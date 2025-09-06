import React, { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const SelfService = ({ userId }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdvanceRequest, setShowAdvanceRequest] = useState(false);
  const [advanceRequests, setAdvanceRequests] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const { t } = useTranslation();

  const advanceRequestSchema = Yup.object({
    amount: Yup.number()
      .positive('Amount must be positive')
      .max(5000, 'Maximum advance amount is 5000 QAR')
      .required('Amount is required'),
    reason: Yup.string()
      .min(10, 'Please provide a detailed reason (minimum 10 characters)')
      .required('Reason is required'),
    repaymentMonths: Yup.number()
      .min(1, 'Minimum 1 month')
      .max(6, 'Maximum 6 months')
      .required('Repayment period is required')
  });

  const advanceFormik = useFormik({
    initialValues: {
      amount: '',
      reason: '',
      repaymentMonths: '1',
      urgency: 'normal'
    },
    validationSchema: advanceRequestSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const requestData = {
          employeeId: employee.id,
          employeeName: employee.name,
          amount: parseFloat(values.amount),
          reason: values.reason,
          repaymentMonths: parseInt(values.repaymentMonths),
          urgency: values.urgency,
          status: 'pending',
          requestedAt: new Date().toISOString(),
          monthlyDeduction: parseFloat(values.amount) / parseInt(values.repaymentMonths)
        };

        // In a real app, this would go to a separate 'advanceRequests' collection
        // For now, we'll add it to the employee's advances array with pending status
        await updateDoc(doc(db, 'employees', employee.id), {
          advanceRequests: arrayUnion(requestData)
        });

        toast.success('Advance request submitted successfully');
        resetForm();
        setShowAdvanceRequest(false);
        fetchEmployeeData();
      } catch (error) {
        toast.error(`Error submitting request: ${error.message}`);
        console.error('Error submitting advance request:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (userId || auth.currentUser) {
      fetchEmployeeData();
    }
  }, [userId]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      
      // In a real app, you'd link the userId to employee ID through a users collection
      // For demo purposes, we'll try to find an employee by email or use the first one
      const currentUser = auth.currentUser;
      let employeeDoc = null;

      if (currentUser) {
        // Try to find employee by email first
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const employeeByEmail = employees.find(emp => emp.email === currentUser.email);
        
        if (employeeByEmail) {
          setEmployee(employeeByEmail);
        } else if (employees.length > 0) {
          // For demo, use the first employee
          setEmployee(employees[0]);
        }
      }

      // If we have an employee, generate sample payslips
      if (employee) {
        generateSamplePayslips(employee);
      }

    } catch (error) {
      toast.error('Error fetching employee data');
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSamplePayslips = (emp) => {
    const samplePayslips = [];
    const today = new Date();
    
    // Generate last 6 months of payslips
    for (let i = 0; i < 6; i++) {
      const payslipDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const baseSalary = emp.salary || 3000;
      const allowances = baseSalary * 0.1; // 10% allowances
      const deductions = baseSalary * 0.05; // 5% deductions
      const netSalary = baseSalary + allowances - deductions;
      
      samplePayslips.push({
        id: `payslip-${payslipDate.getFullYear()}-${payslipDate.getMonth() + 1}`,
        month: payslipDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date: payslipDate.toISOString(),
        baseSalary,
        allowances,
        deductions,
        netSalary,
        status: i === 0 ? 'current' : 'paid'
      });
    }
    
    setPayslips(samplePayslips);
  };

  const downloadPayslip = (payslip) => {
    // Generate simple payslip text
    const payslipText = `
PAYSLIP
Employee: ${employee.name}
Month: ${payslip.month}
Department: ${employee.department}
Position: ${employee.position}

EARNINGS:
Basic Salary: ${payslip.baseSalary.toLocaleString()} QAR
Allowances: ${payslip.allowances.toLocaleString()} QAR
Gross Salary: ${(payslip.baseSalary + payslip.allowances).toLocaleString()} QAR

DEDUCTIONS:
Total Deductions: ${payslip.deductions.toLocaleString()} QAR

NET SALARY: ${payslip.netSalary.toLocaleString()} QAR

Generated on: ${new Date().toLocaleDateString()}
    `.trim();

    const blob = new Blob([payslipText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${employee.name.replace(' ', '-')}-${payslip.month.replace(' ', '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Payslip downloaded');
  };

  const getAdvanceRequestStatus = (status) => {
    const statusMap = {
      'pending': { color: 'status-pending', label: 'Pending Review' },
      'approved': { color: 'status-approved', label: 'Approved' },
      'rejected': { color: 'status-rejected', label: 'Rejected' },
      'disbursed': { color: 'status-disbursed', label: 'Disbursed' }
    };
    return statusMap[status] || { color: 'status-unknown', label: 'Unknown' };
  };

  const calculatePendingAdvances = () => {
    if (!employee || !employee.advances) return 0;
    return employee.advances
      .filter(advance => !advance.repaid)
      .reduce((sum, advance) => sum + advance.amount, 0);
  };

  if (loading) {
    return (
      <div className="self-service-page">
        <div className="loading-spinner">
          <p>Loading your information...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="self-service-page">
        <div className="no-data">
          <h3>Employee Profile Not Found</h3>
          <p>Your employee profile could not be found. Please contact HR for assistance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="self-service-page">
      <div className="page-header">
        <h2>🔐 {t('selfService')}</h2>
        <p>Welcome, {employee.name}!</p>
      </div>

      <div className="self-service-content">
        {/* Employee Profile */}
        <div className="profile-section">
          <h3>👤 My Profile</h3>
          <div className="profile-card">
            <div className="profile-info">
              <div className="info-grid">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{employee.name}</span>
                </div>
                <div className="info-item">
                  <label>Department:</label>
                  <span>{employee.department}</span>
                </div>
                <div className="info-item">
                  <label>Position:</label>
                  <span>{employee.position}</span>
                </div>
                <div className="info-item">
                  <label>Employee ID:</label>
                  <span>{employee.id}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{employee.email || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{employee.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Monthly Salary:</label>
                  <span>{(employee.salary || 0).toLocaleString()} QAR</span>
                </div>
                <div className="info-item">
                  <label>Total Received:</label>
                  <span>{(employee.totalPaid || 0).toLocaleString()} QAR</span>
                </div>
              </div>
            </div>

            {/* Document Status */}
            <div className="document-status">
              <h4>📋 Document Status</h4>
              <div className="status-grid">
                <div className="status-item">
                  <span>QID:</span>
                  <span className={`status-badge ${
                    new Date(employee.qid?.expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) 
                      ? 'status-warning' : 'status-ok'
                  }`}>
                    Expires {new Date(employee.qid?.expiry).toLocaleDateString()}
                  </span>
                </div>
                <div className="status-item">
                  <span>Passport:</span>
                  <span className={`status-badge ${
                    new Date(employee.passport?.expiry) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                      ? 'status-warning' : 'status-ok'
                  }`}>
                    Expires {new Date(employee.passport?.expiry).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h4>Current Salary</h4>
                <p>{(employee.salary || 0).toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h4>Total Received</h4>
                <p>{(employee.totalPaid || 0).toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💳</div>
              <div className="stat-content">
                <h4>Pending Advances</h4>
                <p>{calculatePendingAdvances().toLocaleString()} QAR</p>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h4>Payslips Available</h4>
                <p>{payslips.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payslips Section */}
        <div className="payslips-section">
          <h3>💼 My Payslips</h3>
          <div className="payslips-grid">
            {payslips.map(payslip => (
              <div key={payslip.id} className={`payslip-card ${payslip.status}`}>
                <div className="payslip-header">
                  <h4>{payslip.month}</h4>
                  <span className={`status-badge status-${payslip.status}`}>
                    {payslip.status}
                  </span>
                </div>
                <div className="payslip-details">
                  <p><strong>Gross:</strong> {(payslip.baseSalary + payslip.allowances).toLocaleString()} QAR</p>
                  <p><strong>Deductions:</strong> {payslip.deductions.toLocaleString()} QAR</p>
                  <p><strong>Net Salary:</strong> {payslip.netSalary.toLocaleString()} QAR</p>
                </div>
                <button 
                  onClick={() => downloadPayslip(payslip)}
                  className="download-btn"
                >
                  📄 Download
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Advance Request Section */}
        <div className="advance-section">
          <div className="section-header">
            <h3>💳 Advance Requests</h3>
            <button
              onClick={() => setShowAdvanceRequest(!showAdvanceRequest)}
              className="request-advance-btn"
            >
              {showAdvanceRequest ? '✖️ Cancel' : '➕ Request Advance'}
            </button>
          </div>

          {/* Advance Request Form */}
          {showAdvanceRequest && (
            <div className="advance-form-section">
              <h4>Submit Advance Request</h4>
              <form onSubmit={advanceFormik.handleSubmit} className="advance-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Amount (QAR) *</label>
                    <input
                      name="amount"
                      type="number"
                      placeholder="Enter advance amount"
                      onChange={advanceFormik.handleChange}
                      onBlur={advanceFormik.handleBlur}
                      value={advanceFormik.values.amount}
                      max="5000"
                      min="100"
                      step="50"
                      className={advanceFormik.touched.amount && advanceFormik.errors.amount ? 'error' : ''}
                    />
                    {advanceFormik.touched.amount && advanceFormik.errors.amount && (
                      <p className="error-message">{advanceFormik.errors.amount}</p>
                    )}
                    <small>Maximum advance amount: 5000 QAR</small>
                  </div>

                  <div className="form-group">
                    <label>Repayment Period *</label>
                    <select
                      name="repaymentMonths"
                      onChange={advanceFormik.handleChange}
                      onBlur={advanceFormik.handleBlur}
                      value={advanceFormik.values.repaymentMonths}
                      className={advanceFormik.touched.repaymentMonths && advanceFormik.errors.repaymentMonths ? 'error' : ''}
                    >
                      <option value="1">1 Month</option>
                      <option value="2">2 Months</option>
                      <option value="3">3 Months</option>
                      <option value="6">6 Months</option>
                    </select>
                    {advanceFormik.touched.repaymentMonths && advanceFormik.errors.repaymentMonths && (
                      <p className="error-message">{advanceFormik.errors.repaymentMonths}</p>
                    )}
                    {advanceFormik.values.amount && advanceFormik.values.repaymentMonths && (
                      <small>
                        Monthly deduction: {(parseFloat(advanceFormik.values.amount) / parseInt(advanceFormik.values.repaymentMonths)).toLocaleString()} QAR
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Urgency Level</label>
                    <select
                      name="urgency"
                      onChange={advanceFormik.handleChange}
                      value={advanceFormik.values.urgency}
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Reason for Advance *</label>
                    <textarea
                      name="reason"
                      placeholder="Please provide a detailed reason for the advance request"
                      onChange={advanceFormik.handleChange}
                      onBlur={advanceFormik.handleBlur}
                      value={advanceFormik.values.reason}
                      rows="4"
                      className={advanceFormik.touched.reason && advanceFormik.errors.reason ? 'error' : ''}
                    />
                    {advanceFormik.touched.reason && advanceFormik.errors.reason && (
                      <p className="error-message">{advanceFormik.errors.reason}</p>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    disabled={advanceFormik.isSubmitting}
                    className="submit-advance-btn"
                  >
                    {advanceFormik.isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Advance History */}
          <div className="advance-history">
            <h4>Advance History</h4>
            {employee.advances && employee.advances.length > 0 ? (
              <div className="advances-list">
                {employee.advances
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map((advance, index) => (
                    <div key={index} className={`advance-item ${advance.repaid ? 'repaid' : 'active'}`}>
                      <div className="advance-info">
                        <div className="advance-header">
                          <strong>{advance.amount.toLocaleString()} QAR</strong>
                          <span className={`status-badge ${advance.repaid ? 'status-paid' : 'status-pending'}`}>
                            {advance.repaid ? 'Repaid' : 'Active'}
                          </span>
                        </div>
                        <p>{advance.description || 'Advance payment'}</p>
                        <small>
                          Received: {new Date(advance.date).toLocaleDateString()}
                          {advance.repaidDate && ` | Repaid: ${new Date(advance.repaidDate).toLocaleDateString()}`}
                        </small>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <p className="no-data">No advance history</p>
            )}

            {/* Advance Requests */}
            {employee.advanceRequests && employee.advanceRequests.length > 0 && (
              <div className="advance-requests">
                <h5>Recent Requests</h5>
                {employee.advanceRequests
                  .sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt))
                  .map((request, index) => {
                    const statusInfo = getAdvanceRequestStatus(request.status);
                    return (
                      <div key={index} className="request-item">
                        <div className="request-info">
                          <div className="request-header">
                            <strong>{request.amount.toLocaleString()} QAR</strong>
                            <span className={`status-badge ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p>{request.reason}</p>
                          <div className="request-details">
                            <small>Requested: {new Date(request.requestedAt).toLocaleDateString()}</small>
                            <small>Repayment: {request.repaymentMonths} months</small>
                            <small>Urgency: {request.urgency}</small>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="transactions-section">
          <h3>💰 My Transaction History</h3>
          {employee.transactions && employee.transactions.length > 0 ? (
            <div className="transactions-list">
              {employee.transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10) // Show last 10 transactions
                .map((transaction, index) => (
                  <div key={index} className={`transaction-item ${transaction.type}`}>
                    <div className="transaction-info">
                      <div className="transaction-header">
                        <strong>{transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</strong>
                        <span className={`amount ${transaction.amount >= 0 ? 'positive' : 'negative'}`}>
                          {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()} QAR
                        </span>
                      </div>
                      <p>{transaction.description || `${transaction.type} payment`}</p>
                      <small>{new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}</small>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <p className="no-data">No transaction history available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfService;
