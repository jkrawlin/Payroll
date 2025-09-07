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
      expiry: '2024-09-15', // Expired passport
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
      expiry: '2025-10-05', // Expiring soon
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
      { id: 't003', date: '2025-08-31', amount: 12000, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't004', date: '2025-07-31', amount: 12000, type: 'salary', description: 'Monthly Salary - July 2025' }
    ],
    advances: [
      { id: 'adv001', amount: 5000, status: 'approved', requestDate: '2025-08-15', repaymentMonths: 5, monthlyDeduction: 1000 }
    ],
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp003',
    name: 'Mohammed Al-Thani',
    email: 'mohammed.thani@company.com',
    phone: '+974 5555 3456',
    department: 'Finance',
    position: 'Financial Analyst',
    salary: 9500,
    passport: {
      number: 'C3456789',
      expiry: '2025-10-15', // Expires soon - will show critical
      photoUrl: ''
    },
    qid: {
      number: '28923456789',
      expiry: '2028-01-10',
      photoUrl: ''
    },
    totalPaid: 76000,
    transactions: [
      { id: 't005', date: '2025-08-31', amount: 9500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't006', date: '2025-07-31', amount: 9500, type: 'salary', description: 'Monthly Salary - July 2025' }
    ],
    advances: [],
    createdAt: '2024-03-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp004',
    name: 'Aisha Al-Kuwari',
    email: 'aisha.kuwari@company.com',
    phone: '+974 5555 4567',
    department: 'Marketing',
    position: 'Marketing Specialist',
    salary: 7500,
    passport: {
      number: 'D4567890',
      expiry: '2024-08-30', // Already expired - will show expired
      photoUrl: ''
    },
    qid: {
      number: '28934567890',
      expiry: '2025-12-25',
      photoUrl: ''
    },
    totalPaid: 60000,
    transactions: [
      { id: 't007', date: '2025-08-31', amount: 7500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't008', date: '2025-07-31', amount: 7500, type: 'salary', description: 'Monthly Salary - July 2025' }
    ],
    advances: [
      { id: 'adv002', amount: 3000, status: 'pending', requestDate: '2025-09-01', repaymentMonths: 3, monthlyDeduction: 1000, reason: 'Medical expenses for family' }
    ],
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  },
  {
    id: 'emp005',
    name: 'Omar Al-Dosari',
    email: 'omar.dosari@company.com',
    phone: '+974 5555 5678',
    department: 'Operations',
    position: 'Operations Manager',
    salary: 13500,
    passport: {
      number: 'E5678901',
      expiry: '2027-12-31',
      photoUrl: ''
    },
    qid: {
      number: '28945678901',
      expiry: '2026-08-15',
      photoUrl: ''
    },
    totalPaid: 108000,
    transactions: [
      { id: 't009', date: '2025-08-31', amount: 13500, type: 'salary', description: 'Monthly Salary - August 2025' },
      { id: 't010', date: '2025-07-31', amount: 13500, type: 'salary', description: 'Monthly Salary - July 2025' }
    ],
    advances: [],
    createdAt: '2024-05-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z'
  }
];

export const mockCustomers = [
  {
    id: 'cust001',
    name: 'Al-Rayyan Construction Company',
    contactPerson: 'Khalid Al-Rayyan',
    email: 'khalid@alrayyan-construction.com',
    phone: '+974 4444 1234',
    address: 'Industrial Area, Doha, Qatar',
    totalInvoiced: 125000,
    totalPaid: 100000,
    invoices: [
      {
        id: 'INV-2025-001',
        amount: 25000,
        date: '2025-08-15T00:00:00.000Z',
        dueDate: '2025-09-15T00:00:00.000Z',
        status: 'pending',
        description: 'Payroll services for August 2025'
      },
      {
        id: 'INV-2025-002',
        amount: 100000,
        date: '2025-07-15T00:00:00.000Z',
        dueDate: '2025-08-15T00:00:00.000Z',
        status: 'paid',
        description: 'Quarterly payroll management services',
        paidDate: '2025-08-10T00:00:00.000Z'
      }
    ],
    createdAt: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'cust002',
    name: 'Qatar Tech Solutions',
    contactPerson: 'Sara Al-Mahmoud',
    email: 'sara@qatartech.com',
    phone: '+974 4444 2345',
    address: 'West Bay, Doha, Qatar',
    totalInvoiced: 85000,
    totalPaid: 85000,
    invoices: [
      {
        id: 'INV-2025-003',
        amount: 35000,
        date: '2025-08-01T00:00:00.000Z',
        dueDate: '2025-09-01T00:00:00.000Z',
        status: 'paid',
        description: 'HR and payroll consultation services',
        paidDate: '2025-08-25T00:00:00.000Z'
      },
      {
        id: 'INV-2025-004',
        amount: 50000,
        date: '2025-06-01T00:00:00.000Z',
        dueDate: '2025-07-01T00:00:00.000Z',
        status: 'paid',
        description: 'Employee management system setup',
        paidDate: '2025-06-28T00:00:00.000Z'
      }
    ],
    createdAt: '2024-03-15T00:00:00.000Z'
  },
  {
    id: 'cust003',
    name: 'Doha Retail Group',
    contactPerson: 'Abdullah Al-Naimi',
    email: 'abdullah@doharetail.com',
    phone: '+974 4444 3456',
    address: 'Al Sadd, Doha, Qatar',
    totalInvoiced: 180000,
    totalPaid: 150000,
    invoices: [
      {
        id: 'INV-2025-005',
        amount: 30000,
        date: '2025-08-20T00:00:00.000Z',
        dueDate: '2025-09-20T00:00:00.000Z',
        status: 'overdue',
        description: 'Monthly payroll processing - August 2025'
      },
      {
        id: 'INV-2025-006',
        amount: 150000,
        date: '2025-05-01T00:00:00.000Z',
        dueDate: '2025-06-01T00:00:00.000Z',
        status: 'paid',
        description: 'Complete HR transformation project',
        paidDate: '2025-05-30T00:00:00.000Z'
      }
    ],
    createdAt: '2024-02-20T00:00:00.000Z'
  }
];

export const mockAccounts = {
  id: 'main',
  balance: 485000,
  ledger: [
    {
      id: 'led001',
      date: '2025-09-05T00:00:00.000Z',
      type: 'credit',
      amount: 35000,
      description: 'Payment from Qatar Tech Solutions - HR consultation',
      category: 'revenue',
      reference: 'INV-2025-003'
    },
    {
      id: 'led002',
      date: '2025-09-01T00:00:00.000Z',
      type: 'debit',
      amount: 52500,
      description: 'Salary payments for August 2025',
      category: 'payroll',
      reference: 'PAYROLL-AUG-2025'
    },
    {
      id: 'led003',
      date: '2025-08-30T00:00:00.000Z',
      type: 'credit',
      amount: 100000,
      description: 'Payment from Al-Rayyan Construction - Quarterly services',
      category: 'revenue',
      reference: 'INV-2025-002'
    },
    {
      id: 'led004',
      date: '2025-08-25T00:00:00.000Z',
      type: 'debit',
      amount: 15000,
      description: 'Office rent and utilities',
      category: 'operating_expenses',
      reference: 'EXP-AUG-2025'
    },
    {
      id: 'led005',
      date: '2025-08-20T00:00:00.000Z',
      type: 'debit',
      amount: 8500,
      description: 'Software licenses and subscriptions',
      category: 'operating_expenses',
      reference: 'TECH-AUG-2025'
    },
    {
      id: 'led006',
      date: '2025-08-15T00:00:00.000Z',
      type: 'credit',
      amount: 75000,
      description: 'New client onboarding - Qatar Retail Group',
      category: 'revenue',
      reference: 'SETUP-QRG-2025'
    }
  ],
  monthlyBudget: {
    revenue: 200000,
    payroll: 60000,
    operating_expenses: 25000,
    profit_target: 115000
  },
  kpis: {
    totalRevenue: 485000,
    totalExpenses: 285000,
    netProfit: 200000,
    employeeCount: 5,
    activeClients: 3,
    averageSalary: 10200
  }
};

export const mockPayroll = [
  {
    id: 'pay001',
    employeeId: 'emp001',
    employeeName: 'Ahmed Al-Mansouri',
    month: 'August',
    year: 2025,
    baseSalary: 8500,
    allowances: 850,
    deductions: 425,
    netSalary: 8925,
    status: 'paid',
    payDate: '2025-08-31T00:00:00.000Z'
  },
  {
    id: 'pay002',
    employeeId: 'emp002',
    employeeName: 'Fatima Al-Zahra',
    month: 'August',
    year: 2025,
    baseSalary: 12000,
    allowances: 1200,
    deductions: 1600, // Higher due to advance repayment
    netSalary: 11600,
    status: 'paid',
    payDate: '2025-08-31T00:00:00.000Z'
  },
  {
    id: 'pay003',
    employeeId: 'emp003',
    employeeName: 'Mohammed Al-Thani',
    month: 'August',
    year: 2025,
    baseSalary: 9500,
    allowances: 950,
    deductions: 475,
    netSalary: 9975,
    status: 'paid',
    payDate: '2025-08-31T00:00:00.000Z'
  },
  {
    id: 'pay004',
    employeeId: 'emp004',
    employeeName: 'Aisha Al-Kuwari',
    month: 'August',
    year: 2025,
    baseSalary: 7500,
    allowances: 750,
    deductions: 375,
    netSalary: 7875,
    status: 'paid',
    payDate: '2025-08-31T00:00:00.000Z'
  },
  {
    id: 'pay005',
    employeeId: 'emp005',
    employeeName: 'Omar Al-Dosari',
    month: 'August',
    year: 2025,
    baseSalary: 13500,
    allowances: 1350,
    deductions: 675,
    netSalary: 14175,
    status: 'paid',
    payDate: '2025-08-31T00:00:00.000Z'
  }
];

export const mockReceipts = [
  {
    receiptNumber: 'RCP-2025-001',
    customer: 'Qatar Tech Solutions',
    amount: 35000,
    date: '2025-09-05',
    description: 'HR consultation services payment',
    paymentMethod: 'bank_transfer'
  },
  {
    receiptNumber: 'RCP-2025-002',
    customer: 'Al-Rayyan Construction Company',
    amount: 100000,
    date: '2025-08-30',
    description: 'Quarterly payroll management services',
    paymentMethod: 'check'
  },
  {
    receiptNumber: 'RCP-2025-003',
    customer: 'Doha Retail Group',
    amount: 150000,
    date: '2025-05-30',
    description: 'Complete HR transformation project',
    paymentMethod: 'bank_transfer'
  }
];

// Analytics data for dashboard
export const mockAnalytics = {
  kpis: [
    { title: 'Total Revenue', value: 485000, change: 12.5, icon: '💰' },
    { title: 'Active Employees', value: 5, change: 0, icon: '👥' },
    { title: 'Active Clients', value: 3, change: 20, icon: '🏢' },
    { title: 'Monthly Profit', value: 115000, change: 8.7, icon: '📈' },
    { title: 'Pending Invoices', value: 2, change: -25, icon: '📋' },
    { title: 'Total Payouts', value: 285000, change: 5.2, icon: '💳' },
    { title: 'Document Alerts', value: 2, change: 0, icon: '⚠️' },
    { title: 'System Health', value: 98.5, change: 1.2, icon: '✅' }
  ],
  chartData: {
    revenue: [45000, 52000, 48000, 65000, 58000, 72000, 68000, 75000],
    expenses: [32000, 35000, 31000, 42000, 38000, 45000, 41000, 48000],
    profit: [13000, 17000, 17000, 23000, 20000, 27000, 27000, 27000],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
  }
};

// Mock Firebase-like API functions
export const mockFirebaseAPI = {
  // Get collection data
  getCollection: async (collectionName) => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    await delay();
    
    switch (collectionName) {
      case 'employees':
        return { docs: mockEmployees.map(emp => ({ id: emp.id, data: () => emp })) };
      case 'customers':
        return { docs: mockCustomers.map(cust => ({ id: cust.id, data: () => cust })) };
      case 'accounts':
        return { docs: [{ id: 'main', data: () => mockAccounts }] };
      case 'payroll':
        return { docs: mockPayroll.map(pay => ({ id: pay.id, data: () => pay })) };
      default:
        return { docs: [] };
    }
  },

  // Add document
  addDocument: async (collectionName, data) => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 300));
    await delay();
    
    const newId = `${collectionName}_${Date.now()}`;
    const newDoc = { id: newId, ...data };
    
    // Add to appropriate mock array
    switch (collectionName) {
      case 'employees':
        mockEmployees.push(newDoc);
        break;
      case 'customers':
        mockCustomers.push(newDoc);
        break;
      case 'payroll':
        mockPayroll.push(newDoc);
        break;
    }
    
    return { id: newId };
  },

  // Update document
  updateDocument: async (collectionName, docId, data) => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 300));
    await delay();
    
    // Update in appropriate mock array
    switch (collectionName) {
      case 'employees':
        const empIndex = mockEmployees.findIndex(emp => emp.id === docId);
        if (empIndex !== -1) {
          mockEmployees[empIndex] = { ...mockEmployees[empIndex], ...data };
        }
        break;
      case 'customers':
        const custIndex = mockCustomers.findIndex(cust => cust.id === docId);
        if (custIndex !== -1) {
          mockCustomers[custIndex] = { ...mockCustomers[custIndex], ...data };
        }
        break;
    }
    
    return true;
  },

  // Delete document
  deleteDocument: async (collectionName, docId) => {
    const delay = () => new Promise(resolve => setTimeout(resolve, 300));
    await delay();
    
    // Remove from appropriate mock array
    switch (collectionName) {
      case 'employees':
        const empIndex = mockEmployees.findIndex(emp => emp.id === docId);
        if (empIndex !== -1) {
          mockEmployees.splice(empIndex, 1);
        }
        break;
      case 'customers':
        const custIndex = mockCustomers.findIndex(cust => cust.id === docId);
        if (custIndex !== -1) {
          mockCustomers.splice(custIndex, 1);
        }
        break;
    }
    
    return true;
  }
};
