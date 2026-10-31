import * as XLSX from 'xlsx';
import { db } from './db.ts';
import { ExpenseItem } from './types.ts';

export function generateOriginalFormatExcel(expenses: ExpenseItem[]): Buffer {
  const rows = expenses.map((e) => ({
    'Responsible Person': e.responsiblePerson,
    'Date': e.purchaseDate,
    'Item / Service Purchased': e.productName,
    'Purchased By': e.purchasedBy,
    'Designation': e.designation,
    'Quantity': e.quantity,
    'Unit Price': e.unitPrice,
    'Without Tax': e.taxableAmount,
    'Total Amount': e.totalAmount,
    'Vendor / Supplier': e.vendorName,
    'Purpose / Justification': e.purposeJustification,
    'Payment Method': e.paymentMethod,
    'Invoice / Bill No': e.invoiceNumber,
    'Verified Status': 'Confirmed',
    'Remarks': e.remarks || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'IT_Expenses');

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function generateProfessionalReportExcel(): Buffer {
  const workbook = XLSX.utils.book_new();
  const allExpenses = db.getExpenses();

  // 1. Dashboard Summary
  const stats = [
    { Metric: 'Total Records in System', Value: allExpenses.length },
    { Metric: 'Total Expenditure (INR)', Value: allExpenses.reduce((s, e) => s + e.totalAmount, 0) },
    { Metric: 'Total Tax / GST (INR)', Value: allExpenses.reduce((s, e) => s + e.totalTax, 0) },
    { Metric: 'Total Inventory Products Tracked', Value: db.getInventory().length },
    { Metric: 'Total Fixed Assets Registered', Value: db.getAssets().length },
    { Metric: 'Active Software Subscriptions', Value: db.getSubscriptions().length },
    { Metric: 'Financial Year Basis', Value: 'April 1 to March 31' },
    { Metric: 'Report Generation Timestamp', Value: new Date().toISOString() },
  ];
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats), 'Dashboard Summary');

  // 2. All Transactions
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      allExpenses.map((e, i) => ({
        'S.No': i + 1,
        'Expense ID': e.expenseNumber,
        'Date': e.purchaseDate,
        'Financial Year': e.financialYear,
        'Product / Service': e.productName,
        'Category': e.category,
        'Purchased By': e.purchasedBy,
        'Quantity': e.quantity,
        'Unit': e.unit,
        'Unit Price': e.unitPrice,
        'Currency': e.currency,
        'Rate': e.exchangeRate,
        'Taxable (INR)': e.taxableAmount,
        'GST Rate': `${e.gstRate}%`,
        'Total Tax': e.totalTax,
        'Total Amount (INR)': e.totalAmount,
        'Vendor': e.vendorName,
        'Invoice No': e.invoiceNumber,
        'Payment Status': e.paymentStatus,
        'Received Status': e.receivedStatus,
      }))
    ),
    'All Transactions'
  );

  // 3. Courier Labels
  const cl = allExpenses.filter((e) => e.category === 'courier-labels');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      cl.map((e, idx) => ({
        'S.No': idx + 1,
        'Date of Order': e.purchaseDate,
        'Product Name': e.productName,
        'Quantity Units': e.unit,
        'Quantity Ordered': e.quantity,
        'Unit Price (INR)': e.unitPrice,
        'Total Cost (INR)': e.taxableAmount,
        'Total Amount': e.totalAmount,
        'Vendor': e.vendorName,
        'Invoice': e.invoiceNumber,
        'Remarks / Status': e.remarks || e.receivedStatus,
      }))
    ),
    'Courier Labels'
  );

  // 4. Wax Rolls
  const wr = allExpenses.filter((e) => e.category === 'wax-rolls');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      wr.map((e, idx) => ({
        'S.No': idx + 1,
        'Date of Order': e.purchaseDate,
        'Product Name': e.productName,
        'Quantity Ordered': e.quantity,
        'Unit Price (INR)': e.unitPrice,
        'Total Cost (INR)': e.taxableAmount,
        'Total Amount': e.totalAmount,
        'Vendor': e.vendorName,
        'Invoice': e.invoiceNumber,
        'Remarks / Status': e.remarks || e.receivedStatus,
      }))
    ),
    'Wax Rolls'
  );

  // 5. Barcode Rolls
  const br = allExpenses.filter((e) => e.category === 'barcode-rolls');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      br.map((e, idx) => ({
        'S.No': idx + 1,
        'Date of Order': e.purchaseDate,
        'Product Name': e.productName,
        'Quantity Ordered': e.quantity,
        'Unit Price (INR)': e.unitPrice,
        'Total Cost (INR)': e.taxableAmount,
        'Total Amount': e.totalAmount,
        'Vendor': e.vendorName,
        'Invoice': e.invoiceNumber,
        'Remarks / Status': e.remarks || e.receivedStatus,
      }))
    ),
    'Barcode Rolls'
  );

  // 6. Barcode Wax Rolls
  const bwr = allExpenses.filter((e) => e.category === 'barcode-wax-rolls');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      bwr.map((e, idx) => ({
        'S.No': idx + 1,
        'Purchase Date': e.purchaseDate,
        'Product Name': e.productName,
        'Quantity Ordered': e.quantity,
        'Unit Price': e.unitPrice,
        'Taxable Amount': e.taxableAmount,
        'Final Invoice Amount': e.totalAmount,
        'Vendor': e.vendorName,
        'Invoice Reference': e.invoiceNumber,
        'Remarks': e.remarks,
      }))
    ),
    'Barcode Wax Rolls'
  );

  // 7. Render Hosting
  const renderList = allExpenses.filter((e) => e.category === 'render');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      renderList.map((e, idx) => ({
        'S.No': idx + 1,
        'Product': e.productName,
        'Purchase Month': e.purchaseDate.slice(0, 7),
        'Amount (USD)': e.originalAmount || e.unitPrice,
        'Exchange Rate': e.exchangeRate,
        'Amount (INR)': e.totalAmount,
        'Notes': e.remarks,
        'Status': e.paymentStatus,
        'Invoice': e.invoiceNumber,
        'Payment Date': e.paymentDate || e.purchaseDate,
      }))
    ),
    'Render Hosting'
  );

  // 8. MongoDB
  const mongoList = allExpenses.filter((e) => e.category === 'mongodb');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      mongoList.map((e, idx) => ({
        'S.No': idx + 1,
        'Product': e.productName,
        'Purchase Month': e.purchaseDate.slice(0, 7),
        'Amount (USD)': e.originalAmount || e.unitPrice,
        'Exchange Rate': e.exchangeRate,
        'Amount (INR)': e.totalAmount,
        'Notes': e.remarks,
        'Status': e.paymentStatus,
        'Invoice': e.invoiceNumber,
        'Payment Date': e.paymentDate || e.purchaseDate,
      }))
    ),
    'MongoDB'
  );

  // 9. Other Bills
  const otherList = allExpenses.filter((e) => e.category === 'other');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      otherList.map((e, idx) => ({
        'S.No': idx + 1,
        'Product': e.productName,
        'Purchase Month': e.purchaseDate.slice(0, 7),
        'Without Tax': e.taxableAmount,
        'Tax Rate': `${e.gstRate}%`,
        'Tax Amount': e.totalTax,
        'Grand Total': e.totalAmount,
        'Vendor': e.vendorName,
        'Location / Invoice': e.invoiceNumber,
        'Payment Status': e.paymentStatus,
      }))
    ),
    'Other Bills'
  );

  // 10. Inventory
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      db.getInventory().map((inv) => ({
        'Product ID': inv.productId,
        'Product Name': inv.productName,
        'SKU': inv.sku,
        'Unit': inv.unit,
        'Current Stock': inv.currentStock,
        'Opening Stock': inv.openingStock,
        'Stock Received': inv.stockReceived,
        'Stock Issued': inv.stockIssued,
        'Minimum Threshold': inv.minimumStock,
        'Reorder Threshold': inv.reorderLevel,
        'Last Unit Price (INR)': inv.lastPurchasePrice,
        'Stock Status': inv.reorderStatus,
        'Remarks': inv.remarks || '',
      }))
    ),
    'Inventory'
  );

  // 11. Assets
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      db.getAssets().map((ast) => ({
        'Asset ID': ast.assetId,
        'Asset Name': ast.assetName,
        'Brand': ast.brand,
        'Model': ast.model,
        'Serial Number': ast.serialNumber,
        'Category': ast.category,
        'Purchase Date': ast.purchaseDate,
        'Purchase Price (INR)': ast.purchasePrice,
        'Vendor': ast.vendor,
        'Invoice No': ast.invoiceNumber,
        'Warranty Expiry': ast.warrantyExpiry,
        'Assigned Employee': ast.assignedEmployee || 'Unassigned',
        'Department': ast.department || 'IT Pool',
        'Location': ast.location,
        'Status': ast.assetStatus,
      }))
    ),
    'Assets'
  );

  // 12. Subscriptions
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      db.getSubscriptions().map((sub) => ({
        'Service Name': sub.name,
        'Vendor': sub.vendor,
        'Category': sub.serviceCategory,
        'Billing Cycle': sub.billingCycle,
        'Original Amount': sub.originalAmount,
        'Currency': sub.currency,
        'Exchange Rate': sub.exchangeRate,
        'INR Equivalent': sub.inrEquivalent,
        'Start Date': sub.startDate,
        'Last Paid Date': sub.lastPaymentDate,
        'Next Renewal Date': sub.nextRenewalDate,
        'Status': sub.subscriptionStatus,
      }))
    ),
    'Subscriptions'
  );

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

export function parseExcelImport(buffer: Buffer): {
  success: boolean;
  totalRows: number;
  validRows: Partial<ExpenseItem>[];
  anomalies: { row: number; reason: string; item: any }[];
} {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

    const validRows: Partial<ExpenseItem>[] = [];
    const anomalies: { row: number; reason: string; item: any }[] = [];

    rawRows.forEach((row, index) => {
      const rowNum = index + 2; // header is row 1
      const itemDesc = (row['Item / Service Purchased'] || row['Product'] || row['Item'] || row['productName'] || '').trim();
      const vendor = (row['Vendor / Supplier'] || row['Vendor'] || row['vendorName'] || '').trim();
      const rawDate = row['Date'] || row['purchaseDate'] || row['Purchase Date'] || '';
      const totalAmount = parseFloat(row['Total Amount'] || row['Grand Total'] || row['totalAmount'] || '0');

      if (!itemDesc) {
        anomalies.push({ row: rowNum, reason: 'Missing item or product description', item: row });
        return;
      }

      // Map to category
      let category = 'other';
      const lower = itemDesc.toLowerCase();
      if (lower.includes('courier label') || lower.includes('courier labels')) {
        category = 'courier-labels';
      } else if (lower.includes('barcode wax') || lower.includes('barcode-wax')) {
        category = 'barcode-wax-rolls';
      } else if (lower.includes('wax roll')) {
        category = 'wax-rolls';
      } else if (lower.includes('barcode roll')) {
        category = 'barcode-rolls';
      } else if (lower.includes('render')) {
        category = 'render';
      } else if (lower.includes('mongodb')) {
        category = 'mongodb';
      }

      const qty = parseFloat(row['Quantity'] || row['quantity'] || '1') || 1;
      const unitPrice = parseFloat(row['Unit Price'] || row['unitPrice'] || '0') || (totalAmount > 0 ? +(totalAmount / qty).toFixed(2) : 0);

      // Check anomalies
      const issues: string[] = [];
      if (!vendor) issues.push('Missing vendor');
      if (isNaN(totalAmount) || totalAmount <= 0) issues.push('Invalid or zero total amount');
      if (!rawDate) issues.push('Missing purchase date');

      const expense: Partial<ExpenseItem> = {
        productName: itemDesc,
        category,
        vendorName: vendor || 'Imported Vendor',
        quantity: qty,
        unitPrice,
        taxableAmount: parseFloat(row['Without Tax'] || '0') || +(totalAmount / 1.18).toFixed(2),
        totalTax: +(totalAmount - (parseFloat(row['Without Tax'] || '0') || +(totalAmount / 1.18).toFixed(2))).toFixed(2),
        totalAmount: totalAmount || +(qty * unitPrice).toFixed(2),
        responsiblePerson: row['Responsible Person'] || '',
        purchasedBy: row['Purchased By'] || '',
        designation: row['Designation'] || 'IT Executive',
        paymentMethod: (row['Payment Method'] || 'bank').toLowerCase().includes('cash') ? 'cash' : 'bank',
        invoiceNumber: row['Invoice / Bill No'] || row['Invoice'] || `IMP-${Date.now().toString().slice(-6)}`,
        purchaseDate: rawDate ? String(rawDate) : new Date().toISOString().split('T')[0],
        paymentStatus: 'paid',
        receivedStatus: 'received',
        remarks: row['Remarks'] || 'Imported from legacy Excel spreadsheet',
        currency: 'INR',
        exchangeRate: 1.0,
        gstRate: 18,
        taxMode: 'exclusive',
        gstMethod: 'automatic',
        isConsumable: ['courier-labels', 'wax-rolls', 'barcode-rolls', 'barcode-wax-rolls'].includes(category),
        isAsset: ['hardware', 'laptop', 'desktop', 'monitor', 'printer'].some((k) => lower.includes(k)),
        isSubscription: ['render', 'mongodb', 'saas', 'cloud', 'subscription'].some((k) => lower.includes(k)),
      };

      if (issues.length > 0) {
        anomalies.push({ row: rowNum, reason: issues.join(', '), item: expense });
      }

      validRows.push(expense);
    });

    return {
      success: true,
      totalRows: rawRows.length,
      validRows,
      anomalies,
    };
  } catch (err: any) {
    return {
      success: false,
      totalRows: 0,
      validRows: [],
      anomalies: [{ row: 0, reason: `Failed to parse file: ${err.message}`, item: null }],
    };
  }
}
