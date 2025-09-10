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
} from '@mui/icons-material';

// Validation Schema
const validationSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  position: Yup.string().required('Position is required'),
  department: Yup.string().required('Department is required'),
  salary: Yup.number().positive('Salary must be positive').required('Salary is required'),
  email: Yup.string().email('Invalid email format'),
});

// Premium Desktop Employees Component - Clean build version
const Employees = () => {
  const theme = useTheme();

  // State Management
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailsModalEmployee, setDetailsModalEmployee] = useState(null);
  const [pageSize, setPageSize] = useState(25);

  // Fetch employees data
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!isFirebaseConfigured) {
        console.log('Firebase not configured, using mock data');
        setEmployees(mockEmployees);
        return;
      }

      const employeesCollection = collection(db, 'employees');
      const employeeSnapshot = await getDocs(employeesCollection);
      const employeeList = employeeSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees');
      setEmployees(mockEmployees);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Filter employees
  useEffect(() => {
    let filtered = employees;
    
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, searchTerm, selectedDepartment]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalEmployees = filteredEmployees.length;
    const departments = new Set(employees.map(emp => emp.department)).size;
    const avgSalary = employees.length > 0 
      ? Math.round(employees.reduce((sum, emp) => sum + (emp.salary || 0), 0) / employees.length)
      : 0;
    
    return { totalEmployees, departments, avgSalary };
  }, [employees, filteredEmployees]);

  // Form handlers
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
      address: employee.address || '',
    });
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}?`)) {
      try {
        if (isFirebaseConfigured) {
          await deleteDoc(doc(db, 'employees', employeeId));
        }
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

  // Formik form handling
  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      salary: '',
      address: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const employeeData = {
          ...values,
          salary: parseFloat(values.salary) || 0,
          createdAt: editingId ? employees.find(e => e.id === editingId)?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (isFirebaseConfigured) {
          if (editingId) {
            await updateDoc(doc(db, 'employees', editingId), employeeData);
            toast.success('Employee updated successfully');
          } else {
            await addDoc(collection(db, 'employees'), employeeData);
            toast.success('Employee added successfully');
          }
        } else {
          toast.success(editingId ? 'Employee updated successfully' : 'Employee added successfully');
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

  // DataGrid columns
  const columns = [
    {
      field: 'employee',
      headerName: 'Employee',
      width: 280,
      renderCell: (params) => (
        <Box
          display="flex"
          alignItems="center"
          sx={{ py: 1.5, cursor: 'pointer' }}
          onClick={() => setDetailsModalEmployee(params.row)}
        >
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
              mr: 2,
              width: 40,
              height: 40,
            }}
          >
            {params.row.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              {params.row.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {params.row.position}
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
          variant="outlined"
        />
      ),
    },
    {
      field: 'contact',
      headerName: 'Contact',
      width: 200,
      renderCell: (params) => (
        <Box>
          {params.row.email && (
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <EmailIcon sx={{ mr: 1, fontSize: 16 }} />
              {params.row.email}
            </Typography>
          )}
          {params.row.phone && (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
              {params.row.phone}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" color="success.main" fontWeight={600}>
          {params.row.salary ? `${params.row.salary.toLocaleString()} QAR` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(params.row);
            }}
            sx={{
              color: 'primary.main',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.row.id, params.row.name);
            }}
            sx={{
              color: 'error.main',
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Header */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 4, 
          mb: 3, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
          color: 'white',
          borderRadius: 2
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Employee Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Premium desktop employee directory and management system
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{
              bgcolor: alpha('#fff', 0.2),
              '&:hover': { bgcolor: alpha('#fff', 0.3) },
              px: 3
            }}
          >
            Add Employee
          </Button>
        </Box>
      </Paper>

      {/* Dashboard Layout */}
      <Grid container spacing={3}>
        {/* Sidebar */}
        <Grid item xs={12} md={3}>
          <Stack spacing={3}>
            {/* Search */}
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Search & Filter
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    label="Department"
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
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card elevation={1}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Quick Stats
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <GroupsIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Total Employees
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {statistics.totalEmployees}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <BusinessIcon color="secondary" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Departments
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="secondary" fontWeight={700}>
                      {statistics.departments}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 1 }}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Avg Salary
                      </Typography>
                    </Box>
                    <Typography variant="h4" color="success.main" fontWeight={700}>
                      {statistics.avgSalary.toLocaleString()} QAR
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={9}>
          <Card elevation={1}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h5" fontWeight={600}>
                  Employee Directory
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredEmployees.length} employees • Premium desktop interface
                </Typography>
              </Box>
              
              <Box sx={{ height: 600, width: '100%' }}>
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
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                    '& .MuiDataGrid-row:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                    },
                  }}
                />
              </Box>
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
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {editingId ? 'Edit Employee' : 'Add New Employee'}
            </Typography>
            <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name *"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Position *"
                name="position"
                value={formik.values.position}
                onChange={formik.handleChange}
                error={formik.touched.position && Boolean(formik.errors.position)}
                helperText={formik.touched.position && formik.errors.position}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Department *</InputLabel>
                <Select
                  name="department"
                  value={formik.values.department}
                  onChange={formik.handleChange}
                  label="Department *"
                  error={formik.touched.department && Boolean(formik.errors.department)}
                >
                  <MenuItem value="HR">Human Resources</MenuItem>
                  <MenuItem value="IT">Information Technology</MenuItem>
                  <MenuItem value="Finance">Finance</MenuItem>
                  <MenuItem value="Operations">Operations</MenuItem>
                  <MenuItem value="Sales">Sales</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Salary (QAR) *"
                name="salary"
                type="number"
                value={formik.values.salary}
                onChange={formik.handleChange}
                error={formik.touched.salary && Boolean(formik.errors.salary)}
                helperText={formik.touched.salary && formik.errors.salary}
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
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
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
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCancel} variant="outlined">
            Cancel
          </Button>
          <Button 
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting && <CircularProgress size={16} />}
          >
            {editingId ? 'Update Employee' : 'Add Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Details Dialog */}
      <Dialog
        open={Boolean(detailsModalEmployee)}
        onClose={() => setDetailsModalEmployee(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="between" alignItems="center">
            <Typography variant="h6">Employee Details</Typography>
            <IconButton onClick={() => setDetailsModalEmployee(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsModalEmployee && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {detailsModalEmployee.name?.charAt(0)}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {detailsModalEmployee.name}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {detailsModalEmployee.position}
              </Typography>
              <Chip label={detailsModalEmployee.department} color="primary" sx={{ mb: 2 }} />
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{detailsModalEmployee.email || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1">{detailsModalEmployee.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Salary</Typography>
                  <Typography variant="h6" color="success.main">
                    {detailsModalEmployee.salary ? `${detailsModalEmployee.salary.toLocaleString()} QAR` : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Employees;
