const express = require('express');
const router = express.Router();
const CompetitionApplication = require('../models/CompetitionApplication');
const CompetitionTempOrder = require('../models/CompetitionTempOrder');
const competitionRouter = require('./competitionRoutes');
const { generateNextRollNumber, parseDobToDate } = competitionRouter;

// Dynamic Cashfree configuration helper
const getCashfreeConfig = () => {
  const rawAppId = process.env.CASHFREE_APP_ID || '';
  const rawSecretKey = process.env.CASHFREE_SECRET_KEY || '';
  const rawEnv = process.env.CASHFREE_ENV || 'PROD';

  // Strip accidental newlines, carriage returns, or spaces from dashboard copy-paste
  const appId = rawAppId.replace(/[\r\n\s]+/g, '');
  const secretKey = rawSecretKey.replace(/[\r\n\s]+/g, '');
  const env = rawEnv.replace(/[\r\n\s]+/g, '').toUpperCase();
  
  // Test/Sandbox if appId starts with TEST or env is TEST/SANDBOX
  const isTest = appId.startsWith('TEST') || env === 'TEST' || env === 'SANDBOX';
  const baseUrl = isTest
    ? 'https://sandbox.cashfree.com/pg'
    : 'https://api.cashfree.com/pg';
  const mode = isTest ? 'sandbox' : 'production';

  return {
    appId,
    secretKey,
    isTest,
    mode,
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'x-api-version': '2023-08-01',
    }
  };
};

// -------------------------------------------------------------------
// POST /api/payment/create-order
// Creates a Cashfree order for the competition fee (₹150)
// Body: { formData } (Zero-pending flow) OR { applicationId } (Legacy)
// -------------------------------------------------------------------
router.post('/create-order', async (req, res) => {
  try {
    const { applicationId, formData } = req.body || {};

    let candidateName = 'Candidate';
    let cleanPhone = '9999999999';
    let orderId;

    if (formData) {
      if (!formData.name || !formData.phone) {
        return res.status(400).json({ message: 'Candidate name and phone are required' });
      }
      candidateName = formData.name.trim();
      cleanPhone = (formData.phone || '').replace(/\D/g, '').slice(-10) || '9999999999';
      orderId = `NIICT_COMP_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    } else if (applicationId) {
      const app = await CompetitionApplication.findById(applicationId);
      if (!app) return res.status(404).json({ message: 'Application not found' });
      if (app.paymentStatus === 'paid') {
        return res.status(400).json({ message: 'Payment already completed for this application' });
      }
      candidateName = app.name || 'Candidate';
      cleanPhone = (app.phone || '').replace(/\D/g, '').slice(-10) || '9999999999';
      orderId = `NIICT_COMP_${app.rollNumber}_${Date.now()}`;
    } else {
      return res.status(400).json({ message: 'formData or applicationId is required' });
    }

    const cfConfig = getCashfreeConfig();

    let origin = req.headers.origin || 'https://www.niict.in';
    if (!cfConfig.isTest && origin.startsWith('http://')) {
      origin = 'https://www.niict.in';
    }

    const host = req.headers.host || 'niictbackend.onrender.com';
    const notifyUrl = (!cfConfig.isTest && host.includes('localhost'))
      ? 'https://niictbackend.onrender.com/api/payment/webhook'
      : `https://${host}/api/payment/webhook`;

    const returnUrl = applicationId
      ? `${origin}/competition?order_id=${orderId}&app_id=${applicationId}`
      : `${origin}/competition?order_id=${orderId}`;

    const orderPayload = {
      order_id: orderId,
      order_amount: 150,
      order_currency: 'INR',
      customer_details: {
        customer_id: cleanPhone,
        customer_name: candidateName,
        customer_phone: cleanPhone,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_note: `NIICT GK Competition Registration - ${candidateName}`,
    };

    const cfRes = await fetch(`${cfConfig.baseUrl}/orders`, {
      method: 'POST',
      headers: cfConfig.headers,
      body: JSON.stringify(orderPayload),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok) {
      console.error('Cashfree order creation failed:', cfData);
      return res.status(502).json({
        message: cfData.message || 'Failed to create payment order',
        detail: cfData.message || JSON.stringify(cfData),
      });
    }

    if (formData) {
      // Save temporary order only. NO CompetitionApplication is created!
      await CompetitionTempOrder.create({
        orderId: cfData.order_id,
        paymentSessionId: cfData.payment_session_id,
        amount: 150,
        formData: {
          ...formData,
          dateOfBirth: parseDobToDate(formData.dateOfBirth) || new Date(formData.dateOfBirth)
        },
        status: 'created'
      });
    } else if (applicationId) {
      await CompetitionApplication.findByIdAndUpdate(applicationId, {
        paymentOrderId: cfData.order_id,
        paymentSessionId: cfData.payment_session_id,
        paymentAmount: 150,
      });
    }

    return res.json({
      orderId: cfData.order_id,
      paymentSessionId: cfData.payment_session_id,
      orderStatus: cfData.order_status,
      cfMode: cfConfig.mode,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// -------------------------------------------------------------------
// POST /api/payment/verify
// Verifies payment after Cashfree checkout completes
// Body: { orderId, applicationId? }
// -------------------------------------------------------------------
router.post('/verify', async (req, res) => {
  try {
    const { applicationId, orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ message: 'orderId is required' });
    }

    const cfConfig = getCashfreeConfig();

    // Fetch order payments from Cashfree
    const cfRes = await fetch(`${cfConfig.baseUrl}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: cfConfig.headers,
    });

    const payments = await cfRes.json();

    if (!cfRes.ok) {
      console.error('Cashfree verify failed:', payments);
      return res.status(502).json({ message: 'Failed to verify payment', detail: payments.message });
    }

    // Find the successful payment
    const successPayment = Array.isArray(payments)
      ? payments.find(p => p.payment_status === 'SUCCESS')
      : null;

    if (!successPayment) {
      if (applicationId) {
        const hasFailed = Array.isArray(payments) && payments.some(p => p.payment_status === 'FAILED');
        if (hasFailed) {
          await CompetitionApplication.findByIdAndUpdate(applicationId, { paymentStatus: 'failed' });
        }
      }
      return res.status(400).json({ message: 'Payment not successful or pending', payments });
    }

    // Check if application already created for this order
    let existingApp = await CompetitionApplication.findOne({ paymentOrderId: orderId });
    if (!existingApp && applicationId) {
      existingApp = await CompetitionApplication.findById(applicationId);
    }

    if (existingApp) {
      const updated = await CompetitionApplication.findByIdAndUpdate(
        existingApp._id,
        {
          paymentStatus: 'paid',
          paymentTransactionId: successPayment.cf_payment_id?.toString() || successPayment.bank_reference || existingApp.paymentTransactionId || '',
          paidAt: existingApp.paidAt || new Date(),
          paymentAmount: successPayment.order_amount || 150,
        },
        { new: true }
      );
      return res.json({
        success: true,
        transactionId: updated.paymentTransactionId,
        paidAt: updated.paidAt,
        application: updated,
      });
    }

    // If application doesn't exist yet, create it from CompetitionTempOrder!
    const tempOrder = await CompetitionTempOrder.findOne({ orderId });
    if (!tempOrder) {
      return res.status(404).json({ message: 'Order registration details not found' });
    }

    const rollNumber = await generateNextRollNumber();
    const fd = tempOrder.formData;
    const newApp = await CompetitionApplication.create({
      name: fd.name.trim(),
      fatherName: fd.fatherName.trim(),
      motherName: fd.motherName.trim(),
      phone: fd.phone.trim(),
      school: fd.school.trim(),
      parentPhone: fd.parentPhone ? fd.parentPhone.trim() : '',
      address: fd.address.trim(),
      subject: fd.subject || 'GK',
      aadhaar: fd.aadhaar ? fd.aadhaar.trim() : '',
      dateOfBirth: fd.dateOfBirth,
      classPassed: fd.classPassed.trim(),
      image: fd.image || null,
      rollNumber,
      session: fd.session || '2026-2027',
      paymentStatus: 'paid',
      paymentOrderId: orderId,
      paymentTransactionId: successPayment.cf_payment_id?.toString() || successPayment.bank_reference || '',
      paymentAmount: successPayment.order_amount || 150,
      paidAt: new Date(),
      registrationType: 'online',
      paymentMode: 'online',
      examDate: '18 October 2026',
      examTime: '10:00 AM – 11:30 AM (90 Min)',
      reportingTime: '8:00 AM',
      examCenter: 'S K Modern Intermediate College Semari Janghai Jaunpur'
    });

    tempOrder.status = 'completed';
    await tempOrder.save();

    return res.json({
      success: true,
      transactionId: newApp.paymentTransactionId,
      paidAt: newApp.paidAt,
      application: newApp,
    });
  } catch (err) {
    console.error('verify error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// -------------------------------------------------------------------
// POST /api/payment/webhook  (Cashfree server-to-server notification)
// -------------------------------------------------------------------
router.post('/webhook', async (req, res) => {
  try {
    const event = req.body;
    if (event?.data?.order?.order_status === 'PAID') {
      const orderId = event.data.order.order_id;
      let app = await CompetitionApplication.findOne({ paymentOrderId: orderId });
      if (!app) {
        const tempOrder = await CompetitionTempOrder.findOne({ orderId });
        if (tempOrder && tempOrder.status !== 'completed') {
          const rollNumber = await generateNextRollNumber();
          const fd = tempOrder.formData;
          app = await CompetitionApplication.create({
            name: fd.name.trim(),
            fatherName: fd.fatherName.trim(),
            motherName: fd.motherName.trim(),
            phone: fd.phone.trim(),
            school: fd.school.trim(),
            parentPhone: fd.parentPhone ? fd.parentPhone.trim() : '',
            address: fd.address.trim(),
            subject: fd.subject || 'GK',
            aadhaar: fd.aadhaar ? fd.aadhaar.trim() : '',
            dateOfBirth: fd.dateOfBirth,
            classPassed: fd.classPassed.trim(),
            image: fd.image || null,
            rollNumber,
            session: fd.session || '2026-2027',
            paymentStatus: 'paid',
            paymentOrderId: orderId,
            paymentTransactionId: event.data.payment?.cf_payment_id?.toString() || '',
            paymentAmount: event.data.order?.order_amount || 150,
            paidAt: new Date(),
            registrationType: 'online',
            paymentMode: 'online',
            examDate: '18 October 2026',
            examTime: '10:00 AM – 11:30 AM (90 Min)',
            reportingTime: '8:00 AM',
            examCenter: 'S K Modern Intermediate College Semari Janghai Jaunpur'
          });
          tempOrder.status = 'completed';
          await tempOrder.save();
        }
      } else if (app.paymentStatus !== 'paid') {
        await CompetitionApplication.findByIdAndUpdate(app._id, {
          paymentStatus: 'paid',
          paymentTransactionId: event.data.payment?.cf_payment_id?.toString() || '',
          paidAt: new Date(),
        });
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});


// -------------------------------------------------------------------
// GET /api/payment/status/:applicationId
// -------------------------------------------------------------------
router.get('/status/:applicationId', async (req, res) => {
  try {
    const app = await CompetitionApplication.findById(req.params.applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({
      paymentStatus: app.paymentStatus,
      paymentTransactionId: app.paymentTransactionId,
      paidAt: app.paidAt,
      paymentAmount: app.paymentAmount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
