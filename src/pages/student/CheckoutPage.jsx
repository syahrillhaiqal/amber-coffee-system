import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Loader2, Truck } from "lucide-react";
import { collection, addDoc, doc, getDoc, query, where, getDocs } from "firebase/firestore"; // Added getDoc, doc
import { db } from "../../lib/firebase";
import axios from "axios";

export default function CheckoutPage({ clearCart }) { 
    const navigate = useNavigate();
    const location = useLocation();
    
    const { cart, subTotal, protectionFee, protectionType, total, tripInfo } = location.state || {}; 

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        pickupPoint: "Alpha",
        address: "",
    });

    const finalTotal = total || 0; 

    const isValidPhone = (phone) => {
        return /^[0-9]{9,15}$/.test(phone);
    };

    const generateOrderId = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    // 1. Calculate Cups in Cart
    const cartCups = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;

    // 2. Updated Validation Function
    const checkTripValidity = async () => {
        if (!tripInfo?.tripId) return false;

        try {
            // Fetch Trip Data
            const tripRef = doc(db, "delivery_slots", tripInfo.tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) {
                alert("This trip no longer exists.");
                return false;
            }

            const tripData = tripSnap.data();
            const now = new Date();
            const cutoff = new Date(tripData.cutoffTime);

            // Check Deadline
            if (now >= cutoff) {
                alert(`Ordering for this trip closed at ${cutoff.toLocaleTimeString()}.`);
                navigate('/trip'); 
                return false;
            }

            // --- NEW: Check Capacity ---
            // Fetch current orders to count filled cups
            const q = query(collection(db, "orders"), where("slotId", "==", tripInfo.tripId));
            const ordersSnap = await getDocs(q);
            
            let currentFilledCups = 0;
            ordersSnap.forEach(doc => {
                const data = doc.data();
                // Only count PAID orders
                if (data.status !== 'CANCELLED' && data.status !== 'PENDING_PAYMENT') {
                    const orderCupCount = data.items.reduce((s, i) => s + i.quantity, 0);
                    currentFilledCups += orderCupCount;
                }
            });

            const availableSlots = tripData.maxCapacity - currentFilledCups;

            if (cartCups > availableSlots) {
                alert(`Sorry! This trip is almost full. Only ${availableSlots} cups remaining. Your order has ${cartCups} cups.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Validation Error:", error);
            alert("Network error checking trip status.");
            return false;
        }
    };

    const handlePayment = async () => {
        if (!formData.name || !formData.phone) return alert("Please fill in your Name and Phone Number.");
        if (!isValidPhone(formData.phone)) return alert("Please enter a valid phone number.");
        if (formData.pickupPoint === "NR" && !formData.address) return alert("Please enter your full address for NR delivery.");

        setLoading(true);

        // 1. VALIDATE TRIP BEFORE PROCEEDING
        const isValid = await checkTripValidity();
        if (!isValid) {
            setLoading(false);
            return; // Stop checkout
        }

        try {
            const shortId = generateOrderId();
            const FUNCTION_URL = import.meta.env.VITE_PAYMENT_FUNCTION_URL;

            const response = await axios.post(FUNCTION_URL, {
                orderId: shortId,
                customerName: formData.name,
                customerPhone: formData.phone,
                totalAmount: finalTotal,
                description: `Coffee Order for ${tripInfo?.time || 'Trip'}`
            });

            const { paymentUrl, billCode } = response.data;

            const orderPayload = {
                orderId: shortId,
                billCode: billCode || "", 
                slotId: tripInfo?.tripId || "unknown", 
                tripTime: tripInfo?.time || "unknown", 
                customerName: formData.name,
                customerPhone: formData.phone,
                pickupPoint: formData.pickupPoint,
                address: formData.address || "", 
                items: cart,
                
                subTotal: subTotal || 0,
                protectionFee: protectionFee || 0,
                protectionType: protectionType || "Basic", 
                totalPrice: finalTotal,
                
                status: "PENDING_PAYMENT", 
                createdAt: new Date().toISOString(),
            };

            await addDoc(collection(db, "orders"), orderPayload);
            window.location.href = paymentUrl; 
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment gateway failed. Please try again.");
            setLoading(false);
        }
    };
    
    if (!cart || cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <button onClick={() => navigate('/menu')} className="text-primary font-bold hover:underline">
                    Go to Menu
                </button>
            </div>
        );
    }

    return (
       <div className="min-h-screen bg-stone-100 pb-24 font-sans">
            {/* ... Rest of UI (unchanged) ... */}
            {/* Make sure to paste the full return statement from previous implementation here */}
            {/* Header */}
            <div className="bg-white p-4 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-lg font-bold text-stone-800">Checkout</h1>
            </div>

            <div className="p-4 max-w-md mx-auto space-y-6">
                {/* Trip Summary */}
                {tripInfo && (
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <span className="text-xs font-bold text-orange-600 uppercase">Ordering for Trip</span>
                        <span className="font-bold text-stone-800">{tripInfo.time}</span>
                    </div>
                )}

                {/* 1. Student Details */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Student Details
                    </h2>
                    <input 
                        placeholder="Name on Cup (e.g. Ali)" 
                        className="w-full p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <input 
                        type="tel"
                        inputMode="numeric"
                        placeholder="WhatsApp Number (e.g. 0123456789)" 
                        className="w-full p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                    />
                </div>

                {/* 2. Delivery Location */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Delivery Point
                    </h2>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={20}/>
                        <select 
                            className="w-full pl-10 p-3 bg-stone-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 appearance-none bg-white"
                            value={formData.pickupPoint}
                            onChange={e => setFormData({...formData, pickupPoint: e.target.value})}
                        >
                            <option value="Alpha">Alpha (Front of Alpha 9)</option>
                            <option value="Beta">Beta (Front of Beta 12)</option>
                            <option value="Gamma">Gamma (Gamma Cafe)</option>
                            <option value="NR">NR (Non-Resident)</option>
                        </select>
                    </div>
                    {formData.pickupPoint === "NR" && (
                        <textarea 
                            placeholder="Full Address (House No, Street...)"
                            className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                            rows="2"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    )}
                </div>

                {/* Summary */}
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm text-gray-500 px-2">
                        <span>Items Subtotal</span>
                        <span>RM {subTotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-600 font-medium px-2">
                        <span>{protectionType}</span>
                        <span>RM {protectionFee?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600 font-bold px-2">
                        <span className="flex items-center gap-1"><Truck size={14}/> Delivery Fee</span>
                        <span>FREE</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-stone-900 bg-white p-4 rounded-xl shadow-sm border border-stone-100 mt-2">
                        <span>Total Payment</span> <span className="text-primary">RM {finalTotal?.toFixed(2)}</span>
                    </div>
                </div>

                <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-200 active:scale-95 transition-transform flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading && <Loader2 className="animate-spin" />}
                    {loading ? "Processing..." : `Confirm & Pay`}
                </button>
            </div>
       </div>
    );
}