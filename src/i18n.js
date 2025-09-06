import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      dashboard: 'Dashboard',
      employees: 'Employees',
      payroll: 'Payroll',
      customers: 'Customers',
      accounts: 'Accounts',
      receipts: 'Receipts',
      analytics: 'Analytics',
      selfService: 'Self-Service',
      
      // Common
      name: 'Name',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      update: 'Update',
      
      // Employee Management
      addEmployee: 'Add Employee',
      employeeName: 'Employee Name',
      passportNumber: 'Passport Number',
      passportExpiry: 'Passport Expiry',
      qidNumber: 'QID Number',
      qidExpiry: 'QID Expiry',
      salary: 'Salary',
      uploadPassport: 'Upload Passport Photo',
      uploadQid: 'Upload QID Photo',
      
      // Payroll
      salaryPayment: 'Salary Payment',
      advance: 'Advance',
      amount: 'Amount',
      totalPaid: 'Total Paid',
      
      // Messages
      loginSuccess: 'Logged in successfully',
      employeeSaved: 'Employee saved successfully',
      transactionAdded: 'Transaction added successfully',
      receiptGenerated: 'Receipt generated successfully',
      
      // Notifications
      upcomingExpirations: 'Upcoming Expirations',
      qidExpiryAlert: 'QID Expiry Alert',
      expiresIn: 'Expires in {{days}} days',
    }
  },
  ar: {
    translation: {
      // Navigation - Arabic translations
      dashboard: 'لوحة التحكم',
      employees: 'الموظفين',
      payroll: 'كشوف المرتبات',
      customers: 'العملاء',
      accounts: 'الحسابات',
      receipts: 'الإيصالات',
      analytics: 'التحليلات',
      selfService: 'الخدمة الذاتية',
      
      // Common - Arabic translations
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      login: 'تسجيل الدخول',
      logout: 'تسجيل الخروج',
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      add: 'إضافة',
      update: 'تحديث',
      
      // Employee Management - Arabic translations
      addEmployee: 'إضافة موظف',
      employeeName: 'اسم الموظف',
      passportNumber: 'رقم جواز السفر',
      passportExpiry: 'انتهاء جواز السفر',
      qidNumber: 'رقم الهوية',
      qidExpiry: 'انتهاء الهوية',
      salary: 'الراتب',
      uploadPassport: 'رفع صورة جواز السفر',
      uploadQid: 'رفع صورة الهوية',
      
      // Payroll - Arabic translations
      salaryPayment: 'دفع الراتب',
      advance: 'سلفة',
      amount: 'المبلغ',
      totalPaid: 'إجمالي المدفوع',
      
      // Messages - Arabic translations
      loginSuccess: 'تم تسجيل الدخول بنجاح',
      employeeSaved: 'تم حفظ الموظف بنجاح',
      transactionAdded: 'تم إضافة المعاملة بنجاح',
      receiptGenerated: 'تم إنشاء الإيصال بنجاح',
      
      // Notifications - Arabic translations
      upcomingExpirations: 'انتهاء الصلاحيات القادمة',
      qidExpiryAlert: 'تنبيه انتهاء الهوية',
      expiresIn: 'تنتهي في {{days}} أيام',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already does escaping
    },
  });

export default i18n;
