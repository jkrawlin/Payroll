import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  Alert,
  useTheme,
  alpha,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Business as BusinessIcon,
  Warning as WarningIcon,
  Logout as LogoutIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  AccountBalance as AccountBalanceIcon,
  Work as WorkIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Dashboard = ({ role = 'admin' }) => {
  const theme = useTheme();
  const [upcomingExpiries, setUpcomingExpiries] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPaid: 0,
    pendingAdvances: 0,
    customersCount: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch employees and check expiries
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const expiries = employees.map(employee => {
          const qidExpiry = new Date(employee.qid?.expiry);
          const passportExpiry = new Date(employee.passport?.expiry);
          const today = new Date();
          
          const qidDaysLeft = Math.ceil((qidExpiry - today) / (1000 * 60 * 60 * 24));
          const passportDaysLeft = Math.ceil((passportExpiry - today) / (1000 * 60 * 60 * 24));
          
          const alerts = [];
          if (qidDaysLeft <= 90 && qidDaysLeft > 0) {
            alerts.push(`${employee.name}: QID expires in ${qidDaysLeft} days`);
          }
          if (passportDaysLeft <= 90 && passportDaysLeft > 0) {
            alerts.push(`${employee.name}: Passport expires in ${passportDaysLeft} days`);
          }
          
          return alerts;
        }).flat();
        
        setUpcomingExpiries(expiries);
        
        // Calculate stats
        const totalPaid = employees.reduce((sum, emp) => sum + (emp.totalPaid || 0), 0);
        const pendingAdvances = employees.reduce((sum, emp) => {
          const unpaidAdvances = emp.advances?.filter(adv => !adv.repaid) || [];
          return sum + unpaidAdvances.reduce((advSum, adv) => advSum + adv.amount, 0);
        }, 0);

        // Fetch customers count
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        
        setStats({
          totalEmployees: employees.length,
          totalPaid: totalPaid,
          pendingAdvances: pendingAdvances,
          customersCount: customersSnapshot.size
        });

        if (expiries.length > 0) {
          toast.warn('Upcoming Expirations');
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    };

    fetchDashboardData();
  }, []);

  // Logout functionality commented out for demo
  const handleLogout = async () => {
    toast.info('Logout functionality disabled in demo mode');
    // try {
    //   await signOut(auth);
    //   toast.success('Logged out successfully');
    //   navigate('/login');
    // } catch (error) {
    //   toast.error('Error logging out');
    // }
  };

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
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Dashboard
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Welcome to your Qatar Payroll Management System
              </Typography>
            </Box>
            <Tooltip title="Logout (Demo Mode)">
              <IconButton 
                onClick={handleLogout}
                sx={{ 
                  color: 'white',
                  backgroundColor: alpha('#fff', 0.1),
                  '&:hover': { backgroundColor: alpha('#fff', 0.2) }
                }}
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>
      </motion.div>

      {/* Upcoming Expiries Alert */}
      {upcomingExpiries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ mb: 3, borderRadius: 2 }}
          >
            <Typography variant="h6" fontWeight={600} gutterBottom>
              ⚠️ Upcoming Expirations
            </Typography>
            <List dense>
              {upcomingExpiries.slice(0, 5).map((exp, i) => (
                <ListItem key={i} sx={{ pl: 0 }}>
                  <ListItemText primary={exp} />
                </ListItem>
              ))}
            </List>
          </Alert>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.info.main, 
                    width: 50, 
                    height: 50,
                    mr: 2
                  }}>
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {stats.totalEmployees}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Employees
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.success.main, 
                    width: 50, 
                    height: 50,
                    mr: 2
                  }}>
                    <MoneyIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {stats.totalPaid.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Paid (QAR)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.warning.main, 
                    width: 50, 
                    height: 50,
                    mr: 2
                  }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {stats.pendingAdvances.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Advances (QAR)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card 
              elevation={3}
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.2)} 100%)`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                transition: 'all 0.3s ease',
                '&:hover': { 
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8]
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ 
                    bgcolor: theme.palette.secondary.main, 
                    width: 50, 
                    height: 50,
                    mr: 2
                  }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" fontWeight={700} color="text.primary">
                      {stats.customersCount}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Customers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>

      {/* Navigation Menu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              🚀 Main Navigation
            </Typography>
            <Grid container spacing={3}>
              {(role === 'admin' || role === 'hr') && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    component={Link} 
                    to="/employees"
                    elevation={2}
                    sx={{ 
                      textDecoration: 'none',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.primary.main, 0.1), 
                        width: 60, 
                        height: 60, 
                        mx: 'auto',
                        mb: 2,
                        color: theme.palette.primary.main
                      }}>
                        <PeopleIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Employees
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage employee records and documents
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {(role === 'admin' || role === 'accountant') && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    component={Link} 
                    to="/payroll"
                    elevation={2}
                    sx={{ 
                      textDecoration: 'none',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.success.main, 0.04)
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.success.main, 0.1), 
                        width: 60, 
                        height: 60, 
                        mx: 'auto',
                        mb: 2,
                        color: theme.palette.success.main
                      }}>
                        <MoneyIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Payroll
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Process salaries and advances
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {(role === 'admin' || role === 'accountant') && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    component={Link} 
                    to="/customers"
                    elevation={2}
                    sx={{ 
                      textDecoration: 'none',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.info.main, 0.04)
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        width: 60, 
                        height: 60, 
                        mx: 'auto',
                        mb: 2,
                        color: theme.palette.info.main
                      }}>
                        <BusinessIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Customers
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Manage customer database
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card 
                  component={Link} 
                  to="/accounts"
                  elevation={2}
                  sx={{ 
                    textDecoration: 'none',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      backgroundColor: alpha(theme.palette.warning.main, 0.04)
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      width: 60, 
                      height: 60, 
                      mx: 'auto',
                      mb: 2,
                      color: theme.palette.warning.main
                    }}>
                      <AccountBalanceIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                      Accounts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Track cash flow and ledger
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {(role === 'admin' || role === 'accountant') && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    component={Link} 
                    to="/receipts"
                    elevation={2}
                    sx={{ 
                      textDecoration: 'none',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.secondary.main, 0.04)
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                        width: 60, 
                        height: 60, 
                        mx: 'auto',
                        mb: 2,
                        color: theme.palette.secondary.main
                      }}>
                        <ReceiptIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Receipts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Generate and print receipts
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {role === 'admin' && (
                <Grid item xs={12} sm={6} md={4} lg={3}>
                  <Card 
                    component={Link} 
                    to="/analytics"
                    elevation={2}
                    sx={{ 
                      textDecoration: 'none',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8],
                        backgroundColor: alpha(theme.palette.error.main, 0.04)
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.error.main, 0.1), 
                        width: 60, 
                        height: 60, 
                        mx: 'auto',
                        mb: 2,
                        color: theme.palette.error.main
                      }}>
                        <AnalyticsIcon sx={{ fontSize: 32 }} />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                        Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        View reports and analytics
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              <Grid item xs={12} sm={6} md={4} lg={3}>
                <Card 
                  component={Link} 
                  to="/self-service"
                  elevation={2}
                  sx={{ 
                    textDecoration: 'none',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: `1px solid ${alpha(theme.palette.text.secondary, 0.2)}`,
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      backgroundColor: alpha(theme.palette.text.secondary, 0.04)
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', p: 3 }}>
                    <Avatar sx={{ 
                      bgcolor: alpha(theme.palette.text.secondary, 0.1), 
                      width: 60, 
                      height: 60, 
                      mx: 'auto',
                      mb: 2,
                      color: theme.palette.text.secondary
                    }}>
                      <WorkIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>
                      Self-Service
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Employee self-service portal
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
      >
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              ⚡ Quick Actions
            </Typography>
            <Grid container spacing={2}>
              {(role === 'admin' || role === 'hr') && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    component={Link}
                    to="/employees"
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<AddIcon />}
                    sx={{ 
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': { 
                        border: `2px solid ${theme.palette.primary.main}`,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      }
                    }}
                  >
                    Add Employee
                  </Button>
                </Grid>
              )}
              {(role === 'admin' || role === 'accountant') && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    component={Link}
                    to="/payroll"
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<MoneyIcon />}
                    sx={{ 
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                      color: theme.palette.success.main,
                      '&:hover': { 
                        border: `2px solid ${theme.palette.success.main}`,
                        backgroundColor: alpha(theme.palette.success.main, 0.04)
                      }
                    }}
                  >
                    Process Payment
                  </Button>
                </Grid>
              )}
              {(role === 'admin' || role === 'accountant') && (
                <Grid item xs={12} sm={6} md={4}>
                  <Button
                    component={Link}
                    to="/receipts"
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<ReceiptIcon />}
                    sx={{ 
                      py: 1.5,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      border: `2px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                      color: theme.palette.secondary.main,
                      '&:hover': { 
                        border: `2px solid ${theme.palette.secondary.main}`,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.04)
                      }
                    }}
                  >
                    Generate Receipt
                  </Button>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
  );
};

export default Dashboard;
