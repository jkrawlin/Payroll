import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Removed auth import for demo
// import { signOut } from 'firebase/auth'; // Commented out for demo
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom'; // Commented out for demo

const Dashboard = ({ role = 'admin' }) => {
  const [upcomingExpiries, setUpcomingExpiries] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPaid: 0,
    pendingAdvances: 0,
    customersCount: 0
  });
  const { t, i18n } = useTranslation();
  // const navigate = useNavigate(); // Commented out for demo

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch employees and check expiries
        const employeesSnapshot = await getDocs(collection(db, 'employees'));
        const employees = employeesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const expiries = employees.map(employee => {
          const qidExpiry = new Date(employee.qid?.expiry);
          const passportExpiry = new Date(employee.passport?.expiry);
          const today = new Date();
          
          const qidDaysLeft = Math.ceil((qidExpiry - today) / (1000 * 60 * 60 * 24));
          const passportDaysLeft = Math.ceil((passportExpiry - today) / (1000 * 60 * 60 * 24));
          
          const alerts = [];
          if (qidDaysLeft <= 90 && qidDaysLeft > 0) {
            alerts.push(`${employee.name}: QID expires in ${qidDaysLeft} days`);
          }
          if (passportDaysLeft <= 90 && passportDaysLeft > 0) {
            alerts.push(`${employee.name}: Passport expires in ${passportDaysLeft} days`);
          }
          
          return alerts;
        }).flat();
        
        setUpcomingExpiries(expiries);
        
        // Calculate stats
        const totalPaid = employees.reduce((sum, emp) => sum + (emp.totalPaid || 0), 0);
        const pendingAdvances = employees.reduce((sum, emp) => {
          const unpaidAdvances = emp.advances?.filter(adv => !adv.repaid) || [];
          return sum + unpaidAdvances.reduce((advSum, adv) => advSum + adv.amount, 0);
        }, 0);

        // Fetch customers count
        const customersSnapshot = await getDocs(collection(db, 'customers'));
        
        setStats({
          totalEmployees: employees.length,
          totalPaid: totalPaid,
          pendingAdvances: pendingAdvances,
          customersCount: customersSnapshot.size
        });

        if (expiries.length > 0) {
          toast.warn(t('upcomingExpirations'));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Error loading dashboard data');
      }
    };

    fetchDashboardData();
  }, [t]);

  // Logout functionality commented out for demo
  const handleLogout = async () => {
    toast.info('Logout functionality disabled in demo mode');
    // try {
    //   await signOut(auth);
    //   toast.success('Logged out successfully');
    //   navigate('/login');
    // } catch (error) {
    //   toast.error('Error logging out');
    // }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{t('dashboard')}</h1>
          <div className="header-actions">
            <button onClick={toggleLanguage} className="lang-btn">
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>
            <button onClick={handleLogout} className="logout-btn">
              {t('logout')}
            </button>
          </div>
        </div>
      </header>

      {upcomingExpiries.length > 0 && (
        <div className="alert alert-warning">
          <h3>⚠️ {t('upcomingExpirations')}</h3>
          <ul>
            {upcomingExpiries.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>👥 {t('employees')}</h3>
          <p className="stat-number">{stats.totalEmployees}</p>
        </div>
        <div className="stat-card">
          <h3>💰 Total Paid</h3>
          <p className="stat-number">{stats.totalPaid.toLocaleString()} QAR</p>
        </div>
        <div className="stat-card">
          <h3>📈 Pending Advances</h3>
          <p className="stat-number">{stats.pendingAdvances.toLocaleString()} QAR</p>
        </div>
        <div className="stat-card">
          <h3>🏢 {t('customers')}</h3>
          <p className="stat-number">{stats.customersCount}</p>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="dashboard-nav">
        <div className="nav-grid">
          {(role === 'admin' || role === 'hr') && (
            <Link to="/employees" className="nav-card">
              <div className="nav-icon">👥</div>
              <h3>{t('employees')}</h3>
              <p>Manage employee records and documents</p>
            </Link>
          )}
          
          {(role === 'admin' || role === 'accountant') && (
            <Link to="/payroll" className="nav-card">
              <div className="nav-icon">💰</div>
              <h3>{t('payroll')}</h3>
              <p>Process salaries and advances</p>
            </Link>
          )}
          
          {(role === 'admin' || role === 'accountant') && (
            <Link to="/customers" className="nav-card">
              <div className="nav-icon">🏢</div>
              <h3>{t('customers')}</h3>
              <p>Manage customer database</p>
            </Link>
          )}
          
          <Link to="/accounts" className="nav-card">
            <div className="nav-icon">📊</div>
            <h3>{t('accounts')}</h3>
            <p>Track cash flow and ledger</p>
          </Link>
          
          {(role === 'admin' || role === 'accountant') && (
            <Link to="/receipts" className="nav-card">
              <div className="nav-icon">🧾</div>
              <h3>{t('receipts')}</h3>
              <p>Generate and print receipts</p>
            </Link>
          )}
          
          {role === 'admin' && (
            <Link to="/analytics" className="nav-card">
              <div className="nav-icon">📈</div>
              <h3>{t('analytics')}</h3>
              <p>View reports and analytics</p>
            </Link>
          )}
          
          <Link to="/self-service" className="nav-card">
            <div className="nav-icon">🔐</div>
            <h3>{t('selfService')}</h3>
            <p>Employee self-service portal</p>
          </Link>
        </div>
      </nav>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          {(role === 'admin' || role === 'hr') && (
            <Link to="/employees" className="quick-btn">
              ➕ Add Employee
            </Link>
          )}
          {(role === 'admin' || role === 'accountant') && (
            <Link to="/payroll" className="quick-btn">
              💰 Process Payment
            </Link>
          )}
          {(role === 'admin' || role === 'accountant') && (
            <Link to="/receipts" className="quick-btn">
              🧾 Generate Receipt
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
