import React, { useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  Button,
  useTheme,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Add as AddIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const ModernDashboard = ({ role = 'admin' }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isDarkMode = theme.palette.mode === 'dark';
  const [stats, setStats] = useState({
    totalEmployees: 156,
    totalPaid: 485000,
    activeCustomers: 23,
    pendingTasks: 12,
    monthlyGrowth: 8.5,
    payrollCompletion: 92,
  });

  const [notifications] = useState([
    { id: 1, type: 'warning', message: '5 employee documents expire in 30 days', priority: 'high' },
    { id: 2, type: 'info', message: 'Monthly payroll processing starts tomorrow', priority: 'medium' },
    { id: 3, type: 'success', message: 'All invoices for this month processed', priority: 'low' },
  ]);

  // Chart data with dark mode support
  const payrollTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Total Payroll',
        data: [450000, 465000, 478000, 485000, 492000, 485000],
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main + (isDarkMode ? '30' : '20'),
        tension: 0.4,
        fill: true,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: theme.palette.background.paper,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const departmentData = {
    labels: ['IT', 'HR', 'Finance', 'Operations', 'Sales'],
    datasets: [
      {
        data: [35, 20, 15, 20, 10],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          '#FF6B6B',
          '#4ECDC4',
          '#FFE66D',
        ],
        borderWidth: isDarkMode ? 2 : 0,
        borderColor: theme.palette.background.paper,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: { 
        display: false,
        grid: {
          color: theme.palette.divider,
        },
      },
      y: { 
        display: false,
        grid: {
          color: theme.palette.divider,
        },
      },
    },
  };

  const StatCard = ({ icon, title, value, change, color, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: onClick ? 'pointer' : 'default',
          background: isDarkMode 
            ? `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`
            : `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
          border: isDarkMode 
            ? `1px solid ${color}40`
            : `1px solid ${color}20`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDarkMode 
              ? `0 8px 32px ${color}20`
              : `0 8px 32px ${color}15`,
            border: `1px solid ${color}${isDarkMode ? '60' : '40'}`,
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Avatar
              sx={{
                backgroundColor: color,
                width: 56,
                height: 56,
                boxShadow: `0 4px 12px ${color}30`,
              }}
            >
              {icon}
            </Avatar>
            {change && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {change > 0 ? (
                  <ArrowUpward sx={{ color: '#4CAF50', fontSize: 18 }} />
                ) : (
                  <ArrowDownward sx={{ color: '#F44336', fontSize: 18 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{
                    color: change > 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 600,
                    ml: 0.5,
                  }}
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
          
          <Typography 
            variant="h4" 
            fontWeight={700} 
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
              textShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            {typeof value === 'number' && value > 1000 
              ? `${(value / 1000).toFixed(0)}K` 
              : value}
          </Typography>
          
          <Typography 
            variant="body2" 
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            {title}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  const QuickActionCard = ({ icon, title, description, color, onClick }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          height: '100%',
          cursor: 'pointer',
          border: isDarkMode 
            ? '1px solid rgba(255,255,255,0.1)'
            : `1px solid ${theme.palette.divider}`,
          background: isDarkMode
            ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
            : 'linear-gradient(135deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.01) 100%)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0,0,0,0.6)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            border: `1px solid ${color}40`,
          },
        }}
        onClick={onClick}
      >
        <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
          <Avatar
            sx={{
              backgroundColor: color,
              width: 48,
              height: 48,
              mx: 'auto',
              mb: 2,
              boxShadow: `0 4px 12px ${color}30`,
            }}
          >
            {icon}
          </Avatar>
          <Typography 
            variant="h6" 
            fontWeight={600} 
            gutterBottom
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{
              color: theme.palette.text.secondary,
              fontWeight: 500,
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ maxWidth: '100%' }}>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Welcome back! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your payroll system today
          </Typography>
        </Box>
      </motion.div>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<PeopleIcon />}
            title="Total Employees"
            value={stats.totalEmployees}
            change={5.2}
            color={theme.palette.primary.main}
            onClick={() => navigate('/employees')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<MoneyIcon />}
            title="Total Paid This Month"
            value={`$${stats.totalPaid.toLocaleString()}`}
            change={stats.monthlyGrowth}
            color={theme.palette.secondary.main}
            onClick={() => navigate('/payroll')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<BusinessIcon />}
            title="Active Customers"
            value={stats.activeCustomers}
            change={12.3}
            color="#4CAF50"
            onClick={() => navigate('/customers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<ScheduleIcon />}
            title="Pending Tasks"
            value={stats.pendingTasks}
            change={-15.8}
            color="#FF9800"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Charts Section */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={600}>
                    Payroll Trends
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly payroll overview
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AnalyticsIcon />}
                  onClick={() => navigate('/analytics')}
                >
                  View Details
                </Button>
              </Box>
              <Box sx={{ height: 300 }}>
                <Line data={payrollTrendData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>

          {/* Department Distribution */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Department Distribution
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ width: 200, height: 200 }}>
                  <Doughnut data={departmentData} options={{ maintainAspectRatio: false }} />
                </Box>
                <Box sx={{ ml: 4, flex: 1 }}>
                  {departmentData.labels.map((label, index) => (
                    <Box key={label} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: departmentData.datasets[0].backgroundColor[index],
                          mr: 2,
                        }}
                      />
                      <Typography variant="body2">
                        {label}: {departmentData.datasets[0].data[index]}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          {/* Payroll Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Progress
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Payroll Completion</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {stats.payrollCompletion}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.payrollCompletion}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Next Milestone
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  End of Month Processing
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  5 days remaining
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight={600} 
                gutterBottom
                sx={{ color: theme.palette.text.primary }}
              >
                Recent Notifications
              </Typography>
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      mb: 2, 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        transform: 'translateX(4px)',
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 24,
                        height: 24,
                        mr: 2,
                        backgroundColor: 
                          notification.type === 'warning' ? '#FF9800' :
                          notification.type === 'success' ? '#4CAF50' : '#2196F3',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {notification.type === 'warning' ? <WarningIcon fontSize="small" /> :
                       notification.type === 'success' ? <CheckIcon fontSize="small" /> : 
                       <ScheduleIcon fontSize="small" />}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mb: 0.5,
                          color: theme.palette.text.primary,
                          fontWeight: 500,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={notification.priority === 'high' ? 'error' : 'default'}
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: isDarkMode && notification.priority !== 'high' 
                            ? 'rgba(255,255,255,0.1)' 
                            : undefined,
                          color: isDarkMode && notification.priority !== 'high' 
                            ? theme.palette.text.secondary 
                            : undefined,
                        }}
                      />
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {role === 'admin' || role === 'hr' ? (
                  <Grid item xs={6}>
                    <QuickActionCard
                      icon={<AddIcon />}
                      title="Add Employee"
                      description="Register new staff"
                      color={theme.palette.primary.main}
                      onClick={() => navigate('/employees')}
                    />
                  </Grid>
                ) : null}
                {role === 'admin' || role === 'accountant' ? (
                  <Grid item xs={6}>
                    <QuickActionCard
                      icon={<MoneyIcon />}
                      title="Process Pay"
                      description="Handle payroll"
                      color={theme.palette.secondary.main}
                      onClick={() => navigate('/payroll')}
                    />
                  </Grid>
                ) : null}
                <Grid item xs={6}>
                  <QuickActionCard
                    icon={<AnalyticsIcon />}
                    title="View Reports"
                    description="Analytics dashboard"
                    color="#4CAF50"
                    onClick={() => navigate('/analytics')}
                  />
                </Grid>
                <Grid item xs={6}>
                  <QuickActionCard
                    icon={<PeopleIcon />}
                    title="Self Service"
                    description="Employee portal"
                    color="#FF9800"
                    onClick={() => navigate('/self-service')}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ModernDashboard;
