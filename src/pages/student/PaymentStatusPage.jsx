import { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { analytics, db } from "../../lib/firebase";
import { logEvent } from "firebase/analytics";

export default function PaymentStatusPage({ clearCart }) {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("checking"); 
    const statusId = searchParams.get("status_id"); 
    const orderId = searchParams.get("order_id");

    // Use a ref to prevent logging success multiple times on re-renders
    const hasLoggedSuccess = useRef(false);
    const hasLoggedFailure = useRef(false);

    useEffect(() => {

        // Handle initial failure
        if (!orderId || statusId !== "1") {
            setStatus("fail");
            if (!hasLoggedFailure.current) {
                logEvent(analytics, "payment_failed", {
                    order_id: orderId || "unknown",
                    reason: !orderId ? "missing_order_id" : "toyyibpay_status_failed"
                });
                hasLoggedFailure.current = true;
            }
            return;
        }

        // Listen to the order in Real-Time (for success)
        // We wait for the Backend (Callback) to update the status to 'RECEIVED'
        const q = query(collection(db, "orders"), where("orderId", "==", orderId));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const orderData = snapshot.docs[0].data();
                
                // Check if Backend has done the payment
                if (orderData.paymentStatus === "PAID" || orderData.status === "RECEIVED") {

                    if (hasLoggedSuccess.current) return;
                    hasLoggedSuccess.current = true;

                    // Log Success
                    logEvent(analytics, "payment_success", {
                        order_id: orderData.orderId,
                        total_paid: orderData.totalPrice,
                        payment_method: "toyyibpay"
                    });

                    clearCart();
                    setStatus("success");

                    // Navigate to receipt after 2 seconds
                    setTimeout(() => {
                        navigate("/receipt", { 
                            replace: true,
                            state: { 
                                orderId: orderId,
                                timestamp: new Date().toLocaleString('en-GB'),
                                tripTime: orderData.tripTime,
                                orderType: orderData.orderType || "delivery",
                                cart: orderData.items,
                                customer: { 
                                    pickupPoint: orderData.pickupPoint,
                                    pickupTime: orderData.pickupTime || "",
                                    address: orderData.address 
                                },
                                totals: { 
                                    finalTotal: orderData.totalPrice, 
                                    subTotal: orderData.subTotal, 
                                    protectionFee: orderData.protectionFee,
                                    protectionType: orderData.protectionType || "Basic",
                                    deliveryFee: orderData.deliveryFee || 0
                                } 
                            } 
                        });
                    }, 2000);
                }
            }
        });

        const timeout = setTimeout(() => {
            if (status === 'checking') {
               console.log("Payment verification timed out or is delayed.");
            }
        }, 10000);

        return () => {
            unsubscribe();
            clearTimeout(timeout);
        };
    }, [statusId, orderId, navigate, clearCart]); 

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-100 text-center">
            {status === "checking" && (
                <>
                    <Loader2 className="animate-spin text-primary mb-4" size={48} />
                    <h2 className="text-xl font-bold text-stone-800">Verifying Payment...</h2>
                    <p className="text-xs text-stone-500 mt-2">Waiting for confirmation from bank.</p>
                </>
            )}
            {status === "success" && (
                <>
                    <CheckCircle className="text-green-500 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-stone-800">Payment Successful!</h2>
                    <p className="text-stone-500">Generating receipt...</p>
                </>
            )}
            {status === "fail" && (
                <>
                    <XCircle className="text-red-500 mb-4" size={64} />
                    <h2 className="text-2xl font-bold text-stone-800">Payment Failed</h2>
                    <button onClick={() => navigate('/menu')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold mt-4">
                        Try Again
                    </button>
                </>
            )}
        </div>
    );
}