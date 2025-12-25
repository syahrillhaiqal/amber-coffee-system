const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });

admin.initializeApp();

const TOYYIBPAY_URL = process.env.TOYYIBPAY_URL;
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY; 
const CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE;
const CLIENT_URL = process.env.CLIENT_URL;

exports.createPayment = onRequest(async (req, res) => {
  cors(req, res, async () => {
    // 1. Log Incoming Data (for debugging)
    console.log("🚀 [START] Incoming Request Body:", req.body);

    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { orderId, customerName, customerPhone, totalAmount, description } = req.body;

      // Validate Essential Data
      if (!totalAmount || !orderId) {
        console.error("❌ [ERROR] Missing Data:", { orderId, totalAmount });
        return res.status(400).json({ error: "Missing required fields (orderId or totalAmount)" });
      }

      // Convert to cents
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
        billCallbackUrl: "https://amber-coffee-2f671.cloudfunctions.net/paymentCallback",
        billExternalReferenceNo: orderId,
        billTo: customerName || "Student", // Fallback if empty
        billEmail: "syahrilhaiqal5@gmail.com",
        billPhone: customerPhone || "0123456789", // Fallback if empty
        billSplitPayment: 0,
        billPaymentChannel: "0",
      };

      console.log("📤 [SENDING] Payload to ToyyibPay:", payload);

      // Send as Form Data (Standard for ToyyibPay)
      const formBody = new URLSearchParams(payload);

      const response = await axios.post(TOYYIBPAY_URL, formBody.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const data = response.data;
      console.log("📥 [RECEIVED] ToyyibPay Response:", JSON.stringify(data));

      // Success Check: ToyyibPay returns an array with BillCode on success
      if (Array.isArray(data) && data.length > 0 && data[0].BillCode) {
        return res.status(200).json({ 
            billCode: data[0].BillCode,
            paymentUrl: `https://dev.toyyibpay.com/${data[0].BillCode}`
        });
      } else {
        // If ToyyibPay returns 200 OK but with an error message (e.g., "Category not found")
        console.error("❌ [TOYYIBPAY REJECTED]:", data);
        return res.status(500).json({ error: "ToyyibPay rejected the request", details: data });
      }

    } catch (error) {
      // Catch Network/Axios Errors
      console.error("🔥 [CRASH] System Error:", error.message);
      if (error.response) {
        console.error("🔥 [CRASH] Upstream Response:", error.response.data);
      }
      return res.status(500).json({ error: error.message });
    }
  });
});