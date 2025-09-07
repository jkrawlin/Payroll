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
import * as XLSX from 'xlsx';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

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
  const theme = useTheme();
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

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // const deptSalaries = Object.values(departmentGroups).map(dept => dept.totalSalary); // Currently unused

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
    <Box sx={{ 
      backgroundColor: 'background.default', 
      color: 'text.primary', 
      minHeight: '100vh',
      p: 3 
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white'
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha('#fff', 0.2), 
                width: 60, 
                height: 60,
                mr: 3,
                color: 'white'
              }}>
                <AnalyticsIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Analytics Dashboard
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Comprehensive insights and reporting
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    👥
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="primary">
                      Total Employees
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.totalEmployees}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    💰
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Total Payroll
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.totalPayroll.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1), 
                    color: theme.palette.info.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    📊
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="info.main">
                      Total Revenue
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.totalRevenue.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.error.main, 0.1), 
                    color: theme.palette.error.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    📉
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="error.main">
                      Total Expenses
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.totalExpenses.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                    color: theme.palette.secondary.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    💵
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="secondary.main">
                      Average Salary
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.avgSalary.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(kpis.profitMargin >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1)} 0%, ${alpha(kpis.profitMargin >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(kpis.profitMargin >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(kpis.profitMargin >= 0 ? theme.palette.success.main : theme.palette.error.main, 0.1), 
                    color: kpis.profitMargin >= 0 ? theme.palette.success.main : theme.palette.error.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    📈
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color={kpis.profitMargin >= 0 ? 'success.main' : 'error.main'}>
                      Profit Margin
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.profitMargin.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.warning.main, 0.1), 
                    color: theme.palette.warning.main,
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    ⏰
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="warning.main">
                      Pending Advances
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.pendingAdvances.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#9c27b0', 0.1)} 0%, ${alpha('#9c27b0', 0.05)} 100%)`,
                border: `1px solid ${alpha('#9c27b0', 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-4px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: alpha('#9c27b0', 0.1), 
                    color: '#9c27b0',
                    width: 56,
                    height: 56,
                    mr: 2
                  }}>
                    📋
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: '#9c27b0' }}>
                      Outstanding Invoices
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {kpis.outstandingInvoices.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Payroll Chart */}
          {payrollData.labels.length > 0 && (
            <Grid item xs={12} lg={6}>
              <Card elevation={3} sx={{
                p: 3,
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  elevation: 8,
                  transform: 'translateY(-2px)'
                }
              }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    mr: 2
                  }}>
                    💰
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Employee Payroll Analysis
                  </Typography>
                </Box>
                <Box sx={{ height: 400 }}>
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
                </Box>
              </Card>
            </Grid>
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
