import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Analytics = () => {
  const [payrollData, setPayrollData] = useState({ labels: [], datasets: [] });
  const [customerData, setCustomerData] = useState({ labels: [], datasets: [] });
  const [cashFlowData, setCashFlowData] = useState({ labels: [], datasets: [] });
  const [departmentData, setDepartmentData] = useState({ labels: [], datasets: [] });
  const [kpis, setKpis] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    avgSalary: 0,
    profitMargin: 0,
    pendingAdvances: 0,
    outstandingInvoices: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30'); // days
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchEmployeesData(),
        fetchCustomersData(),
        fetchAccountsData()
      ]);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesData = async () => {
    try {
      const employeesSnapshot = await getDocs(collection(db, 'employees'));
      const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Payroll by Employee
      const labels = employees.map(emp => emp.name);
      const totals = employees.map(emp => emp.totalPaid || 0);
      const salaries = employees.map(emp => emp.salary || 0);

      setPayrollData({
        labels,
        datasets: [
          {
            label: 'Total Paid (QAR)',
            data: totals,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Monthly Salary (QAR)',
            data: salaries,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ]
      });

      // Department breakdown
      const departmentGroups = employees.reduce((acc, emp) => {
        const dept = emp.department || 'Unknown';
        if (!acc[dept]) acc[dept] = { count: 0, totalSalary: 0 };
        acc[dept].count += 1;
        acc[dept].totalSalary += emp.salary || 0;
        return acc;
      }, {});

      const deptLabels = Object.keys(departmentGroups);
      const deptCounts = Object.values(departmentGroups).map(dept => dept.count);
      const deptSalaries = Object.values(departmentGroups).map(dept => dept.totalSalary);

      setDepartmentData({
        labels: deptLabels,
        datasets: [
          {
            label: 'Employee Count',
            data: deptCounts,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40'
            ]
          }
        ]
      });

      // Calculate KPIs
      const totalEmployees = employees.length;
      const totalPayroll = employees.reduce((sum, emp) => sum + (emp.totalPaid || 0), 0);
      const avgSalary = employees.length > 0 ? employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length : 0;
      const pendingAdvances = employees.reduce((sum, emp) => {
        const unpaidAdvances = emp.advances?.filter(adv => !adv.repaid) || [];
        return sum + unpaidAdvances.reduce((advSum, adv) => advSum + adv.amount, 0);
      }, 0);

      setKpis(prev => ({
        ...prev,
        totalEmployees,
        totalPayroll,
        avgSalary,
        pendingAdvances
      }));

    } catch (error) {
      console.error('Error fetching employees data:', error);
    }
  };

  const fetchCustomersData = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customers = customersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Revenue by Customer
      const customerLabels = customers.map(cust => cust.name);
      const customerRevenues = customers.map(cust => cust.totalPaid || 0);

      setCustomerData({
        labels: customerLabels,
        datasets: [
          {
            label: 'Revenue (QAR)',
            data: customerRevenues,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }
        ]
      });

      // Calculate revenue KPIs
      const totalRevenue = customers.reduce((sum, cust) => sum + (cust.totalPaid || 0), 0);
      const outstandingInvoices = customers.reduce((sum, cust) => 
        sum + ((cust.totalInvoiced || 0) - (cust.totalPaid || 0)), 0
      );

      setKpis(prev => ({
        ...prev,
        totalRevenue,
        outstandingInvoices
      }));

    } catch (error) {
      console.error('Error fetching customers data:', error);
    }
  };

  const fetchAccountsData = async () => {
    try {
      const accountsSnapshot = await getDocs(collection(db, 'accounts'));
      if (accountsSnapshot.empty) return;

      const accountsDoc = accountsSnapshot.docs[0].data();
      const ledger = accountsDoc.ledger || [];

      // Filter by selected period
      const periodDays = parseInt(selectedPeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const filteredLedger = ledger.filter(entry => 
        new Date(entry.date) >= startDate
      );

      // Cash flow over time
      const dailyFlow = {};
      filteredLedger.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString();
        if (!dailyFlow[date]) {
          dailyFlow[date] = { credits: 0, debits: 0 };
        }
        if (entry.type === 'credit') {
          dailyFlow[date].credits += entry.amount;
        } else {
          dailyFlow[date].debits += entry.amount;
        }
      });

      const flowLabels = Object.keys(dailyFlow).sort();
      const credits = flowLabels.map(date => dailyFlow[date].credits);
      const debits = flowLabels.map(date => dailyFlow[date].debits);

      setCashFlowData({
        labels: flowLabels,
        datasets: [
          {
            label: 'Income (QAR)',
            data: credits,
            fill: false,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Expenses (QAR)',
            data: debits,
            fill: false,
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      });

      // Calculate financial KPIs
      const totalExpenses = filteredLedger
        .filter(entry => entry.type === 'debit')
        .reduce((sum, entry) => sum + entry.amount, 0);

      setKpis(prev => {
        const profitMargin = prev.totalRevenue > 0 
          ? ((prev.totalRevenue - totalExpenses) / prev.totalRevenue) * 100 
          : 0;

        return {
          ...prev,
          totalExpenses,
          profitMargin
        };
      });

    } catch (error) {
      console.error('Error fetching accounts data:', error);
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
    },
  };

  const exportReport = () => {
    const reportData = {
      period: `${selectedPeriod} days`,
      generatedAt: new Date().toISOString(),
      kpis,
      summary: {
        totalEmployees: kpis.totalEmployees,
        totalPayroll: kpis.totalPayroll,
        totalRevenue: kpis.totalRevenue,
        profit: kpis.totalRevenue - kpis.totalExpenses,
        profitMargin: kpis.profitMargin
      }
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-spinner">
          <p>Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h2>📈 {t('analytics')}</h2>
        <div className="header-actions">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <button onClick={exportReport} className="export-btn">
            📄 Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <h3>Total Employees</h3>
            <p className="kpi-value">{kpis.totalEmployees}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Total Payroll</h3>
            <p className="kpi-value">{kpis.totalPayroll.toLocaleString()} QAR</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📊</div>
          <div className="kpi-content">
            <h3>Total Revenue</h3>
            <p className="kpi-value">{kpis.totalRevenue.toLocaleString()} QAR</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📉</div>
          <div className="kpi-content">
            <h3>Total Expenses</h3>
            <p className="kpi-value">{kpis.totalExpenses.toLocaleString()} QAR</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">💵</div>
          <div className="kpi-content">
            <h3>Average Salary</h3>
            <p className="kpi-value">{kpis.avgSalary.toLocaleString()} QAR</p>
          </div>
        </div>

        <div className={`kpi-card ${kpis.profitMargin >= 0 ? 'positive' : 'negative'}`}>
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <h3>Profit Margin</h3>
            <p className="kpi-value">{kpis.profitMargin.toFixed(1)}%</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⏰</div>
          <div className="kpi-content">
            <h3>Pending Advances</h3>
            <p className="kpi-value">{kpis.pendingAdvances.toLocaleString()} QAR</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">📋</div>
          <div className="kpi-content">
            <h3>Outstanding Invoices</h3>
            <p className="kpi-value">{kpis.outstandingInvoices.toLocaleString()} QAR</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Payroll Chart */}
        {payrollData.labels.length > 0 && (
          <div className="chart-card">
            <h3>💰 Employee Payroll Analysis</h3>
            <div className="chart-container">
              <Bar
                data={payrollData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: 'Total Paid vs Monthly Salary by Employee'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Customer Revenue Chart */}
        {customerData.labels.length > 0 && (
          <div className="chart-card">
            <h3>🏢 Customer Revenue Analysis</h3>
            <div className="chart-container">
              <Bar
                data={customerData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: 'Revenue by Customer'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Cash Flow Chart */}
        {cashFlowData.labels.length > 0 && (
          <div className="chart-card full-width">
            <h3>💹 Cash Flow Trend ({selectedPeriod} days)</h3>
            <div className="chart-container">
              <Line
                data={cashFlowData}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      display: true,
                      text: 'Daily Income vs Expenses'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Department Distribution */}
        {departmentData.labels.length > 0 && (
          <div className="chart-card">
            <h3>🏢 Department Distribution</h3>
            <div className="chart-container">
              <Pie
                data={departmentData}
                options={{
                  ...pieOptions,
                  plugins: {
                    ...pieOptions.plugins,
                    title: {
                      display: true,
                      text: 'Employees by Department'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary */}
      <div className="financial-summary">
        <h3>💼 Financial Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Total Income:</span>
            <span className="summary-value positive">+{kpis.totalRevenue.toLocaleString()} QAR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Expenses:</span>
            <span className="summary-value negative">-{kpis.totalExpenses.toLocaleString()} QAR</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Net Profit:</span>
            <span className={`summary-value ${(kpis.totalRevenue - kpis.totalExpenses) >= 0 ? 'positive' : 'negative'}`}>
              {(kpis.totalRevenue - kpis.totalExpenses) >= 0 ? '+' : ''}
              {(kpis.totalRevenue - kpis.totalExpenses).toLocaleString()} QAR
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Profit Margin:</span>
            <span className={`summary-value ${kpis.profitMargin >= 0 ? 'positive' : 'negative'}`}>
              {kpis.profitMargin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-section">
        <h3>💡 Quick Insights</h3>
        <div className="insights-grid">
          {kpis.totalEmployees > 0 && (
            <div className="insight-card">
              <h4>👥 Workforce</h4>
              <p>You have <strong>{kpis.totalEmployees}</strong> employees with an average salary of <strong>{kpis.avgSalary.toLocaleString()} QAR</strong></p>
            </div>
          )}
          
          {kpis.pendingAdvances > 0 && (
            <div className="insight-card warning">
              <h4>⚠️ Pending Advances</h4>
              <p>There are <strong>{kpis.pendingAdvances.toLocaleString()} QAR</strong> in pending advances that need to be repaid</p>
            </div>
          )}
          
          {kpis.outstandingInvoices > 0 && (
            <div className="insight-card info">
              <h4>📋 Outstanding Invoices</h4>
              <p>You have <strong>{kpis.outstandingInvoices.toLocaleString()} QAR</strong> in outstanding invoices from customers</p>
            </div>
          )}
          
          {kpis.profitMargin < 10 && kpis.totalRevenue > 0 && (
            <div className="insight-card warning">
              <h4>📉 Low Profit Margin</h4>
              <p>Your profit margin is <strong>{kpis.profitMargin.toFixed(1)}%</strong>. Consider reviewing expenses or increasing revenue</p>
            </div>
          )}
          
          {kpis.profitMargin >= 20 && (
            <div className="insight-card success">
              <h4>📈 Healthy Profit Margin</h4>
              <p>Your profit margin of <strong>{kpis.profitMargin.toFixed(1)}%</strong> indicates good financial health</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
