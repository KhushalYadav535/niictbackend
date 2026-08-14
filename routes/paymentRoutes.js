const express = require('express');
const router = express.Router();
const CompetitionApplication = require('../models/CompetitionApplication');

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;
const IS_TEST = (process.env.CASHFREE_ENV || 'TEST') === 'TEST';
const CF_BASE_URL = IS_TEST
  ? 'https://sandbox.cashfree.com/pg'
  : 'https://api.cashfree.com/pg';
const CF_API_VERSION = '2023-08-01';

const cfHeaders = {
  'Content-Type': 'application/json',
  'x-client-id': CASHFREE_APP_ID,
  'x-client-secret': CASHFREE_SECRET_KEY,
  'x-api-version': CF_API_VERSION,
};

// -------------------------------------------------------------------
// POST /api/payment/create-order
// Creates a Cashfree order for the competition fee (₹150)
// Body: { applicationId }
// -------------------------------------------------------------------
router.post('/create-order', async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId) {
      return res.status(400).json({ message: 'applicationId is required' });
    }

    const app = await CompetitionApplication.findById(applicationId);
    if (!app) return res.status(404).json({ message: 'Application not found' });

    if (app.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment already completed for this application' });
    }

    // Build Cashfree order payload
    const orderId = `NIICT_COMP_${app.rollNumber}_${Date.now()}`;
    const orderPayload = {
      order_id: orderId,
      order_amount: 150,
      order_currency: 'INR',
      customer_details: {
        customer_id: app._id.toString(),
        customer_name: app.name,
        customer_phone: app.phone.replace(/\D/g, '').slice(-10), // ensure 10 digits
      },
      order_meta: {
        return_url: `${req.headers.origin || 'http://localhost:5173'}/competition-form?order_id=${orderId}`,
        notify_url: `https://${req.headers.host || 'localhost:5000'}/api/payment/webhook`.replace('https://localhost', 'http://localhost'),
      },
      order_note: `NIICT GK Competition Registration - Roll No: ${app.rollNumber}`,
    };

    const cfRes = await fetch(`${CF_BASE_URL}/orders`, {
      method: 'POST',
      headers: cfHeaders,
      body: JSON.stringify(orderPayload),
    });

    const cfData = await cfRes.json();

    if (!cfRes.ok) {
      console.error('Cashfree order creation failed:', cfData);
      return res.status(502).json({
        message: 'Failed to create payment order',
        detail: cfData.message || JSON.stringify(cfData),
      });
    }

    // Save the order info to the application
    await CompetitionApplication.findByIdAndUpdate(applicationId, {
      paymentOrderId: cfData.order_id,
      paymentSessionId: cfData.payment_session_id,
      paymentAmount: 150,
    });

    return res.json({
      orderId: cfData.order_id,
      paymentSessionId: cfData.payment_session_id,
      orderStatus: cfData.order_status,
    });
  } catch (err) {
    console.error('create-order error:', err);
    return res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// -------------------------------------------------------------------
// POST /api/payment/verify
// Verifies payment after Cashfree checkout completes
// Body: { applicationId, orderId }
// -------------------------------------------------------------------
router.post('/verify', async (req, res) => {
  try {
    const { applicationId, orderId } = req.body;
    if (!applicationId || !orderId) {
      return res.status(400).json({ message: 'applicationId and orderId are required' });
    }

    // Fetch order payments from Cashfree
    const cfRes = await fetch(`${CF_BASE_URL}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: cfHeaders,
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
      // Update as failed if all failed
      const hasFailed = Array.isArray(payments) && payments.some(p => p.payment_status === 'FAILED');
      if (hasFailed) {
        await CompetitionApplication.findByIdAndUpdate(applicationId, {
          paymentStatus: 'failed',
        });
        return res.status(400).json({ message: 'Payment failed or cancelled' });
      }
      return res.status(400).json({ message: 'Payment not yet successful', payments });
    }

    // Mark payment as paid in DB
    const updated = await CompetitionApplication.findByIdAndUpdate(
      applicationId,
      {
        paymentStatus: 'paid',
        paymentTransactionId: successPayment.cf_payment_id?.toString() || successPayment.bank_reference || '',
        paidAt: new Date(),
        paymentAmount: successPayment.order_amount || 150,
      },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Application not found' });

    return res.json({
      success: true,
      transactionId: updated.paymentTransactionId,
      paidAt: updated.paidAt,
      application: updated,
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
      const app = await CompetitionApplication.findOne({ paymentOrderId: orderId });
      if (app && app.paymentStatus !== 'paid') {
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
