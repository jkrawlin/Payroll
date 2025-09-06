import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// import { auth, db } from './firebase';  // Commented out for demo
// import { onAuthStateChanged } from 'firebase/auth';  // Commented out for demo
// import { doc, getDoc } from 'firebase/firestore';  // Commented out for demo
// import Login from './components/Login';  // Commented out for demo
import NoAuthDashboard from './components/NoAuthDashboard'; // Demo dashboard without Firebase
import Dashboard from './components/Dashboard';
import Employees from './components/Employees';
import Payroll from './components/Payroll';
import Customers from './components/Customers';
import Accounts from './components/Accounts';
import Receipts from './components/Receipts';
import Analytics from './components/Analytics';
import SelfService from './components/SelfService';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import './App.css';

function App() {
  // Bypassing authentication for demo - default to admin role
  const role = 'admin';
  const mockUser = { uid: 'demo-user-123', email: 'demo@example.com' };

  return (
    <div className="app">
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
        theme="light"
      />
      <Routes>
        <Route 
          path="/" 
          element={<NoAuthDashboard role={role} />} 
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
        {/* Catch all route - redirect to dashboard */}
        <Route 
          path="*" 
          element={<Navigate to="/" replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
