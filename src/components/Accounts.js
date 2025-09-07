import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';
import { DataGrid } from '@mui/x-data-grid';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Grid,
  Paper,
  Divider,
  useTheme,
  alpha,
  Tab,
  Tabs,
  Avatar,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  PieChart as PieChartIcon,
  Receipt as ReceiptIcon,
  AttachMoney as AttachMoneyIcon,
  Search as SearchIcon,
  GetApp as ExportIcon,
  Add as AddIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

const Accounts = () => {
  const theme = useTheme();
  const [ledger, setLedger] = useState([]);
  const [balance, setBalance] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit'); // credit or debit
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // New states for employee lookup and accounts management
  const [qatarId, setQatarId] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearching, setEmployeeSearching] = useState(false);
  const [employeeAccounts, setEmployeeAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, employee-lookup, transactions, reports
  const [employees, setEmployees] = useState([]);
  const [customerAccounts, setCustomerAccounts] = useState([]);
  const [payrollAccounts, setPayrollAccounts] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Add missing searchTerm state
  
  // New state for cashflow calculations
  const [cashFlow, setCashFlow] = useState({
    totalCredits: 0,
    totalDebits: 0,
    netFlow: 0
  });

  const categories = [
    { value: 'general', label: 'General Ledger', icon: <AccountBalanceIcon /> },
    { value: 'payroll', label: 'Payroll & Salaries', icon: <AttachMoneyIcon /> },
    { value: 'employee-advance', label: 'Employee Advances', icon: <AccountBalanceIcon /> },
    { value: 'employee-deduction', label: 'Employee Deductions', icon: <TrendingDownIcon /> },
    { value: 'revenue', label: 'Revenue & Income', icon: <TrendingUpIcon /> },
    { value: 'customer-payment', label: 'Customer Payments', icon: <AttachMoneyIcon /> },
    { value: 'expenses', label: 'Operating Expenses', icon: <TrendingDownIcon /> },
    { value: 'office', label: 'Office Expenses', icon: <AccountBalanceIcon /> },
    { value: 'utilities', label: 'Utilities & Bills', icon: <AccountBalanceIcon /> },
    { value: 'transport', label: 'Transport & Travel', icon: <TrendingDownIcon /> },
    { value: 'supplies', label: 'Supplies & Materials', icon: <AccountBalanceIcon /> },
    { value: 'maintenance', label: 'Maintenance & Repairs', icon: <TrendingDownIcon /> },
    { value: 'insurance', label: 'Insurance & Benefits', icon: <AccountBalanceIcon /> },
    { value: 'tax-gov', label: 'Tax & Government Fees', icon: <TrendingDownIcon /> },
    { value: 'bank-charges', label: 'Bank Charges & Fees', icon: <AccountBalanceIcon /> }
  ];

  // Helper functions for enhanced UI
  const generateTrendData = (metric) => {
    // Generate mock trend data for mini-charts
    const days = 30;
    const data = [];
    let baseValue = metric === 'balance' ? balance : 
                   metric === 'outstanding' ? outstanding :
                   Math.random() * 10000;
    
    for (let i = 0; i < days; i++) {
      data.push(baseValue + (Math.random() - 0.5) * 1000);
    }
    
    return {
      labels: Array.from({ length: days }, (_, i) => `Day ${i + 1}`),
      datasets: [{
        data,
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      }]
    };
  };

  const createOverviewTableData = () => {
    // Calculate 30-day cash flow
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentEntries = ledger.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= thirtyDaysAgo;
    });

    const totalCredits = recentEntries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalDebits = recentEntries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    const employeeAdvances = ledger
      .filter(entry => entry.category === 'employee-advance' && entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return [
      {
        id: 1,
        metric: 'Current Balance',
        value: `${balance.toLocaleString()} QAR`,
        change: balance >= 0 ? '+' + Math.abs(balance * 0.05).toFixed(0) : '-' + Math.abs(balance * 0.05).toFixed(0),
        trend: 'up',
        icon: <AccountBalanceIcon sx={{ color: 'primary.main' }} />
      },
      {
        id: 2,
        metric: 'Outstanding Amount',
        value: `${outstanding.toLocaleString()} QAR`,
        change: '-' + Math.abs(outstanding * 0.1).toFixed(0),
        trend: 'down',
        icon: <PieChartIcon sx={{ color: 'warning.main' }} />
      },
      {
        id: 3,
        metric: '30-Day Inflow',
        value: `${totalCredits.toLocaleString()} QAR`,
        change: '+' + Math.abs(totalCredits * 0.15).toFixed(0),
        trend: 'up',
        icon: <TrendingUpIcon sx={{ color: 'success.main' }} />
      },
      {
        id: 4,
        metric: '30-Day Outflow',
        value: `${totalDebits.toLocaleString()} QAR`,
        change: '-' + Math.abs(totalDebits * 0.08).toFixed(0),
        trend: 'down',
        icon: <TrendingDownIcon sx={{ color: 'error.main' }} />
      },
      {
        id: 5,
        metric: 'Employee Advances',
        value: `${employeeAdvances.toLocaleString()} QAR`,
        change: '+' + Math.abs(employeeAdvances * 0.05).toFixed(0),
        trend: 'neutral',
        icon: <AttachMoneyIcon sx={{ color: 'info.main' }} />
      },
      {
        id: 6,
        metric: 'Active Employees',
        value: `${employees.length}`,
        change: '+2',
        trend: 'up',
        icon: <AccountBalanceIcon sx={{ color: 'secondary.main' }} />
      }
    ];
  };

  const createCategoryBreakdownData = () => {
    const categoryTotals = categories.map(category => {
      const categoryEntries = ledger.filter(entry => entry.category === category.value);
      const total = categoryEntries.reduce((sum, entry) => {
        return sum + (entry.type === 'credit' ? entry.amount : -entry.amount);
      }, 0);
      
      return {
        label: category.label,
        value: Math.abs(total),
        category: category.value,
      };
    }).filter(item => item.value > 0);

    return {
      labels: categoryTotals.map(item => item.label),
      datasets: [{
        data: categoryTotals.map(item => item.value),
        backgroundColor: [
          '#6a1b9a', '#00bcd4', '#4caf50', '#ff9800',
          '#f44336', '#9c27b0', '#2196f3', '#8bc34a',
          '#ffeb3b', '#795548', '#607d8b', '#e91e63',
          '#3f51b5', '#009688', '#cddc39'
        ],
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#fff'
      }]
    };
  };

  const overviewTableColumns = [
    {
      field: 'icon',
      headerName: '',
      width: 60,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          {params.value}
        </Box>
      ),
      sortable: false,
    },
    {
      field: 'metric',
      headerName: 'Metric',
      width: 200,
      renderCell: (params) => (
        <Typography variant="body1" fontWeight={600}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'value',
      headerName: 'Value',
      width: 150,
      renderCell: (params) => (
        <Typography variant="body1" fontWeight={500}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'change',
      headerName: 'Change',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          icon={params.row.trend === 'up' ? <TrendingUpIcon /> : 
               params.row.trend === 'down' ? <TrendingDownIcon /> : null}
          color={params.row.trend === 'up' ? 'success' : 
                params.row.trend === 'down' ? 'error' : 'default'}
          sx={{ fontWeight: 600 }}
        />
      ),
    },
    {
      field: 'trend',
      headerName: '30-Day Trend',
      width: 200,
      renderCell: (params) => (
        <Box sx={{ width: '100%', height: 40 }}>
          <Line
            data={generateTrendData(params.row.metric.toLowerCase())}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { display: false },
                y: { display: false }
              },
              elements: {
                point: { radius: 0 }
              }
            }}
          />
        </Box>
      ),
    },
  ];

  useEffect(() => {
    fetchAccounts();
    fetchEmployees();
    fetchEmployeeAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const accountsDoc = await getDoc(doc(db, 'accounts', 'main'));
      if (accountsDoc.exists()) {
        const data = accountsDoc.data();
        const ledgerData = data.ledger || [];
        setLedger(ledgerData);
        
        // Calculate balance (credits - debits)
        const calcBalance = ledgerData.reduce((acc, entry) => {
          return acc + (entry.type === 'credit' ? entry.amount : -entry.amount);
        }, 0);
        setBalance(calcBalance);
        
        // Calculate outstanding (simplified - sum of unpaid advances and pending invoices)
        // In a real system, this would come from employee advances and customer invoices
        const outstandingDebits = ledgerData
          .filter(entry => entry.type === 'debit' && entry.category === 'payroll')
          .reduce((sum, entry) => sum + entry.amount, 0);
        setOutstanding(outstandingDebits * 0.1); // Placeholder calculation
      } else {
        // Initialize accounts document if it doesn't exist
        await setDoc(doc(db, 'accounts', 'main'), {
          ledger: [],
          balance: 0,
          outstanding: 0,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      toast.error('Error fetching accounts');
      console.error('Error fetching accounts:', error);
    }
  };

  // Fetch all employees for Qatar ID lookup
  const fetchEmployees = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employees'));
      const employeesList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployees(employeesList);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  // Fetch employee-specific accounts
  const fetchEmployeeAccounts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'employee-accounts'));
      const accountsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setEmployeeAccounts(accountsList);
    } catch (error) {
      console.error('Error fetching employee accounts:', error);
    }
  };

  // Search employee by Qatar ID
  const handleQatarIdSearch = async () => {
    if (!qatarId.trim()) {
      toast.error('Please enter a Qatar ID number');
      return;
    }

    setEmployeeSearching(true);
    try {
      // Find employee by QID number
      const employee = employees.find(emp => 
        emp.qid?.number?.toLowerCase() === qatarId.toLowerCase().trim()
      );

      if (employee) {
        setSelectedEmployee(employee);
        
        // Fetch employee's account history
        const employeeAccountHistory = ledger.filter(entry => 
          entry.employeeId === employee.id || 
          entry.qidNumber === employee.qid.number ||
          entry.description.toLowerCase().includes(employee.name.toLowerCase())
        );
        
        // Calculate employee-specific balances
        const advances = employeeAccountHistory.filter(entry => 
          entry.category === 'employee-advance' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);
        
        const deductions = employeeAccountHistory.filter(entry => 
          entry.category === 'employee-deduction' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);
        
        const salariesPaid = employeeAccountHistory.filter(entry => 
          entry.category === 'payroll' && entry.type === 'debit'
        ).reduce((sum, entry) => sum + entry.amount, 0);

        setSelectedEmployee({
          ...employee,
          accountHistory: employeeAccountHistory,
          totalAdvances: advances,
          totalDeductions: deductions,
          totalSalariesPaid: salariesPaid,
          outstandingBalance: advances - deductions
        });

        toast.success(`Employee found: ${employee.name}`);
      } else {
        setSelectedEmployee(null);
        toast.error('Employee not found with this Qatar ID');
      }
    } catch (error) {
      toast.error('Error searching employee');
      console.error('Error searching employee:', error);
    } finally {
      setEmployeeSearching(false);
    }
  };

  // Add employee transaction
  const addEmployeeTransaction = async (transactionData) => {
    try {
      const accountsRef = doc(db, 'accounts', 'main');
      const date = new Date().toISOString();
      
      const entry = {
        id: Date.now().toString(),
        date,
        type: transactionData.type,
        amount: parseFloat(transactionData.amount),
        description: transactionData.description,
        category: transactionData.category,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        qidNumber: selectedEmployee.qid.number,
        createdBy: 'Admin'
      };

      await updateDoc(accountsRef, {
        ledger: arrayUnion(entry)
      });

      toast.success('Employee transaction added successfully');
      
      // Refresh data
      fetchAccounts();
      handleQatarIdSearch(); // Refresh employee data
      
    } catch (error) {
      toast.error(`Error adding transaction: ${error.message}`);
      console.error('Error adding transaction:', error);
    }
  };

  const handleEntry = async () => {
    if (!amount || parseFloat(amount) <= 0 || !description.trim()) {
      toast.error('Please enter valid amount and description');
      return;
    }

    setLoading(true);
    try {
      const accountsRef = doc(db, 'accounts', 'main');
      const date = new Date().toISOString();
      const entryAmount = parseFloat(amount);
      
      const entry = {
        id: Date.now().toString(),
        date,
        type,
        amount: entryAmount,
        description: description.trim(),
        category,
        createdBy: 'Admin' // In real app, get from auth context
      };

      await updateDoc(accountsRef, {
        ledger: arrayUnion(entry)
      });

      toast.success('Entry added successfully');
      
      // Reset form
      setAmount('');
      setDescription('');
      setType('credit');
      setCategory('general');
      
      // Refresh data
      fetchAccounts();
    } catch (error) {
      toast.error(`Error adding entry: ${error.message}`);
      console.error('Error adding entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (cat) => {
    const colors = {
      general: 'category-general',
      payroll: 'category-payroll',
      revenue: 'category-revenue',
      expenses: 'category-expenses',
      office: 'category-office',
      utilities: 'category-utilities',
      transport: 'category-transport',
      supplies: 'category-supplies'
    };
    return colors[cat] || 'category-general';
  };

  const getTransactionIcon = (type, category) => {
    const categoryItem = categories.find(cat => cat.value === category);
    if (categoryItem) return categoryItem.icon;
    
    // Fallback icons
    if (type === 'credit') {
      switch (category) {
        case 'revenue': return <AttachMoneyIcon sx={{ color: 'success.main' }} />;
        case 'customer-payment': return <AttachMoneyIcon sx={{ color: 'primary.main' }} />;
        case 'payroll': return <AccountBalanceIcon sx={{ color: 'info.main' }} />;
        default: return <TrendingUpIcon sx={{ color: 'success.main' }} />;
      }
    } else {
      switch (category) {
        case 'payroll': return <AccountBalanceIcon sx={{ color: 'primary.main' }} />;
        case 'employee-advance': return <AttachMoneyIcon sx={{ color: 'warning.main' }} />;
        case 'employee-deduction': return <TrendingDownIcon sx={{ color: 'error.main' }} />;
        case 'expenses': return <TrendingDownIcon sx={{ color: 'error.main' }} />;
        case 'office': return <AccountBalanceIcon sx={{ color: 'secondary.main' }} />;
        case 'utilities': return <AccountBalanceIcon sx={{ color: 'info.main' }} />;
        case 'transport': return <TrendingDownIcon sx={{ color: 'warning.main' }} />;
        case 'supplies': return <AccountBalanceIcon sx={{ color: 'secondary.main' }} />;
        case 'maintenance': return <TrendingDownIcon sx={{ color: 'warning.main' }} />;
        case 'insurance': return <AccountBalanceIcon sx={{ color: 'primary.main' }} />;
        case 'tax-gov': return <TrendingDownIcon sx={{ color: 'error.main' }} />;
        case 'bank-charges': return <AccountBalanceIcon sx={{ color: 'warning.main' }} />;
        default: return <TrendingDownIcon sx={{ color: 'error.main' }} />;
      }
    }
  };

  const filterLedger = () => {
    let filtered = [...ledger];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterType);
    }

    // Filter by date range
    if (dateRange.start) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(entry => 
        new Date(entry.date) <= new Date(dateRange.end)
      );
    }

    // Sort by date descending
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const exportToCSV = () => {
    const filtered = filterLedger();
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount'].join(','),
      ...filtered.map(entry => [
        new Date(entry.date).toLocaleDateString(),
        entry.type,
        entry.category,
        `"${entry.description}"`,
        entry.amount
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `accounts-ledger-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getBalanceColor = () => {
    if (balance > 0) return 'balance-positive';
    if (balance < 0) return 'balance-negative';
    return 'balance-neutral';
  };

  const getCashFlowData = () => {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const recentEntries = ledger.filter(entry => 
      new Date(entry.date) >= last30Days
    );

    const totalCredits = recentEntries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0);
    
    const totalDebits = recentEntries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return { totalCredits, totalDebits, netFlow: totalCredits - totalDebits };
  };

  // Update cashFlow state with calculated data
  useEffect(() => {
    const flowData = getCashFlowData();
    setCashFlow(flowData);
  }, [ledger]);

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Enhanced Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccountBalanceIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          Accounts Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive financial management and reporting system
        </Typography>
      </Box>

      {/* Enhanced Navigation Tabs */}
      <Card sx={{ mb: 4, borderRadius: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalanceIcon />
                <Typography fontWeight={600}>Overview</Typography>
              </Box>
            }
            value="overview"
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon />
                <Typography fontWeight={600}>Employee Lookup</Typography>
              </Box>
            }
            value="employee-lookup"
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon />
                <Typography fontWeight={600}>Transactions</Typography>
              </Box>
            }
            value="transactions"
            sx={{ textTransform: 'none', py: 2 }}
          />
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PieChartIcon />
                <Typography fontWeight={600}>Reports</Typography>
              </Box>
            }
            value="reports"
            sx={{ textTransform: 'none', py: 2 }}
          />
        </Tabs>
      </Card>

      {/* Enhanced Overview Tab with Professional UI */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ mb: 4 }}>
            {/* Professional Header with Actions */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box>
                <Typography variant="h4" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PieChartIcon sx={{ color: 'primary.main' }} />
                  Financial Overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time insights into your financial performance and trends
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Export to Excel">
                  <Button
                    variant="outlined"
                    startIcon={<ExportIcon />}
                    onClick={exportToCSV}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    Export
                  </Button>
                </Tooltip>
                <Tooltip title="Add Transaction">
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setActiveTab('transactions')}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                    }}
                  >
                    Add Entry
                  </Button>
                </Tooltip>
              </Stack>
            </Box>

            {/* Enhanced KPI Table with Charts */}
            <Card sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ 
                  p: 3, 
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  background: alpha(theme.palette.primary.main, 0.02)
                }}>
                  <Typography variant="h6" fontWeight={600}>
                    Key Performance Indicators
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overview of critical financial metrics with 30-day trends
                  </Typography>
                </Box>
                <Box sx={{ height: 400, width: '100%' }}>
                  <DataGrid
                    rows={createOverviewTableData()}
                    columns={overviewTableColumns}
                    pageSize={6}
                    hideFooter
                    disableSelectionOnClick
                    disableColumnMenu
                    sx={{
                      border: 0,
                      '& .MuiDataGrid-cell': {
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                        py: 2,
                        px: 3,
                        fontSize: '0.95rem',
                      },
                      '& .MuiDataGrid-row': {
                        minHeight: 60,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&:last-child': {
                          '& .MuiDataGrid-cell': {
                            borderBottom: 'none',
                          },
                        },
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: theme.palette.primary.main,
                        color: 'common.white',
                        fontWeight: 600,
                        fontSize: '1rem',
                        '& .MuiDataGrid-columnHeader': {
                          color: 'common.white',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                          color: 'common.white',
                          fontWeight: 600,
                        },
                        borderBottom: 'none',
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        backgroundColor: 'background.paper',
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Cash Flow Summary Card */}
            <Card sx={{ 
              mb: 4, 
              borderRadius: 3,
              boxShadow: 3,
              background: cashFlow.netFlow >= 0 
                ? `linear-gradient(135deg, ${alpha('#4caf50', 0.1)} 0%, ${alpha('#81c784', 0.05)} 100%)`
                : `linear-gradient(135deg, ${alpha('#f44336', 0.1)} 0%, ${alpha('#e57373', 0.05)} 100%)`,
              border: `2px solid ${cashFlow.netFlow >= 0 ? alpha('#4caf50', 0.3) : alpha('#f44336', 0.3)}`
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      30-Day Net Cash Flow
                    </Typography>
                    <Typography 
                      variant="h4" 
                      fontWeight={700}
                      color={cashFlow.netFlow >= 0 ? 'success.main' : 'error.main'}
                    >
                      {cashFlow.netFlow >= 0 ? '+' : ''}{cashFlow.netFlow.toLocaleString()} QAR
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {cashFlow.netFlow >= 0 ? 'Healthy cash flow' : 'Negative cash flow - review expenses'}
                    </Typography>
                  </Box>
                  <Avatar sx={{ 
                    width: 80, 
                    height: 80, 
                    backgroundColor: cashFlow.netFlow >= 0 ? 'success.main' : 'error.main',
                  }}>
                    {cashFlow.netFlow >= 0 ? 
                      <TrendingUpIcon sx={{ fontSize: '2rem' }} /> : 
                      <TrendingDownIcon sx={{ fontSize: '2rem' }} />
                    }
                  </Avatar>
                </Box>
              </CardContent>
            </Card>

            {/* Category Breakdown with Chart */}
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    mb: 3
                  }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PieChartIcon sx={{ color: 'primary.main' }} />
                        Category Performance
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Transaction breakdown by account categories
                      </Typography>
                    </Box>
                    <Chip 
                      label={`${categories.length} Categories`} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                    
                    {/* Enhanced Category Grid */}
                    <Grid container spacing={2}>
                      {categories.slice(0, 8).map(category => {
                        const categoryEntries = ledger.filter(entry => entry.category === category.value);
                        const totalCredits = categoryEntries
                          .filter(entry => entry.type === 'credit')
                          .reduce((sum, entry) => sum + entry.amount, 0);
                        const totalDebits = categoryEntries
                          .filter(entry => entry.type === 'debit')
                          .reduce((sum, entry) => sum + entry.amount, 0);
                        const netAmount = totalCredits - totalDebits;

                        if (totalCredits === 0 && totalDebits === 0) return null;

                        return (
                          <Grid item xs={12} sm={6} md={3} key={category.value}>
                            <Card sx={{ 
                              p: 2, 
                              borderRadius: 2,
                              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: theme.shadows[4],
                              }
                            }}>
                              <Box sx={{ textAlign: 'center' }}>
                                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                                  {category.icon}
                                </Box>
                                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                  {category.label}
                                </Typography>
                                <Typography 
                                  variant="h6" 
                                  color={netAmount >= 0 ? 'success.main' : 'error.main'}
                                  fontWeight={700}
                                >
                                  {netAmount >= 0 ? '+' : ''}{netAmount.toLocaleString()} QAR
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {categoryEntries.length} transactions
                                </Typography>
                              </Box>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon sx={{ color: 'primary.main' }} />
                      Category Distribution
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Visual breakdown of account categories
                    </Typography>
                    <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                      <Doughnut
                        data={createCategoryBreakdownData()}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                boxWidth: 12,
                                padding: 10,
                                font: { size: 10 }
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  return `${context.label}: ${context.parsed.toLocaleString()} QAR`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </motion.div>
      )}

      {/* Employee Lookup Tab */}
      {activeTab === 'employee-lookup' && (
        <div className="employee-lookup-tab">
          <div className="qatar-id-search">
            <Typography variant="h4" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SearchIcon sx={{ color: 'primary.main' }} />
              Employee Lookup by Qatar ID
            </Typography>
            <div className="search-section">
              <div className="search-input-group">
                <input
                  type="text"
                  placeholder="Enter Qatar ID number (e.g., 12345678901)"
                  value={qatarId}
                  onChange={(e) => setQatarId(e.target.value)}
                  className="qatar-id-input"
                  maxLength="11"
                />
                <button
                  onClick={handleQatarIdSearch}
                  disabled={employeeSearching || !qatarId.trim()}
                  className="search-btn"
                >
                  {employeeSearching ? <><SearchIcon /> Searching...</> : <><SearchIcon /> Search</>}
                </button>
              </div>
              <p className="search-help">Enter the 11-digit Qatar ID number to view employee profile and account details</p>
            </div>
          </div>

          {/* Employee Profile Display */}
          {selectedEmployee && (
            <div className="employee-profile-section">
              <div className="employee-profile-card">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <span className="avatar-text">{selectedEmployee.name.charAt(0)}</span>
                  </div>
                  <div className="profile-info">
                    <h3>{selectedEmployee.name}</h3>
                    <p className="employee-id">QID: {selectedEmployee.qid.number}</p>
                    <p className="employee-position">{selectedEmployee.position} - {selectedEmployee.department}</p>
                  </div>
                  <div className="profile-status">
                    <span className="status-badge active">Active</span>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyIcon sx={{ fontSize: 16 }} />
                          Email:
                        </Box>
                      </span>
                      <span className="detail-value">{selectedEmployee.email || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalanceIcon sx={{ fontSize: 16 }} />
                          Phone:
                        </Box>
                      </span>
                      <span className="detail-value">{selectedEmployee.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyIcon sx={{ fontSize: 16 }} />
                          Basic Salary:
                        </Box>
                      </span>
                      <span className="detail-value">{selectedEmployee.salary?.toLocaleString()} QAR</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalanceIcon sx={{ fontSize: 16 }} />
                          Passport:
                        </Box>
                      </span>
                      <span className="detail-value">{selectedEmployee.passport?.number}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PieChartIcon sx={{ fontSize: 16 }} />
                          QID Expiry:
                        </Box>
                      </span>
                      <span className="detail-value">
                        {selectedEmployee.qid?.expiry ? new Date(selectedEmployee.qid.expiry).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PieChartIcon sx={{ fontSize: 16 }} />
                          Join Date:
                        </Box>
                      </span>
                      <span className="detail-value">
                        {selectedEmployee.createdAt ? new Date(selectedEmployee.createdAt).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Summary */}
                <div className="employee-account-summary">
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalanceIcon sx={{ color: 'primary.main' }} />
                    Account Summary
                  </Typography>
                  <div className="account-summary-grid">
                    <div className="account-summary-card">
                      <span className="summary-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyIcon sx={{ fontSize: 16 }} />
                          Total Salaries Paid
                        </Box>
                      </span>
                      <span className="summary-value positive">{selectedEmployee.totalSalariesPaid?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AccountBalanceIcon sx={{ fontSize: 16 }} />
                          Total Advances
                        </Box>
                      </span>
                      <span className="summary-value warning">{selectedEmployee.totalAdvances?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingDownIcon sx={{ fontSize: 16 }} />
                          Total Deductions
                        </Box>
                      </span>
                      <span className="summary-value negative">{selectedEmployee.totalDeductions?.toLocaleString()} QAR</span>
                    </div>
                    <div className="account-summary-card">
                      <span className="summary-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PieChartIcon sx={{ fontSize: 16 }} />
                          Outstanding Balance
                        </Box>
                      </span>
                      <span className={`summary-value ${selectedEmployee.outstandingBalance >= 0 ? 'warning' : 'positive'}`}>
                        {selectedEmployee.outstandingBalance?.toLocaleString()} QAR
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="employee-quick-actions">
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon sx={{ color: 'primary.main' }} />
                    Quick Actions
                  </Typography>
                  <div className="quick-actions-grid">
                    <button className="quick-action-btn advance" onClick={() => {
                      setDescription(`Advance payment for ${selectedEmployee.name}`);
                      setCategory('employee-advance');
                      setType('debit');
                      setActiveTab('transactions');
                    }}>
                      <AccountBalanceIcon sx={{ mr: 1 }} />
                      Add Advance
                    </button>
                    <button className="quick-action-btn deduction" onClick={() => {
                      setDescription(`Deduction for ${selectedEmployee.name}`);
                      setCategory('employee-deduction');
                      setType('debit');
                      setActiveTab('transactions');
                    }}>
                      <TrendingDownIcon sx={{ mr: 1 }} />
                      Add Deduction
                    </button>
                    <button className="quick-action-btn salary" onClick={() => {
                      setDescription(`Salary payment for ${selectedEmployee.name}`);
                      setCategory('payroll');
                      setType('debit');
                      setAmount(selectedEmployee.salary?.toString() || '');
                      setActiveTab('transactions');
                    }}>
                      <AttachMoneyIcon sx={{ mr: 1 }} />
                      Pay Salary
                    </button>
                    <button className="quick-action-btn view-history" onClick={() => {
                      setFilterType('all');
                      setSearchTerm(selectedEmployee.name);
                      setActiveTab('transactions');
                    }}>
                      <PieChartIcon sx={{ mr: 1 }} />
                      View History
                    </button>
                  </div>
                </div>

                {/* Recent Transactions */}
                {selectedEmployee.accountHistory && selectedEmployee.accountHistory.length > 0 && (
                  <div className="employee-recent-transactions">
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon sx={{ color: 'primary.main' }} />
                      Recent Transactions
                    </Typography>
                    <div className="transaction-list">
                      {selectedEmployee.accountHistory.slice(-5).reverse().map((transaction, index) => (
                        <div key={index} className={`transaction-item ${transaction.type}`}>
                          <div className="transaction-icon">
                            {getTransactionIcon(transaction.type, transaction.category)}
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-description">{transaction.description}</div>
                            <div className="transaction-meta">
                              <span>{new Date(transaction.date).toLocaleDateString()}</span>
                              <span className="transaction-category">
                                {categories.find(cat => cat.value === transaction.category)?.label}
                              </span>
                            </div>
                          </div>
                          <div className={`transaction-amount ${transaction.type}`}>
                            {transaction.type === 'credit' ? '+' : '-'}{transaction.amount.toLocaleString()} QAR
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Transactions Tab */}
      {activeTab === 'transactions' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Grid container spacing={3}>
            {/* Transaction Form */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ borderRadius: 3, height: 'fit-content' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AttachMoneyIcon sx={{ color: 'primary.main' }} />
                    Add New Transaction
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Record financial transactions for your business
                  </Typography>

                  <Box component="form" onSubmit={(e) => { e.preventDefault(); handleEntry(); }}>
                    <Stack spacing={3}>
                      <FormControl fullWidth>
                        <InputLabel>Transaction Type</InputLabel>
                        <Select
                          value={type}
                          label="Transaction Type"
                          onChange={(e) => setType(e.target.value)}
                          sx={{ mb: 2 }}
                        >
                          <MenuItem value="credit">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingUpIcon color="success" />
                              Credit (Money In)
                            </Box>
                          </MenuItem>
                          <MenuItem value="debit">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TrendingDownIcon color="error" />
                              Debit (Money Out)
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={category}
                          label="Category"
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          {categories.map(cat => (
                            <MenuItem key={cat.value} value={cat.value}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography>{cat.icon}</Typography>
                                <Typography>{cat.label}</Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Amount (QAR)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">QAR</InputAdornment>,
                        }}
                        inputProps={{ min: 0, step: 0.01 }}
                      />

                      <TextField
                        fullWidth
                        label="Description"
                        multiline
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter transaction details..."
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading || !amount || !description}
                        fullWidth
                        startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                        sx={{
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        {loading ? 'Adding...' : 'Add Transaction'}
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Transactions Table */}
            <Grid item xs={12} lg={8}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ 
                    p: 3, 
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PieChartIcon sx={{ color: 'primary.main' }} />
                        Transaction History
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Complete record of all financial transactions
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        startIcon={<FilterIcon />}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Filter
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={exportToCSV}
                        size="small"
                        sx={{ textTransform: 'none' }}
                      >
                        Export
                      </Button>
                    </Stack>
                  </Box>

                  {ledger.length > 0 ? (
                    <Box sx={{ height: 500 }}>
                      <DataGrid
                        rows={ledger.map((entry, index) => ({ 
                          id: index, 
                          ...entry,
                          formattedAmount: `${entry.amount.toLocaleString()} QAR`,
                          categoryName: categories.find(cat => cat.value === entry.category)?.label || entry.category,
                          categoryIcon: categories.find(cat => cat.value === entry.category)?.icon || <AccountBalanceIcon />,
                        }))}
                        columns={[
                          {
                            field: 'date',
                            headerName: 'Date',
                            width: 120,
                            renderCell: (params) => (
                              <Typography variant="body2">
                                {new Date(params.value).toLocaleDateString()}
                              </Typography>
                            ),
                          },
                          {
                            field: 'type',
                            headerName: 'Type',
                            width: 100,
                            renderCell: (params) => (
                              <Chip
                                label={params.value}
                                size="small"
                                color={params.value === 'credit' ? 'success' : 'error'}
                                variant="outlined"
                                icon={params.value === 'credit' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                              />
                            ),
                          },
                          {
                            field: 'categoryName',
                            headerName: 'Category',
                            width: 200,
                            renderCell: (params) => (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {params.row.categoryIcon}
                                <Typography variant="body2">{params.value}</Typography>
                              </Box>
                            ),
                          },
                          {
                            field: 'formattedAmount',
                            headerName: 'Amount',
                            width: 150,
                            renderCell: (params) => (
                              <Typography 
                                variant="body2" 
                                fontWeight={600}
                                color={params.row.type === 'credit' ? 'success.main' : 'error.main'}
                              >
                                {params.row.type === 'credit' ? '+' : '-'}{params.value}
                              </Typography>
                            ),
                          },
                          {
                            field: 'description',
                            headerName: 'Description',
                            flex: 1,
                            renderCell: (params) => (
                              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                                {params.value}
                              </Typography>
                            ),
                          },
                        ]}
                        pageSize={10}
                        rowsPerPageOptions={[10, 25, 50]}
                        disableSelectionOnClick
                        sx={{
                          border: 0,
                          '& .MuiDataGrid-cell': {
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                            py: 1,
                          },
                          '& .MuiDataGrid-row': {
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                            '&:nth-of-type(even)': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.5),
                            },
                          },
                          '& .MuiDataGrid-columnHeaders': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.08),
                            borderBottom: `2px solid ${theme.palette.primary.main}`,
                            fontWeight: 600,
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      py: 8,
                      px: 3
                    }}>
                      <Avatar sx={{ 
                        width: 80, 
                        height: 80, 
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        mb: 2
                      }}>
                        <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                      </Avatar>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No transactions found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                        Start by adding your first transaction using the form on the left
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          // Focus on amount input if it exists
                          const amountInput = document.querySelector('input[type="number"]');
                          if (amountInput) amountInput.focus();
                        }}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Add First Transaction
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </motion.div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="reports-tab">
          <Typography variant="h4" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <PieChartIcon sx={{ color: 'primary.main' }} />
            Financial Reports
          </Typography>
          
          {/* Category Breakdown */}
          {ledger.length > 0 && (
            <div className="category-breakdown-section">
              <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PieChartIcon sx={{ color: 'primary.main' }} />
                Category Breakdown (Last 30 Days)
              </Typography>
              <div className="category-grid">
                {categories.map(category => {
                  const categoryEntries = ledger.filter(entry => 
                    entry.category === category.value && 
                    new Date(entry.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                  );
                  
                  const totalCredits = categoryEntries
                    .filter(entry => entry.type === 'credit')
                    .reduce((sum, entry) => sum + entry.amount, 0);
                  
                  const totalDebits = categoryEntries
                    .filter(entry => entry.type === 'debit')
                    .reduce((sum, entry) => sum + entry.amount, 0);

                  if (totalCredits === 0 && totalDebits === 0) return null;

                  return (
                    <div key={category.value} className={`category-summary ${getCategoryColor(category.value)}`}>
                      <div className="category-header">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.icon}
                        </Box>
                        <h4>{category.label}</h4>
                      </div>
                      {totalCredits > 0 && (
                        <p className="category-amount positive">
                          In: +{totalCredits.toLocaleString()} QAR
                        </p>
                      )}
                      {totalDebits > 0 && (
                        <p className="category-amount negative">
                          Out: -{totalDebits.toLocaleString()} QAR
                        </p>
                      )}
                      <p className="category-net">
                        Net: {(totalCredits - totalDebits >= 0 ? '+' : '')}{(totalCredits - totalDebits).toLocaleString()} QAR
                      </p>
                      <p className="category-count">{categoryEntries.length} transactions</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Employee Financial Summary */}
          <div className="employee-financial-summary">
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <AccountBalanceIcon sx={{ color: 'primary.main' }} />
              Employee Financial Summary
            </Typography>
            <div className="employee-summary-grid">
              {employees.map(employee => {
                const employeeTransactions = ledger.filter(entry => 
                  entry.employeeId === employee.id || 
                  entry.qidNumber === employee.qid?.number
                );
                
                if (employeeTransactions.length === 0) return null;

                const salaries = employeeTransactions
                  .filter(entry => entry.category === 'payroll' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                
                const advances = employeeTransactions
                  .filter(entry => entry.category === 'employee-advance' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);
                
                const deductions = employeeTransactions
                  .filter(entry => entry.category === 'employee-deduction' && entry.type === 'debit')
                  .reduce((sum, entry) => sum + entry.amount, 0);

                return (
                  <div key={employee.id} className="employee-summary-card">
                    <div className="employee-summary-header">
                      <h5>{employee.name}</h5>
                      <span className="employee-qid">QID: {employee.qid?.number}</span>
                    </div>
                    <div className="employee-summary-amounts">
                      <div className="amount-item">
                        <span className="amount-label">Salaries Paid:</span>
                        <span className="amount-value positive">{salaries.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Advances:</span>
                        <span className="amount-value warning">{advances.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item">
                        <span className="amount-label">Deductions:</span>
                        <span className="amount-value negative">{deductions.toLocaleString()} QAR</span>
                      </div>
                      <div className="amount-item total">
                        <span className="amount-label">Outstanding:</span>
                        <span className={`amount-value ${(advances - deductions) > 0 ? 'warning' : 'positive'}`}>
                          {(advances - deductions).toLocaleString()} QAR
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Box>
  );
};

export default Accounts;
