import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NoAuthDashboard = ({ role = 'admin' }) => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  const menuItems = [
    { name: 'Employees', path: '/employees', icon: '👥', roles: ['admin', 'hr'] },
    { name: 'Payroll', path: '/payroll', icon: '💰', roles: ['admin', 'accountant'] },
    { name: 'Customers', path: '/customers', icon: '🏢', roles: ['admin', 'accountant'] },
    { name: 'Accounts', path: '/accounts', icon: '📊', roles: ['admin', 'accountant', 'hr'] },
    { name: 'Receipts', path: '/receipts', icon: '🧾', roles: ['admin', 'accountant'] },
    { name: 'Analytics', path: '/analytics', icon: '📈', roles: ['admin'] },
    { name: 'Self Service', path: '/self-service', icon: '👤', roles: ['admin', 'hr', 'accountant', 'employee'] },
  ];

  const accessibleItems = menuItems.filter(item => 
    item.roles.includes(role)
  );

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🏢 Qatar Payroll Management System</h1>
          <h2 className="arabic-title">نظام إدارة كشوف المرتبات القطري</h2>
          
          <div className="header-actions">
            <button 
              onClick={toggleLanguage} 
              className="language-toggle"
              type="button"
            >
              {i18n.language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="demo-notice">
          <h3>🚀 Demo Mode - No Authentication Required</h3>
          <p>
            Authentication has been temporarily disabled. You can explore all features 
            of the payroll system directly. Click on any module below to get started.
          </p>
          <p>
            <strong>Note:</strong> Firebase configuration is not required in demo mode. 
            All features are accessible for testing and demonstration purposes.
          </p>
        </div>

        <div className="quick-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>Ready to Explore</h3>
              <p>Employee Management</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <h3>Demo Data</h3>
              <p>Payroll Processing</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏢</div>
            <div className="stat-info">
              <h3>Full Features</h3>
              <p>Customer Management</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <h3>All Access</h3>
              <p>Analytics & Reports</p>
            </div>
          </div>
        </div>

        <div className="navigation-grid">
          {accessibleItems.map((item, index) => (
            <Link 
              to={item.path} 
              key={index} 
              className="nav-card"
            >
              <div className="nav-icon">{item.icon}</div>
              <h3>{item.name}</h3>
              <p>Access {item.name.toLowerCase()} features</p>
            </Link>
          ))}
        </div>

        <div className="role-info">
          <p><strong>Current Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</p>
          <p>All features are accessible in demo mode regardless of role restrictions.</p>
        </div>
      </div>
    </div>
  );
};

export default NoAuthDashboard;
