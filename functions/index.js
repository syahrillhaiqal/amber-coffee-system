const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const axios = require("axios");
const cors = require("cors")({ origin: true });
const Busboy = require("busboy");

admin.initializeApp();

const TOYYIBPAY_URL = process.env.TOYYIBPAY_URL;
const SECRET_KEY = process.env.TOYYIBPAY_SECRET_KEY;
const CATEGORY_CODE = process.env.TOYYIBPAY_CATEGORY_CODE;
const CLIENT_URL = process.env.CLIENT_URL;

const getProjectId = () => admin.instanceId().app.options.projectId;

// ======================
// 1. CREATE PAYMENT
// ======================
exports.createPayment = onRequest(async (req, res) => {

    // CORS stands for Cross-Origin Resource Sharing.
    // Backend is running on url-A, but frontend on url-B.
    // Browsers by default will block requests since different domain.
    // But CORS will allow it.
    cors(req, res, async () => {

        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        try {
            // 1. Take data from frontend (we send it on CheckoutPage)
            const { orderId, customerName, customerPhone, customerEmail, totalAmount, description } = req.body;

            // Dynamic callback url
            const projectId = getProjectId();
            const callbackUrl = `https://us-central1-${projectId}.cloudfunctions.net/paymentCallback`;

            console.log(`[INFO] Creating Bill for ${customerName} (${customerEmail}).`);

            const amountInCents = Math.round(totalAmount * 100);

            // Based on toyyibpay requirement
            const payload = {
                userSecretKey: SECRET_KEY,
                categoryCode: CATEGORY_CODE,
                billName: `Order ${orderId}`,
                billDescription: description || "Coffee Order",
                billPriceSetting: 1,
                billPayorInfo: 1,
                billAmount: amountInCents,
                billReturnUrl: CLIENT_URL, // The url where user will be redirect after settle the payment
                billCallbackUrl: callbackUrl, // The backend that will update our db, came from toyyibpay
                billExternalReferenceNo: orderId,
                billTo: customerName || "Student",
                billEmail: customerEmail || "student@gmail.com",
                billPhone: customerPhone || "0123456789",
                billSplitPayment: 0,
                billPaymentChannel: "0",
            };

            const formBody = new URLSearchParams(payload);
            const response = await axios.post(
                TOYYIBPAY_URL,
                formBody.toString(),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                },
            );

            const data = response.data;

            if (Array.isArray(data) && data.length > 0 && data[0].BillCode) {

                const isDev = TOYYIBPAY_URL.includes("dev.toyyibpay.com");

                const paymentBaseUrl = isDev ? "https://dev.toyyibpay.com" : "https://toyyibpay.com";

                return res.status(200).json({
                    billCode: data[0].BillCode,
                    paymentUrl: `${paymentBaseUrl}/${data[0].BillCode}`,
                });
            } else {
                console.error("[ERROR] ToyyibPay Rejected:", data);
                return res
                    .status(500)
                    .json({ error: "ToyyibPay rejected", details: data });
            }
        } catch (error) {
            console.error("[ERROR] Error:", error.message);
            return res.status(500).json({ error: error.message });
        }
    });
});

// =======================
// 2. PAYMENT CALLBACK
// =======================
exports.paymentCallback = onRequest((req, res) => {

    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    // Prepare to open the "Multipart form data" using busboy
    const busboy = Busboy({ headers: req.headers });
    const fields = {}; // We will store the data here

    // Extract data field by field
    busboy.on("field", (fieldname, val) => {
        console.log(`[INFO] Processed field ${fieldname}: ${val}`);
        fields[fieldname] = val;
    });

    // When finished opening the form data, run our logic
    busboy.on("finish", async () => {
        const data = fields;
        console.log("[PARSED DATA]:", JSON.stringify(data));

        const isSuccess = data.status == "1";
        const incomingOrderId = data.order_id || data.billExternalReferenceNo;

        if (isSuccess && incomingOrderId) {
            try {
                const ordersRef = admin.firestore().collection("orders");
                const q = ordersRef.where("orderId", "==", incomingOrderId);
                const snapshot = await q.get();

                if (snapshot.empty) {
                    console.error("[ERROR] Order not found in DB:", incomingOrderId);
                    return res.send("Order not found");
                }

                const orderDoc = snapshot.docs[0];
                await orderDoc.ref.update({
                    status: "RECEIVED",
                    paymentStatus: "PAID",
                    paidAt: admin.firestore.FieldValue.serverTimestamp(),
                    transactionId: data.refno,
                });

                console.log(`[SUCCESS] Order ${incomingOrderId} updated to PAID`);
                return res.send("OK");
            } catch (error) {
                console.error("[ERROR] Callback Error:", error);
                return res.status(500).send("Server Error");
            }
        } else {
            console.log(
                `[ERROR] Payment Rejected/Invalid. Status: ${data.status}, ID: ${incomingOrderId}`,
            );
            return res.send("Ignored");
        }
    });

    busboy.end(req.rawBody);
});
