import express from 'express';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, subscribeToEvents, getExchangeRateForDate, connectDatabase } from './server/db.ts';
import { executeGraphQL } from './server/graphql.ts';
import { generateOriginalFormatExcel, generateProfessionalReportExcel, parseExcelImport } from './server/excelService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const sessions = new Map<string, any>();
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.authenticateUser(String(email || ''), String(password || ''));
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' });
  const token = randomUUID();
  sessions.set(token, { user, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', `it_erp_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
  res.json({ success: true, data: user });
});
app.post('/api/auth/logout', (req, res) => {
  const token = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('it_erp_session='))?.split('=')[1];
  if (token) sessions.delete(token);
  res.setHeader('Set-Cookie', 'it_erp_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  res.json({ success: true });
});
app.get('/api/auth/session', (req, res) => {
  const token = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('it_erp_session='))?.split('=')[1];
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expiresAt <= Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Session expired.' });
  }
  res.json({ success: true, data: session.user });
});
app.use('/api', (req, res, next) => {
  const token = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('it_erp_session='))?.split('=')[1];
  const session = token ? sessions.get(token) : undefined;
  const user = session && session.expiresAt > Date.now() ? session.user : undefined;
  if (token && !user) sessions.delete(token);
  if (!user) return res.status(401).json({ error: 'Please sign in to access application data.' });
  if (req.path.startsWith('/users') && user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  res.locals.user = user;
  if (req.body && typeof req.body === 'object') {
    req.body.currentUser = user;
    req.body.adminUser = user;
    req.body.user = user;
  }
  next();
});

// --- Real-Time Server-Sent Events (SSE) ---
app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  const unsubscribe = subscribeToEvents((event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// --- Exchange Rate API (Daily Automatic Lookup) ---
app.get('/api/exchange-rate', (req, res) => {
  const dateStr = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const rate = getExchangeRateForDate(dateStr);
  res.json({ date: dateStr, rate });
});

// --- User Management APIs (Admin Only Access) ---
app.get('/api/users', (req, res) => {
  res.json({ success: true, data: db.getUsers() });
});

app.post('/api/users', (req, res) => {
  try {
    const adminUser = res.locals.user;
    const user = db.createUser(req.body.userData, adminUser);
    res.status(201).json({ success: true, data: user });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.put('/api/users/:id', (req, res) => {
  try {
    const adminUser = res.locals.user;
    const updated = db.updateUser(req.params.id, req.body.updates, adminUser);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const adminUser = res.locals.user;
    const success = db.deleteUser(req.params.id, adminUser);
    res.json({ success });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// --- GraphQL API ---
app.use('/graphql', (req, res, next) => {
  const token = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('it_erp_session='))?.split('=')[1];
  const session = token ? sessions.get(token) : undefined;
  const user = session && session.expiresAt > Date.now() ? session.user : undefined;
  if (token && !user) sessions.delete(token);
  if (!user) return res.status(401).json({ error: 'Please sign in to access application data.' });
  if (user.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' });
  res.locals.user = user;
  next();
});
app.post('/graphql', async (req, res) => {
  const { query, variables } = req.body;
  if (!query) return res.status(400).json({ error: 'Missing GraphQL query' });
  const result = await executeGraphQL(query, variables, res.locals.user);
  res.json(result);
});

// --- Expenses REST Endpoints ---
app.get('/api/expenses', (req, res) => {
  const { category, search, financialYear, paymentStatus } = req.query;
  let list = db.getExpenses();

  if (category && typeof category === 'string') {
    list = list.filter((e) => e.category === category);
  }
  if (financialYear && typeof financialYear === 'string') {
    list = list.filter((e) => e.financialYear === financialYear);
  }
  if (paymentStatus && typeof paymentStatus === 'string') {
    list = list.filter((e) => e.paymentStatus === paymentStatus);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(
      (e) =>
        e.productName.toLowerCase().includes(q) ||
        e.vendorName.toLowerCase().includes(q) ||
        e.invoiceNumber.toLowerCase().includes(q) ||
        e.expenseNumber.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/expenses/:id', (req, res) => {
  const exp = db.getExpenseById(req.params.id);
  if (!exp) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true, data: exp });
});

app.post('/api/expenses', (req, res) => {
  try {
    const user = res.locals.user;
    const created = db.createExpense(req.body, user);
    res.status(201).json({ success: true, data: created });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', (req, res) => {
  try {
    const user = res.locals.user;
    const updated = db.updateExpense(req.params.id, req.body, user);
    if (!updated) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: STRICTLY ADMIN ONLY
app.delete('/api/expenses/:id', (req, res) => {
  try {
    const user = res.locals.user;
    const reason = req.body.reason || 'Administrative Deletion';
    const deleted = db.deleteExpense(req.params.id, user, reason);
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

app.post('/api/expenses/:id/receive', (req, res) => {
  const { quantity, user } = req.body;
  const operator = res.locals.user;
  const updated = db.markExpenseReceived(req.params.id, Number(quantity) || 0, operator);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true, data: updated });
});

app.post('/api/expenses/:id/pay', (req, res) => {
  const { paymentMethod, user } = req.body;
  const operator = res.locals.user;
  const updated = db.markExpensePaid(req.params.id, paymentMethod, operator);
  if (!updated) return res.status(404).json({ error: 'Expense not found' });
  res.json({ success: true, data: updated });
});

// --- Inventory & Stock ---
app.get('/api/inventory', (req, res) => {
  res.json({
    success: true,
    items: db.getInventory(),
    transactions: db.getInventoryTransactions(),
  });
});

app.post('/api/inventory/issue', (req, res) => {
  const { productId, quantity, employeeName, department, remarks, user } = req.body;
  const operator = res.locals.user;
  const result = db.issueInventory(productId, Number(quantity), employeeName, department, remarks, operator);
  if (!result.success) return res.status(400).json(result);
  res.json(result);
});

app.post('/api/inventory/adjust', (req, res) => {
  try {
    const { productId, newCount, reason, user } = req.body;
    const operator = res.locals.user;
    const item = db.adjustInventory(productId, Number(newCount), reason, operator);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, item });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
});

// --- Assets ---
app.get('/api/assets', (req, res) => {
  res.json({ success: true, data: db.getAssets() });
});

app.post('/api/assets', (req, res) => {
  const operator = req.body.res.locals.user;
  const created = db.createAsset(req.body, operator);
  res.status(201).json({ success: true, data: created });
});

app.post('/api/assets/:id/assign', (req, res) => {
  const { assignedEmployee, department, location, user } = req.body;
  const operator = res.locals.user;
  const updated = db.assignAsset(req.params.id, assignedEmployee, department, location, operator);
  if (!updated) return res.status(404).json({ error: 'Asset not found' });
  res.json({ success: true, data: updated });
});

// --- Subscriptions ---
app.get('/api/subscriptions', (req, res) => {
  res.json({ success: true, data: db.getSubscriptions() });
});

app.post('/api/subscriptions', (req, res) => {
  const operator = req.body.res.locals.user;
  const created = db.createSubscription(req.body, operator);
  res.status(201).json({ success: true, data: created });
});

// --- Vendors ---
app.get('/api/vendors', (req, res) => {
  res.json({ success: true, data: db.getVendors() });
});

app.post('/api/vendors', (req, res) => {
  const created = db.createVendor(req.body);
  res.status(201).json({ success: true, data: created });
});

// --- Categories ---
app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: db.getCategories() });
});

// --- Audit & Notifications ---
app.get('/api/audit-logs', (req, res) => {
  res.json({ success: true, data: db.getAuditLogs() });
});

app.get('/api/notifications', (req, res) => {
  res.json({ success: true, data: db.getNotifications() });
});

app.post('/api/notifications/:id/read', (req, res) => {
  db.markNotificationAsRead(req.params.id);
  res.json({ success: true });
});

// --- System Settings ---
app.get('/api/settings', (req, res) => {
  res.json({ success: true, data: db.getSettings() });
});

app.put('/api/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  res.json({ success: true, data: updated });
});

// --- Excel Export (Format A: Original, Format B: Professional) ---
app.get('/api/excel/export/original', (req, res) => {
  const expenses = db.getExpenses();
  const buffer = generateOriginalFormatExcel(expenses);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="IT_Expenses_Original_Format.xlsx"');
  res.send(buffer);
});

app.get('/api/excel/export/professional', (req, res) => {
  const buffer = generateProfessionalReportExcel();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="IT_Expenses_Professional_Report.xlsx"');
  res.send(buffer);
});

// --- Excel Import ---
app.post('/api/excel/import/preview', (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) return res.status(400).json({ error: 'Missing base64Data' });
    const buffer = Buffer.from(base64Data, 'base64');
    const result = parseExcelImport(buffer);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/excel/import/confirm', (req, res) => {
  const { validRows, user } = req.body;
  if (!Array.isArray(validRows) || validRows.length === 0) {
    return res.status(400).json({ error: 'No valid rows provided for import' });
  }

  const operator = res.locals.user;
  const inserted: any[] = [];

  validRows.forEach((row) => {
    try {
      const exp = db.createExpense(row, operator);
      inserted.push(exp);
    } catch {
      // skip invalid row
    }
  });

  db.addAuditLog({
    userId: operator._id,
    userName: operator.name,
    action: 'Excel Batch Import',
    recordType: 'import',
    recordId: `IMP-BATCH-${Date.now()}`,
    newValue: `Imported ${inserted.length} rows into MongoDB ledger`,
  });

  res.json({ success: true, count: inserted.length, data: inserted });
});

// --- Full Stack / Vite Dev Integration ---
async function startServer() {
  await connectDatabase();
  console.log('Connected to MongoDB.');
  if (db.getUsers().length === 0) {
    console.warn('No login accounts are configured. Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the first administrator.');
  }
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TGH IT Expense running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});

