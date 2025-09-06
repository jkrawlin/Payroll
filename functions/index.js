const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Scheduled function to check QID and Passport expirations (runs daily at midnight)
exports.checkExpirations = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Qatar')
  .onRun(async (context) => {
    console.log('Running expiration check...');
    
    try {
      const employeesSnapshot = await admin.firestore().collection('employees').get();
      
      if (employeesSnapshot.empty) {
        console.log('No employees found');
        return null;
      }
      
      const alerts = [];
      const today = new Date();
      
      employeesSnapshot.forEach(doc => {
        const employee = doc.data();
        const employeeName = employee.name;
        
        // Check QID expiration
        if (employee.qid && employee.qid.expiry) {
          const qidExpiry = new Date(employee.qid.expiry);
          const qidDaysLeft = Math.ceil((qidExpiry - today) / (1000 * 60 * 60 * 24));
          
          if (qidDaysLeft <= 90 && qidDaysLeft > 0) {
            alerts.push({
              type: 'qid_expiry',
              employee: employeeName,
              daysLeft: qidDaysLeft,
              message: `${employeeName}'s QID expires in ${qidDaysLeft} days`
            });
          } else if (qidDaysLeft <= 0) {
            alerts.push({
              type: 'qid_expired',
              employee: employeeName,
              daysLeft: qidDaysLeft,
              message: `${employeeName}'s QID has expired ${Math.abs(qidDaysLeft)} days ago`
            });
          }
        }
        
        // Check Passport expiration
        if (employee.passport && employee.passport.expiry) {
          const passportExpiry = new Date(employee.passport.expiry);
          const passportDaysLeft = Math.ceil((passportExpiry - today) / (1000 * 60 * 60 * 24));
          
          if (passportDaysLeft <= 90 && passportDaysLeft > 0) {
            alerts.push({
              type: 'passport_expiry',
              employee: employeeName,
              daysLeft: passportDaysLeft,
              message: `${employeeName}'s Passport expires in ${passportDaysLeft} days`
            });
          } else if (passportDaysLeft <= 0) {
            alerts.push({
              type: 'passport_expired',
              employee: employeeName,
              daysLeft: passportDaysLeft,
              message: `${employeeName}'s Passport has expired ${Math.abs(passportDaysLeft)} days ago`
            });
          }
        }
      });
      
      // Log alerts
      if (alerts.length > 0) {
        console.log('Expiration alerts found:', alerts);
        
        // Store alerts in Firestore for the dashboard to display
        const alertsRef = admin.firestore().collection('alerts').doc('expirations');
        await alertsRef.set({
          alerts: alerts,
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          count: alerts.length
        });
        
        // Send notifications (integrate with email/SMS service like SendGrid/Twilio)
        // Example integration:
        /*
        const criticalAlerts = alerts.filter(alert => alert.daysLeft <= 30);
        if (criticalAlerts.length > 0) {
          await sendEmailNotifications(criticalAlerts);
          await sendSMSNotifications(criticalAlerts);
        }
        */
        
        console.log(`Found ${alerts.length} expiration alerts`);
      } else {
        console.log('No expiration alerts found');
        
        // Clear any existing alerts
        const alertsRef = admin.firestore().collection('alerts').doc('expirations');
        await alertsRef.set({
          alerts: [],
          lastChecked: admin.firestore.FieldValue.serverTimestamp(),
          count: 0
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error checking expirations:', error);
      throw error;
    }
  });

// Function to send welcome email when new employee is added
exports.sendWelcomeEmail = functions.firestore
  .document('employees/{employeeId}')
  .onCreate(async (snap, context) => {
    const employee = snap.data();
    const employeeId = context.params.employeeId;
    
    console.log(`New employee added: ${employee.name} (${employeeId})`);
    
    // Here you would integrate with email service
    // Example: Send welcome email with company policies, login credentials, etc.
    
    try {
      // Log the welcome email event
      await admin.firestore().collection('notifications').add({
        type: 'welcome_email',
        employeeId: employeeId,
        employeeName: employee.name,
        email: employee.email,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Welcome email queued for ${employee.name}`);
    } catch (error) {
      console.error('Error queueing welcome email:', error);
    }
  });

// Function to log payroll transactions for audit purposes
exports.logPayrollTransaction = functions.firestore
  .document('employees/{employeeId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const employeeId = context.params.employeeId;
    
    // Check if transactions array was updated
    const beforeTransactions = before.transactions || [];
    const afterTransactions = after.transactions || [];
    
    if (afterTransactions.length > beforeTransactions.length) {
      const newTransaction = afterTransactions[afterTransactions.length - 1];
      
      try {
        // Log the transaction for audit trail
        await admin.firestore().collection('audit_logs').add({
          type: 'payroll_transaction',
          employeeId: employeeId,
          employeeName: after.name,
          transaction: newTransaction,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          metadata: {
            previousTotalPaid: before.totalPaid || 0,
            newTotalPaid: after.totalPaid || 0,
            transactionCount: afterTransactions.length
          }
        });
        
        console.log(`Payroll transaction logged for ${after.name}: ${newTransaction.type} - ${newTransaction.amount} QAR`);
      } catch (error) {
        console.error('Error logging payroll transaction:', error);
      }
    }
    
    // Check if advances array was updated
    const beforeAdvances = before.advances || [];
    const afterAdvances = after.advances || [];
    
    if (afterAdvances.length > beforeAdvances.length) {
      const newAdvance = afterAdvances[afterAdvances.length - 1];
      
      try {
        // Log the advance for audit trail
        await admin.firestore().collection('audit_logs').add({
          type: 'advance_disbursement',
          employeeId: employeeId,
          employeeName: after.name,
          advance: newAdvance,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Advance logged for ${after.name}: ${newAdvance.amount} QAR`);
      } catch (error) {
        console.error('Error logging advance:', error);
      }
    }
  });

// Function to generate monthly payroll reports
exports.generateMonthlyReport = functions.pubsub.schedule('0 0 1 * *')
  .timeZone('Asia/Qatar')
  .onRun(async (context) => {
    console.log('Generating monthly payroll report...');
    
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Get all employees
      const employeesSnapshot = await admin.firestore().collection('employees').get();
      
      if (employeesSnapshot.empty) {
        console.log('No employees found for report');
        return null;
      }
      
      const reportData = {
        period: `${lastMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
        employees: [],
        summary: {
          totalEmployees: 0,
          totalSalariesPaid: 0,
          totalAdvancesGiven: 0,
          totalDeductions: 0
        }
      };
      
      employeesSnapshot.forEach(doc => {
        const employee = doc.data();
        
        // Filter transactions for last month
        const monthlyTransactions = (employee.transactions || []).filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= lastMonth && transactionDate < thisMonth;
        });
        
        // Filter advances for last month
        const monthlyAdvances = (employee.advances || []).filter(advance => {
          const advanceDate = new Date(advance.date);
          return advanceDate >= lastMonth && advanceDate < thisMonth;
        });
        
        const employeeData = {
          id: doc.id,
          name: employee.name,
          department: employee.department,
          salary: employee.salary || 0,
          transactions: monthlyTransactions,
          advances: monthlyAdvances,
          totalPaid: monthlyTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          totalAdvances: monthlyAdvances.reduce((sum, a) => sum + (a.amount || 0), 0)
        };
        
        reportData.employees.push(employeeData);
        reportData.summary.totalEmployees++;
        reportData.summary.totalSalariesPaid += employeeData.totalPaid;
        reportData.summary.totalAdvancesGiven += employeeData.totalAdvances;
      });
      
      // Save the report
      await admin.firestore().collection('monthly_reports').add(reportData);
      
      console.log(`Monthly report generated for ${reportData.period}`);
      console.log(`Total employees: ${reportData.summary.totalEmployees}`);
      console.log(`Total salaries paid: ${reportData.summary.totalSalariesPaid} QAR`);
      
      return null;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  });

// Helper function to send email notifications (placeholder)
async function sendEmailNotifications(alerts) {
  // Integrate with email service like SendGrid, Nodemailer, etc.
  console.log('Sending email notifications for alerts:', alerts);
  
  // Example implementation:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(functions.config().sendgrid.key);
  
  const msg = {
    to: 'hr@company.com',
    from: 'noreply@company.com',
    subject: 'Document Expiration Alerts',
    html: generateEmailHTML(alerts)
  };
  
  await sgMail.send(msg);
  */
}

// Helper function to send SMS notifications (placeholder)
async function sendSMSNotifications(alerts) {
  // Integrate with SMS service like Twilio
  console.log('Sending SMS notifications for alerts:', alerts);
  
  // Example implementation:
  /*
  const twilio = require('twilio');
  const client = twilio(functions.config().twilio.sid, functions.config().twilio.token);
  
  for (const alert of alerts) {
    await client.messages.create({
      body: alert.message,
      from: functions.config().twilio.phone,
      to: '+974XXXXXXXX'
    });
  }
  */
}
