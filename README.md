# Qatar Payroll Management System 🏢

A comprehensive payroll management web application built with React and Firebase, designed specifically for businesses operating in Qatar. This system handles employee management, payroll processing, customer invoicing, accounting, receipt generation, and provides detailed analytics.

## 🌟 Features

### Core Features
- **Employee Management**: Complete employee profiles with passport and QID document management
- **Payroll Processing**: Salary payments, advances, bonuses, and deductions
- **Customer Database**: Customer management with invoicing capabilities  
- **Accounting System**: Cash flow tracking and ledger management
- **Receipt Generation**: Professional receipt printing with Arabic support
- **Analytics Dashboard**: Comprehensive reports and data visualization
- **Self-Service Portal**: Employee access to payslips and advance requests

### Advanced Features
- **Document Expiry Alerts**: Automated notifications for QID and passport expirations
- **Role-Based Access Control**: Admin, HR, Accountant, and Employee roles
- **Multi-Language Support**: English and Arabic localization
- **Cloud Functions**: Automated processes and notifications
- **Responsive Design**: Mobile-friendly interface
- **File Upload**: Secure document storage
- **Audit Trail**: Complete transaction logging

## 🚀 Tech Stack

- **Frontend**: React 18, React Router, React Charts
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Styling**: Custom CSS with responsive design
- **Forms**: Formik with Yup validation
- **File Upload**: React Dropzone
- **Internationalization**: React i18next
- **Notifications**: React Toastify
- **PDF Generation**: React-to-Print

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase account (free tier available)

## 🛠️ Installation

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd payroll-app
npm install
```

### 2. Firebase Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Cloud Functions
   - Hosting (optional)

4. Get your Firebase config:
   - Go to Project Settings → General → Your apps
   - Add a web app and copy the config object

5. **Option A: Using Environment Variables (Recommended)**
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your Firebase config
   
6. **Option B: Direct Configuration**
   - Replace the placeholder values in `src/firebase.js` with your config

7. **Create Test Users**
   - Go to Firebase Console → Authentication → Users
   - Add a test user: `admin@example.com` / `password123`

### 3. Configure Firebase Authentication
1. In Firebase Console, go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Add test users or use the demo credentials

### 4. Deploy Security Rules
```bash
firebase login
firebase init
# Select Firestore, Functions, Storage, and Hosting
# Use existing project and select your project
firebase deploy --only firestore:rules,storage:rules
```

### 5. Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm start
```
The app will open at `http://localhost:3000`

### Production Build
```bash
npm run build
firebase deploy --only hosting
```

## 🔐 Demo Credentials

For testing purposes, use these demo credentials:
- **Email**: admin@example.com
- **Password**: password123

> **Note**: You'll need to create these users in Firebase Authentication or modify the login component for demo purposes.

## 👥 User Roles

The system supports four user roles:

1. **Admin**: Full system access
2. **HR**: Employee management and reporting
3. **Accountant**: Payroll, customers, and accounting
4. **Employee**: Self-service portal access

## 📊 Database Schema

### Collections Structure

#### `employees`
```javascript
{
  id: "auto-generated",
  name: "Employee Name",
  email: "employee@company.com",
  phone: "+974XXXXXXXX",
  department: "IT",
  position: "Developer",
  salary: 5000,
  passport: {
    number: "A12345678",
    expiry: "2025-12-31",
    photoUrl: "https://..."
  },
  qid: {
    number: "12345678901",
    expiry: "2025-06-30",
    photoUrl: "https://..."
  },
  transactions: [
    {
      date: "2024-01-01T00:00:00.000Z",
      amount: 5000,
      type: "salary",
      description: "Monthly salary"
    }
  ],
  advances: [
    {
      date: "2024-01-15T00:00:00.000Z",
      amount: 1000,
      repaid: false,
      description: "Emergency advance"
    }
  ],
  totalPaid: 15000,
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

#### `customers`
```javascript
{
  id: "auto-generated",
  name: "Company Name",
  contactPerson: "John Doe",
  email: "contact@company.com",
  phone: "+974XXXXXXXX",
  address: "Doha, Qatar",
  taxId: "TX123456789",
  invoices: [
    {
      id: "INV001",
      amount: 10000,
      date: "2024-01-01T00:00:00.000Z",
      status: "paid",
      description: "Service payment"
    }
  ],
  totalInvoiced: 50000,
  totalPaid: 40000
}
```

#### `accounts`
```javascript
{
  id: "main",
  ledger: [
    {
      date: "2024-01-01T00:00:00.000Z",
      type: "credit", // or "debit"
      amount: 10000,
      description: "Payment from customer",
      category: "revenue"
    }
  ],
  balance: 25000
}
```

## 🔧 Configuration

### Firebase Config
Update `src/firebase.js` with your Firebase project configuration:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### Environment Variables
Create a `.env` file in the root directory:

```
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 📱 Features Guide

### Employee Management
- Add, edit, and delete employees
- Upload passport and QID photos
- Track document expiration dates
- Department and position management
- Salary information

### Payroll Processing
- Process monthly salaries
- Handle advance payments
- Apply bonuses and deductions
- Track payment history
- Generate payment reports

### Customer Management
- Maintain customer database
- Create and manage invoices
- Track payments and outstanding amounts
- Generate customer statements

### Accounting
- Maintain general ledger
- Track cash flow
- Category-wise expense tracking
- Financial reporting
- Balance calculations

### Receipt Generation
- Professional receipt templates
- Arabic and English support
- Print functionality
- Customer and company information
- Payment method tracking

### Analytics
- Employee payroll analysis
- Department-wise breakdowns
- Revenue and expense charts
- Cash flow trends
- Key performance indicators

### Self-Service Portal
- Employee profile viewing
- Payslip downloads
- Advance request submissions
- Transaction history
- Document status checking

## 🔔 Notifications

The system includes automated notifications for:
- Document expiry alerts (90-day advance warning)
- Payroll processing confirmations
- Advance request status updates
- Monthly report generation

## 🛡️ Security

### Firebase Security Rules
- Role-based database access
- File upload restrictions
- Size and type limitations
- User authentication requirements

### Data Privacy
- Encrypted data transmission
- Secure file storage
- Access audit trails
- User permission management

## 🌐 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Custom Domain
1. Go to Firebase Console → Hosting
2. Add custom domain
3. Follow DNS configuration steps

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Connection Issues**
   - Check your Firebase config
   - Verify project ID and API keys
   - Ensure Firebase services are enabled

2. **Authentication Problems**
   - Check Firebase Auth settings
   - Verify email/password provider is enabled
   - Create test users in Firebase Console

3. **Permission Denied Errors**
   - Review Firestore security rules
   - Check user roles and permissions
   - Verify authentication status

4. **File Upload Issues**
   - Check Storage security rules
   - Verify file size and type restrictions
   - Ensure proper permissions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review Firebase documentation
- Contact the development team

## 🔄 Updates and Maintenance

### Regular Maintenance
- Update dependencies monthly
- Monitor Firebase usage
- Review security rules
- Backup database regularly
- Check for security updates

### Feature Requests
- Submit feature requests via issues
- Provide detailed requirements
- Include mockups if applicable
- Consider business impact

## 📚 Documentation

Additional documentation available:
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [User Manual](docs/user-manual.md)
- [Developer Guide](docs/developer.md)

---

## 🎯 Roadmap

### Upcoming Features
- [ ] Email notifications integration
- [ ] SMS alerts via Twilio
- [ ] Advanced reporting dashboard
- [ ] Mobile application
- [ ] Biometric attendance integration
- [ ] Leave management system
- [ ] Performance evaluation module

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added analytics and reporting
- **v1.2.0** - Enhanced self-service portal
- **v2.0.0** - Mobile responsiveness and PWA support

---

Made with ❤️ for Qatar businesses
