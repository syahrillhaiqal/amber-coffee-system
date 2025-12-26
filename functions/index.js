const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const Busboy = require('busboy');

admin.initializeApp();

const TOYYIBPAY_URL = process.env.TOYYIBPAY_URL;
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY; 
const CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE;
const CLIENT_URL = process.env.CLIENT_URL;

const getProjectId = () => admin.instanceId().app.options.projectId;

// ==========================================
// 1. CREATE PAYMENT (Frontend calls this)
// ==========================================
exports.createPayment = onRequest(async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    try {
      // 1. RECEIVE EMAIL FROM FRONTEND
      const { orderId, customerName, customerPhone, customerEmail, totalAmount, description } = req.body;

      // DYNAMICALLY BUILD THE CALLBACK URL
      const projectId = getProjectId();
      const region = "us-central1"; 
      const callbackUrl = `https://${region}-${projectId}.cloudfunctions.net/paymentCallback`;

      console.log(`🚀 Creating Bill for ${customerName} (${customerEmail}).`);

      const amountInCents = Math.round(totalAmount * 100);

      const payload = {
        userSecretKey: SECRET_KEY,
        categoryCode: CATEGORY_CODE,
        billName: `Order ${orderId}`,
        billDescription: description || "Coffee Order",
        billPriceSetting: 1,
        billPayorInfo: 1,
        billAmount: amountInCents,
        billReturnUrl: CLIENT_URL,
        billCallbackUrl: callbackUrl,
        billExternalReferenceNo: orderId,
        billTo: customerName || "Student",
        
        // 2. USE CUSTOMER EMAIL (Fall back to admin if empty for some reason)
        billEmail: customerEmail || "ambercoffee.sys@gmail.com", 
        
        billPhone: customerPhone || "0123456789",
        billSplitPayment: 0,
        billPaymentChannel: "0",
      };

      const formBody = new URLSearchParams(payload);
      const response = await axios.post(TOYYIBPAY_URL, formBody.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = response.data;

      if (Array.isArray(data) && data.length > 0 && data[0].BillCode) {
        // Fix for dynamic URL redirect
        const isDev = TOYYIBPAY_URL.includes('dev.toyyibpay.com');
        const paymentBaseUrl = isDev ? 'https://dev.toyyibpay.com' : 'https://toyyibpay.com';

        return res.status(200).json({ 
            billCode: data[0].BillCode,
            paymentUrl: `${paymentBaseUrl}/${data[0].BillCode}` 
        });
      } else {
        console.error("❌ [TOYYIBPAY REJECTED]:", data);
        return res.status(500).json({ error: "ToyyibPay rejected", details: data });
      }

    } catch (error) {
      console.error("🔥 Error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });
});

// ==========================================
// 2. PAYMENT CALLBACK (Updated for Multipart)
// ==========================================
exports.paymentCallback = onRequest((req, res) => {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    // 1. Prepare to open the "Multipart Package"
    const busboy = Busboy({ headers: req.headers });
    const fields = {}; // We will store the data here

    // 2. Extract data field by field
    busboy.on('field', (fieldname, val) => {
        console.log(`Processed field ${fieldname}: ${val}`);
        fields[fieldname] = val;
    });

    // 3. When finished opening the package, run our logic
    busboy.on('finish', async () => {
        const data = fields;
        console.log("🔔 [PARSED DATA]:", JSON.stringify(data));

        // Allow 'status' to be string "1" or number 1
        const isSuccess = data.status == '1'; 
        const incomingOrderId = data.order_id || data.billExternalReferenceNo;

        if (isSuccess && incomingOrderId) {
            try {
                const ordersRef = admin.firestore().collection('orders');
                const q = ordersRef.where('orderId', '==', incomingOrderId);
                const snapshot = await q.get();

                if (snapshot.empty) {
                    console.error("❌ Order not found in DB:", incomingOrderId);
                    return res.send("Order not found");
                }

                const orderDoc = snapshot.docs[0];
                await orderDoc.ref.update({
                    status: 'RECEIVED',
                    paymentStatus: 'PAID',
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    transactionId: data.refno
                });

                console.log(`✅ Order ${incomingOrderId} updated to PAID`);
                return res.send("OK");

            } catch (error) {
                console.error("🔥 Callback Error:", error);
                return res.status(500).send("Server Error");
            }
        } else {
            console.log(`⚠️ Payment Rejected/Invalid. Status: ${data.status}, ID: ${incomingOrderId}`);
            return res.send("Ignored");
        }
    });

    // 4. Start processing the raw data
    // Cloud Functions stores the raw buffer in req.rawBody
    busboy.end(req.rawBody);
});