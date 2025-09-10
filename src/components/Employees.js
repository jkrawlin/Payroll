import React, { useState, useEffect, useMemo } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { mockEmployees } from '../services/mockData';
import { useFormik } from 'formik';
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
  CircularProgress,
  Divider,
  Alert,
  AlertTitle,
  Stack,
  Tooltip,
  List,
  ListItem,
  ListItemText,
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
} from '@mui/icons-material';

// Register Chart.js components
ChartJS.register(ArcElement, Legend);

const Employees = () => {
  // Premium Desktop Theme
  const theme = useTheme();

  // Premium Desktop UI States
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [detailsModalEmployee, setDetailsModalEmployee] = useState(null);

  // Desktop-optimized initialization
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

  // Filter employees based on search and department
  useEffect(() => {
    let filtered = employees;
    
    if (debouncedSearchTerm) {
      filtered = filtered.filter(emp => 
        emp.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }
    
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.department === selectedDepartment);
    }
    
    setFilteredEmployees(filtered);
  }, [employees, debouncedSearchTerm, selectedDepartment]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      
      if (!isFirebaseConfigured) {
        console.log('Firebase not configured, using mock data');
        setEmployees(mockEmployees);
        return;
      }

      const employeesCollection = collection(db, 'employees');
      const employeeSnapshot = await getDocs(employeesCollection);
      const employeeList = employeeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(employeeList);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Error loading employees');
      setEmployees(mockEmployees);
    } finally {
      setLoading(false);
    }
  };

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

  const handleNameClick = async (employee) => {
    setDetailsModalEmployee(employee);
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete ${employeeName}? This action cannot be undone.`)) {
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

  const handleCancel = () => {
    setEditingId(null);
    setShowForm(false);
    formik.resetForm();
  };

  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required('Name is required'),
    position: Yup.string().required('Position is required'),
    department: Yup.string().required('Department is required'),
    salary: Yup.number().positive('Salary must be positive').required('Salary is required'),
    email: Yup.string().email('Invalid email format'),
  });

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

  // Calculate current employees for pagination
  const currentEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredEmployees.slice(startIndex, endIndex);
  }, [filteredEmployees, currentPage, itemsPerPage]);

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
                    <SearchIcon color="action" />
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

            <Divider sx={{ my: 3 }} />

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

            {/* Department Chart */}
            {employees.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
                  Department Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <Pie
                    data={{
                      labels: [...new Set(employees.map(emp => emp.department))],
                      datasets: [{
                        data: [...new Set(employees.map(emp => emp.department))].map(dept => 
                          employees.filter(emp => emp.department === dept).length
                        ),
                        backgroundColor: [
                          theme.palette.primary.main,
                          theme.palette.secondary.main,
                          theme.palette.success.main,
                          theme.palette.warning.main,
                          theme.palette.error.main,
                          theme.palette.info.main,
                        ],
                        borderWidth: 2,
                        borderColor: theme.palette.background.paper
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: { size: 11, weight: '500' }
                          }
                        }
                      }
                    }}
                  />
                </Box>
              </Box>
            )}
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
                      field: 'contact',
                      headerName: 'Contact',
                      width: 200,
                      renderCell: (params) => (
                        <Box sx={{ py: 1 }}>
                          {params.row.email && (
                            <Typography variant="body2" sx={{ fontSize: '0.8rem', mb: 0.5, display: 'flex', alignItems: 'center' }}>
                              <EmailIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                              {params.row.email}
                            </Typography>
                          )}
                          {params.row.phone && (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ mr: 1, fontSize: '0.9rem' }} />
                              {params.row.phone}
                            </Typography>
                          )}
                        </Box>
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

      {/* Premium Employee Form Dialog */}
      <Dialog 
        open={showForm} 
        onClose={handleCancel}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { 
            borderRadius: 3,
            boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              {editingId ? 'Edit Employee' : 'Add New Employee'}
            </Typography>
            <IconButton onClick={handleCancel} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ 
          p: 4,
          minHeight: '400px',
          backgroundColor: theme.palette.background.default,
          '& .MuiTextField-root': {
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper,
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
              '&.Mui-focused': {
                backgroundColor: theme.palette.background.paper,
                boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.1)}`,
              }
            }
          }
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Fill in the employee information below. All fields marked with * are required.
          </Typography>
          
          {/* Employee Form Content */}
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
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
                  InputProps={{
                    startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
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
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          p: 3, 
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.08)}`
        }}>
          <Button 
            onClick={handleCancel}
            variant="outlined"
            sx={{ 
              borderRadius: 2, 
              px: 3,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={formik.handleSubmit}
            variant="contained"
            disabled={formik.isSubmitting}
            sx={{ 
              borderRadius: 2, 
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
            }}
          >
            {formik.isSubmitting ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Saving...
              </>
            ) : (
              editingId ? 'Update Employee' : 'Add Employee'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Employee Details Modal */}
      <Dialog
        open={Boolean(detailsModalEmployee)}
        onClose={() => setDetailsModalEmployee(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
            minHeight: '75vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h5" fontWeight={700}>
              Employee Details
            </Typography>
            <IconButton onClick={() => setDetailsModalEmployee(null)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 4 }}>
          {detailsModalEmployee && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    src={detailsModalEmployee.photoUrl}
                    sx={{
                      width: 120,
                      height: 120,
                      mx: 'auto',
                      mb: 2,
                      fontSize: '2rem',
                      fontWeight: 700,
                      bgcolor: 'primary.main',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }}
                  >
                    {detailsModalEmployee.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                    {detailsModalEmployee.name}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {detailsModalEmployee.position}
                  </Typography>
                  <Chip
                    label={detailsModalEmployee.department}
                    color="primary"
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Employee Information
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailsModalEmployee.email || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailsModalEmployee.phone || 'Not provided'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Monthly Salary</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={700}>
                      {detailsModalEmployee.salary?.toLocaleString()} QAR
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Employee ID</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailsModalEmployee.id}
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: 'span 2' }}>
                    <Typography variant="body2" color="text.secondary">Address</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailsModalEmployee.address || 'Not provided'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Employees;
