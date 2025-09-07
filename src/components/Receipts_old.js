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
      <div className="receipt-print">
        <div className="receipt-header">
          <div className="company-logo">
            <h1>{companyInfo.name}</h1>
            <p>{companyInfo.address}</p>
            <p>Tel: {companyInfo.phone} | Email: {companyInfo.email}</p>
            {companyInfo.taxId && <p>Tax ID: {companyInfo.taxId}</p>}
          </div>
        </div>
        
        <div className="receipt-title">
          <h2>RECEIPT</h2>
          <p>Receipt No: {receiptNumber}</p>
        </div>
        
        <div className="receipt-details">
          <div className="receipt-row">
            <strong>Customer:</strong> {customer}
          </div>
          <div className="receipt-row">
            <strong>Date:</strong> {date}
          </div>
          <div className="receipt-row">
            <strong>Description:</strong> {description}
          </div>
          <div className="receipt-row amount-row">
            <strong>Amount:</strong> <span className="amount">{amount} QAR</span>
          </div>
        </div>
        
        <div className="receipt-footer">
          <p>Thank you for your business!</p>
          <p className="arabic-thanks">شكراً لتعاملكم معنا</p>
          <div className="signature-section">
            <div className="signature-line">
              <p>_________________</p>
              <p>Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .receipt-print {
            width: 100%;
            max-width: 400px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
            border: 2px solid #000;
          }
          .receipt-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .company-logo h1 {
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .company-logo p {
            margin: 2px 0;
            font-size: 12px;
          }
          .receipt-title {
            text-align: center;
            margin-bottom: 20px;
          }
          .receipt-title h2 {
            margin: 0 0 5px 0;
            font-size: 20px;
          }
          .receipt-details {
            margin-bottom: 30px;
          }
          .receipt-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding-bottom: 5px;
          }
          .amount-row {
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 15px;
            font-size: 18px;
          }
          .amount {
            font-weight: bold;
            font-size: 20px;
          }
          .receipt-footer {
            text-align: center;
            margin-top: 30px;
          }
          .arabic-thanks {
            font-size: 14px;
            margin-top: 5px;
          }
          .signature-section {
            margin-top: 40px;
          }
          .signature-line {
            text-align: center;
          }
          .signature-line p {
            margin: 5px 0;
            font-size: 12px;
          }
        `}</style>
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
          createdBy: 'Admin' // In real app, get from auth context
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
        setRecentReceipts(prev => [newReceipt, ...prev.slice(0, 9)]); // Keep last 10

        toast.success('Receipt generated successfully');
        
        // Refresh customers list
        fetchCustomers();
        
        // Update selected customer
        const updatedCustomer = {
          ...selectedCust,
          invoices: [...(selectedCust.invoices || []), invoice],
          totalInvoiced: (selectedCust.totalInvoiced || 0) + parseFloat(values.amount),
          totalPaid: (selectedCust.totalPaid || 0) + parseFloat(values.amount)
        };
        setSelectedCust(updatedCustomer);

        // Don't reset form immediately, let user print first
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
    // Reset form after printing
    formik.resetForm();
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
                  
                  <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
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
                            Print Preview
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
          <form onSubmit={formik.handleSubmit} className="receipt-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Amount (QAR) *</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="Enter amount"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.amount}
                  min="0"
                  step="0.01"
                  className={formik.touched.amount && formik.errors.amount ? 'error' : ''}
                />
                {formik.touched.amount && formik.errors.amount && (
                  <p className="error-message">{formik.errors.amount}</p>
                )}
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  name="paymentMethod"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.paymentMethod}
                  className={formik.touched.paymentMethod && formik.errors.paymentMethod ? 'error' : ''}
                >
                  <option value="cash">💵 Cash</option>
                  <option value="card">💳 Card</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="check">📝 Check</option>
                </select>
                {formik.touched.paymentMethod && formik.errors.paymentMethod && (
                  <p className="error-message">{formik.errors.paymentMethod}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  placeholder="Payment description"
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.description}
                  rows="3"
                  className={formik.touched.description && formik.errors.description ? 'error' : ''}
                />
                {formik.touched.description && formik.errors.description && (
                  <p className="error-message">{formik.errors.description}</p>
                )}
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  name="notes"
                  placeholder="Additional notes"
                  onChange={formik.handleChange}
                  value={formik.values.notes}
                  rows="2"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting || !selectedCust}
              className="generate-btn"
            >
              {formik.isSubmitting ? 'Generating...' : 'Generate Receipt'}
            </button>
          </form>
        </div>

        {/* Receipt Preview and Print */}
        {selectedCust && formik.values.amount && formik.values.description && (
          <div className="receipt-preview-section">
            <h3>Receipt Preview</h3>
            <div className="preview-actions">
              <ReactToPrint
                trigger={() => (
                  <button className="print-btn">
                    🖨️ Print Receipt
                  </button>
                )}
                content={() => componentRef.current}
                onAfterPrint={handlePrintComplete}
              />
            </div>

            <div className="receipt-preview">
              <ReceiptComponent
                ref={componentRef}
                customer={selectedCust.name}
                amount={parseFloat(formik.values.amount || 0).toLocaleString()}
                date={new Date().toLocaleDateString()}
                description={formik.values.description}
                receiptNumber={`RCP-${Date.now()}`}
                companyInfo={companyInfo}
              />
            </div>
          </div>
        )}

        {/* Company Information Settings */}
        <div className="company-info-section">
          <h3>⚙️ Company Information</h3>
          <div className="company-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  value={companyInfo.name}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={companyInfo.address}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={companyInfo.phone}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={companyInfo.email}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label>Tax ID</label>
                <input
                  type="text"
                  value={companyInfo.taxId}
                  onChange={(e) => setCompanyInfo(prev => ({ ...prev, taxId: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Receipts */}
        {recentReceipts.length > 0 && (
          <div className="recent-receipts-section">
            <h3>📋 Recent Receipts</h3>
            <div className="receipts-list">
              {recentReceipts.map((receipt, index) => (
                <div key={index} className="receipt-item">
                  <div className="receipt-info">
                    <div className="receipt-header">
                      <strong>Receipt #{receipt.receiptNumber}</strong>
                      <span className="payment-method">
                        {getPaymentMethodIcon(receipt.paymentMethod)}
                        {receipt.paymentMethod.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <p><strong>Customer:</strong> {receipt.customer}</p>
                    <p><strong>Description:</strong> {receipt.description}</p>
                    <small>{receipt.date}</small>
                  </div>
                  <div className="receipt-amount">
                    {parseFloat(receipt.amount).toLocaleString()} QAR
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Templates */}
        <div className="templates-section">
          <h3>⚡ Quick Templates</h3>
          <div className="templates-grid">
            <button 
              className="template-btn"
              onClick={() => {
                formik.setFieldValue('description', 'Service payment');
                formik.setFieldValue('paymentMethod', 'cash');
              }}
            >
              🔧 Service Payment
            </button>
            
            <button 
              className="template-btn"
              onClick={() => {
                formik.setFieldValue('description', 'Product purchase');
                formik.setFieldValue('paymentMethod', 'card');
              }}
            >
              📦 Product Purchase
            </button>
            
            <button 
              className="template-btn"
              onClick={() => {
                formik.setFieldValue('description', 'Consultation fee');
                formik.setFieldValue('paymentMethod', 'bank_transfer');
              }}
            >
              💼 Consultation
            </button>
            
            <button 
              className="template-btn"
              onClick={() => {
                formik.setFieldValue('description', 'Monthly subscription');
                formik.setFieldValue('paymentMethod', 'card');
              }}
            >
              📅 Subscription
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipts;
