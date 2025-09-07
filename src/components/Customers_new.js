import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
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
  IconButton,
  Chip,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Customers = () => {
  const theme = useTheme();
  const [customers, setCustomers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const customerValidationSchema = Yup.object({
    name: Yup.string().required('Company name is required'),
    contactPerson: Yup.string().required('Contact person is required'),
    email: Yup.string().email('Invalid email format'),
    phone: Yup.string().required('Phone number is required'),
    address: Yup.string(),
    taxId: Yup.string(),
  });

  const invoiceValidationSchema = Yup.object({
    amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
    description: Yup.string().required('Description is required'),
    dueDate: Yup.date().min(new Date(), 'Due date must be in the future'),
  });

  const customerFormik = useFormik({
    initialValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      notes: '',
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values) => {
      try {
        if (editingId) {
          await updateDoc(doc(db, 'customers', editingId), {
            ...values,
            updatedAt: new Date(),
          });
          toast.success('Customer updated successfully');
          setEditingId(null);
        } else {
          await addDoc(collection(db, 'customers'), {
            ...values,
            createdAt: new Date(),
            totalOrders: 0,
            totalPaid: 0,
            invoices: [],
          });
          toast.success('Customer added successfully');
        }
        customerFormik.resetForm();
        fetchCustomers();
      } catch (error) {
        toast.error('Error saving customer');
        console.error('Error saving customer:', error);
      }
    },
  });

  const invoiceFormik = useFormik({
    initialValues: {
      amount: '',
      description: '',
      dueDate: '',
    },
    validationSchema: invoiceValidationSchema,
    onSubmit: async (values) => {
      try {
        const invoice = {
          ...values,
          amount: parseFloat(values.amount),
          createdAt: new Date(),
          status: 'pending',
          id: Date.now().toString(),
        };

        await updateDoc(doc(db, 'customers', selectedCustomer.id), {
          invoices: arrayUnion(invoice),
          totalOrders: (selectedCustomer.totalOrders || 0) + 1,
        });

        toast.success('Invoice created successfully');
        setShowInvoiceForm(false);
        invoiceFormik.resetForm();
        fetchCustomers();
      } catch (error) {
        toast.error('Error creating invoice');
        console.error('Error creating invoice:', error);
      }
    },
  });

  const fetchCustomers = async () => {
    try {
      const customersSnapshot = await getDocs(collection(db, 'customers'));
      const customersData = customersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Error loading customers');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    customerFormik.setValues({
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
      notes: customer.notes || '',
    });
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        await deleteDoc(doc(db, 'customers', id));
        toast.success('Customer deleted successfully');
        fetchCustomers();
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
      } catch (error) {
        toast.error('Error deleting customer');
        console.error('Error deleting customer:', error);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

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
                <BusinessIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Customer Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage your business relationships and invoicing
                </Typography>
              </Box>
            </Box>
            <Box>
              <TextField
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: alpha('#fff', 0.7) }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha('#fff', 0.1),
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#fff',
                    },
                  },
                  '& .MuiOutlinedInput-input': {
                    color: 'white',
                    '&::placeholder': {
                      color: alpha('#fff', 0.7),
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Customer Form */}
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
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    mr: 2
                  }}>
                    <AddIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    {editingId ? 'Edit Customer' : 'Add New Customer'}
                  </Typography>
                </Box>

                <Box component="form" onSubmit={customerFormik.handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="name"
                        label="Company Name *"
                        value={customerFormik.values.name}
                        onChange={customerFormik.handleChange}
                        onBlur={customerFormik.handleBlur}
                        error={customerFormik.touched.name && Boolean(customerFormik.errors.name)}
                        helperText={customerFormik.touched.name && customerFormik.errors.name}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BusinessIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="contactPerson"
                        label="Contact Person *"
                        value={customerFormik.values.contactPerson}
                        onChange={customerFormik.handleChange}
                        onBlur={customerFormik.handleBlur}
                        error={customerFormik.touched.contactPerson && Boolean(customerFormik.errors.contactPerson)}
                        helperText={customerFormik.touched.contactPerson && customerFormik.errors.contactPerson}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="email"
                        label="Email"
                        type="email"
                        value={customerFormik.values.email}
                        onChange={customerFormik.handleChange}
                        onBlur={customerFormik.handleBlur}
                        error={customerFormik.touched.email && Boolean(customerFormik.errors.email)}
                        helperText={customerFormik.touched.email && customerFormik.errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        name="phone"
                        label="Phone *"
                        value={customerFormik.values.phone}
                        onChange={customerFormik.handleChange}
                        onBlur={customerFormik.handleBlur}
                        error={customerFormik.touched.phone && Boolean(customerFormik.errors.phone)}
                        helperText={customerFormik.touched.phone && customerFormik.errors.phone}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="taxId"
                        label="Tax ID"
                        value={customerFormik.values.taxId}
                        onChange={customerFormik.handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="address"
                        label="Address"
                        multiline
                        rows={2}
                        value={customerFormik.values.address}
                        onChange={customerFormik.handleChange}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        name="notes"
                        label="Notes"
                        multiline
                        rows={2}
                        value={customerFormik.values.notes}
                        onChange={customerFormik.handleChange}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <Box display="flex" gap={2}>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={customerFormik.isSubmitting}
                          size="large"
                          startIcon={editingId ? <EditIcon /> : <AddIcon />}
                          sx={{ 
                            py: 1.5, 
                            px: 4,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600
                          }}
                        >
                          {customerFormik.isSubmitting 
                            ? (editingId ? 'Updating...' : 'Adding...') 
                            : (editingId ? 'Update Customer' : 'Add Customer')
                          }
                        </Button>
                        {editingId && (
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setEditingId(null);
                              customerFormik.resetForm();
                            }}
                            size="large"
                            sx={{ 
                              py: 1.5, 
                              px: 3,
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Customer List */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    mr: 2
                  }}>
                    <BusinessIcon />
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} color="text.primary">
                    Customer List ({filteredCustomers.length})
                  </Typography>
                </Box>

                <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                  {filteredCustomers.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <Typography variant="body1" color="text.secondary">
                        No customers found
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {filteredCustomers.map((customer) => (
                        <Grid item xs={12} key={customer.id}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Card 
                              elevation={selectedCustomer?.id === customer.id ? 4 : 1} 
                              onClick={() => setSelectedCustomer(customer)}
                              sx={{
                                borderRadius: 2,
                                cursor: 'pointer',
                                border: selectedCustomer?.id === customer.id ? 
                                  `2px solid ${theme.palette.primary.main}` : 
                                  `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  elevation: 3,
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <CardContent sx={{ p: 2 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="start">
                                  <Box flex={1}>
                                    <Typography variant="h6" fontWeight={600} color="primary" gutterBottom>
                                      {customer.name}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      <PersonIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                      {customer.contactPerson}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                      {customer.phone}
                                    </Typography>
                                    {customer.email && (
                                      <Typography variant="body2" color="text.secondary">
                                        <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                        {customer.email}
                                      </Typography>
                                    )}

                                    <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                                      <Chip 
                                        label={`Orders: ${customer.totalOrders || 0}`} 
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                      />
                                      <Chip 
                                        label={`Paid: ${(customer.totalPaid || 0).toLocaleString()} QAR`} 
                                        size="small" 
                                        color="success"
                                        variant="outlined"
                                      />
                                      {customer.invoices?.length > 0 && (
                                        <Chip 
                                          label={`Invoices: ${customer.invoices.length}`} 
                                          size="small" 
                                          color="info"
                                          variant="outlined"
                                        />
                                      )}
                                    </Box>
                                  </Box>

                                  <Box display="flex" flexDirection="column" gap={1}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEdit(customer);
                                      }}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.warning.main, 0.1),
                                        color: theme.palette.warning.main,
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.warning.main, 0.2),
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(customer.id, customer.name);
                                      }}
                                      sx={{ 
                                        bgcolor: alpha(theme.palette.error.main, 0.1),
                                        color: theme.palette.error.main,
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.error.main, 0.2),
                                        }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </CardContent>
                            </Card>
                          </motion.div>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Selected Customer Details */}
        {selectedCustomer && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card elevation={3} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ 
                        bgcolor: alpha(theme.palette.info.main, 0.1), 
                        color: theme.palette.info.main,
                        mr: 2,
                        width: 48,
                        height: 48
                      }}>
                        <ReceiptIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h5" fontWeight={700} color="text.primary">
                          {selectedCustomer.name} - Details
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Customer relationship management
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<ReceiptIcon />}
                      onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600
                      }}
                    >
                      Create Invoice
                    </Button>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Contact Person:</strong> {selectedCustomer.contactPerson}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Phone:</strong> {selectedCustomer.phone}
                        </Typography>
                        {selectedCustomer.email && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Email:</strong> {selectedCustomer.email}
                          </Typography>
                        )}
                        {selectedCustomer.address && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Address:</strong> {selectedCustomer.address}
                          </Typography>
                        )}
                        {selectedCustomer.taxId && (
                          <Typography variant="body2" gutterBottom>
                            <strong>Tax ID:</strong> {selectedCustomer.taxId}
                          </Typography>
                        )}
                      </Box>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" gutterBottom>
                        Business Statistics
                      </Typography>
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Orders:</strong> {selectedCustomer.totalOrders || 0}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Total Paid:</strong> {(selectedCustomer.totalPaid || 0).toLocaleString()} QAR
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          <strong>Outstanding Invoices:</strong> {selectedCustomer.invoices?.filter(inv => inv.status === 'pending').length || 0}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* Invoice Creation Form */}
                  {showInvoiceForm && (
                    <Box mt={3}>
                      <Divider sx={{ mb: 3 }} />
                      <Typography variant="h6" gutterBottom>
                        Create New Invoice
                      </Typography>
                      <Box component="form" onSubmit={invoiceFormik.handleSubmit}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              name="amount"
                              label="Amount (QAR) *"
                              type="number"
                              value={invoiceFormik.values.amount}
                              onChange={invoiceFormik.handleChange}
                              error={invoiceFormik.touched.amount && Boolean(invoiceFormik.errors.amount)}
                              helperText={invoiceFormik.touched.amount && invoiceFormik.errors.amount}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              name="dueDate"
                              label="Due Date *"
                              type="date"
                              InputLabelProps={{ shrink: true }}
                              value={invoiceFormik.values.dueDate}
                              onChange={invoiceFormik.handleChange}
                              error={invoiceFormik.touched.dueDate && Boolean(invoiceFormik.errors.dueDate)}
                              helperText={invoiceFormik.touched.dueDate && invoiceFormik.errors.dueDate}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              name="description"
                              label="Description *"
                              multiline
                              rows={2}
                              value={invoiceFormik.values.description}
                              onChange={invoiceFormik.handleChange}
                              error={invoiceFormik.touched.description && Boolean(invoiceFormik.errors.description)}
                              helperText={invoiceFormik.touched.description && invoiceFormik.errors.description}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Box display="flex" gap={2}>
                              <Button
                                type="submit"
                                variant="contained"
                                disabled={invoiceFormik.isSubmitting}
                                startIcon={<ReceiptIcon />}
                                sx={{ 
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600
                                }}
                              >
                                {invoiceFormik.isSubmitting ? 'Creating...' : 'Create Invoice'}
                              </Button>
                              <Button
                                variant="outlined"
                                onClick={() => {
                                  setShowInvoiceForm(false);
                                  invoiceFormik.resetForm();
                                }}
                                sx={{ 
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  fontWeight: 600
                                }}
                              >
                                Cancel
                              </Button>
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Customers;
