import { useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { Download, MessageCircle } from "lucide-react";
import { domToPng } from "modern-screenshot";
import logo from "../../assets/amber-coffee.png";

export default function ReceiptPage() {

    const location = useLocation();
    const data = location.state;
    const receiptRef = useRef(null);

    if (!data) return <p className="text-center mt-10">No receipt found.</p>;

    const handleSaveReceipt = async () => {
        if (receiptRef.current) {
            try {
                const dataUrl = await domToPng(receiptRef.current, {
                    scale: 2,
                    backgroundColor: "#ffffff",
                });
                const link = document.createElement("a");
                link.href = dataUrl;
                link.download = `Receipt-${data.orderId}.png`;
                link.click();
            } catch (err) {
                console.error(err);
            }
        }
    };

    // --- DATA EXTRACTION ---
    const itemsTotal = data.totals?.subTotal ?? 0;
    const protectFee = data.totals?.protectionFee ?? 0;
    const grandTotal = data.totals?.finalTotal ?? 0;
    const deliveryFee = data.totals?.deliveryFee ?? 0;
    const pickupPoint = data.customer?.pickupPoint ?? "Unknown";
    const address = data.customer?.address ?? "";
    const deliveryTime = data.tripTime ?? "Unknown";

    return (
        <div className="min-h-screen bg-stone-100 p-6 flex flex-col items-center justify-center">
            <div
                ref={receiptRef}
                className="bg-white w-full max-w-md p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden mb-6 border border-stone-100"
            >
                <div className="absolute top-0 left-0 w-full h-3 bg-primary"></div>

                <div className="text-center space-y-1">
                    <div className="flex justify-center mb-2">
                        <img src={logo} alt="Logo" className="h-20" />
                    </div>
                    <h1 className="text-2xl font-bold text-stone-800">
                        Amber Coffee
                    </h1>
                    <p className="text-stone-400 text-xs uppercase tracking-widest">
                        Official Receipt
                    </p>
                </div>

                <div className="bg-stone-100 p-4 rounded-xl flex justify-between items-center border border-stone-100">
                    <div className="text-left">
                        <p className="text-xs text-stone-400 font-bold uppercase">Order ID</p>
                        <p className="text-xl font-mono font-bold text-stone-800 tracking-tight">{data.orderId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-stone-400 font-bold uppercase">Date</p>
                        <p className="text-xs font-bold text-stone-600">
                            {data.timestamp ? data.timestamp.split(",")[0] : new Date().toLocaleDateString()}
                        </p>
                        <p className="text-xs font-bold text-stone-600">
                            {data.timestamp ? data.timestamp.split(",")[1] : new Date().toLocaleTimeString()}
                        </p>
                        {deliveryTime && (
                            <p className="text-xs font-bold text-primary mt-1">
                                Delivery At: {deliveryTime}
                            </p>
                        )}
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-3 py-2 border-b border-stone-100 pb-4">
                    {data.cart && data.cart.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm items-start">
                            <div className="flex gap-2">
                                <span className="font-bold text-stone-800">{item.quantity}x</span>
                                <div>
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <span className="text-stone-600 block font-bold">{item.name}</span>
                                        {/* PROTECTION BADGE */}
                                        <span className={`text-[9px] px-1 rounded border ${
                                            item.protection === 'premium' 
                                            ? 'text-purple-600 border-purple-200 bg-purple-50' 
                                            : 'text-blue-600 border-blue-200 bg-blue-50'
                                        }`}>
                                            {item.protection === 'premium' ? 'PREMIUM' : 'BASIC'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {item.addon && <span className="text-[10px] text-orange-600 font-bold">+{item.addon}</span>}
                                        {item.sugarLevel && <span className="text-[10px] text-green-600 font-bold">{item.sugarLevel}</span>}
                                    </div>
                                    
                                    {item.remark && <span className="text-[10px] text-gray-400 italic block">"{item.remark}"</span>}
                                </div>
                            </div>
                            <span className="font-bold text-stone-800">RM {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                {/* --- PRICING BREAKDOWN --- */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs text-stone-500">
                        <span>Items Subtotal</span>
                        <span>RM {itemsTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-stone-500">
                        <span>Protection Fee</span>
                        <span>RM {protectFee.toFixed(2)}</span>
                    </div>
                    
                    {/* DYNAMIC DELIVERY FEE */}
                    <div className={`flex justify-between text-xs font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-stone-500'}`}>
                        <span>Delivery Fee</span>
                        <span>{deliveryFee === 0 ? "FREE" : `RM ${deliveryFee.toFixed(2)}`}</span>
                    </div>

                    <div className="flex justify-between text-xl font-black text-stone-900 pt-2 border-t border-dashed border-stone-200 mt-2">
                        <span>Total Paid</span>
                        <span className="text-primary">
                            RM {grandTotal.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Pickup & Address */}
                <div className="bg-primary/5 p-4 rounded-xl text-center border border-primary/10">
                    <p className="text-xs text-primary font-bold uppercase mb-1">Pickup Location</p>
                    <p className="text-lg font-bold text-stone-800">{pickupPoint}</p>
                    {pickupPoint === "NR" && address && (
                        <div className="mt-2 pt-2 border-t border-primary/10">
                            <p className="text-[10px] text-stone-400 uppercase font-bold mb-1">Delivery Address</p>
                            <p className="text-xs text-stone-600 italic leading-relaxed">{address}</p>
                        </div>
                    )}
                </div>

                {/* AMBER CONTACT */}
                <div className="mt-4 pt-4 border-t border-stone-300 text-center">
                    <p className="text-[12px] text-stone-400 font-medium mb-1">Need to contact the runner?</p>
                    <a 
                        href="https://wa.me/601164971911" 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-green-600 transition-colors bg-stone-100 px-4 py-2 rounded-full"
                    >
                        <MessageCircle size={14} className="text-green-500"/>
                        +60 11-6497 1911 (Amber Runner)
                    </a>
                </div>

                <div className="mt-2 bg-primary/10 text-primary py-3 px-4 rounded-xl border border-primary/20">
                    <p className="text-sm font-bold flex flex-col items-center justify-center gap-1 text-center leading-snug">
                        <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                            Save this receipt!
                        </span>
                        <span className="font-normal text-xs text-stone-600">
                            Match the <b>Order ID</b> to find your cup at the pickup point.
                        </span>
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="w-full max-w-md space-y-3">
                <button onClick={handleSaveReceipt} className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white py-4 rounded-xl font-bold active:scale-95 transition-transform shadow-lg shadow-stone-200">
                    <Download size={20} /> Save Receipt Image
                </button>
                <Link to="/" className="block w-full text-center text-stone-500 py-3 text-sm font-bold hover:text-stone-800">
                    Back to Home
                </Link>
            </div>
        </div>
    );
}