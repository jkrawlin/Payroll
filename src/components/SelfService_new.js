import React, { useState, useEffect } from 'react';
import { doc, collection, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Avatar,
  useTheme,
  alpha,
  TextField,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  RequestQuote as RequestIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BankIcon,
  Schedule as ScheduleIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SelfService = ({ userId }) => {
  const theme = useTheme();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdvanceRequest, setShowAdvanceRequest] = useState(false);
  const [payslips, setPayslips] = useState([]);

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
      repaymentMonths: 1
    },
    validationSchema: advanceRequestSchema,
    onSubmit: async (values) => {
      try {
        const advanceRequest = {
          ...values,
          amount: parseFloat(values.amount),
          employeeId: userId,
          employeeName: employee.name,
          status: 'pending',
          requestDate: new Date().toISOString(),
          monthlyDeduction: parseFloat(values.amount) / parseInt(values.repaymentMonths),
          id: Date.now().toString()
        };

        // Add to employee's advance requests
        await updateDoc(doc(db, 'employees', userId), {
          advanceRequests: arrayUnion(advanceRequest)
        });

        toast.success('Advance request submitted successfully');
        setShowAdvanceRequest(false);
        advanceFormik.resetForm();
        fetchEmployeeData();
      } catch (error) {
        toast.error('Error submitting advance request');
        console.error('Error submitting advance request:', error);
      }
    },
  });

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const employeesSnapshot = await getDocs(collection(db, 'employees'));
      const employees = employeesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const currentEmployee = employees.find(emp => emp.id === userId);
      if (currentEmployee) {
        setEmployee(currentEmployee);
        
        // Generate mock payslips for the employee
        const mockPayslips = generatePayslips(currentEmployee);
        setPayslips(mockPayslips);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast.error('Error loading employee data');
    } finally {
      setLoading(false);
    }
  };

  const generatePayslips = (employee) => {
    const payslips = [];
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    const currentYear = new Date().getFullYear();
    
    months.forEach((month, index) => {
      const baseSalary = employee.salary || employee.monthlySalary || 0;
      const allowances = baseSalary * 0.1; // 10% allowances
      const deductions = baseSalary * 0.08; // 8% deductions (tax, etc.)
      const netSalary = baseSalary + allowances - deductions;
      
      payslips.push({
        id: `${currentYear}-${String(index + 1).padStart(2, '0')}`,
        month: month,
        year: currentYear,
        baseSalary: baseSalary,
        allowances: allowances,
        deductions: deductions,
        netSalary: netSalary,
        status: index < 5 ? 'paid' : 'pending',
        payDate: index < 5 ? new Date(currentYear, index, 25).toLocaleDateString() : null
      });
    });
    
    return payslips.reverse(); // Show latest first
  };

  useEffect(() => {
    if (userId) {
      fetchEmployeeData();
    }
  }, [userId]);

  const getTotalPaid = () => {
    return payslips
      .filter(slip => slip.status === 'paid')
      .reduce((total, slip) => total + slip.netSalary, 0);
  };

  const getPendingAdvances = () => {
    return employee?.advanceRequests?.filter(req => req.status === 'pending') || [];
  };

  const getApprovedAdvances = () => {
    return employee?.advanceRequests?.filter(req => req.status === 'approved') || [];
  };

  if (loading) {
    return (
      <Box sx={{ 
        backgroundColor: 'background.default',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <LinearProgress sx={{ width: '300px' }} />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ 
        backgroundColor: 'background.default', 
        minHeight: '100vh',
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="h4" color="text.primary">
          Employee not found
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
          <Box display="flex" alignItems="center">
            <Avatar sx={{ 
              bgcolor: alpha('#fff', 0.2), 
              width: 60, 
              height: 60,
              mr: 3,
              color: 'white'
            }}>
              <PersonIcon sx={{ fontSize: 32 }} />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom>
                Welcome, {employee.name}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Employee Self-Service Portal
              </Typography>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Employee Info Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1), 
                    color: theme.palette.info.main,
                    mr: 2
                  }}>
                    <WorkIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Employee Information
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {employee.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Department
                    </Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {employee.department}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Position
                    </Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {employee.position}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Employee ID
                    </Typography>
                    <Typography variant="body1" fontWeight={600} gutterBottom>
                      {employee.id}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Monthly Salary
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      {(employee.salary || employee.monthlySalary || 0).toLocaleString()} QAR
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Received
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      {getTotalPaid().toLocaleString()} QAR
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions Card */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    mr: 2
                  }}>
                    <RequestIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Quick Actions
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<MoneyIcon />}
                      onClick={() => setShowAdvanceRequest(true)}
                      sx={{ 
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        mb: 2
                      }}
                    >
                      Request Salary Advance
                    </Button>
                  </Grid>

                  {/* Advance Request Status */}
                  {getPendingAdvances().length > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                        <Typography variant="body2" fontWeight={600} color="warning.main" gutterBottom>
                          Pending Advance Requests
                        </Typography>
                        {getPendingAdvances().map((request, index) => (
                          <Box key={index} mb={1}>
                            <Typography variant="body2">
                              {request.amount.toLocaleString()} QAR - {request.reason.substring(0, 30)}...
                            </Typography>
                            <Chip 
                              label="Pending Approval" 
                              size="small" 
                              color="warning"
                              variant="outlined"
                            />
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}

                  {/* Approved Advances */}
                  {getApprovedAdvances().length > 0 && (
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                        <Typography variant="body2" fontWeight={600} color="success.main" gutterBottom>
                          Approved Advances
                        </Typography>
                        {getApprovedAdvances().map((request, index) => (
                          <Box key={index} mb={1}>
                            <Typography variant="body2">
                              {request.amount.toLocaleString()} QAR - Monthly: {request.monthlyDeduction.toLocaleString()} QAR
                            </Typography>
                            <Chip 
                              label="Approved" 
                              size="small" 
                              color="success"
                              variant="outlined"
                            />
                          </Box>
                        ))}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Payslips Table */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    mr: 2
                  }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Payslips History
                  </Typography>
                </Box>

                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <TableCell><strong>Month</strong></TableCell>
                        <TableCell><strong>Base Salary</strong></TableCell>
                        <TableCell><strong>Allowances</strong></TableCell>
                        <TableCell><strong>Deductions</strong></TableCell>
                        <TableCell><strong>Net Salary</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Pay Date</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {payslips.map((payslip) => (
                        <TableRow 
                          key={payslip.id}
                          sx={{ 
                            '&:nth-of-type(odd)': { 
                              bgcolor: alpha(theme.palette.action.hover, 0.5) 
                            } 
                          }}
                        >
                          <TableCell>{payslip.month} {payslip.year}</TableCell>
                          <TableCell>{payslip.baseSalary.toLocaleString()} QAR</TableCell>
                          <TableCell>{payslip.allowances.toLocaleString()} QAR</TableCell>
                          <TableCell>{payslip.deductions.toLocaleString()} QAR</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {payslip.netSalary.toLocaleString()} QAR
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={payslip.status.toUpperCase()}
                              size="small"
                              color={payslip.status === 'paid' ? 'success' : 'default'}
                              variant={payslip.status === 'paid' ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell>{payslip.payDate || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Advance Request Dialog */}
      <Dialog 
        open={showAdvanceRequest} 
        onClose={() => setShowAdvanceRequest(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Avatar sx={{ 
              bgcolor: alpha(theme.palette.primary.main, 0.1), 
              color: theme.palette.primary.main,
              mr: 2
            }}>
              <MoneyIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Request Salary Advance
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={advanceFormik.handleSubmit} sx={{ mt: 1 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="amount"
                  label="Advance Amount (QAR) *"
                  type="number"
                  value={advanceFormik.values.amount}
                  onChange={advanceFormik.handleChange}
                  error={advanceFormik.touched.amount && Boolean(advanceFormik.errors.amount)}
                  helperText={advanceFormik.touched.amount && advanceFormik.errors.amount}
                  inputProps={{ min: 0, max: 5000 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="repaymentMonths"
                  label="Repayment Period (Months) *"
                  type="number"
                  value={advanceFormik.values.repaymentMonths}
                  onChange={advanceFormik.handleChange}
                  error={advanceFormik.touched.repaymentMonths && Boolean(advanceFormik.errors.repaymentMonths)}
                  helperText={advanceFormik.touched.repaymentMonths && advanceFormik.errors.repaymentMonths}
                  inputProps={{ min: 1, max: 6 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  name="reason"
                  label="Reason for Advance *"
                  multiline
                  rows={3}
                  value={advanceFormik.values.reason}
                  onChange={advanceFormik.handleChange}
                  error={advanceFormik.touched.reason && Boolean(advanceFormik.errors.reason)}
                  helperText={advanceFormik.touched.reason && advanceFormik.errors.reason}
                />
              </Grid>
              {advanceFormik.values.amount && advanceFormik.values.repaymentMonths && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1) }}>
                    <Typography variant="body2" color="info.main">
                      <strong>Monthly Deduction:</strong> {(parseFloat(advanceFormik.values.amount) / parseInt(advanceFormik.values.repaymentMonths) || 0).toLocaleString()} QAR
                    </Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => {
              setShowAdvanceRequest(false);
              advanceFormik.resetForm();
            }}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={advanceFormik.handleSubmit}
            variant="contained" 
            disabled={advanceFormik.isSubmitting}
            startIcon={<RequestIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {advanceFormik.isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SelfService;
