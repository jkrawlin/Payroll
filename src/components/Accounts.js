import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Accounts = () => {
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit'); // credit or debit
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // New states for employee lookup and accounts management
  const [qatarId, setQatarId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const [employeeAccounts, setEmployeeAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, employee-lookup, transactions, reports
  const [employees, setEmployees] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [payrollAccounts, setPayrollAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Add missing searchTerm state
  
  const { t } = useTranslation();

  const categories = [
    { value: 'general', label: 'General Ledger', icon: '📊' },
    { value: 'payroll', label: 'Payroll & Salaries', icon: '💰' },
    { value: 'employee-advance', label: 'Employee Advances', icon: '🏧' },
    { value: 'employee-deduction', label: 'Employee Deductions', icon: '➖' },
    { value: 'revenue', label: 'Revenue & Income', icon: '📈' },
    { value: 'customer-payment', label: 'Customer Payments', icon: '💳' },
    { value: 'expenses', label: 'Operating Expenses', icon: '💸' },
    { value: 'office', label: 'Office Expenses', icon: '🏢' },
    { value: 'utilities', label: 'Utilities & Bills', icon: '⚡' },
    { value: 'transport', label: 'Transport & Travel', icon: '🚗' },
    { value: 'supplies', label: 'Supplies & Materials', icon: '📦' },
    { value: 'maintenance', label: 'Maintenance & Repairs', icon: '🔧' },
    { value: 'insurance', label: 'Insurance & Benefits', icon: '🛡️' },
    { value: 'tax-gov', label: 'Tax & Government Fees', icon: '🏛️' },
    { value: 'bank-charges', label: 'Bank Charges & Fees', icon: '🏦' }
  ];

  useEffect(() => {
    fetchAccounts();
    fetchEmployees();
    fetchEmployeeAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const accountsDoc = await getDoc(doc(db, 'accounts', 'main'));
      if (accountsDoc.exists()) {
        const data = accountsDoc.data();
        const ledgerData = data.ledger || [];
        setLedger(ledgerData);
        
        // Calculate balance (credits - debits)
        const calcBalance = ledgerData.reduce((acc, entry) => {
          return acc + (entry.type === 'credit' ? entry.amount : -entry.amount);
        }, 0);
        setBalance(calcBalance);
        
        // Calculate outstanding (simplified - sum of unpaid advances and pending invoices)
        // In a real system, this would come from employee advances and customer invoices
        const outstandingDebits = ledgerData
          .filter(entry => entry.type === 'debit' && entry.category === 'payroll')
          .reduce((sum, entry) => sum + entry.amount, 0);
        setOutstanding(outstandingDebits * 0.1); // Placeholder calculation
      } else {
        // Initialize accounts document if it doesn't exist
        await setDoc(doc(db, 'accounts', 'main'), {
          ledger: [],
          balance: 0,
          outstanding: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      toast.error('Error fetching accounts');
      console.error('Error fetching accounts:', error);
    }
  };

  // Fetch all employees for Qatar ID lookup
  const fetchEmployees = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch employee-specific accounts
  const fetchEmployeeAccounts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employee-accounts'));
      const accountsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployeeAccounts(accountsList);
    } catch (error) {
      console.error('Error fetching employee accounts:', error);
    }
  };

  // Search employee by Qatar ID
  const handleQatarIdSearch = async () => {
    if (!qatarId.trim()) {
      toast.error('Please enter a Qatar ID number');
      return;
    }

    setEmployeeSearching(true);
    try {
      // Find employee by QID number
      const employee = employees.find(emp => 
        emp.qid?.number?.toLowerCase() === qatarId.toLowerCase().trim()
      );

      if (employee) {
        setSelectedEmployee(employee);
        
        // Fetch employee's account history
        const employeeAccountHistory = ledger.filter(entry => 
          entry.employeeId === employee.id || 
          entry.qidNumber === employee.qid.number ||
          entry.description.toLowerCase().includes(employee.name.toLowerCase())
        );
        
        // Calculate employee-specific balances
        const advances = employeeAccountHistory.filter(entry => 
          entry.category === 'employee-advance' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);
        
        const deductions = employeeAccountHistory.filter(entry => 
          entry.category === 'employee-deduction' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);
        
        const salariesPaid = employeeAccountHistory.filter(entry => 
          entry.category === 'payroll' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);

        setSelectedEmployee({
          ...employee,
          accountHistory: employeeAccountHistory,
          totalAdvances: advances,
          totalDeductions: deductions,
          totalSalariesPaid: salariesPaid,
          outstandingBalance: advances - deductions
        });

        toast.success(`Employee found: ${employee.name}`);
      } else {
        setSelectedEmployee(null);
        toast.error('Employee not found with this Qatar ID');
      }
    } catch (error) {
      toast.error('Error searching employee');
      console.error('Error searching employee:', error);
    } finally {
      setEmployeeSearching(false);
    }
  };

  // Add employee transaction
  const addEmployeeTransaction = async (transactionData) => {
    try {
      const accountsRef = doc(db, 'accounts', 'main');
      const date = new Date().toISOString();
      
      const entry = {
        id: Date.now().toString(),
        date,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description,
        category: transactionData.category,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        qidNumber: selectedEmployee.qid.number,
        createdBy: 'Admin'
      };

      await updateDoc(accountsRef, {
        ledger: arrayUnion(entry)
      });

      toast.success('Employee transaction added successfully');
      
      // Refresh data
      fetchAccounts();
      handleQatarIdSearch(); // Refresh employee data
      
    } catch (error) {
      toast.error(`Error adding transaction: ${error.message}`);
      console.error('Error adding transaction:', error);
    }
  };

  const handleEntry = async () => {
    if (!amount || parseFloat(amount) <= 0 || !description.trim()) {
      toast.error('Please enter valid amount and description');
      return;
    }

    setLoading(true);
    try {
      const accountsRef = doc(db, 'accounts', 'main');
      const date = new Date().toISOString();
      const entryAmount = parseFloat(amount);
      
      const entry = {
        id: Date.now().toString(),
        date,
        type,
        amount: entryAmount,
        description: description.trim(),
        category,
        createdBy: 'Admin' // In real app, get from auth context
      };

      await updateDoc(accountsRef, {
        ledger: arrayUnion(entry)
      });

      toast.success('Entry added successfully');
      
      // Reset form
      setAmount('');
      setDescription('');
      setType('credit');
      setCategory('general');
      
      // Refresh data
      fetchAccounts();
    } catch (error) {
      toast.error(`Error adding entry: ${error.message}`);
      console.error('Error adding entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      general: 'category-general',
      payroll: 'category-payroll',
      revenue: 'category-revenue',
      expenses: 'category-expenses',
      office: 'category-office',
      utilities: 'category-utilities',
      transport: 'category-transport',
      supplies: 'category-supplies'
    };
    return colors[cat] || 'category-general';
  };

  const getTransactionIcon = (type, category) => {
    const categoryIcon = categories.find(cat => cat.value === category)?.icon;
    if (categoryIcon) return categoryIcon;
    
    // Fallback icons
    if (type === 'credit') {
      switch (category) {
        case 'revenue': return '💰';
        case 'customer-payment': return '💳';
        case 'payroll': return '↩️';
        default: return '📈';
      }
    } else {
      switch (category) {
        case 'payroll': return '👥';
        case 'employee-advance': return '🏧';
        case 'employee-deduction': return '➖';
        case 'expenses': return '💸';
        case 'office': return '🏢';
        case 'utilities': return '⚡';
        case 'transport': return '🚗';
        case 'supplies': return '📦';
        case 'maintenance': return '🔧';
        case 'insurance': return '🛡️';
        case 'tax-gov': return '🏛️';
        case 'bank-charges': return '🏦';
        default: return '📉';
      }
    }
  };

  const filterLedger = () => {
    let filtered = [...ledger];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) <= new Date(dateRange.end)
      );
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const exportToCSV = () => {
    const filtered = filterLedger();
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount'].join(','),
      ...filtered.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.type,
        entry.category,
        `"${entry.description}"`,
        entry.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getBalanceColor = () => {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-neutral';
  };

  const getCashFlowData = () => {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentEntries = ledger.filter(entry => 
      new Date(entry.date) >= last30Days
    );

    const totalCredits = recentEntries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalDebits = recentEntries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return { totalCredits, totalDebits, netFlow: totalCredits - totalDebits };
  };

  const cashFlow = getCashFlowData();

  return (
    <div className="accounts-page">
      <div className="page-header">
        <h2>💼 Accounts Management</h2>
        <div className="header-actions">
          <button onClick={exportToCSV} className="export-btn">
            📄 Export CSV
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="accounts-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'employee-lookup' ? 'active' : ''}`}
          onClick={() => setActiveTab('employee-lookup')}
        >
          🆔 Employee Lookup
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💰 Transactions
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* Summary Cards */}
          <div className="accounts-summary">
            <div className={`summary-card ${getBalanceColor()}`}>
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <h3>Current Balance</h3>
                <p className="summary-amount">{balance.toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">⏰</div>
              <div className="summary-content">
                <h3>Outstanding</h3>
                <p className="summary-amount">{outstanding.toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <h3>30-Day Inflow</h3>
                <p className="summary-amount positive">+{cashFlow.totalCredits.toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">📉</div>
              <div className="summary-content">
                <h3>30-Day Outflow</h3>
                <p className="summary-amount negative">-{cashFlow.totalDebits.toLocaleString()} QAR</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <h3>Total Employees</h3>
                <p className="summary-amount">{employees.length}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon">🏧</div>
              <div className="summary-content">
                <h3>Employee Advances</h3>
                <p className="summary-amount warning">
                  {ledger.filter(entry => entry.category === 'employee-advance' && entry.type === 'debit')
                    .reduce((sum, entry) => sum + entry.amount, 0).toLocaleString()} QAR
                </p>
              </div>
            </div>
          </div>

          {/* Cash Flow Indicator */}
          <div className={`cash-flow-indicator ${cashFlow.netFlow >= 0 ? 'positive' : 'negative'}`}>
            <h4>30-Day Net Cash Flow: {cashFlow.netFlow >= 0 ? '+' : ''}{cashFlow.netFlow.toLocaleString()} QAR</h4>
          </div>

          {/* Quick Stats Grid */}
          <div className="quick-stats-section">
            <h3>Account Categories Overview</h3>
            <div className="category-grid">
              {categories.map(category => {
                const categoryEntries = ledger.filter(entry => entry.category === category.value);
                const totalCredits = categoryEntries
                  .filter(entry => entry.type === 'credit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                const totalDebits = categoryEntries
                  .filter(entry => entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                const netAmount = totalCredits - totalDebits;

                if (totalCredits === 0 && totalDebits === 0) return null;

                return (
                  <div key={category.value} className={`category-summary ${getCategoryColor(category.value)}`}>
                    <div className="category-header">
                      <span className="category-icon">{category.icon}</span>
                      <h4>{category.label}</h4>
                    </div>
                    <div className="category-amounts">
                      {totalCredits > 0 && (
                        <p className="category-amount positive">
                          In: +{totalCredits.toLocaleString()} QAR
                        </p>
                      )}
                      {totalDebits > 0 && (
                        <p className="category-amount negative">
                          Out: -{totalDebits.toLocaleString()} QAR
                        </p>
                      )}
                      <p className={`category-net ${netAmount >= 0 ? 'positive' : 'negative'}`}>
                        Net: {netAmount >= 0 ? '+' : ''}{netAmount.toLocaleString()} QAR
                      </p>
                    </div>
                    <div className="category-count">
                      {categoryEntries.length} transactions
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Employee Lookup Tab */}
      {activeTab === 'employee-lookup' && (
        <div className="employee-lookup-tab">
          <div className="qatar-id-search">
            <h3>🆔 Employee Lookup by Qatar ID</h3>
            <div className="search-section">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Enter Qatar ID number (e.g., 12345678901)"
                  value={qatarId}
                  onChange={(e) => setQatarId(e.target.value)}
                  className="qatar-id-input"
                  maxLength="11"
                />
                <button
                  onClick={handleQatarIdSearch}
                  disabled={employeeSearching || !qatarId.trim()}
                  className="search-btn"
                >
                  {employeeSearching ? '🔍 Searching...' : '🔍 Search'}
                </button>
              </div>
              <p className="search-help">Enter the 11-digit Qatar ID number to view employee profile and account details</p>
            </div>
          </div>

          {/* Employee Profile Display */}
          {selectedEmployee && (
            <div className="employee-profile-section">
              <div className="employee-profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <span className="avatar-text">{selectedEmployee.name.charAt(0)}</span>
                  </div>
                  <div className="profile-info">
                    <h3>{selectedEmployee.name}</h3>
                    <p className="employee-id">QID: {selectedEmployee.qid.number}</p>
                    <p className="employee-position">{selectedEmployee.position} - {selectedEmployee.department}</p>
                  </div>
                  <div className="profile-status">
                    <span className="status-badge active">Active</span>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">📧 Email:</span>
                      <span className="detail-value">{selectedEmployee.email || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📱 Phone:</span>
                      <span className="detail-value">{selectedEmployee.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">💰 Basic Salary:</span>
                      <span className="detail-value">{selectedEmployee.salary?.toLocaleString()} QAR</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">🛂 Passport:</span>
                      <span className="detail-value">{selectedEmployee.passport?.number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📅 QID Expiry:</span>
                      <span className="detail-value">
                        {selectedEmployee.qid?.expiry ? new Date(selectedEmployee.qid.expiry).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">📅 Join Date:</span>
                      <span className="detail-value">
                        {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="employee-account-summary">
                  <h4>💳 Account Summary</h4>
                  <div className="account-summary-grid">
                    <div className="account-summary-card">
                      <span className="summary-label">💰 Total Salaries Paid</span>
                      <span className="summary-value positive">{selectedEmployee.totalSalariesPaid?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">🏧 Total Advances</span>
                      <span className="summary-value warning">{selectedEmployee.totalAdvances?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">➖ Total Deductions</span>
                      <span className="summary-value negative">{selectedEmployee.totalDeductions?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">📊 Outstanding Balance</span>
                      <span className={`summary-value ${selectedEmployee.outstandingBalance >= 0 ? 'warning' : 'positive'}`}>
                        {selectedEmployee.outstandingBalance?.toLocaleString()} QAR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="employee-quick-actions">
                  <h4>⚡ Quick Actions</h4>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn advance" onClick={() => {
                      setDescription(`Advance payment for ${selectedEmployee.name}`);
                      setCategory('employee-advance');
                      setType('debit');
                      setActiveTab('transactions');
                    }}>
                      🏧 Add Advance
                    </button>
                    <button className="quick-action-btn deduction" onClick={() => {
                      setDescription(`Deduction for ${selectedEmployee.name}`);
                      setCategory('employee-deduction');
                      setType('debit');
                      setActiveTab('transactions');
                    }}>
                      ➖ Add Deduction
                    </button>
                    <button className="quick-action-btn salary" onClick={() => {
                      setDescription(`Salary payment for ${selectedEmployee.name}`);
                      setCategory('payroll');
                      setType('debit');
                      setAmount(selectedEmployee.salary?.toString() || '');
                      setActiveTab('transactions');
                    }}>
                      💰 Pay Salary
                    </button>
                    <button className="quick-action-btn view-history" onClick={() => {
                      setFilterType('all');
                      setSearchTerm(selectedEmployee.name);
                      setActiveTab('transactions');
                    }}>
                      📊 View History
                    </button>
                  </div>
                </div>

                {/* Recent Transactions */}
                {selectedEmployee.accountHistory && selectedEmployee.accountHistory.length > 0 && (
                  <div className="employee-recent-transactions">
                    <h4>📋 Recent Transactions</h4>
                    <div className="transaction-list">
                      {selectedEmployee.accountHistory.slice(-5).reverse().map((transaction, index) => (
                        <div key={index} className={`transaction-item ${transaction.type}`}>
                          <div className="transaction-icon">
                            {getTransactionIcon(transaction.type, transaction.category)}
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-description">{transaction.description}</div>
                            <div className="transaction-meta">
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              <span className="transaction-category">
                                {categories.find(cat => cat.value === transaction.category)?.label}
                              </span>
                            </div>
                          </div>
                          <div className={`transaction-amount ${transaction.type}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} QAR
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="transactions-tab">
          <div className="accounts-content">
            {/* Add Entry Form */}
            <div className="entry-form-section">
              <h3>💰 Add New Transaction</h3>
              <div className="entry-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Type *</label>
                    <select 
                      value={type} 
                      onChange={e => setType(e.target.value)}
                      className="type-select"
                    >
                      <option value="credit">💰 Credit (Money In)</option>
                      <option value="debit">💸 Debit (Money Out)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Category *</label>
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      className="category-select"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount (QAR) *</label>
                    <input
                      type="number"
                      placeholder="Enter amount"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="amount-input"
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea
                      placeholder="Enter description..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows="2"
                      className="description-input"
                    />
                  </div>
                </div>

                {selectedEmployee && (
                  <div className="linked-employee-info">
                    <p>🔗 Linked to: <strong>{selectedEmployee.name}</strong> (QID: {selectedEmployee.qid.number})</p>
                  </div>
                )}

                <button
                  onClick={selectedEmployee ? () => addEmployeeTransaction({
                    type,
                    amount,
                    description,
                    category
                  }) : handleEntry}
                  disabled={loading || !amount || !description.trim()}
                  className="add-entry-btn"
                >
                  {loading ? 'Adding...' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Entry`}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
              <h3>📊 Transaction History</h3>
              <div className="filters">
                <select 
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Transactions</option>
                  <option value="credit">Credits Only</option>
                  <option value="debit">Debits Only</option>
                </select>

                <div className="date-filters">
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="date-input"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="date-input"
                    placeholder="End date"
                  />
                </div>

                {(filterType !== 'all' || dateRange.start || dateRange.end) && (
                  <button
                    onClick={() => {
                      setFilterType('all');
                      setDateRange({ start: '', end: '' });
                    }}
                    className="clear-filters-btn"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Ledger Table */}
            <div className="ledger-section">
              <div className="ledger-list">
                {filterLedger().length > 0 ? (
                  filterLedger().map((entry, i) => (
                    <div key={entry.id || i} className={`ledger-item ${entry.type}`}>
                      <div className="ledger-info">
                        <div className="ledger-icon">
                          {getTransactionIcon(entry.type, entry.category)}
                        </div>
                        <div className="ledger-details">
                          <div className="ledger-header">
                            <strong>{entry.description}</strong>
                            <span className={`category-badge ${getCategoryColor(entry.category)}`}>
                              {categories.find(cat => cat.value === entry.category)?.label || entry.category}
                            </span>
                          </div>
                          <div className="ledger-meta">
                            <span>{new Date(entry.date).toLocaleDateString()}</span>
                            <span>{new Date(entry.date).toLocaleTimeString()}</span>
                            {entry.createdBy && <span>by {entry.createdBy}</span>}
                            {entry.employeeName && <span>👤 {entry.employeeName}</span>}
                            {entry.qidNumber && <span>🆔 {entry.qidNumber}</span>}
                          </div>
                        </div>
                      </div>
                      <div className={`ledger-amount ${entry.type}`}>
                        {entry.type === 'credit' ? '+' : '-'}{entry.amount.toLocaleString()} QAR
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <p>No transactions found. {(filterType !== 'all' || dateRange.start || dateRange.end) && 'Try adjusting your filters.'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-tab">
          <h3>📈 Financial Reports</h3>
          
          {/* Category Breakdown */}
          {ledger.length > 0 && (
            <div className="category-breakdown-section">
              <h4>📊 Category Breakdown (Last 30 Days)</h4>
              <div className="category-grid">
                {categories.map(category => {
                  const categoryEntries = ledger.filter(entry => 
                    entry.category === category.value && 
                    new Date(entry.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  );
                  
                  const totalCredits = categoryEntries
                    .filter(entry => entry.type === 'credit')
                    .reduce((sum, entry) => sum + entry.amount, 0);
                  
                  const totalDebits = categoryEntries
                    .filter(entry => entry.type === 'debit')
                    .reduce((sum, entry) => sum + entry.amount, 0);

                  if (totalCredits === 0 && totalDebits === 0) return null;

                  return (
                    <div key={category.value} className={`category-summary ${getCategoryColor(category.value)}`}>
                      <div className="category-header">
                        <span className="category-icon">{category.icon}</span>
                        <h4>{category.label}</h4>
                      </div>
                      {totalCredits > 0 && (
                        <p className="category-amount positive">
                          In: +{totalCredits.toLocaleString()} QAR
                        </p>
                      )}
                      {totalDebits > 0 && (
                        <p className="category-amount negative">
                          Out: -{totalDebits.toLocaleString()} QAR
                        </p>
                      )}
                      <p className="category-net">
                        Net: {(totalCredits - totalDebits >= 0 ? '+' : '')}{(totalCredits - totalDebits).toLocaleString()} QAR
                      </p>
                      <p className="category-count">{categoryEntries.length} transactions</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employee Financial Summary */}
          <div className="employee-financial-summary">
            <h4>👥 Employee Financial Summary</h4>
            <div className="employee-summary-grid">
              {employees.map(employee => {
                const employeeTransactions = ledger.filter(entry => 
                  entry.employeeId === employee.id || 
                  entry.qidNumber === employee.qid?.number
                );
                
                if (employeeTransactions.length === 0) return null;

                const salaries = employeeTransactions
                  .filter(entry => entry.category === 'payroll' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                
                const advances = employeeTransactions
                  .filter(entry => entry.category === 'employee-advance' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                
                const deductions = employeeTransactions
                  .filter(entry => entry.category === 'employee-deduction' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);

                return (
                  <div key={employee.id} className="employee-summary-card">
                    <div className="employee-summary-header">
                      <h5>{employee.name}</h5>
                      <span className="employee-qid">QID: {employee.qid?.number}</span>
                    </div>
                    <div className="employee-summary-amounts">
                      <div className="amount-item">
                        <span className="amount-label">Salaries Paid:</span>
                        <span className="amount-value positive">{salaries.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Advances:</span>
                        <span className="amount-value warning">{advances.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Deductions:</span>
                        <span className="amount-value negative">{deductions.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item total">
                        <span className="amount-label">Outstanding:</span>
                        <span className={`amount-value ${(advances - deductions) > 0 ? 'warning' : 'positive'}`}>
                          {(advances - deductions).toLocaleString()} QAR
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Accounts;
