import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase';
import { mockEmployees } from '../services/mockData';
import { useDropzone } from 'react-dropzone';
import Dropzone from 'react-dropzone';
import { Formik, Form, Field, useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Avatar,
  Chip,
  useTheme,
  alpha,
  InputAdornment,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Divider,
  useMediaQuery,
  CircularProgress,
  AppBar,
  Toolbar,
  Container,
  Alert,
  AlertTitle,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  CloudUpload as CloudUploadIcon,
  CameraAlt as CameraAltIcon,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  History as HistoryIcon,
  AccountBalance as AccountBalanceIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

// Removed animation imports and transition components for better performance

// TabPanel component for organized content sections
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-details-tabpanel-${index}`}
      aria-labelledby={`employee-details-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `employee-details-tab-${index}`,
    'aria-controls': `employee-details-tabpanel-${index}`,
  };
}

const Employees = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Comprehensive employee details modal state - Enhanced with error handling
  const [detailsModalEmployee, setDetailsModalEmployee] = useState(null);
  const [employeeDetailsLoading, setEmployeeDetailsLoading] = useState(false);
  const [employeeDetailsError, setEmployeeDetailsError] = useState(null);
  const [modalTabValue, setModalTabValue] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  
  // Unified edit mode state for modal
  const [isEditMode, setIsEditMode] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // Photo upload functionality
  const [photoUploadModal, setPhotoUploadModal] = useState(false);
  const [photoUploadEmployee, setPhotoUploadEmployee] = useState(null);
  const [uploading, setUploading] = useState(false);

  const openPhotoUploadModal = (employee) => {
    setPhotoUploadEmployee(employee);
    setPhotoUploadModal(true);
  };

  const onPhotoDrop = async (acceptedFiles) => {
    if (acceptedFiles.length > 0 && photoUploadEmployee) {
      setUploading(true);
      try {
        const file = acceptedFiles[0];
        const photoRef = ref(storage, `employee-photos/${photoUploadEmployee.id}/${file.name}`);
        
        await uploadBytes(photoRef, file);
        const photoUrl = await getDownloadURL(photoRef);
        
        // Update employee photo in database
        if (isFirebaseConfigured) {
          await updateDoc(doc(db, 'employees', photoUploadEmployee.id), { photoUrl });
        } else {
          // Mock update
          const updatedEmployees = employees.map(emp => 
            emp.id === photoUploadEmployee.id ? { ...emp, photoUrl } : emp
          );
          setEmployees(updatedEmployees);
        }
        
        // Update selected employee if it's the same one
        if (detailsModalEmployee?.id === photoUploadEmployee.id) {
          setDetailsModalEmployee({ ...detailsModalEmployee, photoUrl });
        }
        
        toast.success('Profile photo updated successfully');
        setPhotoUploadModal(false);
      } catch (error) {
        console.error('Photo upload error:', error);
        toast.error('Failed to upload photo');
      } finally {
        setUploading(false);
      }
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop: onPhotoDrop, 
    accept: { 'image/*': [] }, 
    maxFiles: 1,
    disabled: uploading
  });

  // Enhanced handler for clicking employee names with robust error handling and timeout
  const handleNameClick = async (employee) => {
    console.log('🔄 Loading employee details for:', employee.name);
    
    // Prevent multiple concurrent requests
    if (employeeDetailsLoading) {
      console.log('⚠️ Already loading, skipping request');
      return;
    }
    
    // Immediately open modal with basic data from table row (instant feedback)
    setDetailsModalEmployee(employee);
    setModalTabValue(0);
    setEmployeeDetailsLoading(true);
    setEmployeeDetailsError(null);
    setRetryCount(0);
    
    try {
      let comprehensiveEmployeeData = { ...employee };
      
      if (isFirebaseConfigured()) {
        console.log('🔥 Firebase configured, fetching comprehensive data...');
        
        // Create timeout wrapper for Firebase calls (10 second timeout)
        const createTimeoutPromise = (ms = 10000) => 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Request timeout after ${ms/1000}s`)), ms)
          );
        
        // Fetch all data in parallel for better performance with timeout protection
        const promises = [];
        
        // Main employee document with timeout
        promises.push(
          Promise.race([
            getDoc(doc(db, 'employees', employee.id)),
            createTimeoutPromise(8000)
          ]).catch(err => {
            console.error('❌ Employee doc fetch failed:', err);
            return null;
          })
        );
        
        // Advances subcollection with timeout
        promises.push(
          Promise.race([
            getDocs(collection(db, 'employees', employee.id, 'advances')),
            createTimeoutPromise(5000)
          ]).catch(err => {
            console.warn('⚠️ Advances fetch failed (non-critical):', err);
            return null;
          })
        );
        
        // Transactions subcollection with timeout
        promises.push(
          Promise.race([
            getDocs(collection(db, 'employees', employee.id, 'transactions')),
            createTimeoutPromise(5000)
          ]).catch(err => {
            console.warn('⚠️ Transactions fetch failed (non-critical):', err);
            return null;
          })
        );

        console.log('⏳ Executing parallel Firebase calls...');
        
        // Execute all Firebase calls in parallel with overall timeout
        const [employeeDoc, advancesSnapshot, transactionsSnapshot] = await Promise.race([
          Promise.all(promises),
          createTimeoutPromise(12000) // Overall timeout
        ]);
        
        console.log('✅ Firebase calls completed');
        
        // Process employee document
        if (employeeDoc && employeeDoc.exists && employeeDoc.exists()) {
          comprehensiveEmployeeData = { ...comprehensiveEmployeeData, ...employeeDoc.data() };
          console.log('📄 Employee document data merged');
        } else {
          console.log('⚠️ No additional employee document found, using table data');
        }

        // Process advances (graceful handling if missing)
        if (advancesSnapshot && advancesSnapshot.docs) {
          comprehensiveEmployeeData.advances = advancesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log(`💰 Loaded ${comprehensiveEmployeeData.advances.length} advances`);
        } else {
          comprehensiveEmployeeData.advances = [];
          console.log('💰 No advances found or fetch failed, using empty array');
        }

        // Process transactions (graceful handling if missing)
        if (transactionsSnapshot && transactionsSnapshot.docs) {
          comprehensiveEmployeeData.transactions = transactionsSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log(`💵 Loaded ${comprehensiveEmployeeData.transactions.length} transactions`);
        } else {
          comprehensiveEmployeeData.transactions = [];
          console.log('💵 No transactions found or fetch failed, using empty array');
        }
        
      } else {
        // Demo mode with realistic loading delay
        console.log('🎭 Demo mode active, using mock data...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockAdvances = [
          { id: 1, amount: 5000, date: new Date('2024-08-15'), repaid: false, reason: 'Emergency medical' },
          { id: 2, amount: 2000, date: new Date('2024-07-10'), repaid: true, reason: 'Travel advance' }
        ];
        const mockTransactions = [
          { id: 1, amount: 12000, date: new Date('2024-09-01'), type: 'Salary Payment' },
          { id: 2, amount: -5000, date: new Date('2024-08-15'), type: 'Advance Deduction' },
          { id: 3, amount: 12000, date: new Date('2024-08-01'), type: 'Salary Payment' },
        ];
        
        comprehensiveEmployeeData.advances = mockAdvances;
        comprehensiveEmployeeData.transactions = mockTransactions;
        comprehensiveEmployeeData.joinDate = new Date('2023-01-15');
        comprehensiveEmployeeData.phone = '+974 5555 1234';
        comprehensiveEmployeeData.email = `${employee.name.toLowerCase().replace(' ', '.')}@company.com`;
        comprehensiveEmployeeData.address = 'Doha, Qatar';
        
        console.log('✅ Mock data loaded successfully');
      }
      
      // Update modal with comprehensive data
      setDetailsModalEmployee(comprehensiveEmployeeData);
      console.log('🎉 Employee details loaded successfully');
      
    } catch (error) {
      console.error('💥 Error fetching comprehensive employee data:', error);
      
      // Set user-friendly error message
      let errorMessage = 'Unable to load complete employee details.';
      if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please contact your administrator.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setEmployeeDetailsError(errorMessage);
      
      // Keep the basic employee data that's already shown (fallback)
      console.log('🔄 Falling back to table data');
      
    } finally {
      setEmployeeDetailsLoading(false);
      console.log('🏁 Loading process completed');
    }
  };

  // Retry handler for failed requests
  const handleRetryEmployeeDetails = () => {
    const currentRetryCount = retryCount + 1;
    setRetryCount(currentRetryCount);
    console.log(`🔄 Retrying employee details (attempt ${currentRetryCount})`);
    
    if (detailsModalEmployee) {
      handleNameClick(detailsModalEmployee);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    passportNumber: Yup.string().required('Passport number is required'),
    passportExpiry: Yup.date().required('Passport expiry is required').min(new Date(), 'Passport expiry must be in the future'),
    qidNumber: Yup.string().required('QID number is required'),
    qidExpiry: Yup.date().required('QID expiry is required').min(new Date(), 'QID expiry must be in the future'),
    salary: Yup.number().positive('Salary must be positive').required('Salary is required'),
    email: Yup.string().email('Invalid email format'),
    phone: Yup.string(),
    department: Yup.string().required('Department is required'),
    position: Yup.string().required('Position is required'),
  });

  // Validation schema for modal inline editing
  const modalValidationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string().email('Invalid email format'),
    phone: Yup.string(),
    department: Yup.string().required('Department is required'),
    position: Yup.string().required('Position is required'),
    salary: Yup.number().positive('Salary must be positive').required('Salary is required'),
    address: Yup.string(),
    passportNumber: Yup.string(),
    passportExpiry: Yup.date(),
    qidNumber: Yup.string(),
    qidExpiry: Yup.date(),
  });

  const formik = useFormik({
    initialValues: {
      name: '',
      passportNumber: '',
      passportExpiry: '',
      qidNumber: '',
      qidExpiry: '',
      salary: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      passportPhoto: null,
      qidPhoto: null
    },
    validationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setLoading(true);
      try {
        let passportUrl = '';
        let qidUrl = '';

        // Upload passport photo if provided
        if (values.passportPhoto) {
          const passportRef = ref(storage, `passports/${Date.now()}_${values.passportPhoto.name}`);
          await uploadBytes(passportRef, values.passportPhoto);
          passportUrl = await getDownloadURL(passportRef);
        }

        // Upload QID photo if provided
        if (values.qidPhoto) {
          const qidRef = ref(storage, `qids/${Date.now()}_${values.qidPhoto.name}`);
          await uploadBytes(qidRef, values.qidPhoto);
          qidUrl = await getDownloadURL(qidRef);
        }

        const employeeData = {
          name: values.name,
          passport: {
            number: values.passportNumber,
            expiry: values.passportExpiry,
            photoUrl: passportUrl || (editingId ? employees.find(e => e.id === editingId)?.passport?.photoUrl || '' : '')
          },
          qid: {
            number: values.qidNumber,
            expiry: values.qidExpiry,
            photoUrl: qidUrl || (editingId ? employees.find(e => e.id === editingId)?.qid?.photoUrl || '' : '')
          },
          salary: parseFloat(values.salary),
          email: values.email,
          phone: values.phone,
          department: values.department,
          position: values.position,
          transactions: editingId ? employees.find(e => e.id === editingId)?.transactions || [] : [],
          totalPaid: editingId ? employees.find(e => e.id === editingId)?.totalPaid || 0 : 0,
          advances: editingId ? employees.find(e => e.id === editingId)?.advances || [] : [],
          createdAt: editingId ? employees.find(e => e.id === editingId)?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (editingId) {
          await updateDoc(doc(db, 'employees', editingId), employeeData);
          toast.success('Employee updated successfully');
          setEditingId(null);
        } else {
          await addDoc(collection(db, 'employees'), employeeData);
          toast.success('Employee saved successfully');
        }

        resetForm();
        setShowForm(false);
        fetchEmployees();
      } catch (error) {
        toast.error(`Error saving employee: ${error.message}`);
        console.error('Error saving employee:', error);
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });

  const fetchEmployees = async () => {
    try {
      if (isFirebaseConfigured()) {
        const snapshot = await getDocs(collection(db, 'employees'));
        const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEmployees(employeesList);
      } else {
        // Use mock data for testing
        setEmployees([...mockEmployees]);
        console.log('Using mock employee data for demonstration');
      }
    } catch (error) {
      // Fallback to mock data if Firebase fails
      setEmployees([...mockEmployees]);
      console.log('Firebase error, using mock data:', error.message);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const checkExpiry = (expiry, type) => {
    if (!expiry) return { status: 'unknown', message: 'No date', color: 'default' };
    
    const expiryDate = new Date(expiry);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', message: `Expired ${Math.abs(daysLeft)} days ago`, color: 'error' };
    } else if (daysLeft <= 30) {
      return { status: 'critical', message: `${daysLeft} days left`, color: 'error' };
    } else if (daysLeft <= 90) {
      return { status: 'warning', message: `${daysLeft} days left`, color: 'warning' };
    } else {
      return { status: 'ok', message: `${daysLeft} days left`, color: 'success' };
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'employees', employeeId));
        toast.success('Employee deleted successfully');
        fetchEmployees();
      } catch (error) {
        toast.error('Error deleting employee');
        console.error('Error deleting employee:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    formik.resetForm();
  };

  // Unified modal edit functions
  const handleStartEdit = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  const handleSaveChanges = async (values, { setSubmitting }) => {
    setSavingChanges(true);
    try {
      const updateData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        department: values.department,
        position: values.position,
        salary: parseFloat(values.salary) || 0,
        address: values.address,
        passport: {
          number: values.passportNumber,
          expiry: values.passportExpiry,
          photoUrl: detailsModalEmployee?.passport?.photoUrl || null
        },
        qid: {
          number: values.qidNumber,
          expiry: values.qidExpiry,
          photoUrl: detailsModalEmployee?.qid?.photoUrl || null
        }
      };

      if (isFirebaseConfigured) {
        await updateDoc(doc(db, 'employees', detailsModalEmployee.id), updateData);
      } else {
        // Mock update for demo
        console.log('Mock update:', updateData);
      }

      // Update local state
      setDetailsModalEmployee(prev => ({
        ...prev,
        ...updateData
      }));

      toast.success('Employee details updated successfully');
      setIsEditMode(false);
      
      // Refresh employees list
      fetchEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
      toast.error('Failed to update employee details');
    } finally {
      setSavingChanges(false);
      setSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.qid?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.passport?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateProgress = (values) => {
    const requiredFields = ['name', 'passportNumber', 'passportExpiry', 'qidNumber', 'qidExpiry', 'salary', 'department', 'position'];
    const completedFields = requiredFields.filter(field => values[field] && values[field].toString().trim() !== '').length;
    return (completedFields / requiredFields.length) * 100;
  };

  const progress = calculateProgress(formik.values);

  return (
    <Box sx={{ 
      backgroundColor: 'background.default', 
      color: 'text.primary', 
      minHeight: '100vh',
      p: 3 
    }}>
      {/* Header - Optimized without animations */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 3, md: 4 }, 
          mb: 3, 
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
              Employee Management
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1rem' }}>
              Manage employee information, documents, and records efficiently
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{
              bgcolor: alpha('#fff', 0.15),
              color: 'white',
              '&:hover': {
                bgcolor: alpha('#fff', 0.25)
              },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              minWidth: { xs: '100%', sm: 'auto' },
              boxShadow: 3
            }}
          >
            Add New Employee
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Search and Filters - Optimized */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <TextField
                fullWidth
                placeholder="Search employees by name, department, QID, or passport..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: alpha(theme.palette.background.paper, 0.7),
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.background.paper, 0.9)
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                Showing {filteredEmployees.length} of {employees.length} employees
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Enhanced Employees DataGrid - Performance Optimized */}
        <Grid item xs={12}>
          <Card elevation={1} sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  Employee Directory
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ 
                  px: 2, 
                  py: 0.5, 
                  borderRadius: 1, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.08)
                }}>
                  {filteredEmployees.length} records
                </Typography>
              </Box>

                <Box sx={{ height: 600, width: '100%' }}>
                  <DataGrid
                    rows={filteredEmployees.map((emp, index) => ({ 
                      ...emp, 
                      id: emp.id || `employee-${index}`,
                      qidStatusObj: checkExpiry(emp.qid?.expiry, 'QID'),
                      passportStatusObj: checkExpiry(emp.passport?.expiry, 'Passport')
                    }))}
                    columns={[
                      {
                        field: 'employee',
                        headerName: 'Employee',
                        width: 250,
                        renderCell: (params) => (
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            sx={{ py: 1.5, px: 2, height: '100%' }}
                          >
                            <Avatar 
                              src={params.row.photoUrl}
                              sx={{ 
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                                mr: 2,
                                width: 40,
                                height: 40,
                                fontSize: '1rem',
                                fontWeight: 600
                              }}
                            >
                              {params.row.name?.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="body1" 
                                fontWeight={600} 
                                noWrap 
                                sx={{ 
                                  mb: 0.5,
                                  color: theme.palette.text.primary,
                                }}
                              >
                                {params.row.name}
                              </Typography>
                              {params.row.email && (
                                <Typography variant="body2" color="text.secondary" noWrap>
                                  {params.row.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        )
                      },
                      {
                        field: 'department',
                        headerName: 'Department',
                        width: 120,
                        align: 'center',
                        headerAlign: 'center'
                      },
                      {
                        field: 'position',
                        headerName: 'Position',
                        width: 150,
                        align: 'center',
                        headerAlign: 'center'
                      },
                      {
                        field: 'qidNumber',
                        headerName: 'Qatar ID',
                        width: 130,
                        align: 'center',
                        headerAlign: 'center',
                        renderCell: (params) => (
                          <Typography variant="body2" fontWeight={500}>
                            {params.row.qid?.number || 'Not provided'}
                          </Typography>
                        )
                      },
                      {
                        field: 'qidStatus',
                        headerName: 'QID Status',
                        width: 100,
                        align: 'center',
                        headerAlign: 'center',
                        renderCell: (params) => (
                          <Chip
                            label={params.row.qidStatusObj.message}
                            color={params.row.qidStatusObj.color}
                            size="small"
                            variant={params.row.qidStatusObj.color === 'default' ? 'outlined' : 'filled'}
                          />
                        )
                      },
                      {
                        field: 'passportStatus',
                        headerName: 'Passport Status',
                        width: 120,
                        align: 'center',
                        headerAlign: 'center',
                        renderCell: (params) => (
                          <Chip
                            label={params.row.passportStatusObj.message}
                            color={params.row.passportStatusObj.color}
                            size="small"
                            variant={params.row.passportStatusObj.color === 'default' ? 'outlined' : 'filled'}
                          />
                        )
                      },
                      {
                        field: 'salary',
                        headerName: 'Salary',
                        width: 100,
                        align: 'right',
                        headerAlign: 'right',
                        valueFormatter: (value) => `${value?.toLocaleString() || 0} QAR`
                      },
                      {
                        field: 'totalPaid',
                        headerName: 'Total Paid',
                        width: 100,
                        align: 'right',
                        headerAlign: 'right',
                        renderCell: (params) => (
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            {(params.row.salary * 6 || 0).toLocaleString()} QAR
                          </Typography>
                        )
                      },
                      {
                        field: 'actions',
                        headerName: 'Actions',
                        width: 120,
                        align: 'center',
                        headerAlign: 'center',
                        sortable: false,
                        renderCell: (params) => (
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                openPhotoUploadModal(params.row);
                              }}
                              sx={{ color: 'primary.main' }}
                            >
                              <CameraAltIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(params.row.id, params.row.name);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )
                      },
                    ]}
                    sx={{
                      '& .MuiDataGrid-root': {
                        border: 'none',
                      },
                      '& .MuiDataGrid-row': {
                        minHeight: 80, // Increased from 68 for better spacing
                        cursor: 'pointer',
                        borderRadius: 2,
                        mb: 1, // Increased from 0.5 for better separation
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`, // More visible divider
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: alpha(theme.palette.grey[50], 0.3), // Subtle zebra striping
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                          mb: 0,
                        }
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: 'none',
                        py: 2.5, // Increased from 1.5 for better vertical padding
                        px: 3, // Increased from 2 for better horizontal padding
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        borderRight: `1px solid ${alpha(theme.palette.divider, 0.08)}`, // Subtle column dividers
                        '&:last-child': {
                          borderRight: 'none',
                        }
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        color: 'common.white',
                        borderBottom: `2px solid ${theme.palette.primary.dark}`,
                        minHeight: 56, // Increased from 52
                        '& .MuiDataGrid-columnHeader': {
                          color: 'common.white',
                          backgroundColor: 'transparent',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          color: 'common.white',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                        },
                        '& .MuiDataGrid-columnSeparator': {
                          color: alpha(theme.palette.common.white, 0.3),
                        }
                      },
                      '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus': {
                        outline: `2px solid ${theme.palette.primary.main}`,
                        outlineOffset: -1,
                      },
                      backgroundColor: '#ffffff',
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      '& .MuiDataGrid-virtualScroller': {
                        backgroundColor: '#ffffff'
                      },
                      '& .MuiDataGrid-footerContainer': {
                        backgroundColor: alpha(theme.palette.grey[50], 0.5),
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        minHeight: 56,
                        borderRadius: '0 0 8px 8px',
                      },
                      '& .MuiDataGrid-toolbarContainer': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                        py: 1,
                        px: 2,
                      }
                    }}
                    pageSize={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    checkboxSelection={false}
                    disableSelectionOnClick={false}
                    autoHeight={false}
                    onRowClick={(params) => {
                      // Open comprehensive details/edit popup when any part of the row is clicked
                      handleNameClick(params.row);
                    }}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 10, page: 0 }
                      }
                    }}
                  />
                </Box>
                
                {filteredEmployees.length === 0 && (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No employees found
                    </Typography>
                    {searchTerm && (
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search terms
                      </Typography>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
        </Grid>
      </Grid>



      {/* Employee Form Dialog */}
      <Dialog 
        open={showForm} 
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: alpha(theme.palette.primary.main, 0.1), 
                color: theme.palette.primary.main,
                mr: 2
              }}>
                <PersonIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={600}>
                {editingId ? 'Edit Employee' : 'Add New Employee'}
              </Typography>
            </Box>
            {progress > 0 && (
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Progress: {Math.round(progress)}%
                </Typography>
                <LinearProgress variant="determinate" value={progress} />
              </Box>
            )}
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>Personal Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="name"
                      label="Full Name *"
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.name && Boolean(formik.errors.name)}
                      helperText={formik.touched.name && formik.errors.name}
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
                      label="Email Address"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
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
                      label="Phone Number"
                      value={formik.values.phone}
                      onChange={formik.handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Department *</InputLabel>
                      <Select
                        name="department"
                        value={formik.values.department}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.department && Boolean(formik.errors.department)}
                        startAdornment={
                          <InputAdornment position="start">
                            <BusinessIcon />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="HR">Human Resources</MenuItem>
                        <MenuItem value="Finance">Finance</MenuItem>
                        <MenuItem value="IT">Information Technology</MenuItem>
                        <MenuItem value="Operations">Operations</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                      </Select>
                      {formik.touched.department && formik.errors.department && (
                        <Typography variant="caption" color="error">
                          {formik.errors.department}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="position"
                      label="Job Position *"
                      value={formik.values.position}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.position && Boolean(formik.errors.position)}
                      helperText={formik.touched.position && formik.errors.position}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AssignmentIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="salary"
                      label="Monthly Salary (QAR) *"
                      type="number"
                      value={formik.values.salary}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.salary && Boolean(formik.errors.salary)}
                      helperText={formik.touched.salary && formik.errors.salary}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MoneyIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>Document Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="passportNumber"
                      label="Passport Number *"
                      value={formik.values.passportNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.passportNumber && Boolean(formik.errors.passportNumber)}
                      helperText={formik.touched.passportNumber && formik.errors.passportNumber}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="passportExpiry"
                      label="Passport Expiry *"
                      type="date"
                      value={formik.values.passportExpiry}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.passportExpiry && Boolean(formik.errors.passportExpiry)}
                      helperText={formik.touched.passportExpiry && formik.errors.passportExpiry}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="qidNumber"
                      label="QID Number *"
                      value={formik.values.qidNumber}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.qidNumber && Boolean(formik.errors.qidNumber)}
                      helperText={formik.touched.qidNumber && formik.errors.qidNumber}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="qidExpiry"
                      label="QID Expiry *"
                      type="date"
                      value={formik.values.qidExpiry}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.qidExpiry && Boolean(formik.errors.qidExpiry)}
                      helperText={formik.touched.qidExpiry && formik.errors.qidExpiry}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>Document Uploads</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        Passport Photo
                      </Typography>
                      <Dropzone
                        onDrop={acceptedFiles => formik.setFieldValue('passportPhoto', acceptedFiles[0])}
                        accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                        maxSize={5242880} // 5MB
                      >
                        {({ getRootProps, getInputProps, isDragActive }) => (
                          <Box 
                            {...getRootProps()} 
                            sx={{ 
                              p: 2, 
                              cursor: 'pointer',
                              borderRadius: 1,
                              bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                              }
                            }}
                          >
                            <input {...getInputProps()} />
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            {formik.values.passportPhoto ? (
                              <Typography variant="body2" color="primary">
                                {formik.values.passportPhoto.name}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Drop passport photo here or click to browse
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      elevation={1}
                      sx={{ 
                        p: 2, 
                        border: `2px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        textAlign: 'center'
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} gutterBottom>
                        QID Photo
                      </Typography>
                      <Dropzone
                        onDrop={acceptedFiles => formik.setFieldValue('qidPhoto', acceptedFiles[0])}
                        accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                        maxSize={5242880} // 5MB
                      >
                        {({ getRootProps, getInputProps, isDragActive }) => (
                          <Box 
                            {...getRootProps()} 
                            sx={{ 
                              p: 2, 
                              cursor: 'pointer',
                              borderRadius: 1,
                              bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.05)
                              }
                            }}
                          >
                            <input {...getInputProps()} />
                            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                            {formik.values.qidPhoto ? (
                              <Typography variant="body2" color="primary">
                                {formik.values.qidPhoto.name}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Drop QID photo here or click to browse
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Dropzone>
                    </Paper>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancel}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={formik.handleSubmit}
            variant="contained" 
            disabled={formik.isSubmitting || loading}
            startIcon={loading ? <LinearProgress size={20} /> : <PersonIcon />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            {loading ? 'Saving...' : editingId ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Photo Upload Modal */}
      <Dialog
        open={photoUploadModal}
        onClose={() => setPhotoUploadModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: 'primary.main', 
          color: 'common.white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" fontWeight={600}>
            Update Profile Photo
          </Typography>
          <IconButton
            onClick={() => setPhotoUploadModal(false)}
            sx={{ color: 'common.white' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={photoUploadEmployee?.photoUrl}
              sx={{
                width: 120,
                height: 120,
                mx: 'auto',
                mb: 2,
                fontSize: '3rem',
                bgcolor: 'primary.main'
              }}
            >
              {photoUploadEmployee?.name?.charAt(0)}
            </Avatar>
            <Typography variant="h6" fontWeight={600}>
              {photoUploadEmployee?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {photoUploadEmployee?.position} • {photoUploadEmployee?.department}
            </Typography>
          </Box>
          
          <Box 
            {...getRootProps()} 
            sx={{
              border: `2px dashed ${uploading ? 'grey.400' : 'primary.main'}`,
              borderRadius: 3,
              p: 4,
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              backgroundColor: uploading ? 'grey.50' : alpha(theme.palette.primary.main, 0.02),
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: uploading ? 'grey.50' : alpha(theme.palette.primary.main, 0.05),
                transform: uploading ? 'none' : 'scale(1.02)'
              }
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <Box>
                <CircularProgress size={40} sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Uploading photo...
                </Typography>
              </Box>
            ) : (
              <Box>
                <CameraAltIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Drag & drop or click to upload
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports: JPG, PNG, GIF (Max 5MB)
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setPhotoUploadModal(false)}
            disabled={uploading}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* High-Performance Employee Details Modal - Optimized for Speed */}
      <Dialog
        open={Boolean(detailsModalEmployee)}
        onClose={() => {
          setDetailsModalEmployee(null);
          setEmployeeDetailsLoading(false);
          setEmployeeDetailsError(null);
          setModalTabValue(0);
          setRetryCount(0);
        }}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        disableEnforceFocus
        disableAutoFocus
        disableScrollLock={false}
        PaperProps={{
          sx: {
            backgroundColor: '#ffffff', // Solid white background
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,0,0,0.08)',
            border: isMobile ? 'none' : `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            minHeight: isMobile ? '100vh' : '75vh',
            maxHeight: isMobile ? '100vh' : '90vh',
            transition: 'none', // Remove all transitions for instant modal
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Solid backdrop
            backdropFilter: 'none', // Remove blur for performance
          }
        }}
        aria-labelledby="employee-details-title"
        aria-describedby="employee-details-content"
      >
        {/* Streamlined Header - No Heavy Gradients */}
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            borderRadius: isMobile ? 0 : '8px 8px 0 0',
            backgroundColor: theme.palette.primary.main,
            color: 'white'
          }}
        >
          <Toolbar sx={{ py: 2, minHeight: 64 }}>
            <Avatar
              src={detailsModalEmployee?.photoUrl || detailsModalEmployee?.photoURL}
              alt={detailsModalEmployee?.name}
              onError={(e) => {
                // Fallback handling for broken images
                e.target.style.display = 'none';
              }}
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                backgroundColor: alpha(theme.palette.common.white, 0.1),
                fontSize: '1.3rem',
                fontWeight: 600,
              }}
            >
              {detailsModalEmployee?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box flexGrow={1}>
              <Typography 
                variant="h5" 
                color="white" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                {detailsModalEmployee?.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: '0.875rem'
                }}
              >
                {detailsModalEmployee?.position} • {detailsModalEmployee?.department}
              </Typography>
            </Box>
            
            {/* Unified Edit/Save buttons */}
            {isEditMode ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    // This will be handled by Formik's submit
                    const form = document.querySelector('form');
                    if (form) form.requestSubmit();
                  }}
                  disabled={savingChanges}
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: 'primary.main',
                    fontWeight: 600,
                    '&:hover': {
                      backgroundColor: 'white'
                    }
                  }}
                >
                  {savingChanges ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCancelEdit}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.08)'
                    }
                  }}
                >
                  Cancel
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditIcon />}
                onClick={handleStartEdit}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  mr: 1,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.08)'
                  }
                }}
              >
                Edit
              </Button>
            )}
            
            <IconButton
              onClick={() => {
                setDetailsModalEmployee(null);
                setEmployeeDetailsLoading(false);
                setEmployeeDetailsError(null);
                setModalTabValue(0);
                setRetryCount(0);
              }}
              sx={{
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.08)'
                }
              }}
              aria-label="Close employee details"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <DialogContent 
          sx={{ 
            p: 0, 
            backgroundColor: '#ffffff', // Pure white background
            color: 'text.primary',
            overflowY: 'auto',
            minHeight: isMobile ? '60vh' : '400px' // Prevent collapse during loading
          }}
        >
          {employeeDetailsLoading ? (
            <Box 
              display="flex" 
              flexDirection="column"
              justifyContent="center" 
              alignItems="center" 
              py={6}
              gap={2}
              sx={{
                backgroundColor: '#ffffff',
                minHeight: '350px'
              }}
            >
              <CircularProgress 
                size={40} 
                thickness={3.6}
                sx={{ color: 'primary.main' }}
              />
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 500 }}>
                Loading details...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: '280px' }}>
                Fetching employee information and records
              </Typography>
            </Box>
          ) : employeeDetailsError ? (
            <Box 
              display="flex" 
              flexDirection="column"
              justifyContent="center" 
              alignItems="center" 
              py={6}
              px={4}
              gap={3}
              sx={{
                backgroundColor: 'background.paper',
                minHeight: '400px'
              }}
            >
              <Alert 
                severity="error" 
                sx={{ 
                  width: '100%', 
                  maxWidth: '500px',
                  '& .MuiAlert-message': {
                    width: '100%'
                  }
                }}
                action={
                  <Button 
                    color="inherit" 
                    size="small" 
                    onClick={handleRetryEmployeeDetails}
                    sx={{ fontWeight: 600 }}
                  >
                    Retry
                  </Button>
                }
              >
                <AlertTitle sx={{ fontWeight: 600 }}>Unable to Load Details</AlertTitle>
                {employeeDetailsError}
                {retryCount > 0 && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                    Failed after {retryCount} attempt{retryCount > 1 ? 's' : ''}
                  </Typography>
                )}
              </Alert>
              
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
                Showing basic information from the employee directory
              </Typography>
              
              <Button
                variant="outlined"
                onClick={handleRetryEmployeeDetails}
                startIcon={<CircularProgress size={16} sx={{ mr: 0.5 }} />}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  fontWeight: 600
                }}
              >
                Try Again
              </Button>
            </Box>
          ) : (
            <Formik
              initialValues={{
                name: detailsModalEmployee?.name || '',
                email: detailsModalEmployee?.email || '',
                phone: detailsModalEmployee?.phone || '',
                department: detailsModalEmployee?.department || '',
                position: detailsModalEmployee?.position || '',
                salary: detailsModalEmployee?.salary || '',
                address: detailsModalEmployee?.address || '',
                passportNumber: detailsModalEmployee?.passport?.number || '',
                passportExpiry: detailsModalEmployee?.passport?.expiry || '',
                qidNumber: detailsModalEmployee?.qid?.number || '',
                qidExpiry: detailsModalEmployee?.qid?.expiry || '',
              }}
              validationSchema={modalValidationSchema}
              enableReinitialize={true}
              onSubmit={handleSaveChanges}
            >
              {({ values, errors, touched, setFieldValue, isValid, dirty, isSubmitting }) => (
                <Form>
                  <Box>
                    {/* Clean Navigation Tabs */}
                    <Box sx={{ 
                      borderBottom: 1, 
                      borderColor: 'divider', 
                      backgroundColor: '#ffffff' 
                    }}>
                      <Tabs 
                        value={modalTabValue} 
                        onChange={(e, newValue) => setModalTabValue(newValue)}
                        variant="fullWidth"
                        textColor="primary"
                        indicatorColor="primary"
                        sx={{
                          backgroundColor: '#ffffff',
                          '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            fontSize: '0.95rem',
                            py: 2,
                            minHeight: 48,
                            color: 'text.primary'
                          },
                          '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '2px 2px 0 0'
                          }
                        }}
                      >
                        <Tab label="Personal Info" {...a11yProps(0)} />
                        <Tab label="Documents" {...a11yProps(1)} />
                        <Tab label="Payroll" {...a11yProps(2)} />
                      </Tabs>
                    </Box>

                    {/* Clean Tab Content */}
                    <Container maxWidth="lg" sx={{ 
                      px: { xs: 2, sm: 3 },
                      backgroundColor: '#ffffff',
                      py: 2
                    }}>
                      {/* Personal Information Tab - Enhanced with Inline Editing */}
                      <TabPanel value={modalTabValue} index={0}>
                        <Grid container spacing={4} justifyContent="center" alignItems="stretch">
                          
                          {/* Profile Photo Section */}
                          <Grid item xs={12} md={4}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                textAlign: 'center',
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                                Profile Photo
                              </Typography>
                              
                              {/* Inline Photo Upload Dropzone */}
                              {isEditMode ? (
                                <Dropzone
                                  onDrop={async (acceptedFiles) => {
                                    if (acceptedFiles.length > 0) {
                                      const file = acceptedFiles[0];
                                      try {
                                        const photoRef = ref(storage, `employee-photos/${detailsModalEmployee.id}/${file.name}`);
                                        await uploadBytes(photoRef, file);
                                        const photoUrl = await getDownloadURL(photoRef);
                                        
                                        // Update employee photo in database
                                        if (isFirebaseConfigured) {
                                          await updateDoc(doc(db, 'employees', detailsModalEmployee.id), { photoUrl });
                                        }
                                        
                                        // Update local state
                                        setDetailsModalEmployee(prev => ({
                                          ...prev,
                                          photoUrl
                                        }));
                                        
                                        toast.success('Profile photo updated successfully');
                                      } catch (error) {
                                        console.error('Photo upload error:', error);
                                        toast.error('Failed to upload photo');
                                      }
                                    }
                                  }}
                                  accept={{ 'image/*': [] }}
                                  maxFiles={1}
                                  maxSize={5242880} // 5MB
                                >
                                  {({ getRootProps, getInputProps, isDragActive }) => (
                                    <Box 
                                      {...getRootProps()} 
                                      sx={{ 
                                        cursor: 'pointer',
                                        border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                                        borderRadius: 2,
                                        p: 2,
                                        mb: 3,
                                        backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          borderColor: theme.palette.primary.main,
                                          backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                        }
                                      }}
                                    >
                                      <input {...getInputProps()} />
                                      <Avatar
                                        src={detailsModalEmployee?.photoUrl || detailsModalEmployee?.photoURL}
                                        alt={detailsModalEmployee?.name}
                                        onError={(e) => {
                                          // Fallback for broken images
                                          e.target.style.backgroundColor = theme.palette.grey[300];
                                        }}
                                        sx={{
                                          width: 120,
                                          height: 120,
                                          mx: 'auto',
                                          mb: 2,
                                          backgroundColor: theme.palette.grey[300],
                                          fontSize: '2.5rem',
                                          fontWeight: 600,
                                          border: `4px solid ${theme.palette.primary.main}`,
                                          opacity: isDragActive ? 0.7 : 1,
                                          transition: 'opacity 0.3s ease'
                                        }}
                                      >
                                        {detailsModalEmployee?.name?.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        {isDragActive ? 'Drop photo here' : 'Click or drag to change photo'}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        JPG, PNG, GIF (Max 5MB)
                                      </Typography>
                                    </Box>
                                  )}
                                </Dropzone>
                              ) : (
                                <Avatar
                                  src={detailsModalEmployee?.photoUrl || detailsModalEmployee?.photoURL}
                                  alt={detailsModalEmployee?.name}
                                  onError={(e) => {
                                    // Fallback for broken images
                                    e.target.style.backgroundColor = theme.palette.grey[300];
                                  }}
                                  sx={{
                                    width: 120,
                                    height: 120,
                                    mx: 'auto',
                                    mb: 3,
                                    backgroundColor: theme.palette.grey[300],
                                    fontSize: '2.5rem',
                                    fontWeight: 600,
                                    border: `4px solid ${theme.palette.primary.main}`,
                                  }}
                                >
                                  {detailsModalEmployee?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                              )}
                              
                              <Typography variant="h6" fontWeight={600} gutterBottom>
                                {detailsModalEmployee?.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {detailsModalEmployee?.position}
                              </Typography>
                              <Chip
                                label={`ID: ${detailsModalEmployee?.id || 'N/A'}`}
                                color="primary"
                                variant="outlined"
                                sx={{ mt: 1, fontWeight: 500 }}
                              />
                            </Card>
                          </Grid>
                          
                          {/* Employment Details */}
                          <Grid item xs={12} md={8}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                                Employment Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Employee Name
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="name">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Employee Name"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.name || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Department
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="department">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Department"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.department || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Position
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="position">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Position"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.position || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Monthly Salary
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="salary">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            type="number"
                                            label="Monthly Salary"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            InputProps={{
                                              endAdornment: <InputAdornment position="end">QAR</InputAdornment>
                                            }}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={700} color="success.main" sx={{ fontSize: '1.2rem' }}>
                                        {detailsModalEmployee?.salary?.toLocaleString() || 0} QAR
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Join Date
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                      {formatDate(detailsModalEmployee?.joinDate || detailsModalEmployee?.createdAt) || 'Not provided'}
                                    </Typography>
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Employee ID
                                    </Typography>
                                    <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                      {detailsModalEmployee?.id || 'Not provided'}
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                              
                              <Divider sx={{ my: 3 }} />
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'secondary.main' }}>
                                Contact Information
                              </Typography>
                              
                              <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Email Address
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="email">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            type="email"
                                            label="Email Address"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.email || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12} sm={6}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Phone Number
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="phone">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            label="Phone Number"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.phone || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                                
                                <Grid item xs={12}>
                                  <Box sx={{ mb: 3 }}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Address
                                    </Typography>
                                    {isEditMode ? (
                                      <Field name="address">
                                        {({ field, meta }) => (
                                          <TextField
                                            {...field}
                                            fullWidth
                                            multiline
                                            rows={2}
                                            label="Address"
                                            variant="outlined"
                                            size="small"
                                            error={meta.touched && meta.error}
                                            helperText={meta.touched && meta.error}
                                            sx={{ mt: 1 }}
                                          />
                                        )}
                                      </Field>
                                    ) : (
                                      <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                        {detailsModalEmployee?.address || 'Not provided'}
                                      </Typography>
                                    )}
                                  </Box>
                                </Grid>
                              </Grid>
                            </Card>
                          </Grid>
                        </Grid>
                      </TabPanel>

                      {/* Documents Tab - Enhanced with Inline Editing */}
                      <TabPanel value={modalTabValue} index={1}>
                        <Grid container spacing={4}>
                          
                          {/* Passport Information */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                Passport Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Passport Number
                                </Typography>
                                {isEditMode ? (
                                  <Field name="passportNumber">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Passport Number"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                    {detailsModalEmployee?.passport?.number || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Expiry Date
                                </Typography>
                                {isEditMode ? (
                                  <Field name="passportExpiry">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        type="date"
                                        label="Passport Expiry Date"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                    {formatDate(detailsModalEmployee?.passport?.expiry) || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* Passport Document Upload */}
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Passport Document
                                </Typography>
                                {detailsModalEmployee?.passport?.documentUrl ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<DownloadIcon />}
                                      onClick={() => window.open(detailsModalEmployee.passport.documentUrl, '_blank')}
                                      sx={{ borderRadius: 2, textTransform: 'none' }}
                                    >
                                      View Passport
                                    </Button>
                                    {isEditMode && (
                                      <Button
                                        variant="text"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => {
                                          // Handle document removal
                                          setFieldValue('passportDocument', null);
                                        }}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    No passport document uploaded
                                  </Typography>
                                )}
                              </Box>
                            </Card>
                          </Grid>
                          
                          {/* QID Information */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                QID Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  QID Number
                                </Typography>
                                {isEditMode ? (
                                  <Field name="qidNumber">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="QID Number"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                    {detailsModalEmployee?.qid?.number || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Expiry Date
                                </Typography>
                                {isEditMode ? (
                                  <Field name="qidExpiry">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        type="date"
                                        label="QID Expiry Date"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        InputLabelProps={{ shrink: true }}
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                    {formatDate(detailsModalEmployee?.qid?.expiry) || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                              
                              {/* QID Document Upload */}
                              <Box sx={{ mt: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  QID Document
                                </Typography>
                                {detailsModalEmployee?.qid?.documentUrl ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                    <Button
                                      variant="outlined"
                                      startIcon={<DownloadIcon />}
                                      onClick={() => window.open(detailsModalEmployee.qid.documentUrl, '_blank')}
                                      sx={{ borderRadius: 2, textTransform: 'none' }}
                                    >
                                      View QID
                                    </Button>
                                    {isEditMode && (
                                      <Button
                                        variant="text"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => {
                                          // Handle document removal
                                          setFieldValue('qidDocument', null);
                                        }}
                                        sx={{ textTransform: 'none' }}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    No QID document uploaded
                                  </Typography>
                                )}
                              </Box>
                            </Card>
                          </Grid>
                          
                          {/* Document Upload Section */}
                          {isEditMode && (
                            <Grid item xs={12}>
                              <Card 
                                sx={{ 
                                  p: 4, 
                                  boxShadow: 3,
                                  borderRadius: 3,
                                  backgroundColor: '#ffffff'
                                }}
                              >
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                  Upload Documents
                                </Typography>
                                <Divider sx={{ mb: 3 }} />
                                
                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={6}>
                                    <Dropzone
                                      onDrop={async (acceptedFiles) => {
                                        if (acceptedFiles.length > 0) {
                                          const file = acceptedFiles[0];
                                          try {
                                            const docRef = ref(storage, `documents/${detailsModalEmployee.id}/passport/${file.name}`);
                                            await uploadBytes(docRef, file);
                                            const documentUrl = await getDownloadURL(docRef);
                                            
                                            // Update employee passport document in database
                                            if (isFirebaseConfigured) {
                                              const updatedPassport = {
                                                ...detailsModalEmployee.passport,
                                                documentUrl
                                              };
                                              await updateDoc(doc(db, 'employees', detailsModalEmployee.id), { 
                                                passport: updatedPassport 
                                              });
                                            }
                                            
                                            // Update local state
                                            setDetailsModalEmployee(prev => ({
                                              ...prev,
                                              passport: {
                                                ...prev.passport,
                                                documentUrl
                                              }
                                            }));
                                            
                                            toast.success('Passport document uploaded successfully');
                                          } catch (error) {
                                            console.error('Document upload error:', error);
                                            toast.error('Failed to upload passport document');
                                          }
                                        }
                                      }}
                                      accept={{ 
                                        'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
                                        'application/pdf': ['.pdf']
                                      }}
                                      maxFiles={1}
                                      maxSize={10485760} // 10MB
                                    >
                                      {({ getRootProps, getInputProps, isDragActive }) => (
                                        <Box 
                                          {...getRootProps()} 
                                          sx={{ 
                                            textAlign: 'center', 
                                            p: 3, 
                                            border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`, 
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                              borderColor: theme.palette.primary.main,
                                              backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                            }
                                          }}
                                        >
                                          <input {...getInputProps()} />
                                          <UploadIcon sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'text.secondary', mb: 2 }} />
                                          <Typography variant="h6" gutterBottom>
                                            Passport Document
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {isDragActive ? 'Drop passport document here' : 'Upload passport copy (PDF, JPG, PNG)'}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Max 10MB • PDF or Images
                                          </Typography>
                                        </Box>
                                      )}
                                    </Dropzone>
                                  </Grid>
                                  
                                  <Grid item xs={12} md={6}>
                                    <Dropzone
                                      onDrop={async (acceptedFiles) => {
                                        if (acceptedFiles.length > 0) {
                                          const file = acceptedFiles[0];
                                          try {
                                            const docRef = ref(storage, `documents/${detailsModalEmployee.id}/qid/${file.name}`);
                                            await uploadBytes(docRef, file);
                                            const documentUrl = await getDownloadURL(docRef);
                                            
                                            // Update employee QID document in database
                                            if (isFirebaseConfigured) {
                                              const updatedQid = {
                                                ...detailsModalEmployee.qid,
                                                documentUrl
                                              };
                                              await updateDoc(doc(db, 'employees', detailsModalEmployee.id), { 
                                                qid: updatedQid 
                                              });
                                            }
                                            
                                            // Update local state
                                            setDetailsModalEmployee(prev => ({
                                              ...prev,
                                              qid: {
                                                ...prev.qid,
                                                documentUrl
                                              }
                                            }));
                                            
                                            toast.success('QID document uploaded successfully');
                                          } catch (error) {
                                            console.error('Document upload error:', error);
                                            toast.error('Failed to upload QID document');
                                          }
                                        }
                                      }}
                                      accept={{ 
                                        'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
                                        'application/pdf': ['.pdf']
                                      }}
                                      maxFiles={1}
                                      maxSize={10485760} // 10MB
                                    >
                                      {({ getRootProps, getInputProps, isDragActive }) => (
                                        <Box 
                                          {...getRootProps()} 
                                          sx={{ 
                                            textAlign: 'center', 
                                            p: 3, 
                                            border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`, 
                                            borderRadius: 2,
                                            cursor: 'pointer',
                                            backgroundColor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                              borderColor: theme.palette.primary.main,
                                              backgroundColor: alpha(theme.palette.primary.main, 0.02)
                                            }
                                          }}
                                        >
                                          <input {...getInputProps()} />
                                          <UploadIcon sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'text.secondary', mb: 2 }} />
                                          <Typography variant="h6" gutterBottom>
                                            QID Document
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {isDragActive ? 'Drop QID document here' : 'Upload QID copy (PDF, JPG, PNG)'}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            Max 10MB • PDF or Images
                                          </Typography>
                                        </Box>
                                      )}
                                    </Dropzone>
                                  </Grid>
                                </Grid>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </TabPanel>

                      {/* Payroll Tab - Enhanced with Inline Editing */}
                      <TabPanel value={modalTabValue} index={2}>
                        <Grid container spacing={4}>
                          
                          {/* Salary Information */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                Salary Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Monthly Salary
                                </Typography>
                                {isEditMode ? (
                                  <Field name="salary">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        type="number"
                                        label="Monthly Salary"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        InputProps={{
                                          endAdornment: <InputAdornment position="end">QAR</InputAdornment>
                                        }}
                                        sx={{ mt: 1 }}
                                      />
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={700} color="success.main" sx={{ fontSize: '1.5rem' }}>
                                    {detailsModalEmployee?.salary?.toLocaleString() || 0} QAR
                                  </Typography>
                                )}
                              </Box>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Annual Salary
                                </Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                                  {((detailsModalEmployee?.salary || 0) * 12).toLocaleString()} QAR
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Last Payment Date
                                </Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                  {formatDate(detailsModalEmployee?.lastPaymentDate) || 'Not available'}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Payment Status
                                </Typography>
                                <Chip
                                  label={detailsModalEmployee?.paymentStatus || 'Active'}
                                  color={detailsModalEmployee?.paymentStatus === 'Overdue' ? 'error' : 'success'}
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </Box>
                            </Card>
                          </Grid>
                          
                          {/* Payroll History & Actions */}
                          <Grid item xs={12} md={6}>
                            <Card 
                              sx={{ 
                                p: 4, 
                                boxShadow: 3,
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff'
                              }}
                            >
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3, color: 'primary.main' }}>
                                Payroll Actions
                              </Typography>
                              <Divider sx={{ mb: 3 }} />
                              
                              <Stack spacing={2}>
                                <Button
                                  variant="contained"
                                  startIcon={<PaymentIcon />}
                                  sx={{ 
                                    borderRadius: 2, 
                                    textTransform: 'none',
                                    py: 1.5,
                                    fontWeight: 500
                                  }}
                                  onClick={() => {
                                    // Handle salary payment
                                    console.log('Process salary payment for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Process Salary Payment
                                </Button>
                                
                                <Button
                                  variant="outlined"
                                  startIcon={<ReceiptIcon />}
                                  sx={{ 
                                    borderRadius: 2, 
                                    textTransform: 'none',
                                    py: 1.5,
                                    fontWeight: 500
                                  }}
                                  onClick={() => {
                                    // Handle generate payslip
                                    console.log('Generate payslip for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Generate Payslip
                                </Button>
                                
                                <Button
                                  variant="outlined"
                                  startIcon={<HistoryIcon />}
                                  sx={{ 
                                    borderRadius: 2, 
                                    textTransform: 'none',
                                    py: 1.5,
                                    fontWeight: 500
                                  }}
                                  onClick={() => {
                                    // Handle view payment history
                                    console.log('View payment history for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  View Payment History
                                </Button>
                                
                                <Button
                                  variant="outlined"
                                  startIcon={<AccountBalanceIcon />}
                                  sx={{ 
                                    borderRadius: 2, 
                                    textTransform: 'none',
                                    py: 1.5,
                                    fontWeight: 500
                                  }}
                                  onClick={() => {
                                    // Handle salary adjustment
                                    console.log('Adjust salary for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Salary Adjustment
                                </Button>
                              </Stack>
                              
                              {/* Payroll Summary */}
                              <Box sx={{ mt: 4, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Payroll Summary
                                </Typography>
                                <Grid container spacing={1}>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">This Month</Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                      {detailsModalEmployee?.salary?.toLocaleString() || 0} QAR
                                    </Typography>
                                  </Grid>
                                  <Grid item xs={6}>
                                    <Typography variant="body2" color="text.secondary">YTD Total</Typography>
                                    <Typography variant="body1" fontWeight={600}>
                                      {((detailsModalEmployee?.salary || 0) * (new Date().getMonth() + 1)).toLocaleString()} QAR
                                    </Typography>
                                  </Grid>
                                </Grid>
                              </Box>
                            </Card>
                          </Grid>
                        </Grid>
                      </TabPanel>
                    </Container>
                  </Box>
                </Form>
              )}
            </Formik>
          )}
        </DialogContent>

        {/* Streamlined Action Buttons - Only Close */}
        <DialogActions 
          sx={{ 
            p: 3,
            backgroundColor: '#ffffff',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            gap: 1,
            justifyContent: 'flex-end'
          }}
        >
          <Button 
            onClick={() => {
              setDetailsModalEmployee(null);
              setEmployeeDetailsLoading(false);
              setEmployeeDetailsError(null);
              setModalTabValue(0);
              setRetryCount(0);
              setIsEditMode(false); // Reset edit mode
            }}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 500,
              textTransform: 'none',
              borderColor: theme.palette.divider,
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'error.main',
                color: 'error.main'
              }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
