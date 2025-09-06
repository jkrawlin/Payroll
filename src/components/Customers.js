import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';

const Customers = () => {
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
      notes: ''
    },
    validationSchema: customerValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const customerData = {
          ...values,
          invoices: editingId ? customers.find(c => c.id === editingId)?.invoices || [] : [],
          totalInvoiced: editingId ? customers.find(c => c.id === editingId)?.totalInvoiced || 0 : 0,
          totalPaid: editingId ? customers.find(c => c.id === editingId)?.totalPaid || 0 : 0,
          createdAt: editingId ? customers.find(c => c.id === editingId)?.createdAt : new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (editingId) {
          await updateDoc(doc(db, 'customers', editingId), customerData);
          toast.success('Customer updated successfully');
          setEditingId(null);
        } else {
          await addDoc(collection(db, 'customers'), customerData);
          toast.success('Customer added successfully');
        }

        resetForm();
        fetchCustomers();
      } catch (error) {
        toast.error(`Error saving customer: ${error.message}`);
        console.error('Error saving customer:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const invoiceFormik = useFormik({
    initialValues: {
      amount: '',
      description: '',
      dueDate: '',
      notes: ''
    },
    validationSchema: invoiceValidationSchema,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      if (!selectedCustomer) return;

      try {
        const invoiceData = {
          id: Date.now().toString(),
          amount: parseFloat(values.amount),
          description: values.description,
          dueDate: values.dueDate,
          notes: values.notes,
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: 'Admin' // In real app, get from auth context
        };

        await updateDoc(doc(db, 'customers', selectedCustomer.id), {
          invoices: arrayUnion(invoiceData),
          totalInvoiced: (selectedCustomer.totalInvoiced || 0) + parseFloat(values.amount)
        });

        toast.success('Invoice created successfully');
        resetForm();
        setShowInvoiceForm(false);
        fetchCustomers();
        
        // Update selected customer
        const updatedCustomer = { 
          ...selectedCustomer, 
          invoices: [...(selectedCustomer.invoices || []), invoiceData],
          totalInvoiced: (selectedCustomer.totalInvoiced || 0) + parseFloat(values.amount)
        };
        setSelectedCustomer(updatedCustomer);
      } catch (error) {
        toast.error(`Error creating invoice: ${error.message}`);
        console.error('Error creating invoice:', error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

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

  const handleEdit = (customer) => {
    setEditingId(customer.id);
    customerFormik.setValues({
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      taxId: customer.taxId || '',
      notes: customer.notes || ''
    });
  };

  const handleDelete = async (customerId, customerName) => {
    if (window.confirm(`Are you sure you want to delete ${customerName}? This will also delete all associated invoices.`)) {
      try {
        await deleteDoc(doc(db, 'customers', customerId));
        toast.success('Customer deleted successfully');
        fetchCustomers();
        if (selectedCustomer?.id === customerId) {
          setSelectedCustomer(null);
        }
      } catch (error) {
        toast.error('Error deleting customer');
        console.error('Error deleting customer:', error);
      }
    }
  };

  const markInvoicePaid = async (customerId, invoiceId) => {
    try {
      const customer = customers.find(c => c.id === customerId);
      if (!customer) return;

      const updatedInvoices = customer.invoices.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, status: 'paid', paidDate: new Date().toISOString() }
          : invoice
      );

      const paidInvoice = customer.invoices.find(inv => inv.id === invoiceId);
      const newTotalPaid = (customer.totalPaid || 0) + (paidInvoice?.amount || 0);

      await updateDoc(doc(db, 'customers', customerId), {
        invoices: updatedInvoices,
        totalPaid: newTotalPaid
      });

      // Update accounts ledger
      try {
        const accountsRef = doc(db, 'accounts', 'main');
        await updateDoc(accountsRef, {
          ledger: arrayUnion({
            date: new Date().toISOString(),
            type: 'credit',
            amount: paidInvoice?.amount || 0,
            description: `Payment from ${customer.name} - ${paidInvoice?.description}`,
            category: 'revenue'
          })
        });
      } catch (error) {
        console.log('Accounts collection may not exist yet');
      }

      toast.success('Invoice marked as paid');
      fetchCustomers();
      
      // Update selected customer if it's the current one
      if (selectedCustomer?.id === customerId) {
        const updatedCustomer = { 
          ...customer, 
          invoices: updatedInvoices, 
          totalPaid: newTotalPaid 
        };
        setSelectedCustomer(updatedCustomer);
      }
    } catch (error) {
      toast.error('Error updating invoice status');
      console.error('Error updating invoice:', error);
    }
  };

  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'status-paid';
      case 'pending': return 'status-pending';
      case 'overdue': return 'status-overdue';
      default: return 'status-pending';
    }
  };

  const isInvoiceOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  return (
    <div className="customers-page">
      <div className="page-header">
        <h2>🏢 Customers</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="customers-content">
        {/* Customer Form */}
        <div className="customer-form-section">
          <h3>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
          <form onSubmit={customerFormik.handleSubmit} className="customer-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  name="name"
                  placeholder="Company Name"
                  onChange={customerFormik.handleChange}
                  onBlur={customerFormik.handleBlur}
                  value={customerFormik.values.name}
                  className={customerFormik.touched.name && customerFormik.errors.name ? 'error' : ''}
                />
                {customerFormik.touched.name && customerFormik.errors.name && (
                  <p className="error-message">{customerFormik.errors.name}</p>
                )}
              </div>

              <div className="form-group">
                <label>Contact Person *</label>
                <input
                  name="contactPerson"
                  placeholder="Contact Person Name"
                  onChange={customerFormik.handleChange}
                  onBlur={customerFormik.handleBlur}
                  value={customerFormik.values.contactPerson}
                  className={customerFormik.touched.contactPerson && customerFormik.errors.contactPerson ? 'error' : ''}
                />
                {customerFormik.touched.contactPerson && customerFormik.errors.contactPerson && (
                  <p className="error-message">{customerFormik.errors.contactPerson}</p>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Email"
                  onChange={customerFormik.handleChange}
                  onBlur={customerFormik.handleBlur}
                  value={customerFormik.values.email}
                  className={customerFormik.touched.email && customerFormik.errors.email ? 'error' : ''}
                />
                {customerFormik.touched.email && customerFormik.errors.email && (
                  <p className="error-message">{customerFormik.errors.email}</p>
                )}
              </div>

              <div className="form-group">
                <label>Phone *</label>
                <input
                  name="phone"
                  placeholder="Phone Number"
                  onChange={customerFormik.handleChange}
                  onBlur={customerFormik.handleBlur}
                  value={customerFormik.values.phone}
                  className={customerFormik.touched.phone && customerFormik.errors.phone ? 'error' : ''}
                />
                {customerFormik.touched.phone && customerFormik.errors.phone && (
                  <p className="error-message">{customerFormik.errors.phone}</p>
                )}
              </div>

              <div className="form-group">
                <label>Tax ID</label>
                <input
                  name="taxId"
                  placeholder="Tax ID"
                  onChange={customerFormik.handleChange}
                  value={customerFormik.values.taxId}
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  name="address"
                  placeholder="Company Address"
                  onChange={customerFormik.handleChange}
                  value={customerFormik.values.address}
                  rows="2"
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  name="notes"
                  placeholder="Additional notes"
                  onChange={customerFormik.handleChange}
                  value={customerFormik.values.notes}
                  rows="2"
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={customerFormik.isSubmitting}
                className="submit-btn"
              >
                {customerFormik.isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Add'} Customer
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    customerFormik.resetForm();
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Customers List */}
        <div className="customers-list-section">
          <h3>Customer List ({filteredCustomers.length})</h3>
          <div className="customers-grid">
            {filteredCustomers.map(customer => {
              const outstandingAmount = (customer.totalInvoiced || 0) - (customer.totalPaid || 0);
              return (
                <div 
                  key={customer.id} 
                  className={`customer-card ${selectedCustomer?.id === customer.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <div className="customer-header">
                    <h4>{customer.name}</h4>
                    <div className="customer-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(customer);
                        }}
                        className="edit-btn"
                        title="Edit Customer"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(customer.id, customer.name);
                        }}
                        className="delete-btn"
                        title="Delete Customer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="customer-info">
                    <p><strong>Contact:</strong> {customer.contactPerson}</p>
                    <p><strong>Phone:</strong> {customer.phone}</p>
                    {customer.email && <p><strong>Email:</strong> {customer.email}</p>}
                    <div className="customer-stats">
                      <p><strong>Total Invoiced:</strong> {(customer.totalInvoiced || 0).toLocaleString()} QAR</p>
                      <p><strong>Total Paid:</strong> {(customer.totalPaid || 0).toLocaleString()} QAR</p>
                      <p className={outstandingAmount > 0 ? 'outstanding-positive' : 'outstanding-zero'}>
                        <strong>Outstanding:</strong> {outstandingAmount.toLocaleString()} QAR
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="no-data">
              <p>No customers found. {searchTerm && 'Try adjusting your search terms.'}</p>
            </div>
          )}
        </div>

        {/* Customer Details and Invoices */}
        {selectedCustomer && (
          <div className="customer-details-section">
            <div className="section-header">
              <h3>📋 {selectedCustomer.name} - Invoices</h3>
              <button
                onClick={() => setShowInvoiceForm(!showInvoiceForm)}
                className="add-invoice-btn"
              >
                {showInvoiceForm ? '✖️ Cancel' : '➕ Add Invoice'}
              </button>
            </div>

            {/* Invoice Form */}
            {showInvoiceForm && (
              <div className="invoice-form-section">
                <h4>Create New Invoice</h4>
                <form onSubmit={invoiceFormik.handleSubmit} className="invoice-form">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Amount (QAR) *</label>
                      <input
                        name="amount"
                        type="number"
                        placeholder="Invoice Amount"
                        onChange={invoiceFormik.handleChange}
                        onBlur={invoiceFormik.handleBlur}
                        value={invoiceFormik.values.amount}
                        className={invoiceFormik.touched.amount && invoiceFormik.errors.amount ? 'error' : ''}
                      />
                      {invoiceFormik.touched.amount && invoiceFormik.errors.amount && (
                        <p className="error-message">{invoiceFormik.errors.amount}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Due Date</label>
                      <input
                        name="dueDate"
                        type="date"
                        onChange={invoiceFormik.handleChange}
                        onBlur={invoiceFormik.handleBlur}
                        value={invoiceFormik.values.dueDate}
                        className={invoiceFormik.touched.dueDate && invoiceFormik.errors.dueDate ? 'error' : ''}
                      />
                      {invoiceFormik.touched.dueDate && invoiceFormik.errors.dueDate && (
                        <p className="error-message">{invoiceFormik.errors.dueDate}</p>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label>Description *</label>
                      <textarea
                        name="description"
                        placeholder="Invoice description"
                        onChange={invoiceFormik.handleChange}
                        onBlur={invoiceFormik.handleBlur}
                        value={invoiceFormik.values.description}
                        rows="3"
                        className={invoiceFormik.touched.description && invoiceFormik.errors.description ? 'error' : ''}
                      />
                      {invoiceFormik.touched.description && invoiceFormik.errors.description && (
                        <p className="error-message">{invoiceFormik.errors.description}</p>
                      )}
                    </div>

                    <div className="form-group full-width">
                      <label>Notes</label>
                      <textarea
                        name="notes"
                        placeholder="Additional notes"
                        onChange={invoiceFormik.handleChange}
                        value={invoiceFormik.values.notes}
                        rows="2"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={invoiceFormik.isSubmitting}
                    className="submit-btn"
                  >
                    {invoiceFormik.isSubmitting ? 'Creating...' : 'Create Invoice'}
                  </button>
                </form>
              </div>
            )}

            {/* Invoices List */}
            <div className="invoices-list">
              {selectedCustomer.invoices && selectedCustomer.invoices.length > 0 ? (
                selectedCustomer.invoices
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((invoice) => {
                    const overdue = invoice.status === 'pending' && invoice.dueDate && isInvoiceOverdue(invoice.dueDate);
                    return (
                      <div key={invoice.id} className={`invoice-item ${overdue ? 'overdue' : ''}`}>
                        <div className="invoice-info">
                          <div className="invoice-header">
                            <strong>Invoice #{invoice.id}</strong>
                            <span className={`status-badge ${getInvoiceStatusColor(overdue ? 'overdue' : invoice.status)}`}>
                              {overdue ? 'Overdue' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </span>
                          </div>
                          <p>{invoice.description}</p>
                          <div className="invoice-details">
                            <small>Created: {new Date(invoice.createdAt).toLocaleDateString()}</small>
                            {invoice.dueDate && (
                              <small>Due: {new Date(invoice.dueDate).toLocaleDateString()}</small>
                            )}
                            {invoice.paidDate && (
                              <small>Paid: {new Date(invoice.paidDate).toLocaleDateString()}</small>
                            )}
                          </div>
                        </div>
                        <div className="invoice-actions">
                          <div className="invoice-amount">
                            {invoice.amount.toLocaleString()} QAR
                          </div>
                          {invoice.status === 'pending' && (
                            <button
                              onClick={() => markInvoicePaid(selectedCustomer.id, invoice.id)}
                              className="pay-btn"
                            >
                              💰 Mark Paid
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="no-data">No invoices for this customer yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
