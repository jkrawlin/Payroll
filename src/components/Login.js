import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const formik = useFormik({
    initialValues: { 
      email: '', 
      password: '' 
    },
    validationSchema: Yup.object({
      email: Yup.string().email('Invalid email').required('Email is required'),
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Check if Firebase is configured
        if (!isFirebaseConfigured()) {
          toast.error('Firebase is not configured. Please set up your Firebase project first.');
          return;
        }
        
        await signInWithEmailAndPassword(auth, values.email, values.password);
        toast.success(t('loginSuccess'));
        navigate('/');
      } catch (error) {
        console.error('Login error:', error);
        if (error.code === 'auth/user-not-found') {
          toast.error('No user found with this email. Please check your credentials or contact admin.');
        } else if (error.code === 'auth/wrong-password') {
          toast.error('Incorrect password. Please try again.');
        } else if (error.code === 'auth/invalid-email') {
          toast.error('Invalid email format.');
        } else {
          toast.error(`Login failed: ${error.message}`);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Qatar Payroll System</h1>
          <h2 className="arabic-title">نظام كشوف المرتبات القطري</h2>
          <button 
            onClick={toggleLanguage} 
            className="language-toggle"
            type="button"
          >
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>

        {!isFirebaseConfigured() && (
          <div className="config-warning">
            <h3>⚠️ Firebase Configuration Required</h3>
            <p>To use this application, please:</p>
            <ol>
              <li>Create a Firebase project at <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
              <li>Enable Authentication (Email/Password)</li>
              <li>Enable Firestore Database</li>
              <li>Enable Storage</li>
              <li>Update the config in <code>src/firebase.js</code></li>
            </ol>
          </div>
        )}
        <form onSubmit={formik.handleSubmit} className="login-form">
          <div className="form-group">
            <input
              name="email"
              type="email"
              placeholder={t('email')}
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
            <input
              name="password"
              type="password"
              placeholder={t('password')}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.password}
              className={formik.touched.password && formik.errors.password ? 'error' : ''}
            />
            {formik.touched.password && formik.errors.password && (
              <p className="error-message">{formik.errors.password}</p>
            )}
          </div>

          <button 
            type="submit" 
            disabled={formik.isSubmitting}
            className="login-btn"
          >
            {formik.isSubmitting ? 'Logging in...' : t('login')}
          </button>
        </form>

        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Email: admin@example.com</p>
          <p>Password: password123</p>
          <small>Note: Set up Firebase Authentication to enable login</small>
        </div>
      </div>
    </div>
  );
};

export default Login;
