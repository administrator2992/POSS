const express = require('express');
const router = express.Router();

// Lazy-init DANA client (singleton)
let danaClient = null;
let paymentGatewayApi = null;
let webhookParser = null;

function getDanaClient() {
  if (paymentGatewayApi) return paymentGatewayApi;

  const partnerId = process.env.X_PARTNER_ID;
  if (!partnerId) {
    throw new Error(
      'DANA credentials not configured. Set X_PARTNER_ID and key paths in server/.env'
    );
  }

  const { Dana } = require('dana-node');
  danaClient = new Dana({
    partnerId,
    privateKeyPath: process.env.PRIVATE_KEY_PATH,
    origin: process.env.ORIGIN || 'http://localhost:4000',
    env: process.env.DANA_ENV || 'sandbox',
    debugMode: process.env.X_DEBUG || 'true',
  });

  paymentGatewayApi = danaClient.paymentGatewayApi;
  return paymentGatewayApi;
}

function getWebhookParser() {
  if (webhookParser) return webhookParser;

  const publicKey = process.env.DANA_PUBLIC_KEY;
  const publicKeyPath = process.env.DANA_PUBLIC_KEY_PATH;

  if (!publicKey && !publicKeyPath) {
    throw new Error('DANA public key not configured for webhook verification');
  }

  const { WebhookParser } = require('dana-node/webhook/v1');
  webhookParser = new WebhookParser(publicKey, publicKeyPath);
  return webhookParser;
}

// ─── In-memory order store (replace with DB in production) ──────────────────

const orders = new Map();

// ─── POST /create-qris ──────────────────────────────────────────────────────
// Generates a QRIS payment order and returns the QR / checkout URL.

router.post('/create-qris', async (req, res) => {
  try {
    const api = getDanaClient();
    const { amount, orderId, items } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // partnerReferenceNo must be max 25 chars for QRIS
    const partnerReferenceNo = (orderId || `POSS-${Date.now()}`).substring(0, 25);

    // Validity: 15 minutes from now (GMT+7)
    const validUpTo = new Date(Date.now() + 15 * 60 * 1000);
    const gmt7Offset = 7 * 60 * 60 * 1000;
    const gmt7Date = new Date(validUpTo.getTime() + gmt7Offset);
    const validityStr =
      gmt7Date.toISOString().replace('Z', '+07:00').slice(0, 19) + '+07:00';

    // Build goods list from order items
    const goods = (items || []).map((item) => ({
      name: item.name || 'Item',
      quantity: item.quantity || 1,
      price: {
        value: (item.price || 0).toFixed(2),
        currency: 'IDR',
      },
    }));

    const request = {
      partnerReferenceNo,
      merchantId: process.env.X_PARTNER_ID,
      amount: {
        value: amount.toFixed(2),
        currency: 'IDR',
      },
      validUpTo: validityStr,
      payOptionDetails: [
        {
          payMethod: 'NETWORK_PAY',
          payOption: 'NETWORK_PAY_PG_QRIS',
        },
      ],
      additionalInfo: {
        order: {
          title: 'POSS Payment',
          scenario: 'API',
          merchantTransType: 'GOODS',
          goods: goods.length > 0 ? goods : undefined,
        },
      },
    };

    console.log('Creating QRIS order:', partnerReferenceNo, 'Amount:', amount);

    const response = await api.createOrder(request);

    // Store order for status tracking
    orders.set(partnerReferenceNo, {
      referenceNo: partnerReferenceNo,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      response,
    });

    // The response should contain webRedirectUrl or acquirerId
    res.json({
      success: true,
      referenceNo: partnerReferenceNo,
      checkoutUrl: response?.webRedirectUrl || null,
      qrContent: response?.qrContent || null,
      acquirementId: response?.acquirementId || null,
    });
  } catch (error) {
    console.error('DANA create-qris error:', error.message || error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create QRIS order',
      debug: error.additionalInfo?.debugMessage || null,
    });
  }
});

// ─── GET /status/:referenceNo ───────────────────────────────────────────────
// Polls DANA for payment status of a specific order.

router.get('/status/:referenceNo', async (req, res) => {
  try {
    const { referenceNo } = req.params;

    // Check local store first
    const localOrder = orders.get(referenceNo);

    try {
      const api = getDanaClient();
      const statusResponse = await api.queryPayment({
        partnerReferenceNo: referenceNo,
        merchantId: process.env.X_PARTNER_ID,
      });

      const status = statusResponse?.statusDetail?.acquirementStatus || 'UNKNOWN';

      // Update local store
      if (localOrder) {
        localOrder.status = status;
        localOrder.statusResponse = statusResponse;
      }

      res.json({
        success: true,
        referenceNo,
        status,
        paid: status === 'SUCCESS',
        details: statusResponse,
      });
    } catch (queryError) {
      // If query fails, return local status
      res.json({
        success: true,
        referenceNo,
        status: localOrder?.status || 'UNKNOWN',
        paid: localOrder?.status === 'SUCCESS',
        error: queryError.message,
      });
    }
  } catch (error) {
    console.error('DANA status error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /cancel ───────────────────────────────────────────────────────────

router.post('/cancel', async (req, res) => {
  try {
    const api = getDanaClient();
    const { referenceNo } = req.body;

    if (!referenceNo) {
      return res.status(400).json({ error: 'referenceNo is required' });
    }

    const cancelResponse = await api.cancelOrder({
      partnerReferenceNo: referenceNo,
      merchantId: process.env.X_PARTNER_ID,
    });

    // Update local store
    const localOrder = orders.get(referenceNo);
    if (localOrder) {
      localOrder.status = 'CANCELLED';
    }

    res.json({ success: true, referenceNo, response: cancelResponse });
  } catch (error) {
    console.error('DANA cancel error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─── POST /webhook ──────────────────────────────────────────────────────────
// Receives DANA Finish Notify when payment completes.

router.post('/webhook', (req, res) => {
  try {
    const parser = getWebhookParser();

    // req.body is raw Buffer because of express.raw() middleware
    const bodyString = req.body.toString('utf-8');
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }

    const finishNotify = parser.parseWebhook(
      'POST',
      '/api/dana/webhook',
      headers,
      bodyString
    );

    console.log('DANA webhook received:', finishNotify);

    // Update local order store
    const refNo = finishNotify.originalPartnerReferenceNo;
    if (refNo && orders.has(refNo)) {
      orders.get(refNo).status = 'SUCCESS';
      orders.get(refNo).webhookPayload = finishNotify;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('DANA webhook error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
});

// ─── GET /redirect ──────────────────────────────────────────────────────────
// Browser redirect from DANA after payment completes.
// Shows a success page — the installed app polls /status, no postMessage needed.

router.get('/redirect', (req, res) => {
  const { partnerReferenceNo, acquirementId } = req.query;

  // Update local store if available
  if (partnerReferenceNo && orders.has(partnerReferenceNo)) {
    orders.get(partnerReferenceNo).status = 'SUCCESS';
    orders.get(partnerReferenceNo).redirectReceived = true;
  }

  console.log('DANA redirect received:', { partnerReferenceNo, acquirementId });

  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>Pembayaran Berhasil</title>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #fff7ed, #ffedd5); }
    .card { background: white; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.1); max-width: 400px; }
    .icon { width: 64px; height: 64px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 32px; }
    h1 { color: #166534; margin: 0 0 8px; }
    p { color: #6b7280; margin: 0 0 4px; font-size: 14px; }
    .ref { font-family: monospace; color: #9ca3af; font-size: 12px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✓</div>
    <h1>Pembayaran Berhasil!</h1>
    <p>Transaksi DANA QRIS Anda telah diterima.</p>
    <p>Anda bisa menutup halaman ini.</p>
    <div class="ref">${partnerReferenceNo ? `Ref: ${partnerReferenceNo}` : ''}</div>
  </div>
  <script>
    // Auto-close if opened in a popup/in-app browser
    try { window.close(); } catch(e) {}
    setTimeout(function() { try { window.close(); } catch(e) {} }, 5000);
  </script>
</body>
</html>`);
});

module.exports = router;
