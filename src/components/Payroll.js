import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Avatar,
  Grid,
  Paper,
  Divider,
  useTheme,
  InputAdornment,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Money as MoneyIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Payroll = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('salary'); // salary or advance
  const [description, setDescription] = useState('');
  const [processing, setProcessing] = useState(false);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [qidSearchValue, setQidSearchValue] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchPayrollHistory();
  }, []);

  // Real-time Qatar ID and name search
  useEffect(() => {
    if (qidSearchValue) {
      setSearchLoading(true);
      const searchTerm = qidSearchValue.toLowerCase();
      
      const filtered = employees.filter(emp => {
        const qatarId = emp.qatarId?.toLowerCase() || '';
        const name = emp.name?.toLowerCase() || '';
        const department = emp.department?.toLowerCase() || '';
        const position = emp.position?.toLowerCase() || '';
        
        return qatarId.includes(searchTerm) || 
               name.includes(searchTerm) || 
               department.includes(searchTerm) ||
               position.includes(searchTerm);
      });
      
      setTimeout(() => {
        setFilteredEmployees(filtered);
        setSearchLoading(false);
      }, 300); // Simulate real-time search delay
    } else {
      setFilteredEmployees(employees);
    }
  }, [qidSearchValue, employees]);

  const fetchEmployees = async () => {
    try {
      setSearchLoading(true);
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Ensure Qatar ID exists - generate demo ones if missing
          qatarId: data.qatarId || generateDemoQatarId(data.name),
        };
      });
      
      setEmployees(employeesList);
      setFilteredEmployees(employeesList);
      setSearchLoading(false);
    } catch (error) {
      toast.error('Error fetching employees');
      console.error('Error fetching employees:', error);
      setSearchLoading(false);
    }
  };

  // Generate demo Qatar IDs for testing (in real app, this would come from database)
  const generateDemoQatarId = (name) => {
    if (!name) return '12345678901';
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return Math.abs(hash).toString().padStart(11, '0').substring(0, 11);
  };

  const handleEmployeeSelect = (event, newValue) => {
    setSelectedEmp(newValue);
    if (newValue) {
      setQidSearchValue(newValue.qatarId);
      toast.success(`Employee ${newValue.name} selected`);
    } else {
      setQidSearchValue('');
    }
  };

  const resetForm = () => {
    setSelectedEmp(null);
    setAmount('');
    setDescription('');
    setQidSearchValue('');
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

      toast.success('Transaction added successfully');
      
      // Reset form completely
      resetForm();
      setType('salary');
      
      // Refresh data
      await fetchEmployees();
      await fetchPayrollHistory();
      
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
      case 'salary': return <MoneyIcon sx={{ color: 'success.main' }} />;
      case 'advance': return <MoneyIcon sx={{ color: 'warning.main' }} />;
      case 'bonus': return <MoneyIcon sx={{ color: 'primary.main' }} />;
      case 'deduction': return <HistoryIcon sx={{ color: 'error.main' }} />;
      default: return <PersonIcon sx={{ color: 'primary.main' }} />;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 3 }}>
      {/* Modern Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <MoneyIcon />
          </Avatar>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Payroll Management
          </Typography>
        </Box>
      </motion.div>

      <Grid container spacing={3}>
        {/* Enhanced Transaction Form */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card sx={{ height: 'fit-content' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <PersonIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    Process Payment
                  </Typography>
                </Box>

                {/* Qatar ID Search Autocomplete */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Search Employee by Qatar ID or Name *
                  </Typography>
                  <Autocomplete
                    options={filteredEmployees}
                    getOptionLabel={(option) => 
                      `${option.qatarId} - ${option.name} (${option.department})`
                    }
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.light', width: 36, height: 36 }}>
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {option.qatarId} • {option.department} • {option.salary?.toLocaleString()} QAR
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    value={selectedEmp}
                    onChange={handleEmployeeSelect}
                    inputValue={qidSearchValue}
                    onInputChange={(event, newInputValue) => {
                      setQidSearchValue(newInputValue);
                    }}
                    loading={searchLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Enter Qatar ID or employee name..."
                        variant="outlined"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchIcon color="action" />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <>
                              {searchLoading ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    clearOnEscape
                    selectOnFocus
                    handleHomeEndKeys
                  />
                </Box>

                {/* Selected Employee Info Card */}
                {selectedEmp && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                          {selectedEmp.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>
                            {selectedEmp.name}
                          </Typography>
                          <Chip 
                            label={selectedEmp.department} 
                            size="small" 
                            sx={{ bgcolor: 'primary.main', color: 'white' }}
                          />
                        </Box>
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Qatar ID
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedEmp.qatarId}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Position
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedEmp.position}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Monthly Salary
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {selectedEmp.salary?.toLocaleString()} QAR
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            Pending Advances
                          </Typography>
                          <Typography variant="body2" fontWeight={600}>
                            {calculatePendingAdvances(selectedEmp).toLocaleString()} QAR
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* Transaction Type */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Transaction Type *</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    label="Transaction Type *"
                  >
                    <MenuItem value="salary">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ color: 'success.main' }} />
                        Salary Payment
                      </Box>
                    </MenuItem>
                    <MenuItem value="advance">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ color: 'warning.main' }} />
                        Advance
                      </Box>
                    </MenuItem>
                    <MenuItem value="bonus">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon sx={{ color: 'primary.main' }} />
                        Bonus
                      </Box>
                    </MenuItem>
                    <MenuItem value="deduction">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <HistoryIcon sx={{ color: 'error.main' }} />
                        Deduction
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Amount Input */}
                <TextField
                  fullWidth
                  label="Amount (QAR) *"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
                  }}
                  inputProps={{ min: 0, step: 0.01 }}
                  sx={{ mb: 3 }}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`Enter description for ${type}...`}
                  sx={{ mb: 3 }}
                />

                {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={processing}
                    sx={{
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.dark,
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-2px)',
                      },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 3,
                      py: 1.5,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleTransaction}
                    disabled={processing || !selectedEmp || !amount}
                    startIcon={processing ? <CircularProgress size={20} color="inherit" /> : <MoneyIcon />}
                    sx={{
                      backgroundColor: theme.palette.primary.main,
                      color: '#ffffff', // Explicit white text for maximum contrast
                      '&:hover': {
                        backgroundColor: theme.palette.primary.dark,
                        boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.4)}`,
                        transform: 'translateY(-2px)',
                      },
                      '&:active': {
                        transform: 'translateY(0px)',
                      },
                      '&:disabled': {
                        backgroundColor: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                      fontWeight: 600,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {processing ? 'Processing...' : `Process ${type.charAt(0).toUpperCase() + type.slice(1)}`}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Transaction History and Analytics */}
        <Grid item xs={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {selectedEmp ? (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <HistoryIcon color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Transaction History - {selectedEmp.name}
                    </Typography>
                  </Box>

                  {/* Recent Transactions */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon sx={{ color: 'primary.main' }} />
                      Recent Payments
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {selectedEmp.transactions && selectedEmp.transactions.length > 0 ? (
                        selectedEmp.transactions
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 5)
                          .map((tx, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '1.2em' }}>
                                      {getTransactionIcon(tx.type)}
                                    </Typography>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(tx.date).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Chip
                                    label={`${tx.amount < 0 ? '-' : '+'}${Math.abs(tx.amount).toLocaleString()} QAR`}
                                    color={tx.amount < 0 ? 'error' : 'success'}
                                    variant="outlined"
                                  />
                                </Box>
                                {tx.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {tx.description}
                                  </Typography>
                                )}
                              </Paper>
                            </motion.div>
                          ))
                      ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                          <Typography color="text.secondary">
                            No salary transactions yet
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Advances */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                      💳 Advances
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {selectedEmp.advances && selectedEmp.advances.length > 0 ? (
                        selectedEmp.advances
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .slice(0, 5)
                          .map((advance, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontSize: '1.2em' }}>💳</Typography>
                                    <Box>
                                      <Typography variant="body2" fontWeight={600}>
                                        Advance Payment
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(advance.date).toLocaleDateString()}
                                        {advance.repaid && advance.repaidDate && (
                                          <> • Repaid: {new Date(advance.repaidDate).toLocaleDateString()}</>
                                        )}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                      label={`${advance.amount.toLocaleString()} QAR`}
                                      color="warning"
                                      variant="outlined"
                                    />
                                    <Chip
                                      label={advance.repaid ? 'Repaid' : 'Pending'}
                                      color={advance.repaid ? 'success' : 'warning'}
                                      size="small"
                                    />
                                  </Box>
                                </Box>
                                {advance.description && (
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {advance.description}
                                  </Typography>
                                )}
                                {!advance.repaid && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    sx={{ mt: 1 }}
                                    onClick={() => markAdvanceRepaid(selectedEmp.id, i)}
                                  >
                                    Mark as Repaid
                                  </Button>
                                )}
                              </Paper>
                            </motion.div>
                          ))
                      ) : (
                        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                          <Typography color="text.secondary">
                            No advances recorded
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent sx={{ p: 4, textAlign: 'center' }}>
                  <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Select an employee to view transaction history
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Use the Qatar ID search to find and select an employee
                  </Typography>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Grid>

        {/* Recent Payroll History */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HistoryIcon sx={{ color: 'primary.main' }} />
                  Recent Payroll Activity
                </Typography>
                <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                  {payrollHistory.length > 0 ? (
                    payrollHistory.slice(0, 10).map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                <Typography sx={{ fontSize: '1.1em' }}>
                                  {getTransactionIcon(item.type)}
                                </Typography>
                              </Avatar>
                              <Box>
                                <Typography variant="body1" fontWeight={600}>
                                  {item.employeeName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {item.type?.charAt(0).toUpperCase() + item.type?.slice(1)} • {new Date(item.date).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={`${item.amount < 0 ? '-' : '+'}${Math.abs(item.amount || 0).toLocaleString()} QAR`}
                              color={item.amount < 0 ? 'error' : 'success'}
                              variant="filled"
                            />
                          </Box>
                        </Paper>
                      </motion.div>
                    ))
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                      <Typography color="text.secondary">
                        No payroll history available
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Payroll;
