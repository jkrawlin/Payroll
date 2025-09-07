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
  Divider,
  useTheme,
  alpha,
  Avatar,
  IconButton,
  Tooltip,
  MenuItem,
} from '@mui/material';
import {
  Print as PrintIcon,
  Receipt as ReceiptIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// Receipt Component for Printing
class ReceiptComponent extends React.Component {
  render() {
    const { customer, amount, date, description, receiptNumber, companyInfo } = this.props;
    
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '20px' }}>
          <h1 style={{ margin: '0', fontSize: '24px' }}>{companyInfo.name}</h1>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>{companyInfo.address}</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Tel: {companyInfo.phone}</p>
          {companyInfo.taxId && <p style={{ margin: '5px 0', fontSize: '14px' }}>Tax ID: {companyInfo.taxId}</p>}
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: '0', fontSize: '20px' }}>RECEIPT</h2>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>Receipt No: {receiptNumber}</p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Customer:</strong> <span>{customer}</span>
          </div>
          <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <strong>Date:</strong> <span>{date}</span>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Description:</strong> <span>{description}</span>
          </div>
          <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', display: 'flex', justifyContent: 'space-between', fontSize: '18px' }}>
            <strong>Amount:</strong> <strong>{amount} QAR</strong>
          </div>
        </div>
        
        <div style={{ textAlign: 'center', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
          <p style={{ margin: '5px 0' }}>Thank you for your business!</p>
          <p style={{ margin: '5px 0', fontSize: '14px' }}>شكراً لتعاملكم معنا</p>
          <div style={{ marginTop: '30px' }}>
            <p style={{ margin: '10px 0' }}>_________________</p>
            <p style={{ margin: '0', fontSize: '12px' }}>Authorized Signature</p>
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
          invoices: arrayUnion(invoice)
        });

        // Add to recent receipts
        const newReceipt = {
          receiptNumber,
          customer: selectedCust.name,
          amount: values.amount,
          date: new Date().toLocaleDateString(),
          description: values.description,
          paymentMethod: values.paymentMethod
        };

        setRecentReceipts(prev => [newReceipt, ...prev].slice(0, 10));

        toast.success('Receipt generated successfully! You can now print it.');
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
    
    // Load recent receipts from localStorage
    const savedReceipts = localStorage.getItem('recentReceipts');
    if (savedReceipts) {
      setRecentReceipts(JSON.parse(savedReceipts));
    }
  }, []);

  // Save recent receipts to localStorage
  useEffect(() => {
    if (recentReceipts.length > 0) {
      localStorage.setItem('recentReceipts', JSON.stringify(recentReceipts));
    }
  }, [recentReceipts]);

  const handlePrintComplete = () => {
    formik.resetForm();
    setSelectedCust(null);
    toast.success('Receipt printed successfully');
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash': return '💵';
      case 'card': return '💳';
      case 'bank_transfer': return '🏦';
      case 'check': return '📝';
      default: return '💰';
    }
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
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Receipt Form */}
        <Grid item xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                  📋 Generate Receipt
                </Typography>
                
                {/* Customer Selection */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
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
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <PersonIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2, width: 32, height: 32 }}>
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
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        mb: 4, 
                        borderRadius: 2,
                        backgroundColor: alpha(theme.palette.info.main, 0.04),
                        borderColor: alpha(theme.palette.info.main, 0.2)
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom color="info.main" fontWeight={600}>
                          📋 Selected Customer Details
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
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Receipt Form */}
                <Box component="form" onSubmit={formik.handleSubmit}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
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
                        error={formik.touched.amount && Boolean(formik.errors.amount)}
                        helperText={formik.touched.amount && formik.errors.amount}
                        InputProps={{
                          startAdornment: <MoneyIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />,
                        }}
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
                        error={formik.touched.paymentMethod && Boolean(formik.errors.paymentMethod)}
                        helperText={formik.touched.paymentMethod && formik.errors.paymentMethod}
                      >
                        <MenuItem value="cash">💵 Cash</MenuItem>
                        <MenuItem value="card">💳 Card</MenuItem>
                        <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                        <MenuItem value="check">📝 Check</MenuItem>
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
                    
                    {selectedCust && formik.values.amount && (
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

        {/* Company Settings & Recent Receipts */}
        <Grid item xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Company Info Settings */}
            <Card elevation={3} sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  🏢 Company Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Company Name"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Address"
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Tax ID"
                      value={companyInfo.taxId}
                      onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxId: e.target.value }))}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Recent Receipts */}
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  📊 Recent Receipts
                </Typography>
                
                {recentReceipts.length > 0 ? (
                  <Box sx={{ mt: 2 }}>
                    {recentReceipts.slice(0, 5).map((receipt, index) => (
                      <Card 
                        key={index}
                        variant="outlined" 
                        sx={{ 
                          mb: 2, 
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': { 
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box flex={1}>
                              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                Receipt #{receipt.receiptNumber}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {receipt.customer}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {receipt.date} • {getPaymentMethodIcon(receipt.paymentMethod)}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="h6" fontWeight={700} color="success.main">
                                {parseFloat(receipt.amount).toLocaleString()} QAR
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Box 
                    sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      color: 'text.secondary'
                    }}
                  >
                    <ReceiptIcon sx={{ fontSize: 64, opacity: 0.5, mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No recent receipts
                    </Typography>
                    <Typography variant="body2">
                      Generate your first receipt to see it here
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Quick Templates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card elevation={3} sx={{ borderRadius: 3, mt: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
              ⚡ Quick Templates
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    formik.setFieldValue('description', 'Service payment');
                    formik.setFieldValue('paymentMethod', 'cash');
                  }}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  🔧 Service Payment
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    formik.setFieldValue('description', 'Product purchase');
                    formik.setFieldValue('paymentMethod', 'card');
                  }}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  📦 Product Purchase
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    formik.setFieldValue('description', 'Consultation fee');
                    formik.setFieldValue('paymentMethod', 'bank_transfer');
                  }}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  💼 Consultation
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    formik.setFieldValue('description', 'Monthly subscription');
                    formik.setFieldValue('paymentMethod', 'card');
                  }}
                  sx={{ 
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  📅 Subscription
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Hidden Print Component */}
      {selectedCust && formik.values.amount && (
        <Box sx={{ display: 'none' }}>
          <ReceiptComponent
            ref={componentRef}
            customer={selectedCust.name}
            amount={formik.values.amount}
            date={new Date().toLocaleDateString()}
            description={formik.values.description}
            receiptNumber={`RCP-${Date.now()}`}
            companyInfo={companyInfo}
          />
        </Box>
      )}
    </Box>
  );
};

export default Receipts;
