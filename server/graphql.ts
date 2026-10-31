import { buildSchema, graphql } from 'graphql';
import { db } from './db.ts';

export const schema = buildSchema(`
  type User {
    _id: String!
    name: String!
    email: String!
    role: String!
    designation: String
    department: String
    avatar: String
  }

  type Expense {
    _id: String!
    expenseNumber: String!
    invoiceId: String
    purchaseDate: String!
    productName: String!
    category: String!
    subcategory: String
    responsiblePerson: String!
    purchasedBy: String!
    designation: String
    quantity: Float!
    unit: String
    unitPrice: Float!
    currency: String!
    exchangeRate: Float!
    taxMode: String!
    gstMethod: String!
    gstRate: Float!
    taxableAmount: Float!
    cgst: Float!
    sgst: Float!
    igst: Float!
    totalTax: Float!
    totalAmount: Float!
    originalAmount: Float
    vendorName: String!
    vendorId: String
    purposeJustification: String
    paymentMethod: String
    invoiceNumber: String!
    invoiceFileUrl: String
    approvedBy: String
    approvalDate: String
    approvalStatus: String!
    approvalComments: String
    paymentStatus: String!
    paymentDate: String
    receivedStatus: String!
    receivedDate: String
    receivedQuantity: Float
    remarks: String
    financialYear: String!
    isConsumable: Boolean
    isAsset: Boolean
    isSubscription: Boolean
    createdAt: String!
  }

  type Vendor {
    _id: String!
    name: String!
    code: String!
    gstin: String
    address: String
    state: String
    country: String
    email: String
    phone: String
    contactPerson: String
    paymentTerms: String
    status: String
    categories: [String!]
  }

  type InventoryItem {
    _id: String!
    productId: String!
    productName: String!
    sku: String!
    category: String!
    unit: String!
    packageQuantity: Float
    openingStock: Float!
    stockReceived: Float!
    stockIssued: Float!
    stockReturned: Float!
    damagedStock: Float!
    currentStock: Float!
    minimumStock: Float!
    reorderLevel: Float!
    lastPurchasePrice: Float!
    averagePurchasePrice: Float!
    lastPurchaseDate: String
    reorderStatus: String!
    remarks: String
  }

  type InventoryTransaction {
    _id: String!
    productId: String!
    productName: String!
    transactionType: String!
    quantity: Float!
    date: String!
    employeeName: String
    department: String
    issuedBy: String
    expenseId: String
    invoiceNumber: String
    remarks: String
    createdAt: String!
  }

  type Asset {
    _id: String!
    assetId: String!
    assetName: String!
    brand: String
    model: String
    serialNumber: String!
    category: String
    purchaseDate: String
    purchasePrice: Float!
    linkedExpenseId: String
    vendor: String
    invoiceNumber: String
    warrantyExpiry: String
    assignedEmployee: String
    department: String
    location: String
    assetStatus: String!
    notes: String
  }

  type Subscription {
    _id: String!
    name: String!
    vendor: String!
    serviceCategory: String
    billingCycle: String!
    originalAmount: Float!
    currency: String!
    exchangeRate: Float!
    inrEquivalent: Float!
    startDate: String
    lastPaymentDate: String
    nextRenewalDate: String
    paymentStatus: String!
    subscriptionStatus: String!
    invoiceNumber: String
    notes: String
  }

  type Category {
    id: String!
    name: String!
    slug: String!
    type: String!
    icon: String
  }

  type AuditLog {
    _id: String!
    userId: String!
    userName: String!
    action: String!
    recordType: String!
    recordId: String!
    oldValue: String
    newValue: String
    timestamp: String!
  }

  type Notification {
    _id: String!
    title: String!
    description: String!
    type: String!
    relatedRecordId: String
    relatedRecordType: String
    isRead: Boolean!
    createdAt: String!
  }

  type DashboardStats {
    totalExpenses: Float!
    totalTax: Float!
    currentMonthExpenses: Float!
    financialYearExpenses: Float!
    pendingApprovalsCount: Int!
    pendingPaymentsCount: Int!
    activeSubscriptionsCount: Int!
    lowStockCount: Int!
    totalAssetsCount: Int!
    totalAssetValue: Float!
    currencyDistribution: [CurrencyStat!]!
    categoryDistribution: [CategoryStat!]!
  }

  type CurrencyStat {
    currency: String!
    totalAmountInINR: Float!
    count: Int!
  }

  type CategoryStat {
    category: String!
    amount: Float!
    count: Int!
  }

  type Query {
    expenses(category: String, search: String, financialYear: String, approvalStatus: String, paymentStatus: String): [Expense!]!
    expense(id: String!): Expense
    inventory: [InventoryItem!]!
    inventoryTransactions: [InventoryTransaction!]!
    assets: [Asset!]!
    subscriptions: [Subscription!]!
    vendors: [Vendor!]!
    categories: [Category!]!
    stats(financialYear: String): DashboardStats!
    auditLogs: [AuditLog!]!
    notifications: [Notification!]!
  }

  input ExpenseInput {
    purchaseDate: String
    productName: String!
    category: String!
    subcategory: String
    responsiblePerson: String
    purchasedBy: String
    designation: String
    quantity: Float
    unit: String
    unitPrice: Float
    currency: String
    exchangeRate: Float
    taxMode: String
    gstMethod: String
    gstRate: Float
    taxableAmount: Float
    cgst: Float
    sgst: Float
    igst: Float
    totalTax: Float
    totalAmount: Float
    originalAmount: Float
    vendorName: String!
    purposeJustification: String
    paymentMethod: String
    invoiceNumber: String
    approvalStatus: String
    paymentStatus: String
    receivedStatus: String
    remarks: String
    isConsumable: Boolean
    isAsset: Boolean
    isSubscription: Boolean
  }

  type Mutation {
    createExpense(input: ExpenseInput!): Expense!
    updateApproval(id: String!, status: String!, comments: String): Expense
    markReceived(id: String!, receivedQuantity: Float): Expense
    markPaid(id: String!, paymentMethod: String): Expense
    assignAsset(assetId: String!, assignedEmployee: String!, department: String, location: String): Asset
    issueInventory(productId: String!, quantity: Float!, employeeName: String!, department: String, remarks: String): InventoryItem
  }
`);

export const rootResolver = {
  expenses: (args: { category?: string; search?: string; financialYear?: string; approvalStatus?: string; paymentStatus?: string }) => {
    let list = db.getExpenses();
    if (args.category) {
      list = list.filter((e) => e.category === args.category);
    }
    if (args.financialYear) {
      list = list.filter((e) => e.financialYear === args.financialYear);
    }
    if (args.paymentStatus) {
      list = list.filter((e) => e.paymentStatus === args.paymentStatus);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.productName.toLowerCase().includes(q) ||
          e.vendorName.toLowerCase().includes(q) ||
          e.invoiceNumber.toLowerCase().includes(q) ||
          e.expenseNumber.toLowerCase().includes(q)
      );
    }
    return list;
  },

  expense: (args: { id: string }) => db.getExpenseById(args.id),
  inventory: () => db.getInventory(),
  inventoryTransactions: () => db.getInventoryTransactions(),
  assets: () => db.getAssets(),
  subscriptions: () => db.getSubscriptions(),
  vendors: () => db.getVendors(),
  categories: () => db.getCategories(),
  auditLogs: () => db.getAuditLogs(),
  notifications: () => db.getNotifications(),

  stats: (args: { financialYear?: string }) => {
    const expenses = db.getExpenses();
    const currentFY = args.financialYear || '2026-27';
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const fyExpenses = expenses.filter((e) => e.financialYear === currentFY && e.paymentStatus !== 'cancelled');
    const totalExpenses = fyExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
    const totalTax = fyExpenses.reduce((sum, e) => sum + e.totalTax, 0);
    const currentMonthExpenses = expenses
      .filter((e) => e.purchaseDate.startsWith(currentMonth) && e.paymentStatus !== 'cancelled')
      .reduce((sum, e) => sum + e.totalAmount, 0);

    const pendingApprovalsCount = 0;
    const pendingPaymentsCount = expenses.filter((e) => e.paymentStatus === 'pending').length;
    const activeSubscriptionsCount = db.getSubscriptions().filter((s) => s.subscriptionStatus === 'active').length;
    const lowStockCount = db.getInventory().filter((i) => i.reorderStatus === 'urgent' || i.reorderStatus === 'reorder' || i.reorderStatus === 'out_of_stock').length;
    const totalAssets = db.getAssets();
    const totalAssetValue = totalAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

    const currencyMap: Record<string, { totalAmountInINR: number; count: number }> = {};
    expenses.forEach((e) => {
      const c = e.currency || 'INR';
      if (!currencyMap[c]) currencyMap[c] = { totalAmountInINR: 0, count: 0 };
      currencyMap[c].totalAmountInINR += e.totalAmount;
      currencyMap[c].count += 1;
    });

    const categoryMap: Record<string, { amount: number; count: number }> = {};
    fyExpenses.forEach((e) => {
      const cat = e.category || 'other';
      if (!categoryMap[cat]) categoryMap[cat] = { amount: 0, count: 0 };
      categoryMap[cat].amount += e.totalAmount;
      categoryMap[cat].count += 1;
    });

    return {
      totalExpenses: +totalExpenses.toFixed(2),
      totalTax: +totalTax.toFixed(2),
      currentMonthExpenses: +currentMonthExpenses.toFixed(2),
      financialYearExpenses: +totalExpenses.toFixed(2),
      pendingApprovalsCount,
      pendingPaymentsCount,
      activeSubscriptionsCount,
      lowStockCount,
      totalAssetsCount: totalAssets.length,
      totalAssetValue: +totalAssetValue.toFixed(2),
      currencyDistribution: Object.entries(currencyMap).map(([currency, v]) => ({
        currency,
        totalAmountInINR: +v.totalAmountInINR.toFixed(2),
        count: v.count,
      })),
      categoryDistribution: Object.entries(categoryMap).map(([category, v]) => ({
        category,
        amount: +v.amount.toFixed(2),
        count: v.count,
      })),
    };
  },

  createExpense: (args: { input: any }, user: any) => db.createExpense(args.input, user),

  updateApproval: (args: { id: string; status: any; comments?: string }) => {
    return db.getExpenseById(args.id);
  },

  markReceived: (args: { id: string; receivedQuantity?: number }, user: any) => db.markExpenseReceived(args.id, args.receivedQuantity || 0, user),

  markPaid: (args: { id: string; paymentMethod?: string }, user: any) => db.markExpensePaid(args.id, args.paymentMethod, user),

  assignAsset: (args: { assetId: string; assignedEmployee: string; department?: string; location?: string }, user: any) => db.assignAsset(args.assetId, args.assignedEmployee, args.department || '', args.location || '', user),

  issueInventory: (args: { productId: string; quantity: number; employeeName: string; department?: string; remarks?: string }, user: any) => {
    const result = db.issueInventory(args.productId, args.quantity, args.employeeName, args.department || 'General', args.remarks || '', user);
    return result.item || null;
  },
};

export async function executeGraphQL(query: string, variables?: any, user?: any) {
  return await graphql({
    schema,
    source: query,
    rootValue: rootResolver,
    contextValue: user,
    variableValues: variables,
  });
}
