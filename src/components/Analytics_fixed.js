import React, { useState, useEffect } from 'react';
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

const Analytics = ({ employees = [], payments = [], receipts = [] }) => {
  const theme = useTheme();
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

  // Calculate KPIs
  const calculateKPIs = () => {
    if (!employees || employees.length === 0) return;

    const totalEmployees = employees.length;
    const totalPayroll = employees.reduce((sum, emp) => sum + (emp.monthlySalary || 0), 0);
    const avgSalary = totalEmployees > 0 ? totalPayroll / totalEmployees : 0;
    
    // Mock revenue and expenses calculation
    const totalRevenue = totalPayroll * 1.5; // Assume revenue is 1.5x of payroll
    const totalExpenses = totalPayroll * 1.2; // Assume expenses are 1.2x of payroll
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
    
    // Mock other KPIs
    const pendingAdvances = employees.reduce((sum, emp) => sum + (emp.advance || 0), 0);
    const outstandingInvoices = Math.random() * 50000; // Mock data

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

  // Generate chart data
  const generateChartData = () => {
    if (!employees || employees.length === 0) return;

    // Payroll Chart Data
    const payrollChartData = {
      labels: employees.slice(0, 10).map(emp => emp.name || 'Unknown'),
      datasets: [
        {
          label: 'Monthly Salary',
          data: employees.slice(0, 10).map(emp => emp.monthlySalary || 0),
          backgroundColor: 'rgba(54, 162, 235, 0.8)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
    setPayrollData(payrollChartData);

    // Salary Distribution
    const salaryRanges = {
      '< 5000': 0,
      '5000-10000': 0,
      '10000-15000': 0,
      '15000+': 0
    };

    employees.forEach(emp => {
      const salary = emp.monthlySalary || 0;
      if (salary < 5000) salaryRanges['< 5000']++;
      else if (salary <= 10000) salaryRanges['5000-10000']++;
      else if (salary <= 15000) salaryRanges['10000-15000']++;
      else salaryRanges['15000+']++;
    });

    const salaryDistChartData = {
      labels: Object.keys(salaryRanges),
      datasets: [
        {
          data: Object.values(salaryRanges),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
    setSalaryDistData(salaryDistChartData);

    // Monthly Trends (Mock data)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyTrendsChartData = {
      labels: months,
      datasets: [
        {
          label: 'Revenue',
          data: [65000, 70000, 68000, 75000, 78000, 82000],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Expenses',
          data: [50000, 55000, 52000, 58000, 60000, 62000],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
      ],
    };
    setMonthlyTrendsData(monthlyTrendsChartData);

    // Customer Data (Mock)
    const customerChartData = {
      labels: ['Company A', 'Company B', 'Company C', 'Company D', 'Company E'],
      datasets: [
        {
          label: 'Revenue (QAR)',
          data: [25000, 30000, 20000, 35000, 28000],
          backgroundColor: 'rgba(153, 102, 255, 0.8)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    };
    setCustomerData(customerChartData);

    // Cash Flow (Mock)
    const cashFlowChartData = {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          label: 'Income',
          data: [18000, 22000, 20000, 25000],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
        },
        {
          label: 'Expenses',
          data: [15000, 18000, 16000, 20000],
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.1,
        },
      ],
    };
    setCashFlowData(cashFlowChartData);

    // Department Distribution
    const departments = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      departments[dept] = (departments[dept] || 0) + 1;
    });

    const departmentChartData = {
      labels: Object.keys(departments),
      datasets: [
        {
          data: Object.values(departments),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };
    setDepartmentData(departmentChartData);
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
