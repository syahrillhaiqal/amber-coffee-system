import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function PaymentStatusPage({ clearCart }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("checking"); 

    const statusId = searchParams.get("status_id"); 
    const orderId = searchParams.get("order_id");

    useEffect(() => {
        const verifyOrder = async () => {
            if (statusId === "1") {
                try {
                    const q = query(collection(db, "orders"), where("orderId", "==", orderId));
                    const snapshot = await getDocs(q);

                    if (!snapshot.empty) {
                        const orderDoc = snapshot.docs[0];
                        const orderData = orderDoc.data();
                        
                        await updateDoc(orderDoc.ref, {
                            status: "RECEIVED",
                            paymentStatus: "PAID"
                        });

                        clearCart();
                        setStatus("success");
                        
                        setTimeout(() => {
                            navigate("/receipt", { 
                                replace: true,
                                state: { 
                                    orderId: orderId,
                                    timestamp: new Date().toLocaleString('en-GB'),
                                    cart: orderData.items,
                                    
                                    // PASS ALL DATA TO RECEIPT
                                    customer: { 
                                        pickupPoint: orderData.pickupPoint,
                                        address: orderData.address // <--- CRITICAL: Pass address
                                    },
                                    totals: { 
                                        finalTotal: orderData.totalPrice, 
                                        subTotal: orderData.subTotal, // <--- Pass breakdown
                                        protectionFee: orderData.protectionFee,
                                        protectionType: orderData.protectionType || "Basic"
                                    }
                                } 
                            });
                        }, 2000);
                    }
                } catch (err) {
                    console.error("DB Error", err);
                    setStatus("fail");
                }
            } else {
                setStatus("fail");
            }
        };

        verifyOrder();
    }, [statusId, orderId]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-100 text-center">
            {status === "checking" && (
                <>
                    <Loader2 className="animate-spin text-primary mb-4" size={48} />
                    <h2 className="text-xl font-bold text-stone-800">Verifying Payment...</h2>
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
                    
                    {/* FIX: Go back to Checkout to retry payment */}
                    <button onClick={() => navigate('/menu')} className="bg-primary text-white px-6 py-3 rounded-xl font-bold mt-4">
                        Try Again
                    </button>
                    
                    {/* OR Go back to Menu */}
                    {/* <button onClick={() => navigate('/menu')} className="text-stone-500 font-bold mt-4 text-sm block">
                        Back to Menu
                    </button> */}
                </>
            )}
        </div>
    );
}