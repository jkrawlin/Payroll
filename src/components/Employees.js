import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockEmployees } from '../services/mockData';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Stack,
  Tooltip,
  Badge,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Zoom,
  Skeleton,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  TrendingUp as TrendingUpIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  AccountBalance as AccountBalanceIcon,
  AttachMoney as AttachMoneyIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Assignment as AssignmentIcon,
  Payment as PaymentIcon,
  Warning as WarningIcon,
  CreditCard as CreditCardIcon,
} from '@mui/icons-material';

// Enhanced Validation Schema
const validationSchema = Yup.object({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  position: Yup.string()
    .min(2, 'Position must be at least 2 characters')
    .required('Position is required'),
  department: Yup.string().required('Department is required'),
  salary: Yup.number()
    .positive('Salary must be positive')
    .min(1000, 'Minimum salary is 1000 QAR')
    .max(100000, 'Maximum salary is 100,000 QAR')
    .required('Salary is required'),
  email: Yup.string().email('Invalid email format'),
  phone: Yup.string().matches(/^[\+]?[0-9\s\-\(\)]+$/, 'Invalid phone number format'),
});

// Enhanced Premium Desktop Employees Component
const Employees = () => {
  const theme = useTheme();

  // Enhanced State Management
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [salaryRange, setSalaryRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailsModalEmployee, setDetailsModalEmployee] = useState(null);
  const [pageSize, setPageSize] = useState(25);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Enhanced departments list
  const departments = [
    'HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing', 
    'Engineering', 'Legal', 'Admin', 'Management'
  ];

  // Enhanced fetch employees with better error handling
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!isFirebaseConfigured) {
        console.log('Firebase not configured, using enhanced mock data');
        // Simulate API delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        setEmployees(mockEmployees);
        return;
      }

      const employeesCollection = collection(db, 'employees');
      const employeeSnapshot = await getDocs(employeesCollection);
      const employeeList = employeeSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployees(employeeList.length > 0 ? employeeList : mockEmployees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees, using offline data');
      setEmployees(mockEmployees);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Enhanced filter employees with salary range
  useEffect(() => {
    let filtered = employees;
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.phone?.includes(searchTerm)
      );
    }
    
    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }

    // Salary range filter
    if (salaryRange !== 'all') {
      const ranges = {
        'low': [0, 5000],
        'mid': [5000, 10000],
        'high': [10000, 20000],
        'premium': [20000, Infinity]
      };
      const [min, max] = ranges[salaryRange] || [0, Infinity];
      filtered = filtered.filter(emp => emp.salary >= min && emp.salary < max);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, selectedDepartment, salaryRange]);

  // Enhanced statistics calculation with Phase 1 improvements
  const statistics = useMemo(() => {
    const totalEmployees = filteredEmployees.length;
    const totalOriginalEmployees = employees.length;
    const departments = new Set(employees.map(emp => emp.department)).size;
    const avgSalary = employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length)
      : 0;
    
    const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
    
    // Additional Excel-like analytics
    const expiringDocuments = employees.filter(emp => 
      emp.qid?.status === 'expiring_soon' || 
      (emp.qid?.expiry && new Date(emp.qid.expiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    ).length;

    const totalAdvances = employees.reduce((sum, emp) => 
      sum + (emp.advances?.reduce((advSum, adv) => advSum + (adv.amount || 0), 0) || 0), 0
    );

    const departmentDistribution = employees.reduce((acc, emp) => {
      const dept = emp.department || 'Unassigned';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});
    
    return { 
      totalEmployees, 
      totalOriginalEmployees,
      departments, 
      avgSalary,
      totalPayroll,
      expiringDocuments,
      totalAdvances,
      departmentDistribution
    };
  }, [employees, filteredEmployees]);

  // Enhanced form handlers
  const handleEdit = (employee) => {
    setEditingId(employee.id);
    setShowForm(true);
    formik.setValues({
      name: employee.name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      salary: employee.salary || '',
      joinDate: employee.joinDate || '',
      address: employee.address || '',
    });
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`⚠️ Are you sure you want to delete ${employeeName}?\n\nThis action cannot be undone.`)) {
      try {
        setLoading(true);
        
        if (isFirebaseConfigured) {
          await deleteDoc(doc(db, 'employees', employeeId));
        } else {
          // Simulate API delay for mock data
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        toast.success(`Employee ${employeeName} deleted successfully`);
        fetchEmployees();
      } catch (error) {
        toast.error('Error deleting employee');
        console.error('Error deleting employee:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    formik.resetForm();
  };

  // Enhanced Formik form handling
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: '',
      joinDate: '',
      address: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        
        const employeeData = {
          ...values,
          salary: parseFloat(values.salary) || 0,
          joinDate: values.joinDate || new Date().toISOString().split('T')[0],
          createdAt: editingId ? employees.find(e => e.id === editingId)?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          photoUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 20) + 1}`,
          totalPaid: 0,
          transactions: [],
          advances: []
        };

        if (isFirebaseConfigured) {
          if (editingId) {
            await updateDoc(doc(db, 'employees', editingId), employeeData);
            toast.success('Employee updated successfully! 🎉');
          } else {
            await addDoc(collection(db, 'employees'), employeeData);
            toast.success('Employee added successfully! 🎉');
          }
        } else {
          // Simulate API delay for mock data
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.success(editingId ? 'Employee updated successfully! 🎉' : 'Employee added successfully! 🎉');
        }

        fetchEmployees();
        handleCancel();
      } catch (error) {
        toast.error('Error saving employee');
        console.error('Error saving employee:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Enhanced DataGrid columns with better styling
  const columns = [
    {
      field: 'employee',
      headerName: 'Employee',
      width: 320,
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          sx={{ py: 1.5, cursor: 'pointer' }}
          onClick={() => setDetailsModalEmployee(params.row)}
        >
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              />
            }
          >
            <Avatar
              src={params.row.photoUrl}
              sx={{
                bgcolor: theme.palette.primary.main,
                mr: 2,
                width: 44,
                height: 44,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }}
            >
              {params.row.name?.charAt(0)?.toUpperCase()}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              {params.row.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {params.row.position}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Joined: {params.row.joinDate ? new Date(params.row.joinDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'department',
      headerName: 'Department',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.row.department}
          size="small"
          color="primary"
          variant="filled"
          sx={{
            fontWeight: 600,
            borderRadius: 2,
          }}
        />
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact Information',
      width: 250,
      renderCell: (params) => (
        <Box>
          {params.row.email && (
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon sx={{ mr: 1, fontSize: 14, color: 'primary.main' }} />
              {params.row.email}
            </Typography>
          )}
          {params.row.phone && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ mr: 1, fontSize: 14, color: 'secondary.main' }} />
              {params.row.phone}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'salary',
      headerName: 'Monthly Salary',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body1" color="success.main" fontWeight={700}>
            {params.row.salary ? `${params.row.salary.toLocaleString()} QAR` : 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Annual: {params.row.salary ? `${(params.row.salary * 12).toLocaleString()} QAR` : 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={`View ${params.row.name}'s Details`} arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDetailsModalEmployee(params.row);
              }}
              sx={{
                color: 'info.main',
                '&:hover': { 
                  bgcolor: alpha(theme.palette.info.main, 0.1),
                  transform: 'scale(1.1)'
                }
              }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Edit ${params.row.name}`} arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row);
              }}
              sx={{
                color: 'primary.main',
                '&:hover': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  transform: 'scale(1.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={`Delete ${params.row.name}`} arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row.id, params.row.name);
              }}
              sx={{
                color: 'error.main',
                '&:hover': { 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  transform: 'scale(1.1)'
                }
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Enhanced Header with Animation */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            mb: 3, 
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: `radial-gradient(circle, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" position="relative" zIndex={1}>
            <Box>
              <Box display="flex" alignItems="center" mb={2}>
                <PersonIcon sx={{ mr: 2, fontSize: 40 }} />
                <Typography variant="h3" fontWeight={700}>
                  Employee Management
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                Qatar Payroll System • Premium Desktop Interface
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip 
                  label={`${statistics.totalOriginalEmployees} Total Employees`}
                  sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', fontWeight: 600 }}
                />
                <Chip 
                  label={`${statistics.totalPayroll.toLocaleString()} QAR Total Payroll`}
                  sx={{ bgcolor: alpha('#fff', 0.2), color: 'white', fontWeight: 600 }}
                />
              </Box>
            </Box>
            <Zoom in timeout={1200}>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setShowForm(true)}
                sx={{
                  bgcolor: alpha('#fff', 0.2),
                  '&:hover': { 
                    bgcolor: alpha('#fff', 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  fontWeight: 600
                }}
              >
                Add New Employee
              </Button>
            </Zoom>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Dashboard Layout */}
      <Grid container spacing={3}>
        {/* Enhanced Sidebar */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* Enhanced Search and Filter */}
            <Fade in timeout={1000}>
              <Card 
                elevation={2} 
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.primary.main, 0.02)})`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <FilterListIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      Search & Filter
                    </Typography>
                  </Box>
                  
                  {/* Enhanced Search */}
                  <TextField
                    fullWidth
                    placeholder="Search employees, positions, emails..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover': {
                          '& > fieldset': { borderColor: theme.palette.primary.main }
                        }
                      }
                    }}
                  />

                  {/* Department Filter */}
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Department</InputLabel>
                    <Select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      label="Department"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Departments</MenuItem>
                      {departments.map(dept => (
                        <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Salary Range Filter */}
                  <FormControl fullWidth>
                    <InputLabel>Salary Range</InputLabel>
                    <Select
                      value={salaryRange}
                      onChange={(e) => setSalaryRange(e.target.value)}
                      label="Salary Range"
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="all">All Ranges</MenuItem>
                      <MenuItem value="low">1,000 - 5,000 QAR</MenuItem>
                      <MenuItem value="mid">5,000 - 10,000 QAR</MenuItem>
                      <MenuItem value="high">10,000 - 20,000 QAR</MenuItem>
                      <MenuItem value="premium">20,000+ QAR</MenuItem>
                    </Select>
                  </FormControl>

                  {searchTerm && (
                    <Box mt={2}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => setSearchTerm('')}
                        fullWidth
                        sx={{ borderRadius: 2 }}
                      >
                        Clear Search
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Fade>

            {/* Enhanced Statistics Dashboard */}
            <Fade in timeout={1400}>
              <Card 
                elevation={2}
                sx={{ 
                  borderRadius: 3,
                  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${alpha(theme.palette.secondary.main, 0.02)})`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" alignItems="center" mb={3}>
                    <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6" fontWeight={700}>
                      Quick Analytics
                    </Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    {/* Total Employees Stat */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box display="flex" alignItems="center">
                          <GroupsIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="text.secondary" fontWeight={600}>
                            {statistics.totalEmployees === statistics.totalOriginalEmployees 
                              ? 'Total Employees' 
                              : `Filtered (${statistics.totalEmployees}/${statistics.totalOriginalEmployees})`
                            }
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h3" color="primary" fontWeight={800}>
                        {statistics.totalEmployees}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Active workforce
                      </Typography>
                    </Paper>

                    {/* Departments Stat */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Departments
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="secondary" fontWeight={800}>
                        {statistics.departments}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Organizational units
                      </Typography>
                    </Paper>

                    {/* Average Salary Stat */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Average Salary
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="success.main" fontWeight={800}>
                        {statistics.avgSalary.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        QAR per month
                      </Typography>
                    </Paper>

                    {/* Total Payroll Stat */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)}, ${alpha(theme.palette.warning.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <AccountBalanceIcon color="warning" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Total Payroll
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="warning.main" fontWeight={800}>
                        {statistics.totalPayroll.toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        QAR monthly cost
                      </Typography>
                    </Paper>

                    {/* Expiring Documents Alert */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <WarningIcon color="error" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Expiring QIDs
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="error.main" fontWeight={800}>
                        {statistics.expiringDocuments || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Need attention
                      </Typography>
                    </Paper>

                    {/* Total Advances */}
                    <Paper 
                      elevation={1} 
                      sx={{ 
                        p: 2.5, 
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})`,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                      }}
                    >
                      <Box display="flex" alignItems="center" mb={1}>
                        <CreditCardIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary" fontWeight={600}>
                          Active Advances
                        </Typography>
                      </Box>
                      <Typography variant="h3" color="info.main" fontWeight={800}>
                        {statistics.totalAdvances?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        QAR outstanding
                      </Typography>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Fade>
          </Stack>
        </Grid>

        {/* Enhanced Main Content */}
        <Grid item xs={12} lg={9}>
          <Fade in timeout={1600}>
            <Card 
              elevation={2}
              sx={{ 
                borderRadius: 3,
                overflow: 'hidden'
              }}
            >
              <CardContent sx={{ p: 0 }}>
                {/* Enhanced Table Header */}
                <Box 
                  sx={{ 
                    p: 3, 
                    borderBottom: 1, 
                    borderColor: 'divider',
                    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="h5" fontWeight={700} color="text.primary">
                        Employee Directory
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {filteredEmployees.length} employees found • Premium desktop interface
                      </Typography>
                    </Box>
                    <Box display="flex" gap={2}>
                      <Chip 
                        icon={<PersonIcon />}
                        label={`${filteredEmployees.length} Records`}
                        color="primary"
                        variant="outlined"
                      />
                      {loading && <CircularProgress size={24} />}
                    </Box>
                  </Box>
                </Box>
                
                {/* Enhanced DataGrid */}
                <Box sx={{ width: '100%' }}>
                  {loading ? (
                    <Box sx={{ p: 3 }}>
                      {[...Array(5)].map((_, index) => (
                        <Box key={index} display="flex" alignItems="center" mb={2}>
                          <Skeleton variant="circular" width={44} height={44} sx={{ mr: 2 }} />
                          <Box flex={1}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <DataGrid
                      rows={filteredEmployees.map((emp, index) => ({
                        ...emp,
                        id: emp.id || `employee-${index}`,
                      }))}
                      columns={columns}
                      pageSize={pageSize}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
                      loading={loading}
                      disableSelectionOnClick
                      autoHeight
                      checkboxSelection={false}
                      density="standard"
                      sx={{
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        '& .MuiDataGrid-main': {
                          borderRadius: 2,
                        },
                        '& .MuiDataGrid-columnHeaders': {
                          bgcolor: alpha(theme.palette.primary.main, 0.08),
                          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: theme.palette.primary.main,
                          '& .MuiDataGrid-columnHeader': {
                            '&:focus': {
                              outline: 'none',
                            },
                          },
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          fontWeight: 700,
                        },
                        '& .MuiDataGrid-row': {
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          '&:nth-of-type(even)': {
                            bgcolor: alpha(theme.palette.primary.main, 0.02),
                          },
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            transform: 'translateY(-1px)',
                            boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
                            zIndex: 1,
                          },
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          cursor: 'pointer',
                        },
                        '& .MuiDataGrid-cell': {
                          borderColor: alpha(theme.palette.divider, 0.08),
                          fontSize: '0.875rem',
                          '&:focus': {
                            outline: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                            outlineOffset: '-2px',
                          },
                        },
                        '& .MuiDataGrid-footer': {
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                          '& .MuiTablePagination-toolbar': {
                            minHeight: 48,
                          },
                        },
                        '& .MuiDataGrid-virtualScroller': {
                          '&::-webkit-scrollbar': {
                            width: 8,
                            height: 8,
                          },
                          '&::-webkit-scrollbar-track': {
                            bgcolor: alpha(theme.palette.grey[300], 0.2),
                            borderRadius: 4,
                          },
                          '&::-webkit-scrollbar-thumb': {
                            bgcolor: alpha(theme.palette.primary.main, 0.3),
                            borderRadius: 4,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.primary.main, 0.5),
                            },
                          },
                        },
                      }}
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>

      {/* Enhanced Employee Form Dialog */}
      <Dialog 
        open={showForm} 
        onClose={handleCancel}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '600px'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            p: 3
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              {editingId ? <EditIcon sx={{ mr: 2 }} /> : <AddIcon sx={{ mr: 2 }} />}
              <Box>
                <Typography variant="h5" fontWeight={700}>
                  {editingId ? 'Edit Employee' : 'Add New Employee'}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {editingId ? 'Update employee information' : 'Fill in the employee details below'}
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={handleCancel} 
              sx={{ 
                color: 'white',
                '&:hover': { bgcolor: alpha('#fff', 0.2) }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position"
                name="position"
                value={formik.values.position}
                onChange={formik.handleChange}
                error={formik.touched.position && Boolean(formik.errors.position)}
                helperText={formik.touched.position && formik.errors.position}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WorkIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Department</InputLabel>
                <Select
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  label="Department"
                  error={formik.touched.department && Boolean(formik.errors.department)}
                  sx={{ borderRadius: 2 }}
                >
                  {departments.map(dept => (
                    <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                  ))}
                </Select>
                {formik.touched.department && formik.errors.department && (
                  <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                    {formik.errors.department}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Salary (QAR)"
                name="salary"
                type="number"
                value={formik.values.salary}
                onChange={formik.handleChange}
                error={formik.touched.salary && Boolean(formik.errors.salary)}
                helperText={formik.touched.salary && formik.errors.salary}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon color="success" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="info" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                error={formik.touched.phone && Boolean(formik.errors.phone)}
                helperText={formik.touched.phone && formik.errors.phone}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon color="secondary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Join Date"
                name="joinDate"
                type="date"
                value={formik.values.joinDate}
                onChange={formik.handleChange}
                InputLabelProps={{
                  shrink: true,
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateRangeIcon color="warning" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                multiline
                rows={3}
                value={formik.values.address}
                onChange={formik.handleChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 4, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
          <Button 
            onClick={handleCancel} 
            variant="outlined"
            size="large"
            sx={{ 
              mr: 2,
              borderRadius: 2,
              px: 3
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={16} /> : (editingId ? <EditIcon /> : <AddIcon />)}
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 4,
              bgcolor: editingId ? 'warning.main' : 'primary.main',
              '&:hover': {
                bgcolor: editingId ? 'warning.dark' : 'primary.dark',
              }
            }}
          >
            {editingId ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Employee Details Modal */}
      <Dialog
        open={Boolean(detailsModalEmployee)}
        onClose={() => setDetailsModalEmployee(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '500px'
          }
        }}
      >
        <DialogTitle sx={{ p: 0 }}>
          {detailsModalEmployee && (
            <Box
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                p: 4,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '100px',
                  height: '100px',
                  background: `radial-gradient(circle, ${alpha('#fff', 0.1)} 0%, transparent 70%)`,
                }
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="start" position="relative" zIndex={1}>
                <Box display="flex" alignItems="center">
                  <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    badgeContent={
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: 'success.main',
                          border: `3px solid white`,
                        }}
                      />
                    }
                  >
                    <Avatar
                      src={detailsModalEmployee.photoUrl}
                      sx={{
                        width: 80,
                        height: 80,
                        mr: 3,
                        bgcolor: alpha('#fff', 0.2),
                        fontSize: '2rem',
                        fontWeight: 700
                      }}
                    >
                      {detailsModalEmployee.name?.charAt(0)}
                    </Avatar>
                  </Badge>
                  <Box>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                      {detailsModalEmployee.name}
                    </Typography>
                    <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                      {detailsModalEmployee.position}
                    </Typography>
                    <Chip 
                      label={detailsModalEmployee.department} 
                      sx={{ 
                        bgcolor: alpha('#fff', 0.2), 
                        color: 'white', 
                        fontWeight: 600 
                      }} 
                    />
                  </Box>
                </Box>
                <IconButton 
                  onClick={() => setDetailsModalEmployee(null)} 
                  sx={{ 
                    color: 'white',
                    '&:hover': { bgcolor: alpha('#fff', 0.2) }
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {detailsModalEmployee && (
            <Box>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <EmailIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Contact Information
                      </Typography>
                    </Box>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <EmailIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Email Address"
                          secondary={detailsModalEmployee.email || 'Not provided'}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <PhoneIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Phone Number"
                          secondary={detailsModalEmployee.phone || 'Not provided'}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>

                {/* Employment Details */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <WorkIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Employment Details
                      </Typography>
                    </Box>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <BusinessIcon color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Department"
                          secondary={detailsModalEmployee.department}
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <DateRangeIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Join Date"
                          secondary={detailsModalEmployee.joinDate ? new Date(detailsModalEmployee.joinDate).toLocaleDateString() : 'Not provided'}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>

                {/* Salary Information */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={1} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})`,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <Box display="flex" alignItems="center" mb={3}>
                      <AttachMoneyIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="h6" fontWeight={600}>
                        Compensation Details
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center">
                          <Typography variant="h3" color="success.main" fontWeight={800}>
                            {detailsModalEmployee.salary ? `${detailsModalEmployee.salary.toLocaleString()}` : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            QAR Monthly
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center">
                          <Typography variant="h3" color="primary.main" fontWeight={800}>
                            {detailsModalEmployee.salary ? `${(detailsModalEmployee.salary * 12).toLocaleString()}` : 'N/A'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            QAR Annual
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Box textAlign="center">
                          <Typography variant="h3" color="warning.main" fontWeight={800}>
                            {detailsModalEmployee.totalPaid ? `${detailsModalEmployee.totalPaid.toLocaleString()}` : '0'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            QAR Total Paid
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Recent Transactions */}
                {detailsModalEmployee.transactions && detailsModalEmployee.transactions.length > 0 && (
                  <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <PaymentIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="h6" fontWeight={600}>
                          Recent Transactions
                        </Typography>
                      </Box>
                      <List>
                        {detailsModalEmployee.transactions.slice(0, 3).map((transaction, index) => (
                          <ListItem key={index} sx={{ px: 0, borderBottom: index < 2 ? 1 : 0, borderColor: 'divider' }}>
                            <ListItemIcon>
                              <AssignmentIcon color={transaction.type === 'salary' ? 'success' : 'warning'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={transaction.description}
                              secondary={`${new Date(transaction.date).toLocaleDateString()} • ${transaction.amount.toLocaleString()} QAR`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button 
            variant="outlined" 
            onClick={() => setDetailsModalEmployee(null)}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          {detailsModalEmployee && (
            <Button 
              variant="contained" 
              onClick={() => {
                handleEdit(detailsModalEmployee);
                setDetailsModalEmployee(null);
              }}
              startIcon={<EditIcon />}
              sx={{ borderRadius: 2 }}
            >
              Edit Employee
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;
