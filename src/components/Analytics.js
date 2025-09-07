import React, { useState, useEffect } from 'react';
import { mockAnalytics, mockEmployees, mockCustomers, mockAccounts } from '../services/mockData';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Paper, 
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement
);

const Analytics = ({ 
  employees = mockEmployees, 
  payments = [], 
  receipts = [],
  customers = mockCustomers,
  accounts = mockAccounts
}) => {
  const theme = useTheme();
  const [kpis, setKpis] = useState(mockAnalytics.kpis.reduce((acc, kpi) => ({
    ...acc,
    [kpi.title.toLowerCase().replace(' ', '')]: kpi.value
  }), {}));
  
  const [payrollData, setPayrollData] = useState({ labels: [], datasets: [] });
  const [salaryDistData, setSalaryDistData] = useState({ labels: [], datasets: [] });
  const [monthlyTrendsData, setMonthlyTrendsData] = useState({ labels: [], datasets: [] });
  const [customerData, setCustomerData] = useState({ labels: [], datasets: [] });
  const [cashFlowData, setCashFlowData] = useState({ labels: [], datasets: [] });
  const [departmentData, setDepartmentData] = useState({ labels: [], datasets: [] });
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Analytics Chart',
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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: 'Distribution Chart',
      },
    },
  };

  // Calculate KPIs using mock data
  const calculateKPIs = () => {
    const totalEmployees = employees.length;
    const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
    
    // Use accounts data for revenue/expenses
    const totalRevenue = accounts?.kpis?.totalRevenue || 485000;
    const totalExpenses = accounts?.kpis?.totalExpenses || 285000;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    
    // Calculate pending advances from employee data
    const pendingAdvances = employees.reduce((sum, emp) => {
      const empAdvances = emp.advances?.filter(adv => adv.status === 'pending') || [];
      return sum + empAdvances.reduce((advSum, adv) => advSum + (adv.amount || 0), 0);
    }, 0);
    
    // Calculate outstanding invoices from customer data
    const outstandingInvoices = customers.reduce((sum, cust) => {
      const pendingInvoices = cust.invoices?.filter(inv => inv.status === 'pending' || inv.status === 'overdue') || [];
      return sum + pendingInvoices.reduce((invSum, inv) => invSum + (inv.amount || 0), 0);
    }, 0);

    setKpis({
      totalEmployees,
      totalPayroll,
      totalRevenue,
      totalExpenses,
      avgSalary,
      profitMargin,
      pendingAdvances,
      outstandingInvoices
    });
  };

  // Generate chart data using mock data
  const generateChartData = () => {
    // Payroll Chart Data
    const payrollChartData = {
      labels: employees.slice(0, 10).map(emp => emp.name || 'Unknown'),
      datasets: [
        {
          label: 'Monthly Salary (QAR)',
          data: employees.slice(0, 10).map(emp => emp.salary || 0),
          backgroundColor: `rgba(${theme.palette.primary.main.slice(1)}, 0.8)`.replace('#', ''),
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        },
      ],
    };
    setPayrollData(payrollChartData);

    // Salary Distribution
    const salaryRanges = {
      '< 8000': 0,
      '8000-10000': 0,
      '10000-13000': 0,
      '13000+': 0
    };

    employees.forEach(emp => {
      const salary = emp.salary || 0;
      if (salary < 8000) salaryRanges['< 8000']++;
      else if (salary <= 10000) salaryRanges['8000-10000']++;
      else if (salary <= 13000) salaryRanges['10000-13000']++;
      else salaryRanges['13000+']++;
    });

    const salaryDistChartData = {
      labels: Object.keys(salaryRanges),
      datasets: [
        {
          label: 'Number of Employees',
          data: Object.values(salaryRanges),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
          borderWidth: 2,
        },
      ],
    };
    setSalaryDistData(salaryDistChartData);

    // Monthly Trends using mock analytics data
    const monthlyTrendsChartData = {
      labels: mockAnalytics.chartData.labels,
      datasets: [
        {
          label: 'Revenue (QAR)',
          data: mockAnalytics.chartData.revenue,
          borderColor: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Expenses (QAR)',
          data: mockAnalytics.chartData.expenses,
          borderColor: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Profit (QAR)',
          data: mockAnalytics.chartData.profit,
          borderColor: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
          tension: 0.4,
          fill: true,
        },
      ],
    };
    setMonthlyTrendsData(monthlyTrendsChartData);

    // Customer Revenue Data
    const customerChartData = {
      labels: customers.map(cust => cust.name),
      datasets: [
        {
          label: 'Total Invoiced (QAR)',
          data: customers.map(cust => cust.totalInvoiced || 0),
          backgroundColor: alpha(theme.palette.info.main, 0.8),
          borderColor: theme.palette.info.main,
          borderWidth: 2,
        },
      ],
    };
    setCustomerData(customerChartData);

    // Department Analysis
    const departmentCounts = {};
    const departmentSalaries = {};
    
    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
      departmentSalaries[dept] = (departmentSalaries[dept] || 0) + (emp.salary || 0);
    });

    const departmentChartData = {
      labels: Object.keys(departmentCounts),
      datasets: [
        {
          label: 'Employee Count',
          data: Object.values(departmentCounts),
          backgroundColor: [
            alpha(theme.palette.primary.main, 0.8),
            alpha(theme.palette.secondary.main, 0.8),
            alpha(theme.palette.success.main, 0.8),
            alpha(theme.palette.warning.main, 0.8),
            alpha(theme.palette.info.main, 0.8),
          ],
          borderWidth: 2,
        },
      ],
    };
    setDepartmentData(departmentChartData);

    // Cash Flow Data using accounts ledger
    const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const cashFlowChartData = {
      labels: weekLabels,
      datasets: [
        {
          label: 'Income (QAR)',
          data: [180000, 220000, 200000, 250000],
          borderColor: theme.palette.success.main,
          backgroundColor: alpha(theme.palette.success.main, 0.1),
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Expenses (QAR)',
          data: [150000, 180000, 160000, 200000],
          borderColor: theme.palette.error.main,
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          tension: 0.4,
          fill: true,
        },
      ],
    };
    setCashFlowData(cashFlowChartData);
  };

  useEffect(() => {
    calculateKPIs();
    generateChartData();
  }, [employees, payments, receipts, selectedPeriod]);

  const exportReport = () => {
    const reportData = {
      kpis,
      timestamp: new Date().toISOString(),
      period: selectedPeriod,
    };
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!employees || employees.length === 0) {
    return (
      <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
        <Typography variant="h4" color="text.primary">
          No employee data available for analytics
        </Typography>
      </Box>
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
                📊
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
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="h6" fontWeight={600}>
                Period:
              </Typography>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                style={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px'
                }}
              >
                <option value="7" style={{color: '#000'}}>Last 7 days</option>
                <option value="30" style={{color: '#000'}}>Last 30 days</option>
                <option value="90" style={{color: '#000'}}>Last 3 months</option>
                <option value="365" style={{color: '#000'}}>Last year</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={exportReport}
                style={{
                  backgroundColor: alpha('#fff', 0.2),
                  color: 'white',
                  border: `1px solid ${alpha('#fff', 0.3)}`,
                  borderRadius: '8px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                📄 Export Report
              </motion.button>
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
                    💵
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="info.main">
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
                          display: false
                        }
                      }
                    }}
                  />
                </Box>
              </Card>
            </Grid>
          )}

          {/* Salary Distribution Chart */}
          {salaryDistData.labels.length > 0 && (
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
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    mr: 2
                  }}>
                    📊
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Salary Distribution
                  </Typography>
                </Box>
                <Box sx={{ height: 400 }}>
                  <Pie
                    data={salaryDistData}
                    options={{
                      ...pieOptions,
                      plugins: {
                        ...pieOptions.plugins,
                        title: {
                          display: false
                        }
                      }
                    }}
                  />
                </Box>
              </Card>
            </Grid>
          )}

          {/* Monthly Trends Chart */}
          {monthlyTrendsData.labels.length > 0 && (
            <Grid item xs={12}>
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
                    bgcolor: alpha(theme.palette.info.main, 0.1), 
                    color: theme.palette.info.main,
                    mr: 2
                  }}>
                    📈
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Monthly Financial Trends
                  </Typography>
                </Box>
                <Box sx={{ height: 400 }}>
                  <Line
                    data={monthlyTrendsData}
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        title: {
                          display: false
                        }
                      }
                    }}
                  />
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      </motion.div>

      {/* Business Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          }}
        >
          <Box display="flex" alignItems="center" mb={3}>
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.secondary.main, 0.1), 
              color: theme.palette.secondary.main,
              mr: 2
            }}>
              💡
            </Avatar>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Business Insights
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {kpis.avgSalary > 10000 && (
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: theme.palette.success.main,
                      mr: 2,
                      width: 40,
                      height: 40
                    }}>
                      💰
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Competitive Salaries
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your average salary of <strong>QR {kpis.avgSalary.toLocaleString()}</strong> is competitive in the market
                  </Typography>
                </Card>
              </Grid>
            )}

            {kpis.profitMargin >= 20 && (
              <Grid item xs={12} md={6}>
                <Card elevation={2} sx={{
                  p: 3,
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: theme.palette.success.main,
                      mr: 2,
                      width: 40,
                      height: 40
                    }}>
                      📈
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      Healthy Profit Margin
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Your profit margin of <strong>{kpis.profitMargin.toFixed(1)}%</strong> indicates good financial health
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Analytics;
