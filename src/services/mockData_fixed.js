// Mock Data Service for Testing
// This provides sample data for all components without requiring Firebase setup

export const mockEmployees = [
  {
    id: 'emp001',
    name: 'Ahmed Al-Mansouri',
    email: 'ahmed.mansouri@company.com',
    phone: '+974 5555 1234',
    department: 'IT',
    position: 'Software Engineer',
    salary: 8500,
    joinDate: '2024-01-15',
    photoUrl: 'https://i.pravatar.cc/150?img=1',
    passport: {
      number: 'A1234567',
      expiry: '2026-12-31',
      photoUrl: ''
    },
    qid: {
      number: '28901234567',
      expiry: '2025-11-15',
      photoUrl: ''
    },
    totalPaid: 68000,
    transactions: [
      { id: 't001', date: '2025-08-31', amount: 8500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't002', date: '2025-07-31', amount: 8500, type: 'salary', description: 'Monthly Salary - July 2025' },
      { id: 't003', date: '2025-06-30', amount: 8500, type: 'salary', description: 'Monthly Salary - June 2025' },
      { id: 't004', date: '2025-05-31', amount: 8500, type: 'salary', description: 'Monthly Salary - May 2025' },
      { id: 't005', date: '2025-04-15', amount: 2000, type: 'advance', description: 'Emergency Advance Payment' }
    ],
    advances: [
      { id: 'adv001', amount: 2000, date: '2025-04-15', reason: 'Emergency medical expenses', status: 'active' }
    ],
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp002',
    name: 'Fatima Al-Zahra',
    email: 'fatima.zahra@company.com',
    phone: '+974 5555 2345',
    department: 'HR',
    position: 'HR Manager',
    salary: 12000,
    joinDate: '2023-03-20',
    photoUrl: 'https://i.pravatar.cc/150?img=5',
    passport: {
      number: 'B2345678',
      expiry: '2027-06-30',
      photoUrl: ''
    },
    qid: {
      number: '28912345678',
      expiry: '2026-03-20',
      photoUrl: ''
    },
    totalPaid: 96000,
    transactions: [
      { id: 't006', date: '2025-08-31', amount: 12000, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't007', date: '2025-07-31', amount: 12000, type: 'salary', description: 'Monthly Salary - July 2025' },
      { id: 't008', date: '2025-06-30', amount: 12000, type: 'salary', description: 'Monthly Salary - June 2025' },
      { id: 't009', date: '2025-05-31', amount: 12000, type: 'salary', description: 'Monthly Salary - May 2025' },
      { id: 't010', date: '2025-04-30', amount: 12000, type: 'salary', description: 'Monthly Salary - April 2025' }
    ],
    advances: [],
    createdAt: '2023-03-20T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp003',
    name: 'Mohammed Al-Thani',
    email: 'mohammed.thani@company.com',
    phone: '+974 5555 3456',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 10500,
    joinDate: '2023-08-10',
    photoUrl: 'https://i.pravatar.cc/150?img=8',
    passport: {
      number: 'C3456789',
      expiry: '2024-09-15',
      photoUrl: ''
    },
    qid: {
      number: '28923456789',
      expiry: '2027-01-10',
      photoUrl: ''
    },
    totalPaid: 126000,
    transactions: [
      { id: 't011', date: '2025-08-31', amount: 10500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't012', date: '2025-07-31', amount: 10500, type: 'salary', description: 'Monthly Salary - July 2025' },
      { id: 't013', date: '2025-06-30', amount: 10500, type: 'salary', description: 'Monthly Salary - June 2025' },
      { id: 't014', date: '2025-06-15', amount: 3000, type: 'advance', description: 'Vacation Advance' },
      { id: 't015', date: '2025-05-31', amount: 10500, type: 'salary', description: 'Monthly Salary - May 2025' }
    ],
    advances: [
      { id: 'adv002', amount: 3000, date: '2025-06-15', reason: 'Summer vacation expenses', status: 'active' }
    ],
    createdAt: '2023-08-10T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp004',
    name: 'Aisha Al-Kuwari',
    email: 'aisha.kuwari@company.com',
    phone: '+974 5555 4567',
    department: 'Operations',
    position: 'Operations Coordinator',
    salary: 7500,
    joinDate: '2024-06-01',
    photoUrl: 'https://i.pravatar.cc/150?img=9',
    passport: {
      number: 'D4567890',
      expiry: '2028-03-25',
      photoUrl: ''
    },
    qid: {
      number: '28934567890',
      expiry: '2025-10-05',
      photoUrl: ''
    },
    totalPaid: 22500,
    transactions: [
      { id: 't016', date: '2025-08-31', amount: 7500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't017', date: '2025-07-31', amount: 7500, type: 'salary', description: 'Monthly Salary - July 2025' },
      { id: 't018', date: '2025-06-30', amount: 7500, type: 'salary', description: 'Monthly Salary - June 2025' }
    ],
    advances: [],
    createdAt: '2024-06-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp005',
    name: 'Omar Al-Dosari',
    email: 'omar.dosari@company.com',
    phone: '+974 5555 5678',
    department: 'Sales',
    position: 'Sales Executive',
    salary: 9200,
    joinDate: '2022-11-12',
    photoUrl: 'https://i.pravatar.cc/150?img=12',
    passport: {
      number: 'E5678901',
      expiry: '2026-07-20',
      photoUrl: ''
    },
    qid: {
      number: '28945678901',
      expiry: '2026-12-30',
      photoUrl: ''
    },
    totalPaid: 258800,
    transactions: [
      { id: 't019', date: '2025-08-31', amount: 9200, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't020', date: '2025-07-31', amount: 9200, type: 'salary', description: 'Monthly Salary - July 2025' },
      { id: 't021', date: '2025-06-30', amount: 9200, type: 'salary', description: 'Monthly Salary - June 2025' },
      { id: 't022', date: '2025-05-31', amount: 9200, type: 'salary', description: 'Monthly Salary - May 2025' },
      { id: 't023', date: '2025-04-30', amount: 9200, type: 'salary', description: 'Monthly Salary - April 2025' },
      { id: 't024', date: '2025-03-15', amount: 5000, type: 'bonus', description: 'Q1 Performance Bonus' }
    ],
    advances: [],
    createdAt: '2022-11-12T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  }
];

export const mockCustomers = [
  {
    id: 'cust001',
    name: 'Al-Rayyan Construction',
    email: 'contracts@alrayyan-const.qa',
    phone: '+974 4444 1111',
    address: 'West Bay, Doha, Qatar',
    totalInvoiced: 450000,
    totalPaid: 380000,
    outstanding: 70000,
    invoices: [
      { id: 'inv001', amount: 85000, date: '2025-08-15', status: 'paid', description: 'Q3 Construction Services' },
      { id: 'inv002', amount: 70000, date: '2025-09-01', status: 'pending', description: 'Additional Materials Supply' }
    ]
  },
  {
    id: 'cust002',
    name: 'Qatar Tech Solutions',
    email: 'billing@qatartech.com.qa',
    phone: '+974 4444 2222',
    address: 'Lusail City, Qatar',
    totalInvoiced: 280000,
    totalPaid: 280000,
    outstanding: 0,
    invoices: [
      { id: 'inv003', amount: 95000, date: '2025-07-20', status: 'paid', description: 'IT Infrastructure Setup' },
      { id: 'inv004', amount: 65000, date: '2025-08-10', status: 'paid', description: 'Software Licensing' }
    ]
  },
  {
    id: 'cust003',
    name: 'Doha Retail Group',
    email: 'finance@doharet.qa',
    phone: '+974 4444 3333',
    address: 'The Pearl, Doha, Qatar',
    totalInvoiced: 320000,
    totalPaid: 250000,
    outstanding: 70000,
    invoices: [
      { id: 'inv005', amount: 120000, date: '2025-06-30', status: 'paid', description: 'Retail System Integration' },
      { id: 'inv006', amount: 70000, date: '2025-08-25', status: 'pending', description: 'POS System Upgrade' }
    ]
  }
];

export const mockAccountsLedger = [
  { id: 'acc001', date: '2025-08-31', type: 'revenue', amount: 450000, description: 'Service Revenue - August', category: 'Revenue' },
  { id: 'acc002', date: '2025-08-31', type: 'expense', amount: 95000, description: 'Payroll Expenses', category: 'Salaries' },
  { id: 'acc003', date: '2025-08-15', type: 'expense', amount: 25000, description: 'Office Rent', category: 'Rent' },
  { id: 'acc004', date: '2025-08-10', type: 'revenue', amount: 280000, description: 'Consulting Services', category: 'Revenue' },
  { id: 'acc005', date: '2025-07-31', type: 'expense', amount: 15000, description: 'Utilities', category: 'Utilities' },
  { id: 'acc006', date: '2025-07-28', type: 'revenue', amount: 320000, description: 'Project Revenue - July', category: 'Revenue' },
  { id: 'acc007', date: '2025-07-25', type: 'expense', amount: 8000, description: 'Marketing Expenses', category: 'Marketing' }
];

export const mockPayrollData = {
  currentMonth: 'August 2025',
  totalPayroll: 47700,
  employeesPaid: 5,
  pendingPayments: 0,
  monthlyBreakdown: [
    { month: 'January', amount: 45000 },
    { month: 'February', amount: 46500 },
    { month: 'March', amount: 47000 },
    { month: 'April', amount: 47200 },
    { month: 'May', amount: 47500 },
    { month: 'June', amount: 47700 },
    { month: 'July', amount: 47700 },
    { month: 'August', amount: 47700 }
  ],
  departmentBreakdown: [
    { department: 'IT', employees: 1, totalSalary: 8500 },
    { department: 'HR', employees: 1, totalSalary: 12000 },
    { department: 'Finance', employees: 1, totalSalary: 10500 },
    { department: 'Operations', employees: 1, totalSalary: 7500 },
    { department: 'Sales', employees: 1, totalSalary: 9200 }
  ]
};

export const mockReceipts = [
  {
    id: 'rcpt001',
    receiptNumber: 'RCP-2025-001',
    customerName: 'Al-Rayyan Construction',
    amount: 85000,
    date: '2025-08-15',
    paymentMethod: 'Bank Transfer',
    description: 'Payment for Invoice #INV001',
    status: 'confirmed'
  },
  {
    id: 'rcpt002',
    receiptNumber: 'RCP-2025-002',
    customerName: 'Qatar Tech Solutions',
    amount: 95000,
    date: '2025-07-20',
    paymentMethod: 'Cheque',
    description: 'Payment for Invoice #INV003',
    status: 'confirmed'
  },
  {
    id: 'rcpt003',
    receiptNumber: 'RCP-2025-003',
    customerName: 'Doha Retail Group',
    amount: 120000,
    date: '2025-06-30',
    paymentMethod: 'Bank Transfer',
    description: 'Payment for Invoice #INV005',
    status: 'confirmed'
  }
];

// Mock Firebase API functions for fallback
export const mockFirebaseAPI = {
  // Mock function that mimics Firebase behavior
  isConfigured: () => false,
  
  // Mock collection operations
  collection: (collectionName) => {
    const data = {
      employees: mockEmployees,
      customers: mockCustomers,
      accounts: mockAccountsLedger,
      receipts: mockReceipts
    };
    return {
      get: () => Promise.resolve({
        docs: (data[collectionName] || []).map(item => ({
          id: item.id,
          data: () => item
        }))
      })
    };
  },

  // Mock document operations
  doc: (collectionName, docId) => {
    const data = {
      employees: mockEmployees,
      customers: mockCustomers,
      accounts: mockAccountsLedger,
      receipts: mockReceipts
    };
    const item = (data[collectionName] || []).find(item => item.id === docId);
    return {
      get: () => Promise.resolve({
        exists: () => !!item,
        data: () => item
      })
    };
  }
};
