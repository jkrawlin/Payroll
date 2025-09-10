import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured } from '../firebase';
import { mockEmployees } from '../services/mockData';
import { useDropzone } from 'react-dropzone';
import Dropzone from 'react-dropzone';
import { Formik, Form, Field, useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Legend
} from 'chart.js';
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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fab,
  Tooltip,
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
  Event as EventIcon,
  Star as StarIcon,
  Assessment as AssessmentIcon,
  Note as NoteIcon,
  Print as PrintIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  FilterList as FilterListIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  PersonAdd as PersonAddIcon,
  Renew as RenewIcon,
  UploadFile as UploadFileIcon,
  Visibility as VisibilityIcon,
  PictureAsPdf as PictureAsPdfIcon,
} from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';

// Define custom animations
const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`;

const spin = keyframes`
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
`;

// Register Chart.js components
ChartJS.register(ArcElement, Legend);

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

// Debounce utility function
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

const Employees = () => {
  // Premium Desktop Theme
  const theme = useTheme();
  
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // View mode state for responsive design
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  
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
    hrNotes: Yup.string(),
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

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Responsive view mode detection
  // Desktop-optimized initialization
  useEffect(() => {
    setViewMode('table'); // Always use table view for desktop
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

  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setShowForm(true);
    formik.setValues(employee);
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
        },
        hrNotes: values.hrNotes,
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
    employee.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    employee.qid?.number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    employee.passport?.number?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    employee.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Department distribution data for pie chart
  const departmentData = useMemo(() => {
    const deptCount = {};
    employees.forEach(employee => {
      const dept = employee.department || 'Unassigned';
      deptCount[dept] = (deptCount[dept] || 0) + 1;
    });
    return deptCount;
  }, [employees]);

  const handlePageChange = (event, newPage) => {
    setCurrentPage(newPage + 1); // Material-UI DataGrid uses 0-based indexing
  };

  const handlePageSizeChange = (newPageSize) => {
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
  };

  // Render employee card for mobile view
  const renderEmployeeCard = (employee) => {
    const qidStatusObj = checkExpiry(employee.qid?.expiry, 'QID');
    const passportStatusObj = checkExpiry(employee.passport?.expiry, 'Passport');

    const getOverallStatus = () => {
      if (qidStatusObj?.status === 'expired' || passportStatusObj?.status === 'expired') return 'critical';
      if (qidStatusObj?.status === 'critical' || passportStatusObj?.status === 'critical') return 'critical';
      if (qidStatusObj?.status === 'warning' || passportStatusObj?.status === 'warning') return 'warning';
      return 'good';
    };

    const status = getOverallStatus();

    return (
      <Card 
        key={employee.id} 
        className="employee-card"
        onClick={() => handleNameClick(employee)}
        sx={{ 
          mb: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box className="employee-card-header">
            <Avatar
              src={employee.photoUrl}
              className="employee-avatar"
              sx={{
                bgcolor: theme.palette.primary.main,
                color: 'white',
                width: 60,
                height: 60,
                mr: 2,
                fontSize: '1.2rem',
                fontWeight: 700,
                border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`
              }}
            >
              {employee.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                {employee.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.position} • {employee.department}
              </Typography>
            </Box>
            <Chip
              label={status === 'critical' ? 'Action Required' :
                     status === 'warning' ? 'Review Soon' : 'Active'}
              color={status === 'critical' ? 'error' :
                     status === 'warning' ? 'warning' : 'success'}
              size="small"
              variant="filled"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box className="employee-detail">
                <Typography variant="body2" color="text.secondary" className="employee-detail-label">
                  Email
                </Typography>
                <Typography variant="body2" fontWeight={500} className="employee-detail-value">
                  {employee.email || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box className="employee-detail">
                <Typography variant="body2" color="text.secondary" className="employee-detail-label">
                  Phone
                </Typography>
                <Typography variant="body2" fontWeight={500} className="employee-detail-value">
                  {employee.phone || 'N/A'}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box className="employee-detail">
                <Typography variant="body2" color="text.secondary" className="employee-detail-label">
                  Salary
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.main" className="employee-detail-value">
                  {employee.salary?.toLocaleString() || 0} QAR
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box className="employee-detail">
                <Typography variant="body2" color="text.secondary" className="employee-detail-label">
                  QID Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: qidStatusObj?.color === 'success' ? '#4caf50' :
                                   qidStatusObj?.color === 'warning' ? '#ff9800' :
                                   qidStatusObj?.color === 'error' ? '#f44336' : '#9e9e9e'
                  }} />
                  <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                    {qidStatusObj?.message || 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box className="employee-actions" sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="View employee details" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNameClick(employee);
                }}
                sx={{
                  color: 'primary.main',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <PersonIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete employee" arrow placement="top">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(employee.id, employee.name);
                }}
                sx={{
                  color: 'error.main',
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.15),
                    transform: 'scale(1.1)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <DeleteIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };

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
      p: 4 
    }}>
      {/* Premium Desktop Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 5, 
          mb: 4, 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          border: `1px solid ${alpha(theme.palette.primary.light, 0.2)}`
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h3" fontWeight={800} gutterBottom sx={{ 
              fontSize: '2.5rem',
              letterSpacing: '-0.02em',
              mb: 2
            }}>
              Employee Management
            </Typography>
            <Typography variant="h6" sx={{ 
              opacity: 0.9, 
              fontSize: '1.1rem',
              fontWeight: 400
            }}>
              Advanced employee directory with comprehensive management tools
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
              sx={{
                bgcolor: alpha('#fff', 0.2),
                color: 'white',
                '&:hover': {
                  bgcolor: alpha('#fff', 0.3),
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                border: `1px solid ${alpha('#fff', 0.3)}`
              }}
            >
              Add New Employee
            </Button>
          </Box>
        </Box>
      </Paper>
              px: 3,
              py: 1.5,
              minWidth: { xs: '100%', sm: 'auto' },
              boxShadow: 3,
              transition: 'all 0.3s ease'
            }}
          >
            Add New Employee
          </Button>
        </Box>
      </Paper>

      {/* Premium Desktop Dashboard Layout */}
      <Box sx={{ display: 'flex', gap: 4, mb: 4 }}>
        
        {/* Advanced Search & Filter Sidebar */}
        <Card elevation={0} sx={{
          width: 320,
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${theme.palette.background.paper} 100%)`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          position: 'sticky',
          top: 20,
          height: 'fit-content',
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'auto'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ 
              mb: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Advanced Search
            </Typography>
            
            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.background.default, 0.8),
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            {/* Department Filter */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                label="Department"
                sx={{
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.background.default, 0.3)
                }}
              >
                <MenuItem value="all">All Departments</MenuItem>
                <MenuItem value="HR">Human Resources</MenuItem>
                <MenuItem value="IT">Information Technology</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
                <MenuItem value="Operations">Operations</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </Select>
            </FormControl>

            {/* Quick Stats */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
                Quick Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                }}>
                  <Typography variant="h4" fontWeight={700} color="primary.main">
                    {filteredEmployees.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Employees
                  </Typography>
                </Box>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`
                }}>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {new Set(employees.map(emp => emp.department)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Departments
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Main Content Area */}
        <Box sx={{ flex: 1 }}>
          {/* Advanced Employee DataGrid */}
          <Card elevation={0} sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: 0 }}>
              {/* Table Header */}
              <Box sx={{ 
                p: 4, 
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`
              }}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h5" fontWeight={700} sx={{ 
                      mb: 1,
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}>
                      Employee Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Comprehensive employee management and oversight • {filteredEmployees.length} employees
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Chip 
                      label={`${filteredEmployees.length} Records`}
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Employee Content Area - Desktop Only */}
              <Box sx={{ height: 'calc(100vh - 400px)', minHeight: 600 }}>
                <DataGrid
                  rows={currentEmployees.map((emp, index) => ({
                    ...emp,
                    id: emp.id || `employee-${index}`,
                    qidStatusObj: checkExpiry(emp.qid?.expiry, 'QID'),
                    passportStatusObj: checkExpiry(emp.passport?.expiry, 'Passport')
                  }))}
                  columns={[
                    {
                      field: 'employee',
                      headerName: 'Employee',
                      width: 300,
                      renderCell: (params) => (
                        <Box
                          display="flex"
                          alignItems="center"
                          sx={{ py: 1.5, px: 1, height: '100%', width: '100%', cursor: 'pointer' }}
                          onClick={() => handleNameClick(params.row)}
                        >
                          <Avatar
                            src={params.row.photoUrl}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              mr: 3,
                              width: 48,
                              height: 48,
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.05)',
                                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            {params.row.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="h6"
                              fontWeight={600}
                              sx={{ 
                                mb: 0.5,
                                color: 'text.primary',
                                fontSize: '1rem',
                                '&:hover': {
                                  color: 'primary.main'
                                }
                              }}
                            >
                              {params.row.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                              {params.row.position}
                            </Typography>
                          </Box>
                        </Box>
                      ),
                    },
                    {
                      field: 'department',
                      headerName: 'Department',
                      width: 160,
                      renderCell: (params) => (
                        <Chip
                          label={params.row.department}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            fontWeight: 600,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.08)
                          }}
                        />
                      ),
                    },
                    {
                      field: 'position',
                      headerName: 'Position',
                      width: 180,
                      renderCell: (params) => (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {params.row.position}
                        </Typography>
                      ),
                    },
                    {
                      field: 'salary',
                      headerName: 'Salary',
                      width: 140,
                      renderCell: (params) => (
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 700 }}>
                          {params.row.salary?.toLocaleString()} QAR
                        </Typography>
                      ),
                    },
                    {
                      field: 'status',
                      headerName: 'Document Status',
                      width: 150,
                      renderCell: (params) => {
                        const qidStatus = params.row.qidStatusObj;
                        const passportStatus = params.row.passportStatusObj;
                        const criticalStatus = qidStatus.status === 'critical' || passportStatus.status === 'critical' || 
                                             qidStatus.status === 'expired' || passportStatus.status === 'expired';
                        return (
                          <Chip
                            label={criticalStatus ? 'Expires Soon' : 'Valid'}
                            size="small"
                            color={criticalStatus ? 'error' : 'success'}
                            variant="filled"
                            sx={{ 
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        );
                      },
                    },
                    {
                      field: 'actions',
                      headerName: 'Actions',
                      width: 120,
                      sortable: false,
                      renderCell: (params) => (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Edit Employee" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(params.row);
                              }}
                              sx={{
                                color: 'primary.main',
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <EditIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Employee" arrow>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(params.row.id, params.row.name);
                              }}
                              sx={{
                                color: 'error.main',
                                backgroundColor: alpha(theme.palette.error.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.15),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      ),
                    },
                  ]}
                  pageSize={itemsPerPage}
                  rowsPerPageOptions={[10, 15, 25, 50]}
                  onPageSizeChange={(newPageSize) => {
                    setItemsPerPage(newPageSize);
                  }}
                  disableSelectionOnClick
                  loading={loading}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-root': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-main': {
                      border: 'none',
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.04),
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      '& .MuiDataGrid-columnHeader': {
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: 'text.primary',
                      },
                    },
                    '& .MuiDataGrid-row': {
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'scale(1.002)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                    },
                    '& .MuiDataGrid-cell': {
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      padding: '8px 16px',
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                      backgroundColor: alpha(theme.palette.background.default, 0.5),
                    },
                  }}
                  componentsProps={{
                    pagination: {
                      sx: {
                        '& .MuiTablePagination-displayedRows, & .MuiTablePagination-selectLabel': {
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <PeopleIcon sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {employees.length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Total Workforce
                </Typography>
              </CardContent>
            </Card>

            {/* Active Employees Card */}
            <Card
              elevation={2}
              sx={{
                minWidth: 200,
                flex: 1,
                background: `linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)`,
                color: 'white',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 30px rgba(139, 0, 0, 0.3)',
                },
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {employees.filter(emp => {
                    const qidStatus = checkExpiry(emp.qid?.expiry, 'QID');
                    const passportStatus = checkExpiry(emp.passport?.expiry, 'Passport');
                    return qidStatus.status !== 'expired' && passportStatus.status !== 'expired';
                  }).length}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Active Employees
                </Typography>
              </CardContent>
            </Card>

            {/* Average Salary Card */}
            <Card
              elevation={2}
              sx={{
                minWidth: 200,
                flex: 1,
                background: `linear-gradient(135deg, #8B0000 0%, #A52A2A 100%)`,
                color: 'white',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 30px rgba(139, 0, 0, 0.3)',
                },
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <TrendingUpIcon sx={{ fontSize: '2.5rem', mb: 1, opacity: 0.9 }} />
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {employees.length > 0
                    ? Math.round(employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length).toLocaleString()
                    : 0
                  }
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  Average Salary (QAR)
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Grid>

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
                      backgroundColor: alpha(theme.palette.background.paper, 0.9),
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2
                      }
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'white',
                      boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2
                      }
                    },
                    transition: 'all 0.3s ease'
                  },
                  '& .MuiOutlinedInput-input': {
                    '&::placeholder': {
                      color: 'text.secondary',
                      opacity: 0.8
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm ? (
                    <InputAdornment position="end">
                      <Tooltip title="Clear search" arrow>
                        <IconButton
                          size="small"
                          onClick={() => setSearchTerm('')}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'primary.main',
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) : null
                }}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', fontWeight: 500 }}>
                <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon sx={{ fontSize: '1rem', color: 'primary.main' }} />
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length} employees
                  {debouncedSearchTerm && (
                    <Chip
                      label={`"${debouncedSearchTerm}"`}
                      size="small"
                      color="primary"
                      variant="outlined"
                      onDelete={() => setSearchTerm('')}
                      sx={{ 
                        ml: 1,
                        fontSize: '0.75rem',
                        height: 20,
                        '& .MuiChip-deleteIcon': {
                          fontSize: '0.75rem'
                        }
                      }}
                    />
                  )}
                </Box>
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Department Distribution Pie Chart */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={2}
            sx={{
              borderRadius: 3,
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              height: '100%',
              minHeight: 400,
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
              }
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PieChartIcon sx={{ color: '#8B0000', mr: 1.5, fontSize: '1.5rem' }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#8B0000' }}>
                  Department Distribution
                </Typography>
              </Box>

              <Box sx={{ height: 300, position: 'relative' }}>
                <Pie
                  data={{
                    labels: Object.keys(departmentData),
                    datasets: [{
                      data: Object.values(departmentData),
                      backgroundColor: [
                        '#8B0000', // Dark Red
                        '#A52A2A', // Brown
                        '#DC143C', // Crimson
                        '#B22222', // Fire Brick
                        '#CD5C5C', // Indian Red
                        '#F08080', // Light Coral
                      ],
                      borderColor: 'white',
                      borderWidth: 2,
                      hoverBorderColor: 'white',
                      hoverBorderWidth: 3,
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 20,
                          usePointStyle: true,
                          font: {
                            size: 12,
                            weight: '500'
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                          }
                        }
                      }
                    },
                    animation: {
                      animateScale: true,
                      animateRotate: true
                    }
                  }}
                />
              </Box>

              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Total Employees: {employees.length}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Professional Employee DataGrid */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${theme.palette.background.paper} 100%)`,
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden'
          }}>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              {/* Professional Header */}
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1
                    }}
                  >
                    Employee Directory
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
                    Comprehensive employee management and oversight
                  </Typography>
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                }}>
                  <PersonIcon sx={{ color: 'primary.main', fontSize: '1.2rem' }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600} color="primary.main">
                      {filteredEmployees.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      Active Employees
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Employee Content Area */}
              {!isMobile ? (
                <DataGrid
                  rows={currentEmployees.map((emp, index) => ({
                    ...emp,
                    id: emp.id || `employee-${index}`,
                    qidStatusObj: checkExpiry(emp.qid?.expiry, 'QID'),
                    passportStatusObj: checkExpiry(emp.passport?.expiry, 'Passport')
                  }))}
                    columns={[
                    {
                      field: 'employee',
                      headerName: 'Employee',
                      width: 280,
                      renderCell: (params) => (
                        <Box
                          display="flex"
                          alignItems="center"
                          sx={{ py: 1, px: 1, height: '100%', width: '100%' }}
                        >
                          <Avatar
                            src={params.row.photoUrl}
                            sx={{
                              bgcolor: theme.palette.primary.main,
                              color: 'white',
                              mr: 2.5,
                              width: 48,
                              height: 48,
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              border: `3px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                                borderColor: theme.palette.primary.main
                              }
                            }}
                          >
                            {params.row.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body1"
                              fontWeight={600}
                              noWrap
                              sx={{
                                mb: 0.5,
                                color: theme.palette.text.primary,
                                fontSize: '0.95rem',
                                lineHeight: 1.2
                              }}
                            >
                              {params.row.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {params.row.position}
                              </Typography>
                              <Box sx={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: 'text.disabled'
                              }} />
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                                sx={{ fontSize: '0.8rem' }}
                              >
                                {params.row.department}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                      )
                    },
                    {
                      field: 'contact',
                      headerName: 'Contact',
                      width: 200,
                      renderCell: (params) => (
                        <Box sx={{ py: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight={500}
                            sx={{
                              mb: 0.5,
                              color: theme.palette.text.primary,
                              fontSize: '0.85rem'
                            }}
                          >
                            {params.row.email || 'No email'}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: '0.8rem' }}
                          >
                            {params.row.phone || 'No phone'}
                          </Typography>
                        </Box>
                      )
                    },
                    {
                      field: 'documents',
                      headerName: 'Documents',
                      width: 180,
                      align: 'center',
                      headerAlign: 'center',
                      renderCell: (params) => (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: params.row.qidStatusObj?.color === 'success' ? '#4caf50' :
                                             params.row.qidStatusObj?.color === 'warning' ? '#ff9800' :
                                             params.row.qidStatusObj?.color === 'error' ? '#f44336' : '#9e9e9e'
                            }} />
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              QID
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: params.row.passportStatusObj?.color === 'success' ? '#4caf50' :
                                             params.row.passportStatusObj?.color === 'warning' ? '#ff9800' :
                                             params.row.passportStatusObj?.color === 'error' ? '#f44336' : '#9e9e9e'
                            }} />
                            <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                              Passport
                            </Typography>
                          </Box>
                        </Box>
                      )
                    },
                    {
                      field: 'salary',
                      headerName: 'Salary',
                      width: 140,
                      align: 'right',
                      headerAlign: 'right',
                      renderCell: (params) => (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{
                              color: 'success.main',
                              fontSize: '0.95rem',
                              mb: 0.5
                            }}
                          >
                            {params.row.salary?.toLocaleString() || 0} QAR
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            Monthly
                          </Typography>
                        </Box>
                      )
                    },
                    {
                      field: 'status',
                      headerName: 'Status',
                      width: 120,
                      align: 'center',
                      headerAlign: 'center',
                      renderCell: (params) => {
                        const qidDays = params.row.qidStatusObj?.message?.includes('days') ?
                          parseInt(params.row.qidStatusObj.message) : null;
                        const passportDays = params.row.passportStatusObj?.message?.includes('days') ?
                          parseInt(params.row.passportStatusObj.message) : null;

                        const getOverallStatus = () => {
                          if (qidDays !== null && qidDays <= 30) return 'critical';
                          if (passportDays !== null && passportDays <= 30) return 'critical';
                          if (qidDays !== null && qidDays <= 90) return 'warning';
                          if (passportDays !== null && passportDays <= 90) return 'warning';
                          return 'good';
                        };

                        const status = getOverallStatus();

                        return (
                          <Chip
                            label={status === 'critical' ? 'Action Required' :
                                   status === 'warning' ? 'Review Soon' : 'Active'}
                            color={status === 'critical' ? 'error' :
                                   status === 'warning' ? 'warning' : 'success'}
                            size="small"
                            variant="filled"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              height: 24,
                              '& .MuiChip-label': {
                                px: 1.5
                              }
                            }}
                          />
                        );
                      }
                    },
                    {
                      field: 'actions',
                      headerName: 'Actions',
                      width: 100,
                      align: 'center',
                      headerAlign: 'center',
                      sortable: false,
                      renderCell: (params) => (
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                          <Tooltip title="View employee details" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNameClick(params.row);
                              }}
                              sx={{
                                color: 'primary.main',
                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease',
                                width: 32,
                                height: 32
                              }}
                            >
                              <PersonIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete employee" arrow placement="top">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(params.row.id, params.row.name);
                              }}
                              sx={{
                                color: 'error.main',
                                backgroundColor: alpha(theme.palette.error.main, 0.08),
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.error.main, 0.15),
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s ease',
                                width: 32,
                                height: 32
                              }}
                            >
                              <DeleteIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )
                    },
                  ]}
                  pageSize={itemsPerPage}
                  rowsPerPageOptions={[5, 10, 25]}
                  checkboxSelection={false}
                  disableSelectionOnClick={false}
                  autoHeight={false}
                  onRowClick={(params) => {
                    handleNameClick(params.row);
                  }}
                  pagination
                  paginationMode="server"
                  rowCount={filteredEmployees.length}
                  page={currentPage - 1}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  initialState={{
                    pagination: {
                      paginationModel: { pageSize: itemsPerPage, page: currentPage - 1 }
                    }
                  }}
                  sx={{
                    m: 2,  // 16px outer margin for page breathing room
                    borderRadius: 2,
                    overflow: 'hidden',  // Clip rounded corners
                    boxShadow: 4,  // Medium shadow for elevation (Material Design 3 level 4 for tables)
                    backgroundColor: 'background.paper',
                    '& .MuiDataGrid-row': {
                      minHeight: 72,  // 9x8px grid units for perfect spacing
                      mx: 0,  // No horizontal margin to fill width
                      my: 0,  // Vertical handled by cell py
                      borderRadius: 0,  // Flat rows inside rounded container
                      transition: 'box-shadow 0.2s ease, transform 0.2s ease',  // Smooth animations
                      cursor: 'pointer',
                      position: 'relative',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, transparent 100%)`,
                        borderRadius: 2,
                        opacity: 0,
                        transition: 'opacity 0.3s ease'
                      },
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02),
                        transform: 'translateY(-2px)',  // Subtle lift for interactivity (2025 motion trend)
                        boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
                        borderColor: alpha(theme.palette.primary.main, 0.2),
                        '&::before': {
                          opacity: 1
                        }
                      },
                      '&:nth-of-type(odd)': {
                        backgroundColor: alpha(theme.palette.grey[50], 0.5)
                      }
                    },
                    '& .MuiDataGrid-cell': {
                      py: 2.5,  /* 20px vertical (2.5x8px) for ample line spacing */
                      px: 3,  /* 24px horizontal (3x8px) to prevent crowding */
                      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,  /* Thin divider for clear row separation (effective 16px gap with py) */
                      '&:focus-within': { backgroundColor: 'action.focus' },  /* Focus state for accessibility */
                    },
                    '& .MuiDataGrid-columnHeaders': {
                      backgroundColor: 'grey.100',  // Light gray for subtle contrast
                      color: 'text.primary',  // Black/dark text (12:1 ratio on gray)
                      fontWeight: 600,
                      fontSize: '0.875rem',  // Compact but readable
                      py: 1.5,  // 12px vertical padding
                      borderBottom: `2px solid ${theme.palette.primary.main}`,  // Purple accent for branding
                      minHeight: 60,
                      '& .MuiDataGrid-columnHeaderTitle': { whiteSpace: 'nowrap' },  // No wrap for headers
                    },
                    '& .MuiDataGrid-footerContainer': {
                      borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                      backgroundColor: 'grey.50',  /* Subtle footer bg */
                      justifyContent: 'space-between',  /* Align count left, pagination right */
                      py: 1.5,
                    },
                    '& .MuiDataGrid-virtualScroller': {  /* For large datasets */
                      overflowY: 'auto',
                    },
                  }}
                />
                ) : (
                  <>
                    {/* Mobile Card View */}
                    {isMobile && (
                      <Box sx={{ mt: 2 }}>
                        <Grid container spacing={2}>
                          {currentEmployees.map((employee) => (
                            <Grid item xs={12} sm={6} md={4} key={employee.id}>
                              <Card
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                  },
                                  borderRadius: 3,
                                  overflow: 'hidden',
                                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                }}
                                onClick={() => handleNameClick(employee)}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Avatar
                                      src={employee.photoUrl || employee.photoURL}
                                      alt={employee.name}
                                      sx={{
                                        width: 50,
                                        height: 50,
                                        mr: 2,
                                        bgcolor: 'primary.main',
                                        fontSize: '1.2rem',
                                        fontWeight: 600,
                                      }}
                                    >
                                      {employee.name?.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                                        {employee.name}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {employee.position}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  <Box sx={{ mb: 2 }}>
                                    <Chip
                                      label={employee.department}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                      sx={{ mb: 1, fontWeight: 500 }}
                                    />
                                  </Box>

                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                        Monthly Salary
                                      </Typography>
                                      <Typography variant="h6" color="success.main" fontWeight={700}>
                                        {employee.salary?.toLocaleString()} QAR
                                      </Typography>
                                    </Box>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNameClick(employee);
                                      }}
                                      sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        '&:hover': {
                                          bgcolor: alpha(theme.palette.primary.main, 0.2),
                                        },
                                      }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    {/* Professional Empty State */}
                    {currentEmployees.length === 0 && (
                      <Box sx={{
                        p: 8,
                        textAlign: 'center',
                        backgroundColor: alpha(theme.palette.background.paper, 0.5),
                        borderRadius: 3,
                        border: `2px dashed ${alpha(theme.palette.divider, 0.3)}`
                      }}>
                        <PersonIcon sx={{
                          fontSize: '4rem',
                          color: 'text.disabled',
                          mb: 3,
                          opacity: 0.5
                        }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontWeight: 500 }}>
                          {debouncedSearchTerm ? 'No employees found' : 'No employees in directory'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                          {debouncedSearchTerm
                            ? `No employees match your search for "${debouncedSearchTerm}". Try adjusting your search terms.`
                            : 'Get started by adding your first employee to the directory.'
                          }
                        </Typography>
                        {!debouncedSearchTerm && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowForm(true)}
                            sx={{
                              borderRadius: 2,
                              px: 4,
                              py: 1.5,
                              fontWeight: 600,
                              textTransform: 'none',
                              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                            }}
                          >
                            Add First Employee
                          </Button>
                        )}
                      </Box>
                    )}
                  </>
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
            
            {/* Unified Edit/Save buttons with Tooltips */}
            {isEditMode ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Save all changes to employee details" arrow placement="bottom">
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
                      },
                      borderRadius: 2,
                      px: 2,
                      minWidth: 'auto'
                    }}
                  >
                    {savingChanges ? (
                      <>
                        <CircularProgress size={16} sx={{ mr: 1, color: 'primary.main' }} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <EditIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        Save
                      </>
                    )}
                  </Button>
                </Tooltip>
                <Tooltip title="Cancel editing and discard changes" arrow placement="bottom">
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
                      },
                      borderRadius: 2,
                      px: 2,
                      minWidth: 'auto'
                    }}
                  >
                    <CloseIcon sx={{ mr: 1, fontSize: '1rem' }} />
                    Cancel
                  </Button>
                </Tooltip>
              </Box>
            ) : (
              <Tooltip title="Edit employee information" arrow placement="bottom">
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
                    },
                    borderRadius: 2,
                    px: 2,
                    minWidth: 'auto'
                  }}
                >
                  Edit
                </Button>
              </Tooltip>
            )}
            
            <Tooltip title="Close employee details" arrow placement="bottom">
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
            </Tooltip>
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
              py={8}
              gap={3}
              sx={{
                backgroundColor: '#ffffff',
                minHeight: '400px'
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <CircularProgress 
                  size={60} 
                  thickness={4}
                  sx={{ 
                    color: 'primary.main',
                    filter: 'drop-shadow(0 2px 8px rgba(25, 118, 210, 0.3))'
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, ${alpha(theme.palette.primary.main, 0.1)} 0deg, transparent 360deg)`,
                    animation: `${spin} 2s linear infinite`
                  }}
                />
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>
                  Loading Employee Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '280px' }}>
                  Fetching comprehensive information and records
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Box sx={{ width: 20, height: 8, backgroundColor: alpha(theme.palette.primary.main, 0.2), borderRadius: 1, animation: `${pulse} 1.5s ease-in-out infinite` }} />
                <Box sx={{ width: 20, height: 8, backgroundColor: alpha(theme.palette.primary.main, 0.4), borderRadius: 1, animation: `${pulse} 1.5s ease-in-out 0.2s infinite` }} />
                <Box sx={{ width: 20, height: 8, backgroundColor: alpha(theme.palette.primary.main, 0.6), borderRadius: 1, animation: `${pulse} 1.5s ease-in-out 0.4s infinite` }} />
              </Box>
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
                hrNotes: detailsModalEmployee?.hrNotes || '',
              }}
              validationSchema={modalValidationSchema}
              enableReinitialize={true}
              onSubmit={handleSaveChanges}
            >
              {({ values, errors, touched, setFieldValue, isValid, dirty, isSubmitting }) => (
                <Form>
                  <Box>
                    {/* Enhanced Navigation Tabs with Icons */}
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
                            color: 'text.primary',
                            minWidth: 0,
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                              color: theme.palette.primary.main
                            }
                          },
                          '& .MuiTabs-indicator': {
                            height: 3,
                            borderRadius: '2px 2px 0 0'
                          }
                        }}
                      >
                        <Tab 
                          icon={<PersonIcon />} 
                          iconPosition="start"
                          label="Personal Info" 
                          {...a11yProps(0)} 
                          sx={{ 
                            '& .MuiTab-iconWrapper': { 
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        <Tab 
                          icon={<AssignmentIcon />} 
                          iconPosition="start"
                          label="Documents" 
                          {...a11yProps(1)} 
                          sx={{ 
                            '& .MuiTab-iconWrapper': { 
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        <Tab 
                          icon={<MoneyIcon />} 
                          iconPosition="start"
                          label="Payroll" 
                          {...a11yProps(2)} 
                          sx={{ 
                            '& .MuiTab-iconWrapper': { 
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        <Tab 
                          icon={<AccountBalanceIcon />} 
                          iconPosition="start"
                          label="Bank Details" 
                          {...a11yProps(3)} 
                          sx={{ 
                            '& .MuiTab-iconWrapper': { 
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }
                          }}
                        />
                        <Tab 
                          icon={<AssessmentIcon />} 
                          iconPosition="start"
                          label="HR Features" 
                          {...a11yProps(4)} 
                          sx={{ 
                            '& .MuiTab-iconWrapper': { 
                              mb: 0.5,
                              fontSize: '1.1rem'
                            }
                          }}
                        />
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
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff',
                                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                  transform: 'translateY(-2px)'
                                }
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
                                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                borderRadius: 3,
                                height: '100%',
                                backgroundColor: '#ffffff',
                                border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                  transform: 'translateY(-2px)'
                                }
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
                                    fontWeight: 500,
                                    backgroundColor: 'success.main',
                                    '&:hover': {
                                      backgroundColor: 'success.dark',
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                                    },
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 2px 8px rgba(76, 175, 80, 0.2)'
                                  }}
                                  onClick={() => {
                                    // Handle salary payment
                                    console.log('Process salary payment for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Process Salary Payment
                                </Button>
                                
                                <Tooltip title="Generate and download payslip" arrow placement="top">
                                  <Button
                                    variant="outlined"
                                    startIcon={<ReceiptIcon />}
                                    sx={{ 
                                      borderRadius: 2, 
                                      textTransform: 'none',
                                      py: 1.5,
                                      fontWeight: 500,
                                      borderColor: 'info.main',
                                      color: 'info.main',
                                      '&:hover': {
                                        borderColor: 'info.dark',
                                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      // Handle generate payslip
                                      console.log('Generate payslip for employee:', detailsModalEmployee?.id);
                                    }}
                                  >
                                    Generate Payslip
                                  </Button>
                                </Tooltip>
                                
                                <Tooltip title="View payment history and transactions" arrow placement="top">
                                  <Button
                                    variant="outlined"
                                    startIcon={<HistoryIcon />}
                                    sx={{ 
                                      borderRadius: 2, 
                                      textTransform: 'none',
                                      py: 1.5,
                                      fontWeight: 500,
                                      borderColor: 'warning.main',
                                      color: 'warning.main',
                                      '&:hover': {
                                        borderColor: 'warning.dark',
                                        backgroundColor: alpha(theme.palette.warning.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      // Handle view payment history
                                      console.log('View payment history for employee:', detailsModalEmployee?.id);
                                    }}
                                  >
                                    View Payment History
                                  </Button>
                                </Tooltip>
                                
                                <Tooltip title="Adjust salary or compensation" arrow placement="top">
                                  <Button
                                    variant="outlined"
                                    startIcon={<AccountBalanceIcon />}
                                    sx={{ 
                                      borderRadius: 2, 
                                      textTransform: 'none',
                                      py: 1.5,
                                      fontWeight: 500,
                                      borderColor: 'secondary.main',
                                      color: 'secondary.main',
                                      '&:hover': {
                                        borderColor: 'secondary.dark',
                                        backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(156, 39, 176, 0.2)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      // Handle salary adjustment
                                      console.log('Adjust salary for employee:', detailsModalEmployee?.id);
                                    }}
                                  >
                                    Salary Adjustment
                                  </Button>
                                </Tooltip>
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

                      {/* Bank Details Tab - Enhanced with Inline Editing */}
                      <TabPanel value={modalTabValue} index={3}>
                        <Grid container spacing={4}>

                          {/* Bank Account Information */}
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
                                Bank Account Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Bank Name
                                </Typography>
                                {isEditMode ? (
                                  <Field name="bankName">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Bank Name"
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
                                    {detailsModalEmployee?.bankDetails?.bankName || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Account Holder Name
                                </Typography>
                                {isEditMode ? (
                                  <Field name="accountHolderName">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Account Holder Name"
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
                                    {detailsModalEmployee?.bankDetails?.accountHolderName || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Account Number
                                </Typography>
                                {isEditMode ? (
                                  <Field name="accountNumber">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Account Number"
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
                                    {detailsModalEmployee?.bankDetails?.accountNumber || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  IBAN
                                </Typography>
                                {isEditMode ? (
                                  <Field name="iban">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="IBAN"
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
                                    {detailsModalEmployee?.bankDetails?.iban || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                            </Card>
                          </Grid>

                          {/* Additional Banking Information */}
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
                                Additional Banking Information
                              </Typography>
                              <Divider sx={{ mb: 3 }} />

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  SWIFT/BIC Code
                                </Typography>
                                {isEditMode ? (
                                  <Field name="swiftCode">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="SWIFT/BIC Code"
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
                                    {detailsModalEmployee?.bankDetails?.swiftCode || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Branch Name
                                </Typography>
                                {isEditMode ? (
                                  <Field name="branchName">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Branch Name"
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
                                    {detailsModalEmployee?.bankDetails?.branchName || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Branch Code
                                </Typography>
                                {isEditMode ? (
                                  <Field name="branchCode">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        fullWidth
                                        label="Branch Code"
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
                                    {detailsModalEmployee?.bankDetails?.branchCode || 'Not provided'}
                                  </Typography>
                                )}
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Account Type
                                </Typography>
                                {isEditMode ? (
                                  <Field name="accountType">
                                    {({ field, meta }) => (
                                      <TextField
                                        {...field}
                                        select
                                        fullWidth
                                        label="Account Type"
                                        variant="outlined"
                                        size="small"
                                        error={meta.touched && meta.error}
                                        helperText={meta.touched && meta.error}
                                        sx={{ mt: 1 }}
                                      >
                                        <MenuItem value="savings">Savings Account</MenuItem>
                                        <MenuItem value="checking">Checking Account</MenuItem>
                                        <MenuItem value="current">Current Account</MenuItem>
                                      </TextField>
                                    )}
                                  </Field>
                                ) : (
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.1rem' }}>
                                    {detailsModalEmployee?.bankDetails?.accountType ? (
                                      detailsModalEmployee.bankDetails.accountType === 'savings' ? 'Savings Account' :
                                      detailsModalEmployee.bankDetails.accountType === 'checking' ? 'Checking Account' :
                                      detailsModalEmployee.bankDetails.accountType === 'current' ? 'Current Account' :
                                      detailsModalEmployee.bankDetails.accountType
                                    ) : 'Not provided'}
                                  </Typography>
                                )}
                              </Box>
                            </Card>
                          </Grid>

                          {/* Bank Document Upload Section */}
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
                                  Bank Document Upload
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={6}>
                                    <Dropzone
                                      onDrop={async (acceptedFiles) => {
                                        if (acceptedFiles.length > 0) {
                                          const file = acceptedFiles[0];
                                          try {
                                            const docRef = ref(storage, `documents/${detailsModalEmployee.id}/bank-statement/${file.name}`);
                                            await uploadBytes(docRef, file);
                                            const documentUrl = await getDownloadURL(docRef);

                                            // Update employee bank statement document in database
                                            if (isFirebaseConfigured) {
                                              const updatedBankDetails = {
                                                ...detailsModalEmployee.bankDetails,
                                                bankStatementUrl: documentUrl
                                              };
                                              await updateDoc(doc(db, 'employees', detailsModalEmployee.id), {
                                                bankDetails: updatedBankDetails
                                              });
                                            }

                                            // Update local state
                                            setDetailsModalEmployee(prev => ({
                                              ...prev,
                                              bankDetails: {
                                                ...prev.bankDetails,
                                                bankStatementUrl: documentUrl
                                              }
                                            }));

                                            toast.success('Bank statement uploaded successfully');
                                          } catch (error) {
                                            console.error('Bank statement upload error:', error);
                                            toast.error('Failed to upload bank statement');
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
                                            Bank Statement
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {isDragActive ? 'Drop bank statement here' : 'Upload bank statement (PDF, JPG, PNG)'}
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
                                            const docRef = ref(storage, `documents/${detailsModalEmployee.id}/bank-letter/${file.name}`);
                                            await uploadBytes(docRef, file);
                                            const documentUrl = await getDownloadURL(docRef);

                                            // Update employee bank letter document in database
                                            if (isFirebaseConfigured) {
                                              const updatedBankDetails = {
                                                ...detailsModalEmployee.bankDetails,
                                                bankLetterUrl: documentUrl
                                              };
                                              await updateDoc(doc(db, 'employees', detailsModalEmployee.id), {
                                                bankDetails: updatedBankDetails
                                              });
                                            }

                                            // Update local state
                                            setDetailsModalEmployee(prev => ({
                                              ...prev,
                                              bankDetails: {
                                                ...prev.bankDetails,
                                                bankLetterUrl: documentUrl
                                              }
                                            }));

                                            toast.success('Bank letter uploaded successfully');
                                          } catch (error) {
                                            console.error('Bank letter upload error:', error);
                                            toast.error('Failed to upload bank letter');
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
                                          <input {...getInputProps()} />
                                          <UploadIcon sx={{ fontSize: 48, color: isDragActive ? 'primary.main' : 'text.secondary', mb: 2 }} />
                                          <Typography variant="h6" gutterBottom>
                                            Bank Letter
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            {isDragActive ? 'Drop bank letter here' : 'Upload bank letter (PDF, JPG, PNG)'}
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

                          {/* Bank Document View Section */}
                          {!isEditMode && (
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
                                  Bank Documents
                                </Typography>
                                <Divider sx={{ mb: 3 }} />

                                <Grid container spacing={3}>
                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Bank Statement
                                    </Typography>
                                    {detailsModalEmployee?.bankDetails?.bankStatementUrl ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<DownloadIcon />}
                                          onClick={() => window.open(detailsModalEmployee.bankDetails.bankStatementUrl, '_blank')}
                                          sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                          View Bank Statement
                                        </Button>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        No bank statement uploaded
                                      </Typography>
                                    )}
                                  </Grid>

                                  <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                      Bank Letter
                                    </Typography>
                                    {detailsModalEmployee?.bankDetails?.bankLetterUrl ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                                        <Button
                                          variant="outlined"
                                          startIcon={<DownloadIcon />}
                                          onClick={() => window.open(detailsModalEmployee.bankDetails.bankLetterUrl, '_blank')}
                                          sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                          View Bank Letter
                                        </Button>
                                      </Box>
                                    ) : (
                                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        No bank letter uploaded
                                      </Typography>
                                    )}
                                  </Grid>
                                </Grid>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      </TabPanel>

                      {/* HR Features Tab - Leave Balance, Performance Reviews, HR Notes */}
                      <TabPanel value={modalTabValue} index={4}>
                        <Grid container spacing={4}>

                          {/* Leave Balance Section */}
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
                                Leave Balance
                              </Typography>
                              <Divider sx={{ mb: 3 }} />

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Annual Leave
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                                    {detailsModalEmployee?.leaveBalance?.annual || 25} days
                                  </Typography>
                                  <Chip
                                    label="Available"
                                    color="success"
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Used: {detailsModalEmployee?.leaveBalance?.annualUsed || 0} days
                                </Typography>
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Sick Leave
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                                    {detailsModalEmployee?.leaveBalance?.sick || 10} days
                                  </Typography>
                                  <Chip
                                    label="Available"
                                    color="info"
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Used: {detailsModalEmployee?.leaveBalance?.sickUsed || 0} days
                                </Typography>
                              </Box>

                              <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>
                                  Emergency Leave
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: '1.2rem' }}>
                                    {detailsModalEmployee?.leaveBalance?.emergency || 5} days
                                  </Typography>
                                  <Chip
                                    label="Available"
                                    color="warning"
                                    size="small"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                  Used: {detailsModalEmployee?.leaveBalance?.emergencyUsed || 0} days
                                </Typography>
                              </Box>

                              <Divider sx={{ my: 3 }} />
                              <Tooltip title="Submit a leave request" arrow placement="top">
                                <Button
                                  variant="outlined"
                                  startIcon={<EventIcon />}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderColor: 'primary.main',
                                    color: 'primary.main',
                                    '&:hover': {
                                      borderColor: 'primary.dark',
                                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                                    },
                                    transition: 'all 0.3s ease'
                                  }}
                                  onClick={() => {
                                    // Handle leave request
                                    console.log('Request leave for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Request Leave
                                </Button>
                              </Tooltip>
                            </Card>
                          </Grid>

                          {/* Performance Reviews Section */}
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
                                Performance Reviews
                              </Typography>
                              <Divider sx={{ mb: 3 }} />

                              <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                                {(detailsModalEmployee?.performanceReviews || [
                                  { date: '2024-01-15', rating: 'Excellent', reviewer: 'John Smith', comments: 'Outstanding performance and dedication to work.' },
                                  { date: '2023-07-10', rating: 'Good', reviewer: 'Sarah Johnson', comments: 'Consistent performance with room for improvement in leadership skills.' }
                                ]).map((review, index) => (
                                  <ListItem key={index} alignItems="flex-start" sx={{ px: 0 }}>
                                    <ListItemIcon>
                                      <StarIcon color="primary" />
                                    </ListItemIcon>
                                    <ListItemText
                                      primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                          <Typography variant="subtitle2" fontWeight={600}>
                                            {formatDate(review.date)}
                                          </Typography>
                                          <Chip
                                            label={review.rating}
                                            color={review.rating === 'Excellent' ? 'success' : review.rating === 'Good' ? 'primary' : 'warning'}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                          />
                                        </Box>
                                      }
                                      secondary={
                                        <Box>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Reviewed by: {review.reviewer}
                                          </Typography>
                                          <Typography variant="body2" color="text.primary">
                                            {review.comments}
                                          </Typography>
                                        </Box>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>

                              <Divider sx={{ my: 3 }} />
                              <Tooltip title="Add a new performance review" arrow placement="top">
                                <Button
                                  variant="outlined"
                                  startIcon={<AssessmentIcon />}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    borderColor: 'success.main',
                                    color: 'success.main',
                                    '&:hover': {
                                      borderColor: 'success.dark',
                                      backgroundColor: alpha(theme.palette.success.main, 0.08),
                                      transform: 'translateY(-1px)',
                                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                                    },
                                    transition: 'all 0.3s ease'
                                  }}
                                  onClick={() => {
                                    // Handle add performance review
                                    console.log('Add performance review for employee:', detailsModalEmployee?.id);
                                  }}
                                >
                                  Add Review
                                </Button>
                              </Tooltip>
                            </Card>
                          </Grid>

                          {/* HR Notes Section */}
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
                                HR Notes
                              </Typography>
                              <Divider sx={{ mb: 3 }} />

                              {isEditMode ? (
                                <Field name="hrNotes">
                                  {({ field, meta }) => (
                                    <TextField
                                      {...field}
                                      fullWidth
                                      multiline
                                      rows={6}
                                      label="HR Notes"
                                      variant="outlined"
                                      placeholder="Add internal HR notes, observations, or important information about this employee..."
                                      error={meta.touched && meta.error}
                                      helperText={meta.touched && meta.error}
                                      sx={{ mt: 1 }}
                                    />
                                  )}
                                </Field>
                              ) : (
                                <Typography variant="body1" sx={{ minHeight: 120, whiteSpace: 'pre-wrap' }}>
                                  {detailsModalEmployee?.hrNotes || 'No HR notes available for this employee.'}
                                </Typography>
                              )}

                              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                <Tooltip title="View history of HR notes" arrow placement="top">
                                  <Button
                                    variant="outlined"
                                    startIcon={<NoteIcon />}
                                    sx={{
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 500,
                                      borderColor: 'info.main',
                                      color: 'info.main',
                                      '&:hover': {
                                        borderColor: 'info.dark',
                                        backgroundColor: alpha(theme.palette.info.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      // Handle view note history
                                      console.log('View note history for employee:', detailsModalEmployee?.id);
                                    }}
                                  >
                                    View History
                                  </Button>
                                </Tooltip>
                                <Tooltip title="Print HR notes and documentation" arrow placement="top">
                                  <Button
                                    variant="outlined"
                                    startIcon={<PrintIcon />}
                                    sx={{
                                      borderRadius: 2,
                                      textTransform: 'none',
                                      fontWeight: 500,
                                      borderColor: 'warning.main',
                                      color: 'warning.main',
                                      '&:hover': {
                                        borderColor: 'warning.dark',
                                        backgroundColor: alpha(theme.palette.warning.main, 0.08),
                                        transform: 'translateY(-1px)',
                                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => {
                                      // Handle print HR notes
                                      console.log('Print HR notes for employee:', detailsModalEmployee?.id);
                                    }}
                                  >
                                    Print Notes
                                  </Button>
                                </Tooltip>
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
                color: 'error.main',
                backgroundColor: alpha(theme.palette.error.main, 0.04),
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
              },
              transition: 'all 0.3s ease'
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
