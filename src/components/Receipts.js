import React, { useState, useEffect, useRef } from 'react';
import ReactToPrint from 'react-to-print';
import { useFormik } from 'formik';
import { collection, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import * as Yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Grid,
  Paper,
  useTheme,
  alpha,
  Avatar,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon,
  ExpandMore as ExpandMoreIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Dashboard as TemplateIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Assignment as CheckIcon,
  Money as CashIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Receipt Component for Printing
class ReceiptComponent extends React.Component {
  render() {
    const { customer, amount, date, description, receiptNumber, companyInfo } = this.props;
    
    return (
      <div style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
        border: '2px solid #000',
        backgroundColor: 'white',
        color: 'black'
      }}>
        <div style={{
          textAlign: 'center',
          borderBottom: '1px solid #000',
          paddingBottom: '15px',
          marginBottom: '15px'
        }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{companyInfo.name}</h1>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>{companyInfo.address}</p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>Tel: {companyInfo.phone} | Email: {companyInfo.email}</p>
          {companyInfo.taxId && <p style={{ margin: '2px 0', fontSize: '12px' }}>Tax ID: {companyInfo.taxId}</p>}
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 5px 0', fontSize: '20px' }}>RECEIPT</h2>
          <p style={{ margin: '0', fontSize: '14px' }}>Receipt No: {receiptNumber}</p>
        </div>
        
        <div style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '5px' }}>
            <strong>Customer:</strong> <span>{customer}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '5px' }}>
            <strong>Date:</strong> <span>{date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '5px' }}>
            <strong>Description:</strong> <span>{description}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            borderTop: '1px solid #000', 
            paddingTop: '10px', 
            marginTop: '15px', 
            fontSize: '18px' 
          }}>
            <strong>Amount:</strong> <span style={{ fontWeight: 'bold', fontSize: '20px' }}>{amount} QAR</span>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <p>Thank you for your business!</p>
          <p style={{ fontSize: '14px', marginTop: '5px' }}>شكراً لتعاملكم معنا</p>
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <div>
              <p style={{ margin: '5px 0', fontSize: '12px' }}>_________________</p>
              <p style={{ margin: '5px 0', fontSize: '12px' }}>Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const Receipts = () => {
  const theme = useTheme();
  const componentRef = useRef();
  const [customers, setCustomers] = useState([]);
  const [selectedCust, setSelectedCust] = useState(null);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: 'Qatar Payroll Company',
    address: 'Doha, Qatar',
    phone: '+974 XXXX XXXX',
    email: 'info@qatarpayroll.com',
    taxId: 'TX123456789'
  });

  const receiptValidationSchema = Yup.object({
    amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
    description: Yup.string().required('Description is required'),
    paymentMethod: Yup.string().required('Payment method is required'),
  });

  const formik = useFormik({
    initialValues: { 
      amount: '', 
      description: '',
      paymentMethod: 'cash',
      notes: ''
    },
    validationSchema: receiptValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      if (!selectedCust) {
        toast.error('Please select a customer');
        return;
      }

      try {
        const date = new Date().toISOString();
        const receiptNumber = `RCP-${Date.now()}`;
        
        const invoice = {
          id: receiptNumber,
          amount: parseFloat(values.amount),
          date,
          status: 'paid',
          description: values.description,
          paymentMethod: values.paymentMethod,
          notes: values.notes,
          receiptGenerated: true,
          createdBy: 'Admin'
        };

        // Update customer record
        await updateDoc(doc(db, 'customers', selectedCust.id), {
          invoices: arrayUnion(invoice),
          totalInvoiced: (selectedCust.totalInvoiced || 0) + parseFloat(values.amount),
          totalPaid: (selectedCust.totalPaid || 0) + parseFloat(values.amount)
        });

        // Update accounts ledger
        try {
          const accountsRef = doc(db, 'accounts', 'main');
          await updateDoc(accountsRef, {
            ledger: arrayUnion({
              date,
              type: 'credit',
              amount: parseFloat(values.amount),
              description: `Payment from ${selectedCust.name} - ${values.description}`,
              category: 'revenue'
            })
          });
        } catch (error) {
          console.log('Accounts collection may not exist yet');
        }

        // Add to recent receipts
        const newReceipt = {
          receiptNumber,
          customer: selectedCust.name,
          amount: parseFloat(values.amount),
          date: new Date().toLocaleDateString(),
          description: values.description,
          paymentMethod: values.paymentMethod
        };
        setRecentReceipts(prev => [newReceipt, ...prev.slice(0, 9)]);

        toast.success('Receipt generated successfully');
        fetchCustomers();
        
        // Update selected customer
        const updatedCustomer = {
          ...selectedCust,
          invoices: [...(selectedCust.invoices || []), invoice],
          totalInvoiced: (selectedCust.totalInvoiced || 0) + parseFloat(values.amount),
          totalPaid: (selectedCust.totalPaid || 0) + parseFloat(values.amount)
        };
        setSelectedCust(updatedCustomer);
      } catch (error) {
        toast.error(`Error generating receipt: ${error.message}`);
        console.error('Error generating receipt:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const fetchCustomers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'customers'));
      const customersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customersList);
    } catch (error) {
      toast.error('Error fetching customers');
      console.error('Error fetching customers:', error);
    }
  };

  useEffect(() => {
    fetchCustomers();
    
    const savedReceipts = localStorage.getItem('recentReceipts');
    if (savedReceipts) {
      setRecentReceipts(JSON.parse(savedReceipts));
    }
  }, []);

  useEffect(() => {
    if (recentReceipts.length > 0) {
      localStorage.setItem('recentReceipts', JSON.stringify(recentReceipts));
    }
  }, [recentReceipts]);

  const handlePrintComplete = () => {
    formik.resetForm();
    toast.success('Receipt printed successfully');
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return <CashIcon />;
      case 'card': return <CardIcon />;
      case 'bank_transfer': return <BankIcon />;
      case 'check': return <CheckIcon />;
      default: return <MoneyIcon />;
    }
  };

  const getPaymentMethodColor = (method) => {
    switch (method) {
      case 'cash': return 'success';
      case 'card': return 'primary';
      case 'bank_transfer': return 'info';
      case 'check': return 'warning';
      default: return 'default';
    }
  };

  const quickTemplates = [
    { name: 'Service Payment', description: 'Service payment', method: 'cash', icon: '🔧' },
    { name: 'Product Purchase', description: 'Product purchase', method: 'card', icon: '📦' },
    { name: 'Consultation', description: 'Consultation fee', method: 'bank_transfer', icon: '💼' },
    { name: 'Subscription', description: 'Monthly subscription', method: 'card', icon: '📅' }
  ];

  const handleTemplateSelect = (template) => {
    formik.setFieldValue('description', template.description);
    formik.setFieldValue('paymentMethod', template.method);
    toast.success(`Template "${template.name}" applied`);
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
            background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha('#fff', 0.2), 
                width: 60, 
                height: 60,
                mr: 3,
                color: 'white'
              }}>
                <ReceiptIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Receipt Generator
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Generate professional receipts for customer payments
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setShowSettings(true)}
              sx={{
                bgcolor: alpha('#fff', 0.2),
                color: 'white',
                '&:hover': { bgcolor: alpha('#fff', 0.3) }
              }}
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Receipt Form */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    mr: 2
                  }}>
                    <ReceiptIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Generate Receipt
                  </Typography>
                </Box>
                
                {/* Customer Selection */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Customer Information
                  </Typography>
                  <Autocomplete
                    value={selectedCust}
                    onChange={(event, newValue) => setSelectedCust(newValue)}
                    options={customers}
                    getOptionLabel={(option) => `${option.name} - ${option.contactPerson}`}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Customer *"
                        variant="outlined"
                        fullWidth
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1), 
                          color: theme.palette.primary.main,
                          mr: 2, 
                          width: 32, 
                          height: 32 
                        }}>
                          <BusinessIcon sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="body1" fontWeight={600}>
                            {option.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.contactPerson} • {option.phone}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Box>

                {selectedCust && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Paper 
                      elevation={1}
                      sx={{ 
                        mb: 4, 
                        p: 3,
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.info.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}
                    >
                      <Typography variant="h6" gutterBottom color="info.main" fontWeight={600}>
                        Selected Customer Details
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Company Name
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {selectedCust.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Contact Person
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {selectedCust.contactPerson}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Phone
                          </Typography>
                          <Typography variant="body1" fontWeight={600}>
                            {selectedCust.phone}
                          </Typography>
                        </Grid>
                        {selectedCust.email && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Email
                            </Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {selectedCust.email}
                            </Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </motion.div>
                )}

                {/* Receipt Form */}
                <Box component="form" onSubmit={formik.handleSubmit}>
                  <Typography variant="h6" gutterBottom fontWeight={600} sx={{ mb: 3 }}>
                    Receipt Details
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="amount"
                        label="Amount (QAR) *"
                        type="number"
                        value={formik.values.amount}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        name="paymentMethod"
                        label="Payment Method *"
                        value={formik.values.paymentMethod}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                        helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
                        SelectProps={{ native: true }}
                      >
                        <option value="cash">💵 Cash</option>
                        <option value="card">💳 Card</option>
                        <option value="bank_transfer">🏦 Bank Transfer</option>
                        <option value="check">📝 Check</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="description"
                        label="Description *"
                        multiline
                        rows={3}
                        value={formik.values.description}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.description && Boolean(formik.errors.description)}
                        helperText={formik.touched.description && formik.errors.description}
                        placeholder="Enter payment description or service details..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="notes"
                        label="Additional Notes"
                        multiline
                        rows={2}
                        value={formik.values.notes}
                        onChange={formik.handleChange}
                        placeholder="Optional additional notes..."
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={formik.isSubmitting || !selectedCust}
                      size="large"
                      startIcon={<ReceiptIcon />}
                      sx={{ 
                        py: 1.5, 
                        px: 4,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      {formik.isSubmitting ? 'Generating...' : 'Generate Receipt'}
                    </Button>
                    
                    {selectedCust && formik.values.amount && formik.values.description && (
                      <ReactToPrint
                        trigger={() => (
                          <Button
                            variant="outlined"
                            size="large"
                            startIcon={<PrintIcon />}
                            sx={{ 
                              py: 1.5, 
                              px: 4,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Print Receipt
                          </Button>
                        )}
                        content={() => componentRef.current}
                        onAfterPrint={handlePrintComplete}
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Right Sidebar */}
        <Grid item xs={12} lg={4}>
          <Grid container spacing={3}>
            {/* Quick Templates */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.warning.main, 0.1), 
                        color: theme.palette.warning.main,
                        mr: 2
                      }}>
                        <TemplateIcon />
                      </Avatar>
                      <Typography variant="h6" fontWeight={600} color="text.primary">
                        Quick Templates
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      {quickTemplates.map((template, index) => (
                        <Grid item xs={12} key={index}>
                          <Button
                            fullWidth
                            variant="outlined"
                            onClick={() => handleTemplateSelect(template)}
                            sx={{
                              p: 2,
                              justifyContent: 'flex-start',
                              borderRadius: 2,
                              textTransform: 'none',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <Box display="flex" alignItems="center" width="100%">
                              <Typography variant="h6" sx={{ mr: 2 }}>
                                {template.icon}
                              </Typography>
                              <Box textAlign="left">
                                <Typography variant="body2" fontWeight={600}>
                                  {template.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {template.description}
                                </Typography>
                              </Box>
                            </Box>
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>

            {/* Receipt Preview */}
            {selectedCust && formik.values.amount && formik.values.description && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                        Receipt Preview
                      </Typography>
                      
                      <Paper 
                        elevation={1}
                        sx={{ 
                          p: 2,
                          mb: 3,
                          backgroundColor: alpha(theme.palette.background.default, 0.5),
                          borderRadius: 2
                        }}
                      >
                        <ReceiptComponent
                          ref={componentRef}
                          customer={selectedCust.name}
                          amount={parseFloat(formik.values.amount || 0).toLocaleString()}
                          date={new Date().toLocaleDateString()}
                          description={formik.values.description}
                          receiptNumber={`RCP-${Date.now()}`}
                          companyInfo={companyInfo}
                        />
                      </Paper>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            )}

            {/* Recent Receipts */}
            {recentReceipts.length > 0 && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" alignItems="center" mb={3}>
                        <Avatar sx={{ 
                          bgcolor: alpha(theme.palette.info.main, 0.1), 
                          color: theme.palette.info.main,
                          mr: 2
                        }}>
                          <HistoryIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                          Recent Receipts
                        </Typography>
                      </Box>

                      <List>
                        {recentReceipts.slice(0, 5).map((receipt, index) => (
                          <ListItem 
                            key={index} 
                            sx={{ 
                              px: 0,
                              borderBottom: index < recentReceipts.slice(0, 5).length - 1 ? `1px solid ${theme.palette.divider}` : 'none'
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar sx={{ 
                                bgcolor: alpha(getPaymentMethodColor(receipt.paymentMethod) === 'default' ? theme.palette.primary.main : theme.palette[getPaymentMethodColor(receipt.paymentMethod)].main, 0.1),
                                color: getPaymentMethodColor(receipt.paymentMethod) === 'default' ? theme.palette.primary.main : theme.palette[getPaymentMethodColor(receipt.paymentMethod)].main,
                                width: 32,
                                height: 32
                              }}>
                                {getPaymentMethodIcon(receipt.paymentMethod)}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {receipt.customer}
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600} color="success.main">
                                    {parseFloat(receipt.amount).toLocaleString()} QAR
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {receipt.description}
                                  </Typography>
                                  <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                                    <Typography variant="caption" color="text.secondary">
                                      {receipt.date}
                                    </Typography>
                                    <Chip 
                                      label={receipt.paymentMethod.replace('_', ' ').toUpperCase()}
                                      size="small"
                                      variant="outlined"
                                      color={getPaymentMethodColor(receipt.paymentMethod)}
                                    />
                                  </Box>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>

      {/* Company Settings Dialog */}
      <Dialog 
        open={showSettings} 
        onClose={() => setShowSettings(false)}
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
              <SettingsIcon />
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              Company Information Settings
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name"
                value={companyInfo.name}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={companyInfo.address}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={companyInfo.phone}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={companyInfo.email}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tax ID"
                value={companyInfo.taxId}
                onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxId: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setShowSettings(false)}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              setShowSettings(false);
              toast.success('Company information updated');
            }}
            variant="contained"
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Receipts;
