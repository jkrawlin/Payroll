import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
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
  const { t } = useTranslation();

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'payroll', label: 'Payroll' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'expenses', label: 'Expenses' },
    { value: 'office', label: 'Office Expenses' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'transport', label: 'Transport' },
    { value: 'supplies', label: 'Supplies' }
  ];

  useEffect(() => {
    fetchAccounts();
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
    if (type === 'credit') {
      switch (category) {
        case 'revenue': return '💰';
        case 'payroll': return '↩️';
        default: return '📈';
      }
    } else {
      switch (category) {
        case 'payroll': return '👥';
        case 'expenses': return '💸';
        case 'office': return '🏢';
        case 'utilities': return '⚡';
        case 'transport': return '🚗';
        case 'supplies': return '📦';
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
        <h2>📊 {t('accounts')}</h2>
        <div className="header-actions">
          <button onClick={exportToCSV} className="export-btn">
            📄 Export CSV
          </button>
        </div>
      </div>

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
      </div>

      {/* Cash Flow Indicator */}
      <div className={`cash-flow-indicator ${cashFlow.netFlow >= 0 ? 'positive' : 'negative'}`}>
        <h4>30-Day Net Cash Flow: {cashFlow.netFlow >= 0 ? '+' : ''}{cashFlow.netFlow.toLocaleString()} QAR</h4>
      </div>

      <div className="accounts-content">
        {/* Add Entry Form */}
        <div className="entry-form-section">
          <h3>Add New Entry</h3>
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
                      {cat.label}
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

            <button
              onClick={handleEntry}
              disabled={loading || !amount || !description.trim()}
              className="add-entry-btn"
            >
              {loading ? 'Adding...' : `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Entry`}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <h3>Transaction History</h3>
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

        {/* Category Breakdown */}
        {ledger.length > 0 && (
          <div className="category-breakdown-section">
            <h3>Category Breakdown (Last 30 Days)</h3>
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
                    <h4>{category.label}</h4>
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
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Accounts;
