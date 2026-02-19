import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Loader2, Truck, Mail, Gift, ShoppingBag } from "lucide-react"; 
import axios from "axios";
import { calcDeliveryFee } from "../../lib/pricing";
import { createOrder, getFilledCupsForSlot } from "../../services/orderService";
import { getSlotById } from "../../services/slotService";

export default function CheckoutPage({ clearCart }) { 

    const navigate = useNavigate();
    const location = useLocation();
    
    const { cart, subTotal, protectionFee, protectionType, tripInfo } = location.state || {}; 

    const cartCups = cart ? cart.reduce((sum, item) => sum + item.quantity, 0) : 0;

    const [loading, setLoading] = useState(false);
    const [showUpsellModal, setShowUpsellModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "", 
        pickupPoint: "Alpha",
        address: "",
    });

    const finalDeliveryFee = calcDeliveryFee(formData.pickupPoint, cartCups);

    const finalTotal = (subTotal || 0) + (protectionFee || 0) + finalDeliveryFee;

    // Handle Dropdown Change
    const handleLocationChange = (e) => {
        const newLocation = e.target.value;
        setFormData({ ...formData, pickupPoint: newLocation });

        // Trigger Upsell if NR selected AND cups < 5
        if (newLocation === "NR" && cartCups < 5) {
            setShowUpsellModal(true);
        }
    };

    const handleAddMoreItems = () => {
        navigate('/menu', { state: tripInfo });
    };

    /* --- VALIDATION LOGIC --- */
    const isValidPhone = (phone) => {
        return /^[0-9]{9,15}$/.test(phone);
    };

    const isValidEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email); 
    };

    const generateOrderId = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const checkTripValidity = async () => {
        if (!tripInfo?.tripId) return false;

        try {
            const tripData = await getSlotById(tripInfo.tripId);
            if (!tripData) {
                alert("This trip no longer exists.");
                return false;
            }

            const now = new Date();
            const cutoff = new Date(tripData.cutoffTime);

            if (now >= cutoff) {
                alert(`Ordering for this trip closed at ${cutoff.toLocaleTimeString()}.`);
                navigate('/trip'); 
                return false;
            }

            const currentFilledCups = await getFilledCupsForSlot(tripInfo.tripId);
            const availableSlots = tripData.maxCapacity - currentFilledCups;

            if (cartCups > availableSlots) {
                alert(`Sorry! This trip is almost full. Only ${availableSlots} cups remaining.`);
                return false;
            }

            return true;
        } catch (error) {
            console.error("Validation Error:", error);
            alert("Network error checking trip status.");
            return false;
        }
    };

    // Payment handling
    const handlePayment = async () => {
        if (!formData.name || !formData.phone || !formData.email) return alert("Please fill in Name, Phone, and Email.");
        if (!isValidPhone(formData.phone)) return alert("Please enter a valid phone number.");
        if (!isValidEmail(formData.email)) return alert("Please enter a valid email address.");
        if (formData.pickupPoint === "NR" && !formData.address) return alert("Please enter your full address for NR delivery.");

        // logEvent(analytics, "begin_checkout");

        setLoading(true);

        const isValid = await checkTripValidity();
        if (!isValid) {
            setLoading(false);
            return; 
        }

        try {
            const shortId = generateOrderId();
            const FUNCTION_URL = import.meta.env.VITE_PAYMENT_FUNCTION_URL;

            // axios : library to send http request
            // This part we send http request to our cloud function
            const response = await axios.post(FUNCTION_URL, {
                orderId: shortId,
                customerName: formData.name,
                customerPhone: formData.phone,
                customerEmail: formData.email, 
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
                customerEmail: formData.email, 
                pickupPoint: formData.pickupPoint,
                address: formData.address || "", 
                items: cart,
                
                subTotal: subTotal || 0,
                protectionFee: protectionFee || 0,
                protectionType: protectionType || "Mixed",
                deliveryFee: finalDeliveryFee, 
                totalPrice: finalTotal,
                
                status: "PENDING_PAYMENT", 
                createdAt: new Date().toISOString(),
            };

            await createOrder(orderPayload);
            window.location.href = paymentUrl; 
        } catch (error) {
            console.error("Payment Error:", error);
            alert("Payment gateway failed. Please make sure your details are correct.");
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
       <div className="min-h-screen bg-stone-100 pb-24 font-sans relative">
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

                {/* Student Details Form */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                        Student Details
                    </h2>
                    <input 
                        placeholder="Name on Cup (e.g. Ali)" 
                        className="w-full p-3 bg-stone-100 rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                    <input 
                        type="tel"
                        inputMode="numeric"
                        placeholder="WhatsApp Number (e.g. 0123456789)" 
                        className="w-full p-3 bg-stone-100 rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                    />
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                            <input 
                                type="email"
                                placeholder="Email (e.g. ali@gmail.com)" 
                                className="w-full pl-10 p-3 bg-stone-100 rounded-xl border-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 pl-1">
                            We will send the payment receipt here.
                        </p>
                    </div>
                </div>

                {/* Delivery Location Form */}
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-stone-100 space-y-4">
                    <h2 className="font-bold text-stone-800 flex items-center gap-2">
                        <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                        Delivery Point
                    </h2>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={20}/>
                        <select 
                            className="w-full pl-10 p-3 bg-stone-100 rounded-xl border-none focus:ring-2 focus:ring-primary/20 appearance-none"
                            value={formData.pickupPoint}
                            onChange={handleLocationChange}
                        >
                            <option value="Alpha">Alpha (Front of Alpha 9)</option>
                            <option value="Beta">Beta (Front of Beta 12)</option>
                            <option value="Gamma">Gamma (Gamma Cafe)</option>
                            <option value="NR">
                                NR (Non-Resident) {cartCups >= 5 ? '' : '(RM3.00)'}
                            </option>
                        </select>
                    </div>
                    {formData.pickupPoint === "NR" && (
                        <div className="animate-fade-in">
                            <textarea 
                                placeholder="Full Address (House No, Street...)"
                                className="w-full p-3 bg-orange-50 rounded-xl border border-orange-100 focus:ring-2 focus:ring-orange-200 transition-all text-sm"
                                rows="2"
                                value={formData.address}
                                onChange={e => setFormData({...formData, address: e.target.value})}
                            />
                            <p className="text-[10px] text-orange-600 mt-1 pl-1">
                                *NR Delivery requires min. 5 cups for free delivery.
                            </p>
                        </div>
                    )}
                </div>

                {/* Summary */}
                <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm text-gray-500 px-2">
                        <span>Items Subtotal</span>
                        <span>RM {subTotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-blue-600 font-medium px-2">
                        <span>Protection Fee</span>
                        <span>RM {protectionFee?.toFixed(2)}</span>
                    </div>
                    
                    {/* SHOW DYNAMIC DELIVERY FEE */}
                    <div className={`flex justify-between text-sm font-bold px-2 ${finalDeliveryFee === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                        <span className="flex items-center gap-1"><Truck size={14}/> Delivery Fee</span>
                        <span>{finalDeliveryFee === 0 ? "FREE" : `RM ${finalDeliveryFee.toFixed(2)}`}</span>
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

            {/* UPSELL POPUP MODAL (FOR NR) */}
            {showUpsellModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up text-center relative overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-100 rounded-full opacity-50"></div>

                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <Gift size={32} />
                        </div>

                        <h2 className="text-xl font-black text-gray-900 mb-2">
                            Delivery is RM3.00
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                            NR Delivery is <b>FREE</b> if you order 5 cups or more.
                            <br />
                            You currently have <b>{cartCups} cups</b>.
                            <br />
                            <span className="text-green-600 font-bold mt-2 block">
                                Add {5 - cartCups} more to save RM3.00!
                            </span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleAddMoreItems}
                                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={18} /> Add More Items
                            </button>
                            <button
                                onClick={() => setShowUpsellModal(false)}
                                className="w-full text-gray-400 font-bold text-sm py-2 hover:text-gray-600"
                            >
                                No thanks, I'll pay RM3.00
                            </button>
                        </div>
                    </div>
                </div>
            )}
       </div>
    );
}