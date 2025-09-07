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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
} from '@mui/material';
import {
  Person as PersonIcon,
  ExpandMore as ExpandMoreIcon,
  Upload as UploadIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const Employees = () => {
  const theme = useTheme();
  const [employees, setEmployees] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate form completion progress
  const calculateProgress = (values) => {
    const requiredFields = ['name', 'passportNumber', 'passportExpiry', 'qidNumber', 'qidExpiry', 'salary', 'department', 'position'];
    const completedFields = requiredFields.filter(field => values[field] && values[field].toString().trim() !== '').length;
    return (completedFields / requiredFields.length) * 100;
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
    if (!expiry) return { status: 'unknown', message: 'No date', className: 'status-unknown' };
    
    const expiryDate = new Date(expiry);
    const today = new Date();
    const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', message: `Expired ${Math.abs(daysLeft)} days ago`, className: 'status-expired' };
    } else if (daysLeft <= 30) {
      return { status: 'critical', message: `${daysLeft} days left`, className: 'status-critical' };
    } else if (daysLeft <= 90) {
      return { status: 'warning', message: `${daysLeft} days left`, className: 'status-warning' };
    } else {
      return { status: 'ok', message: `${daysLeft} days left`, className: 'status-ok' };
    }
  };

  const handleEdit = (employee) => {
    setEditingId(employee.id);
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

  const filteredEmployees = employees.filter(employee =>
    employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.qid?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.passport?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="employees-page">
      <div className="page-header">
        <h2>👥 Employees</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Employee Form */}
      <div className="employee-form-section">
        <h3>{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
        <form onSubmit={formik.handleSubmit} className="employee-form">
          <div className="form-grid">
            {/* Personal Information */}
            <div className="form-group">
              <label>Name *</label>
              <input
                name="name"
                placeholder="Employee Name"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.name}
                className={formik.touched.name && formik.errors.name ? 'error' : ''}
              />
              {formik.touched.name && formik.errors.name && (
                <p className="error-message">{formik.errors.name}</p>
              )}
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Email"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.email}
                className={formik.touched.email && formik.errors.email ? 'error' : ''}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="error-message">{formik.errors.email}</p>
              )}
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                name="phone"
                placeholder="Phone Number"
                onChange={formik.handleChange}
                value={formik.values.phone}
              />
            </div>

            <div className="form-group">
              <label>Department *</label>
              <select
                name="department"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.department}
                className={formik.touched.department && formik.errors.department ? 'error' : ''}
              >
                <option value="">Select Department</option>
                <option value="HR">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="IT">Information Technology</option>
                <option value="Operations">Operations</option>
                <option value="Sales">Sales</option>
                <option value="Marketing">Marketing</option>
              </select>
              {formik.touched.department && formik.errors.department && (
                <p className="error-message">{formik.errors.department}</p>
              )}
            </div>

            <div className="form-group">
              <label>Position *</label>
              <input
                name="position"
                placeholder="Job Position"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.position}
                className={formik.touched.position && formik.errors.position ? 'error' : ''}
              />
              {formik.touched.position && formik.errors.position && (
                <p className="error-message">{formik.errors.position}</p>
              )}
            </div>

            <div className="form-group">
              <label>Salary (QAR) *</label>
              <input
                name="salary"
                type="number"
                placeholder="Monthly Salary"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.salary}
                className={formik.touched.salary && formik.errors.salary ? 'error' : ''}
              />
              {formik.touched.salary && formik.errors.salary && (
                <p className="error-message">{formik.errors.salary}</p>
              )}
            </div>

            {/* Passport Information */}
            <div className="form-group">
              <label>Passport Number *</label>
              <input
                name="passportNumber"
                placeholder="Passport Number"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.passportNumber}
                className={formik.touched.passportNumber && formik.errors.passportNumber ? 'error' : ''}
              />
              {formik.touched.passportNumber && formik.errors.passportNumber && (
                <p className="error-message">{formik.errors.passportNumber}</p>
              )}
            </div>

            <div className="form-group">
              <label>Passport Expiry *</label>
              <input
                name="passportExpiry"
                type="date"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.passportExpiry}
                className={formik.touched.passportExpiry && formik.errors.passportExpiry ? 'error' : ''}
              />
              {formik.touched.passportExpiry && formik.errors.passportExpiry && (
                <p className="error-message">{formik.errors.passportExpiry}</p>
              )}
            </div>

            {/* QID Information */}
            <div className="form-group">
              <label>QID Number *</label>
              <input
                name="qidNumber"
                placeholder="QID Number"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.qidNumber}
                className={formik.touched.qidNumber && formik.errors.qidNumber ? 'error' : ''}
              />
              {formik.touched.qidNumber && formik.errors.qidNumber && (
                <p className="error-message">{formik.errors.qidNumber}</p>
              )}
            </div>

            <div className="form-group">
              <label>QID Expiry *</label>
              <input
                name="qidExpiry"
                type="date"
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.qidExpiry}
                className={formik.touched.qidExpiry && formik.errors.qidExpiry ? 'error' : ''}
              />
              {formik.touched.qidExpiry && formik.errors.qidExpiry && (
                <p className="error-message">{formik.errors.qidExpiry}</p>
              )}
            </div>
          </div>

          {/* File Upload Sections */}
          <div className="upload-section">
            <div className="upload-group">
              <label>Passport Photo</label>
              <Dropzone
                onDrop={acceptedFiles => formik.setFieldValue('passportPhoto', acceptedFiles[0])}
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                maxSize={5242880} // 5MB
              >
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {formik.values.passportPhoto ? (
                      <p>📄 {formik.values.passportPhoto.name}</p>
                    ) : (
                      <p>📋 Drop passport photo here or click to browse</p>
                    )}
                  </div>
                )}
              </Dropzone>
            </div>

            <div className="upload-group">
              <label>QID Photo</label>
              <Dropzone
                onDrop={acceptedFiles => formik.setFieldValue('qidPhoto', acceptedFiles[0])}
                accept={{ 'image/*': ['.jpeg', '.jpg', '.png', '.gif'] }}
                maxSize={5242880} // 5MB
              >
                {({ getRootProps, getInputProps, isDragActive }) => (
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {formik.values.qidPhoto ? (
                      <p>📄 {formik.values.qidPhoto.name}</p>
                    ) : (
                      <p>🆔 Drop QID photo here or click to browse</p>
                    )}
                  </div>
                )}
              </Dropzone>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={formik.isSubmitting || loading}
              className="submit-btn"
            >
              {loading ? 'Saving...' : editingId ? 'Update' : 'Add'} Employee
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  formik.resetForm();
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Employees Table */}
      <div className="employees-table-section">
        <h3>Employee List ({filteredEmployees.length})</h3>
        <div className="table-wrapper">
          <table className="employees-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Position</th>
                <th>QID Status</th>
                <th>Passport Status</th>
                <th>Salary</th>
                <th>Total Paid</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(employee => {
                const qidStatus = checkExpiry(employee.qid?.expiry, 'QID');
                const passportStatus = checkExpiry(employee.passport?.expiry, 'Passport');
                
                return (
                  <tr key={employee.id}>
                    <td>
                      <div className="employee-name">
                        <strong>{employee.name}</strong>
                        {employee.email && <div className="employee-email">{employee.email}</div>}
                      </div>
                    </td>
                    <td>{employee.department}</td>
                    <td>{employee.position}</td>
                    <td>
                      <span className={`status-badge ${qidStatus.className}`}>
                        {qidStatus.message}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${passportStatus.className}`}>
                        {passportStatus.message}
                      </span>
                    </td>
                    <td>{employee.salary?.toLocaleString()} QAR</td>
                    <td>{(employee.totalPaid || 0).toLocaleString()} QAR</td>
                    <td className="actions">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="edit-btn"
                        title="Edit Employee"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id, employee.name)}
                        className="delete-btn"
                        title="Delete Employee"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="no-data">
              <p>No employees found. {searchTerm && 'Try adjusting your search terms.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Employees;
