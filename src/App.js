import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
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
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Try to fetch user role from Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data()?.role || 'employee');
          } else {
            // If no user document exists, default to admin for demo purposes
            setRole('admin');
          }
        } catch (error) {
          console.log('Error fetching user role, defaulting to admin for demo:', error);
          setRole('admin'); // Default role for demo
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner">
          <h2>Qatar Payroll System</h2>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

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
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login />} 
        />
        <Route 
          path="/" 
          element={user ? <Dashboard role={role} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/employees" 
          element={
            user && (role === 'admin' || role === 'hr') 
              ? <Employees /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/payroll" 
          element={
            user && (role === 'admin' || role === 'accountant') 
              ? <Payroll /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/customers" 
          element={
            user && (role === 'admin' || role === 'accountant') 
              ? <Customers /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/accounts" 
          element={user ? <Accounts /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/receipts" 
          element={
            user && (role === 'admin' || role === 'accountant') 
              ? <Receipts /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/analytics" 
          element={
            user && role === 'admin' 
              ? <Analytics /> 
              : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/self-service" 
          element={user ? <SelfService userId={user.uid} /> : <Navigate to="/" replace />} 
        />
        {/* Catch all route */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/" : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;
