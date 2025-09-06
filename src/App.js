import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeContextProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import ModernDashboard from './components/ModernDashboard';
import NoAuthDashboard from './components/NoAuthDashboard'; // Fallback dashboard
import Employees from './components/Employees';
import Payroll from './components/Payroll';
import Customers from './components/Customers';
import Accounts from './components/Accounts';
import Receipts from './components/Receipts';
import Analytics from './components/Analytics';
import SelfService from './components/SelfService';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Import Tailwind CSS
import './index.css';

function App() {
  // Bypassing authentication for demo - default to admin role
  const role = 'admin';
  const mockUser = { uid: 'demo-user-123', email: 'demo@example.com' };

  return (
    <ThemeContextProvider>
      <Layout role={role}>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ zIndex: 9999 }}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={<ModernDashboard role={role} />} 
          />
          <Route 
            path="/employees" 
            element={<Employees />} 
          />
          <Route 
            path="/payroll" 
            element={<Payroll />} 
          />
          <Route 
            path="/customers" 
            element={<Customers />} 
          />
          <Route 
            path="/accounts" 
            element={<Accounts />} 
          />
          <Route 
            path="/receipts" 
            element={<Receipts />} 
          />
          <Route 
            path="/analytics" 
            element={<Analytics />} 
          />
          <Route 
            path="/self-service" 
            element={<SelfService userId={mockUser.uid} />} 
          />
          {/* Fallback route */}
          <Route 
            path="/legacy-dashboard" 
            element={<NoAuthDashboard role={role} />} 
          />
          {/* Catch all route - redirect to dashboard */}
          <Route 
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </Layout>
    </ThemeContextProvider>
  );
}

export default App;
