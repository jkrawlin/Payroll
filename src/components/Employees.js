import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase';
import { mockEmployees, mockFirebaseAPI } from '../services/mockData';
import { useDropzone } from 'react-dropzone';
import Dropzone from 'react-dropzone';
import { useFormik } from 'formik';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery,
  CircularProgress,
  Backdrop,
  Fab,
  AppBar,
  Toolbar,
  Slide,
  Container,
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
  Badge as BadgeIcon,
  FlightTakeoff as FlightTakeoffIcon,
  Payments as PaymentsIcon,
  ContactMail as ContactMailIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { DataGrid } from '@mui/x-data-grid';

// Transition component for modal slide animation
const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  
  // Employee Details Modal States
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Comprehensive employee details modal state
  const [detailsModalEmployee, setDetailsModalEmployee] = useState(null);
  const [openEmployeeDetails, setOpenEmployeeDetails] = useState(false);
  const [employeeDetailsLoading, setEmployeeDetailsLoading] = useState(false);
  const [modalTabValue, setModalTabValue] = useState(0);

  // Helper functions for calculations and formatting
  const calculateDaysPaid = (employee) => {
    if (!employee?.totalPaid || !employee?.salary) return 0;
    const dailyRate = employee.salary / 30; // Assume 30-day month
    return Math.floor(employee.totalPaid / dailyRate);
  };

  const calculateRemainingDays = (employee) => {
    if (!employee?.salary || !employee?.totalPaid) return 0;
    const daysPaid = calculateDaysPaid(employee);
    return Math.max(0, 30 - daysPaid); // 30 days in a month minus days already paid
  };

  // Helper function to calculate days until document expiry
  const calculateDaysToExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    try {
      const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return null;
    }
  };

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
        if (selectedEmployee?.id === photoUploadEmployee.id) {
          setSelectedEmployee({ ...selectedEmployee, photoUrl });
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

  // Handler for clicking employee names to open comprehensive details modal
  const handleNameClick = async (employee) => {
    // Prevent multiple concurrent requests
    if (employeeDetailsLoading) return;
    
    // Immediately open modal with basic data for instant feedback
    setDetailsModalEmployee(employee);
    setOpenEmployeeDetails(true);
    setModalTabValue(0); // Reset to first tab
    setEmployeeDetailsLoading(true);
    
    try {
      let comprehensiveEmployeeData = { ...employee };
      
      if (isFirebaseConfigured) {
        // Fetch all data in parallel for better performance
        const promises = [];
        
        // Main employee document
        promises.push(getDoc(doc(db, 'employees', employee.id)));
        
        // Advances subcollection
        promises.push(
          getDocs(collection(db, 'employees', employee.id, 'advances'))
            .catch(() => null) // Handle missing collection gracefully
        );
        
        // Transactions subcollection  
        promises.push(
          getDocs(collection(db, 'employees', employee.id, 'transactions'))
            .catch(() => null) // Handle missing collection gracefully
        );

        // Execute all Firebase calls in parallel
        const [employeeDoc, advancesSnapshot, transactionsSnapshot] = await Promise.all(promises);
        
        // Process employee document
        if (employeeDoc && employeeDoc.exists()) {
          comprehensiveEmployeeData = { ...employeeDoc.data(), id: employee.id };
        }

        // Process advances
        comprehensiveEmployeeData.advances = advancesSnapshot?.docs?.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) || [];

        // Process transactions
        comprehensiveEmployeeData.transactions = transactionsSnapshot?.docs?.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => new Date(b.date) - new Date(a.date)) || []; // Sort by date, newest first
        
      } else {
        // Use mock data with additional details (simulate network delay)
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading for consistent UX
        
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
      }
      
      // Update modal with comprehensive data
      setDetailsModalEmployee(comprehensiveEmployeeData);
    } catch (error) {
      console.error('Error fetching comprehensive employee data:', error);
      toast.error('Failed to load employee details');
      // Keep the basic employee data that's already shown
    } finally {
      setEmployeeDetailsLoading(false);
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

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // TabPanel Component
  const TabPanel = ({ children, value, index }) => {
    return (
      <Box role="tabpanel" hidden={value !== index} sx={{ pt: 3 }}>
        {value === index && children}
      </Box>
    );
  };

  // Enhanced employee row click handler
  const handleRowClick = async (employee) => {
    setSelectedEmployee(employee);
    setOpenDetailsModal(true);
    setTabValue(0); // Reset to first tab
    
    // Fetch additional details if using Firebase
    if (isFirebaseConfigured() && employee.id) {
      setDetailsLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'employees', employee.id));
        if (docSnap.exists()) {
          const fullData = { id: employee.id, ...docSnap.data() };
          setSelectedEmployee(fullData);
        }
      } catch (error) {
        console.error('Error fetching employee details:', error);
      } finally {
        setDetailsLoading(false);
      }
    }
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

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setShowForm(true);
    formik.setValues({
      name: employee.name || '',
      passportNumber: employee.passport?.number || '',
      passportExpiry: employee.passport?.expiry || '',
      qidNumber: employee.qid?.number || '',
      qidExpiry: employee.qid?.expiry || '',
      salary: employee.salary || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      passportPhoto: null,
      qidPhoto: null
    });
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, md: 4 }, 
            mb: 4, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white'
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={3}>
            <Box>
              <Typography variant="h3" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                Employee Management
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
                Manage employee information, documents, and records
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              sx={{
                bgcolor: alpha('#fff', 0.2),
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.3)
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                minWidth: { xs: '100%', sm: 'auto' }
              }}
            >
              Add Employee
            </Button>
          </Box>
        </Paper>
      </motion.div>

      <Grid container spacing={3}>
        {/* Search and Filters */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                <TextField
                  fullWidth
                  placeholder="Search employees by name, department, QID, or passport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: alpha(theme.palette.background.paper, 0.5)
                    }
                  }}
                />
                
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
                  {filteredEmployees.length} of {employees.length} employees found
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Enhanced Employees DataGrid */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={2} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h5" fontWeight={600} color="text.primary" gutterBottom sx={{ mb: 3 }}>
                  Employee Directory
                </Typography>

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
                        minHeight: 72,  // Increased from default ~52px for better spacing
                        cursor: 'pointer',
                        borderRadius: 1,
                        mb: 0.5,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          transform: 'translateY(-1px)',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.1)}`,
                        },
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: 'none',  // Remove cell borders in favor of row borders
                        py: 2,  // 16px vertical padding for breathing room
                        px: 2,  // 16px horizontal padding
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.primary.main,
                        fontWeight: 600,
                        fontSize: '1rem',
                        color: 'common.white',
                        borderBottom: 'none',
                        borderRadius: '8px 8px 0 0',
                        minHeight: 56,  // Taller headers for proportion
                        '& .MuiDataGrid-columnHeader': {
                          color: 'common.white',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          color: 'common.white',
                          fontWeight: 600,
                        }
                      },
                      backgroundColor: 'background.paper',
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                      '& .MuiDataGrid-footerContainer': {
                        backgroundColor: alpha(theme.palette.grey[50], 0.5),
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                        minHeight: 56
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        backgroundColor: 'background.paper'
                      },
                      '& .MuiDataGrid-selectedRowCount': {
                        fontWeight: 600,
                        color: theme.palette.primary.main
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
          </motion.div>
        </Grid>
      </Grid>

      {/* Comprehensive Employee Details Modal */}
      <Dialog
        open={openDetailsModal}
        onClose={() => setOpenDetailsModal(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            borderRadius: isMobile ? 0 : 3,
            minHeight: isMobile ? '100vh' : '600px'
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar
                src={selectedEmployee?.photoUrl}
                sx={{
                  width: 50,
                  height: 50,
                  mr: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main
                }}
              >
                <PersonIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {selectedEmployee?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedEmployee?.position} • {selectedEmployee?.department}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setOpenDetailsModal(false)}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Loading Backdrop */}
          <Backdrop 
            open={detailsLoading} 
            sx={{ 
              position: 'absolute', 
              zIndex: 1, 
              backgroundColor: alpha(theme.palette.background.paper, 0.8) 
            }}
          >
            <CircularProgress />
          </Backdrop>

          {/* Tabs Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant={isMobile ? "scrollable" : "centered"}
              scrollButtons={isMobile ? "auto" : false}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 120,
                  fontSize: '1rem',
                  py: 2
                }
              }}
            >
              <Tab label="Personal Details" />
              <Tab label="Documents" />
              <Tab label="Payroll History" />
            </Tabs>
          </Box>

          {/* Tab Panels */}
          <Box sx={{ p: 3 }}>
            {/* Personal Details Tab */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                    <Avatar
                      src={selectedEmployee?.photoUrl}
                      sx={{
                        width: 100,
                        height: 100,
                        mx: 'auto',
                        mb: 3,
                        bgcolor: theme.palette.primary.main,
                        color: 'white',
                        fontSize: '2.5rem',
                        fontWeight: 600
                      }}
                    >
                      {selectedEmployee?.name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                      {selectedEmployee?.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {selectedEmployee?.position}
                    </Typography>
                    <Chip
                      label={`ID: ${selectedEmployee?.id || 'N/A'}`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 500 }}
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Paper elevation={1} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mb: 3 }}>
                      Employment Information
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Join Date
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {formatDate(selectedEmployee?.joinDate || selectedEmployee?.createdAt)}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Department
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {selectedEmployee?.department}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Position
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {selectedEmployee?.position}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Monthly Salary
                          </Typography>
                          <Typography variant="body1" fontWeight={700} color="success.main" sx={{ fontSize: '1.2rem' }}>
                            {selectedEmployee?.salary?.toLocaleString() || 0} QAR
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Email Address
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {selectedEmployee?.email || 'Not provided'}
                          </Typography>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Phone Number
                          </Typography>
                          <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                            {selectedEmployee?.phone || 'Not provided'}
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Documents Tab */}
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom color="primary.main">
                      Qatar ID (QID)
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {selectedEmployee?.qid?.photoUrl && (
                      <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <img
                          src={selectedEmployee.qid.photoUrl}
                          alt="Qatar ID"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: 8,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                          }}
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">QID Number</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedEmployee?.qid?.number || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDate(selectedEmployee?.qid?.expiry)}
                        </Typography>
                        {selectedEmployee?.qid?.expiry && (
                          <Chip
                            label={checkExpiry(selectedEmployee.qid.expiry, 'QID').message}
                            color={checkExpiry(selectedEmployee.qid.expiry, 'QID').color}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom color="secondary.main">
                      Passport
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {selectedEmployee?.passport?.photoUrl && (
                      <Box sx={{ mb: 2, textAlign: 'center' }}>
                        <img
                          src={selectedEmployee.passport.photoUrl}
                          alt="Passport"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            borderRadius: 8,
                            border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                          }}
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Passport Number</Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {selectedEmployee?.passport?.number || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Expiry Date</Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body1" fontWeight={600}>
                          {formatDate(selectedEmployee?.passport?.expiry)}
                        </Typography>
                        {selectedEmployee?.passport?.expiry && (
                          <Chip
                            label={checkExpiry(selectedEmployee.passport.expiry, 'Passport').message}
                            color={checkExpiry(selectedEmployee.passport.expiry, 'Passport').color}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Payroll History Tab */}
            <TabPanel value={tabValue} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom color="success.main">
                      Salary Overview
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Base Monthly Salary
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="success.main">
                        {selectedEmployee?.salary?.toLocaleString() || 0} QAR
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Total Amount Paid
                      </Typography>
                      <Typography variant="h5" fontWeight={700} color="primary.main">
                        {(selectedEmployee?.totalPaid || 0).toLocaleString()} QAR
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Equivalent Days Paid
                      </Typography>
                      <Typography variant="h6" fontWeight={600}>
                        {calculateDaysPaid(selectedEmployee)} days
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Outstanding Advances
                      </Typography>
                      <Typography variant="h6" fontWeight={600} color="warning.main">
                        {selectedEmployee?.advances?.length || 0} advance(s)
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>
                      Recent Transactions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    {selectedEmployee?.transactions && selectedEmployee.transactions.length > 0 ? (
                      <List>
                        {selectedEmployee.transactions.slice(0, 5).map((transaction, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {transaction.type || 'Payment'}
                                  </Typography>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={700}
                                    color={transaction.type === 'advance' ? 'warning.main' : 'success.main'}
                                  >
                                    {transaction.amount?.toLocaleString()} QAR
                                  </Typography>
                                </Box>
                              }
                              secondary={
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(transaction.date)} • {transaction.description || 'Monthly salary payment'}
                                </Typography>
                              }
                            />
                            {index < selectedEmployee.transactions.slice(0, 5).length - 1 && <Divider />}
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No transaction history available
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Button 
            onClick={() => setOpenDetailsModal(false)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setOpenDetailsModal(false);
              handleEdit(selectedEmployee);
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
          >
            Edit Employee
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Comprehensive Employee Details Modal - Fully Overhauled */}
      <Dialog
        open={Boolean(detailsModalEmployee)}
        onClose={() => {
          setDetailsModalEmployee(null);
          setOpenEmployeeDetails(false);
          setEmployeeDetailsLoading(false);
          setModalTabValue(0);
        }}
        TransitionComponent={Transition}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            opacity: 1, // Force full opacity
            borderRadius: isMobile ? 0 : 3,
            boxShadow: 24,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            minHeight: isMobile ? '100vh' : '80vh',
            maxHeight: isMobile ? '100vh' : '90vh',
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: alpha(theme.palette.common.black, 0.8),
            backdropFilter: 'blur(4px)',
          }
        }}
        aria-labelledby="employee-details-title"
        aria-describedby="employee-details-content"
      >
        {/* Professional Header with AppBar - Solid Background */}
        <AppBar 
          position="static" 
          color="primary" 
          elevation={0}
          sx={{ 
            borderRadius: isMobile ? 0 : '12px 12px 0 0',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          <Toolbar sx={{ py: 2 }}>
            <Avatar
              src={detailsModalEmployee?.photoURL}
              alt={detailsModalEmployee?.name}
              sx={{
                width: 56,
                height: 56,
                mr: 3,
                border: '3px solid rgba(255,255,255,0.2)',
                fontSize: '1.5rem',
                fontWeight: 700,
                backgroundColor: alpha(theme.palette.common.white, 0.1)
              }}
            >
              {detailsModalEmployee?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box flexGrow={1}>
              <Typography 
                variant="h4" 
                color="white" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {detailsModalEmployee?.name}
              </Typography>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 500
                }}
              >
                {detailsModalEmployee?.position} • {detailsModalEmployee?.department}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setDetailsModalEmployee(null);
                setOpenEmployeeDetails(false);
                setEmployeeDetailsLoading(false);
                setModalTabValue(0);
              }}
              sx={{
                color: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  color: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
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
            backgroundColor: 'background.paper', // Solid opaque background
            color: 'text.primary',
            overflowY: 'auto'
          }}
        >
          {employeeDetailsLoading ? (
            <Box 
              display="flex" 
              flexDirection="column"
              justifyContent="center" 
              alignItems="center" 
              py={8}
              gap={2}
            >
              <CircularProgress size={48} thickness={4} />
              <Typography variant="h6" color="text.secondary">
                Loading employee details...
              </Typography>
            </Box>
          ) : (
            <Box>
              {/* Navigation Tabs - Solid Background */}
              <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider', 
                backgroundColor: 'background.paper' // Solid background for tabs
              }}>
                <Tabs 
                  value={modalTabValue} 
                  onChange={(e, newValue) => setModalTabValue(newValue)}
                  variant="fullWidth"
                  textColor="primary"
                  indicatorColor="primary"
                  sx={{
                    backgroundColor: 'background.paper', // Ensure solid background
                    '& .MuiTab-root': {
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      py: 3,
                    }
                  }}
                >
                  <Tab label="Personal Information" {...a11yProps(0)} />
                  <Tab label="Official Documents" {...a11yProps(1)} />
                  <Tab label="Payroll & Financial" {...a11yProps(2)} />
                </Tabs>
              </Box>

              {/* Tab Content - All with solid backgrounds */}
              <Container maxWidth="lg" sx={{ 
                px: { xs: 2, sm: 3 },
                backgroundColor: 'background.paper' // Solid background for content
              }}>
                {/* Personal Information Tab */}
                <TabPanel value={modalTabValue} index={0}>
                  <Grid container spacing={4}>
                    {/* Employee Photo Section */}
                    <Grid item xs={12} md={4}>
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          backgroundColor: 'background.paper', // Solid background
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                        }}
                      >
                        <Avatar
                          src={detailsModalEmployee?.photoURL}
                          alt={detailsModalEmployee?.name}
                          sx={{
                            width: 120,
                            height: 120,
                            mx: 'auto',
                            mb: 2,
                            fontSize: '2rem',
                            fontWeight: 700,
                            boxShadow: 4
                          }}
                        >
                          {detailsModalEmployee?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {detailsModalEmployee?.name}
                        </Typography>
                        <Chip 
                          label={`Employee ID: ${detailsModalEmployee?.id || 'N/A'}`}
                          color="primary"
                          variant="outlined"
                          size="small"
                        />
                      </Paper>
                    </Grid>

                    {/* Basic Information Section */}
                    <Grid item xs={12} md={8}>
                      <Typography 
                        variant="h5" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 600,
                          color: 'primary.main',
                          mb: 3
                        }}
                      >
                        Basic Information
                      </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                            borderLeft: `4px solid ${theme.palette.info.main}`
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Department
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {detailsModalEmployee?.department || 'Not assigned'}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                            borderLeft: `4px solid ${theme.palette.secondary.main}`
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Position
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {detailsModalEmployee?.position || 'Not specified'}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                            borderLeft: `4px solid ${theme.palette.success.main}`
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Join Date
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              {formatDate(detailsModalEmployee?.joinDate)}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                            borderLeft: `4px solid ${theme.palette.warning.main}`
                          }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                              Monthly Salary
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                              QAR {detailsModalEmployee?.salary?.toLocaleString() || 'Not set'}
                            </Typography>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                            Contact Information
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                          }}>
                            <EmailIcon color="primary" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Email Address
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {detailsModalEmployee?.email || 'Not provided'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                          <Paper sx={{ 
                            p: 2.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                          }}>
                            <PhoneIcon color="primary" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Phone Number
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {detailsModalEmployee?.phone || 'Not provided'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>

                        <Grid item xs={12}>
                          <Paper sx={{ 
                            p: 2.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2,
                            backgroundColor: 'background.paper',
                            border: `1px solid ${alpha(theme.palette.divider, 0.3)}`
                          }}>
                            <BusinessIcon color="primary" />
                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                Address
                              </Typography>
                              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                {detailsModalEmployee?.address || 'Not provided'}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Official Documents Tab */}
                <TabPanel value={modalTabValue} index={1}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      mb: 3
                    }}
                  >
                    Official Documents & Status
                  </Typography>
                  
                  <Grid container spacing={4}>
                    {/* Qatar ID Section */}
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 3,
                          backgroundColor: 'background.paper',
                          border: `2px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.warning.main, 0.1)
                          }}>
                            <BadgeIcon sx={{ color: 'warning.main', fontSize: 28 }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Qatar ID Information
                          </Typography>
                        </Box>
                        
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                            QID Number
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace', mb: 2 }}>
                            {detailsModalEmployee?.qidNumber || 'Not provided'}
                          </Typography>
                        </Box>
                        
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Expiry Date
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                            {formatDate(detailsModalEmployee?.qidExpiry)}
                          </Typography>
                        </Box>

                        {detailsModalEmployee?.qidExpiry && (
                          <Box>
                            {(() => {
                              const daysToExpiry = calculateDaysToExpiry(detailsModalEmployee.qidExpiry);
                              if (daysToExpiry === null) return null;
                              
                              let chipColor = 'success';
                              let chipLabel = 'Valid';
                              
                              if (daysToExpiry < 0) {
                                chipColor = 'error';
                                chipLabel = `Expired ${Math.abs(daysToExpiry)} days ago`;
                              } else if (daysToExpiry < 30) {
                                chipColor = 'warning';
                                chipLabel = `Expires in ${daysToExpiry} days`;
                              } else {
                                chipLabel = `Valid (${daysToExpiry} days remaining)`;
                              }

                              return (
                                <Chip 
                                  label={chipLabel}
                                  color={chipColor}
                                  sx={{ fontWeight: 600 }}
                                />
                              );
                            })()}
                          </Box>
                        )}

                        {detailsModalEmployee?.qid?.photoUrl && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Document Copy
                            </Typography>
                            <img 
                              src={detailsModalEmployee.qid.photoUrl} 
                              alt="Qatar ID Copy" 
                              style={{ 
                                maxWidth: '100%', 
                                height: 'auto', 
                                borderRadius: 8, 
                                cursor: 'pointer',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                border: `1px solid ${theme.palette.divider}`
                              }} 
                              onClick={() => window.open(detailsModalEmployee.qid.photoUrl, '_blank')}
                            />
                          </Box>
                        )}
                      </Paper>
                    </Grid>

                    {/* Passport Section */}
                    <Grid item xs={12} md={6}>
                      <Paper 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          backgroundColor: 'background.paper',
                          border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2} mb={3}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.info.main, 0.1)
                          }}>
                            <FlightTakeoffIcon sx={{ color: 'info.main', fontSize: 28 }} />
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Passport Information
                          </Typography>
                        </Box>
                        
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Passport Number
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontFamily: 'monospace', mb: 2 }}>
                            {detailsModalEmployee?.passportNumber || 'Not provided'}
                          </Typography>
                        </Box>
                        
                        <Box mb={2}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                            Expiry Date
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                            {formatDate(detailsModalEmployee?.passportExpiry)}
                          </Typography>
                        </Box>

                        {detailsModalEmployee?.passportExpiry && (
                          <Box>
                            {(() => {
                              const daysToExpiry = calculateDaysToExpiry(detailsModalEmployee.passportExpiry);
                              if (daysToExpiry === null) return null;
                              
                              let chipColor = 'success';
                              let chipLabel = 'Valid';
                              
                              if (daysToExpiry < 0) {
                                chipColor = 'error';
                                chipLabel = `Expired ${Math.abs(daysToExpiry)} days ago`;
                              } else if (daysToExpiry < 90) {
                                chipColor = 'warning';
                                chipLabel = `Expires in ${daysToExpiry} days`;
                              } else {
                                chipLabel = `Valid (${daysToExpiry} days remaining)`;
                              }

                              return (
                                <Chip 
                                  label={chipLabel}
                                  color={chipColor}
                                  sx={{ fontWeight: 600 }}
                                />
                              );
                            })()}
                          </Box>
                        )}

                        {detailsModalEmployee?.passport?.photoUrl && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Document Copy
                            </Typography>
                            <img 
                              src={detailsModalEmployee.passport.photoUrl} 
                              alt="Passport Copy" 
                              style={{ 
                                maxWidth: '100%', 
                                height: 'auto', 
                                borderRadius: 8, 
                                cursor: 'pointer',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                                border: `1px solid ${theme.palette.divider}`
                              }} 
                              onClick={() => window.open(detailsModalEmployee.passport.photoUrl, '_blank')}
                            />
                          </Box>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>

                {/* Payroll & Financial Tab */}
                <TabPanel value={modalTabValue} index={2}>
                  <Typography 
                    variant="h5" 
                    gutterBottom 
                    sx={{ 
                      fontWeight: 600,
                      color: 'primary.main',
                      mb: 3
                    }}
                  >
                    Payroll & Financial Summary
                  </Typography>
                  
                  {/* Financial Overview Cards - Solid Backgrounds */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          backgroundColor: 'background.paper',
                          border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`
                        }}
                      >
                        <PaymentsIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          color: 'success.main',
                          mb: 1
                        }}>
                          QAR {detailsModalEmployee?.salary?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Monthly Salary
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          backgroundColor: 'background.paper',
                          border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <MoneyIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          color: 'primary.main',
                          mb: 1
                        }}>
                          QAR {detailsModalEmployee?.totalPaid?.toLocaleString() || '0'}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Total Paid
                        </Typography>
                      </Card>
                    </Grid>

                    <Grid item xs={12} sm={4}>
                      <Card 
                        elevation={3}
                        sx={{ 
                          p: 3, 
                          textAlign: 'center',
                          backgroundColor: 'background.paper',
                          border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`
                        }}
                      >
                        <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                        <Typography variant="h4" sx={{ 
                          fontWeight: 700, 
                          color: 'warning.main',
                          mb: 1
                        }}>
                          {detailsModalEmployee ? calculateRemainingDays(detailsModalEmployee) : 0}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Days Remaining
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Advances Section - Solid Background */}
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 3, 
                      mb: 3,
                      backgroundColor: 'background.paper',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <MoneyIcon color="warning" />
                      Advances ({detailsModalEmployee?.advances?.filter(a => !a.repaid).length || 0} outstanding)
                    </Typography>
                    
                    {detailsModalEmployee?.advances && detailsModalEmployee.advances.length > 0 ? (
                      <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {detailsModalEmployee.advances.map((advance, index) => (
                          <ListItem key={index} divider={index < detailsModalEmployee.advances.length - 1}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography sx={{ fontWeight: 600 }}>
                                    QAR {advance.amount?.toLocaleString()}
                                  </Typography>
                                  <Chip 
                                    label={advance.repaid ? 'Repaid' : 'Outstanding'} 
                                    color={advance.repaid ? 'success' : 'warning'}
                                    size="small"
                                  />
                                </Box>
                              }
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    Date: {formatDate(advance.date)}
                                  </Typography>
                                  {advance.reason && (
                                    <Typography variant="body2" color="text.secondary">
                                      Reason: {advance.reason}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No advances recorded
                      </Typography>
                    )}
                  </Paper>

                  {/* Recent Transactions Section - Solid Background */}
                  <Paper 
                    elevation={2} 
                    sx={{ 
                      p: 3,
                      backgroundColor: 'background.paper',
                      border: `1px solid ${alpha(theme.palette.divider, 0.2)}`
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <PaymentsIcon color="primary" />
                      Recent Transactions (Last 5)
                    </Typography>
                    
                    {detailsModalEmployee?.transactions && detailsModalEmployee.transactions.length > 0 ? (
                      <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                        {detailsModalEmployee.transactions.slice(0, 5).map((transaction, index) => (
                          <ListItem key={index} divider={index < 4 && index < detailsModalEmployee.transactions.length - 1}>
                            <ListItemText
                              primary={
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  <Typography sx={{ fontWeight: 600 }}>
                                    {transaction.type}
                                  </Typography>
                                  <Typography 
                                    sx={{ 
                                      fontWeight: 600,
                                      color: transaction.amount > 0 ? 'success.main' : 'error.main'
                                    }}
                                  >
                                    {transaction.amount > 0 ? '+' : ''}QAR {transaction.amount?.toLocaleString()}
                                  </Typography>
                                </Box>
                              }
                              secondary={formatDate(transaction.date)}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                        No transactions recorded
                      </Typography>
                    )}
                  </Paper>
                </TabPanel>
              </Container>
            </Box>
          )}
        </DialogContent>

        {/* Action Buttons - Solid Background */}
        <DialogActions 
          sx={{ 
            p: 3,
            backgroundColor: 'background.paper', // Solid background
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            gap: 2
          }}
        >
          <Button 
            onClick={() => {
              setDetailsModalEmployee(null);
              setOpenEmployeeDetails(false);
              setEmployeeDetailsLoading(false);
              setModalTabValue(0);
            }}
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600
            }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 600,
              boxShadow: 4,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                boxShadow: 6,
                transform: 'translateY(-1px)'
              }
            }}
            onClick={() => {
              // Store current employee and close details modal, then open edit form
              const employeeToEdit = detailsModalEmployee;
              setDetailsModalEmployee(null);
              setOpenEmployeeDetails(false);
              setEmployeeDetailsLoading(false);
              setModalTabValue(0);
              setSelectedEmployee(employeeToEdit);
              setShowForm(true);
            }}
          >
            Edit Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
