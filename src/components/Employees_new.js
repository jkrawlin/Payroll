import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
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
} from '@mui/material';
import {
  Person as PersonIcon,
  Search as SearchIcon,
  Upload as UploadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Employees = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);

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
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEmployees(employeesList);
    } catch (error) {
      toast.error('Error fetching employees');
      console.error('Error fetching employees:', error);
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
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
                <PersonIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography variant="h3" fontWeight={700} gutterBottom>
                  Employee Management
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Manage employee information, documents, and records
                </Typography>
              </Box>
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
                fontWeight: 600
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
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search employees by name, department, QID, or passport..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary">
                  {filteredEmployees.length} of {employees.length} employees found
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Employees Table */}
        <Grid item xs={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
                  Employee List
                </Typography>

                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                        <TableCell><strong>Employee</strong></TableCell>
                        <TableCell><strong>Department</strong></TableCell>
                        <TableCell><strong>Position</strong></TableCell>
                        <TableCell><strong>QID Status</strong></TableCell>
                        <TableCell><strong>Passport Status</strong></TableCell>
                        <TableCell><strong>Salary</strong></TableCell>
                        <TableCell><strong>Total Paid</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEmployees.map((employee, index) => {
                        const qidStatus = checkExpiry(employee.qid?.expiry, 'QID');
                        const passportStatus = checkExpiry(employee.passport?.expiry, 'Passport');
                        
                        return (
                          <motion.tr
                            key={employee.id}
                            component={TableRow}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            sx={{ 
                              '&:nth-of-type(odd)': { 
                                bgcolor: alpha(theme.palette.action.hover, 0.5) 
                              },
                              '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <Avatar sx={{ 
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  mr: 2
                                }}>
                                  <PersonIcon />
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {employee.name}
                                  </Typography>
                                  {employee.email && (
                                    <Typography variant="body2" color="text.secondary">
                                      {employee.email}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>{employee.department}</TableCell>
                            <TableCell>{employee.position}</TableCell>
                            <TableCell>
                              <Chip 
                                label={qidStatus.message}
                                color={qidStatus.color}
                                size="small"
                                variant={qidStatus.color === 'default' ? 'outlined' : 'filled'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={passportStatus.message}
                                color={passportStatus.color}
                                size="small"
                                variant={passportStatus.color === 'default' ? 'outlined' : 'filled'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {employee.salary?.toLocaleString()} QAR
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} color="success.main">
                                {(employee.totalPaid || 0).toLocaleString()} QAR
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box display="flex" gap={1}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(employee)}
                                  sx={{ 
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(employee.id, employee.name)}
                                  sx={{ 
                                    color: theme.palette.error.main,
                                    '&:hover': {
                                      bgcolor: alpha(theme.palette.error.main, 0.1)
                                    }
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </motion.tr>
                        );
                      })}
                    </TableBody>
                  </Table>
                  
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
                </TableContainer>
              </CardContent>
            </Card>
          </motion.div>
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
    </Box>
  );
};

export default Employees;
