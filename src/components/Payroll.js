import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Payroll = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('salary'); // salary or advance
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
  }, []);

  const fetchEmployees = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(employeesList);
    } catch (error) {
      toast.error('Error fetching employees');
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayrollHistory = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employees'));
      const allTransactions = [];
      
      snapshot.docs.forEach(doc => {
        const employee = doc.data();
        const transactions = employee.transactions || [];
        const advances = employee.advances || [];
        
        transactions.forEach(transaction => {
          allTransactions.push({
            ...transaction,
            employeeName: employee.name,
            employeeId: doc.id,
            transactionType: 'transaction'
          });
        });
        
        advances.forEach(advance => {
          allTransactions.push({
            ...advance,
            employeeName: employee.name,
            employeeId: doc.id,
            transactionType: 'advance',
            type: 'advance'
          });
        });
      });
      
      // Sort by date descending
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setPayrollHistory(allTransactions.slice(0, 50)); // Show last 50 transactions
    } catch (error) {
      console.error('Error fetching payroll history:', error);
    }
  };

  const handleTransaction = async () => {
    if (!selectedEmp || !amount || amount <= 0) {
      toast.error('Please select an employee and enter a valid amount');
      return;
    }

    setProcessing(true);
    
    try {
      const empRef = doc(db, 'employees', selectedEmp.id);
      const date = new Date().toISOString();
      const transactionAmount = parseFloat(amount);
      
      let updates = {};
      let accountDescription = '';
      
      if (type === 'salary') {
        updates = {
          transactions: arrayUnion({
            date,
            amount: transactionAmount,
            type: 'salary',
            description: description || 'Salary payment',
            processedBy: 'Admin' // In a real app, get from auth context
          }),
          totalPaid: (selectedEmp.totalPaid || 0) + transactionAmount
        };
        accountDescription = `Salary payment for ${selectedEmp.name}`;
      } else if (type === 'advance') {
        updates = {
          advances: arrayUnion({
            date,
            amount: transactionAmount,
            repaid: false,
            description: description || 'Advance payment',
            processedBy: 'Admin'
          })
        };
        accountDescription = `Advance for ${selectedEmp.name}`;
      } else if (type === 'bonus') {
        updates = {
          transactions: arrayUnion({
            date,
            amount: transactionAmount,
            type: 'bonus',
            description: description || 'Bonus payment',
            processedBy: 'Admin'
          }),
          totalPaid: (selectedEmp.totalPaid || 0) + transactionAmount
        };
        accountDescription = `Bonus payment for ${selectedEmp.name}`;
      } else if (type === 'deduction') {
        updates = {
          transactions: arrayUnion({
            date,
            amount: -transactionAmount, // Negative for deductions
            type: 'deduction',
            description: description || 'Salary deduction',
            processedBy: 'Admin'
          }),
          totalPaid: (selectedEmp.totalPaid || 0) - transactionAmount
        };
        accountDescription = `Deduction for ${selectedEmp.name}`;
      }

      // Update employee record
      await updateDoc(empRef, updates);

      // Update accounts ledger
      try {
        const accountsRef = doc(db, 'accounts', 'main');
        await updateDoc(accountsRef, {
          ledger: arrayUnion({
            date,
            type: type === 'deduction' ? 'credit' : 'debit', // Deductions are credits to the company
            amount: transactionAmount,
            description: accountDescription,
            category: 'payroll'
          })
        });
      } catch (error) {
        console.log('Accounts collection may not exist yet, creating transaction anyway');
      }

      toast.success(t('transactionAdded'));
      
      // Reset form
      setAmount('');
      setDescription('');
      setType('salary');
      
      // Refresh data
      await fetchEmployees();
      await fetchPayrollHistory();
      
      // Update selected employee data
      const updatedEmployee = await getDocs(collection(db, 'employees'));
      const updatedEmp = updatedEmployee.docs.find(doc => doc.id === selectedEmp.id);
      if (updatedEmp) {
        setSelectedEmp({ id: updatedEmp.id, ...updatedEmp.data() });
      }
      
    } catch (error) {
      toast.error(`Error processing transaction: ${error.message}`);
      console.error('Error processing transaction:', error);
    } finally {
      setProcessing(false);
    }
  };

  const markAdvanceRepaid = async (employeeId, advanceIndex) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;

      const updatedAdvances = [...(employee.advances || [])];
      updatedAdvances[advanceIndex] = {
        ...updatedAdvances[advanceIndex],
        repaid: true,
        repaidDate: new Date().toISOString()
      };

      await updateDoc(doc(db, 'employees', employeeId), {
        advances: updatedAdvances
      });

      toast.success('Advance marked as repaid');
      fetchEmployees();
      fetchPayrollHistory();
    } catch (error) {
      toast.error('Error updating advance status');
      console.error('Error updating advance:', error);
    }
  };

  const calculatePendingAdvances = (employee) => {
    const unpaidAdvances = employee.advances?.filter(advance => !advance.repaid) || [];
    return unpaidAdvances.reduce((sum, advance) => sum + advance.amount, 0);
  };

  const getTransactionIcon = (transactionType) => {
    switch (transactionType) {
      case 'salary': return '💰';
      case 'advance': return '💳';
      case 'bonus': return '🎉';
      case 'deduction': return '📉';
      default: return '📝';
    }
  };

  return (
    <div className="payroll-page">
      <div className="page-header">
        <h2>💰 {t('payroll')}</h2>
      </div>

      <div className="payroll-content">
        {/* Transaction Form */}
        <div className="transaction-form-section">
          <h3>Process Payment</h3>
          <div className="transaction-form">
            <div className="form-group">
              <label>Select Employee *</label>
              <select 
                onChange={e => {
                  const emp = employees.find(emp => emp.id === e.target.value);
                  setSelectedEmp(emp || null);
                }}
                value={selectedEmp?.id || ''}
                className="employee-select"
              >
                <option value="">Choose Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.department} ({emp.salary?.toLocaleString()} QAR)
                  </option>
                ))}
              </select>
            </div>

            {selectedEmp && (
              <div className="employee-info">
                <div className="info-card">
                  <h4>👤 {selectedEmp.name}</h4>
                  <p><strong>Department:</strong> {selectedEmp.department}</p>
                  <p><strong>Position:</strong> {selectedEmp.position}</p>
                  <p><strong>Monthly Salary:</strong> {selectedEmp.salary?.toLocaleString()} QAR</p>
                  <p><strong>Total Paid:</strong> {(selectedEmp.totalPaid || 0).toLocaleString()} QAR</p>
                  <p><strong>Pending Advances:</strong> {calculatePendingAdvances(selectedEmp).toLocaleString()} QAR</p>
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Transaction Type *</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                className="transaction-type-select"
              >
                <option value="salary">💰 Salary Payment</option>
                <option value="advance">💳 Advance</option>
                <option value="bonus">🎉 Bonus</option>
                <option value="deduction">📉 Deduction</option>
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

            <div className="form-group">
              <label>Description</label>
              <textarea
                placeholder={`Enter description for ${type}...`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows="3"
                className="description-input"
              />
            </div>

            <button
              onClick={handleTransaction}
              disabled={processing || !selectedEmp || !amount}
              className="process-btn"
            >
              {processing ? 'Processing...' : `Process ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </button>
          </div>
        </div>

        {/* Employee Transaction History */}
        {selectedEmp && (
          <div className="employee-history-section">
            <h3>Transaction History - {selectedEmp.name}</h3>
            
            {/* Recent Transactions */}
            <div className="history-subsection">
              <h4>💰 Salary & Bonus Payments</h4>
              <div className="transactions-list">
                {selectedEmp.transactions && selectedEmp.transactions.length > 0 ? (
                  selectedEmp.transactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((tx, i) => (
                      <div key={i} className={`transaction-item ${tx.amount < 0 ? 'deduction' : 'payment'}`}>
                        <div className="transaction-info">
                          <span className="transaction-icon">{getTransactionIcon(tx.type)}</span>
                          <div className="transaction-details">
                            <strong>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</strong>
                            <p>{tx.description}</p>
                            <small>{new Date(tx.date).toLocaleDateString()}</small>
                          </div>
                        </div>
                        <div className={`transaction-amount ${tx.amount < 0 ? 'negative' : 'positive'}`}>
                          {tx.amount < 0 ? '-' : '+'}{Math.abs(tx.amount).toLocaleString()} QAR
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="no-data">No salary transactions yet</p>
                )}
              </div>
            </div>

            {/* Advances */}
            <div className="history-subsection">
              <h4>💳 Advances</h4>
              <div className="advances-list">
                {selectedEmp.advances && selectedEmp.advances.length > 0 ? (
                  selectedEmp.advances
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((advance, i) => (
                      <div key={i} className={`advance-item ${advance.repaid ? 'repaid' : 'pending'}`}>
                        <div className="advance-info">
                          <span className="advance-icon">💳</span>
                          <div className="advance-details">
                            <strong>Advance Payment</strong>
                            <p>{advance.description}</p>
                            <small>{new Date(advance.date).toLocaleDateString()}</small>
                            {advance.repaid && advance.repaidDate && (
                              <small>Repaid: {new Date(advance.repaidDate).toLocaleDateString()}</small>
                            )}
                          </div>
                        </div>
                        <div className="advance-amount">
                          {advance.amount.toLocaleString()} QAR
                          <div className="advance-actions">
                            {!advance.repaid ? (
                              <button
                                onClick={() => markAdvanceRepaid(selectedEmp.id, i)}
                                className="repaid-btn"
                                title="Mark as repaid"
                              >
                                ✅ Mark Repaid
                              </button>
                            ) : (
                              <span className="status-repaid">✅ Repaid</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="no-data">No advances taken</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Payroll Activity */}
        <div className="payroll-history-section">
          <h3>Recent Payroll Activity</h3>
          <div className="history-list">
            {payrollHistory.length > 0 ? (
              payrollHistory.map((item, i) => (
                <div key={i} className={`history-item ${item.type}`}>
                  <div className="history-info">
                    <span className="history-icon">{getTransactionIcon(item.type)}</span>
                    <div className="history-details">
                      <strong>{item.employeeName}</strong>
                      <p>{item.type.charAt(0).toUpperCase() + item.type.slice(1)} - {item.description}</p>
                      <small>{new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}</small>
                    </div>
                  </div>
                  <div className={`history-amount ${item.amount < 0 ? 'negative' : 'positive'}`}>
                    {item.amount < 0 ? '-' : '+'}{Math.abs(item.amount || 0).toLocaleString()} QAR
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No payroll activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;
