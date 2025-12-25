import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldCheck, Info, Image as ImageIcon, Trash2 } from 'lucide-react'; // Added Trash2

const PACKAGES = {
    basic: { name: 'Basic Protection', price: 1.00 },
    premium: { name: 'Premium Protection', price: 2.00 }
};

export default function CartDrawer({ cart, close, tripInfo, removeFromCart }) { // Receive removeFromCart
    const navigate = useNavigate();
    const [protectionType, setProtectionType] = useState('basic'); 
    const [showPackageInfo, setShowPackageInfo] = useState(false);

    // --- CALCULATIONS ---
    const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
    const protectionFee = PACKAGES[protectionType].price * totalCups;
    const finalTotal = itemsTotal + protectionFee;

    const handleCheckout = () => {
        close();
        navigate('/checkout', {
            state: { 
                cart, 
                subTotal: itemsTotal, 
                protectionFee, 
                total: finalTotal, 
                protectionType: PACKAGES[protectionType].name, // Pass name string
                tripInfo
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-slide-in">
                
                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
                    <button onClick={close} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={24} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center mt-20 text-gray-400">Your cart is empty.</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartId} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 text-sm">{item.quantity}x {item.name}</p>
                                        {item.addon && (
                                            <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                +{item.addon}
                                            </span>
                                        )}
                                    </div>
                                    {item.remark && <p className="text-xs text-gray-500 italic mt-1">Note: "{item.remark}"</p>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="font-medium text-gray-600 text-sm">RM {(item.price * item.quantity).toFixed(2)}</p>
                                    
                                    {/* Remove Button */}
                                    <button 
                                        onClick={() => removeFromCart(item.cartId)}
                                        className="text-gray-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer (Calculations & Checkout) - Remains same as previous step */}
                {cart.length > 0 && (
                    <div className="border-t p-5 bg-white space-y-5 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                        {/* ... Protection Selector Logic (Same as before) ... */}
                        
                        {/* Re-paste protection selector code here if you lost it, or keep existing */}
                         <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                            <div className="flex justify-between items-center mb-3">
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck size={14}/> Protection Package
                                </p>
                                <button onClick={() => setShowPackageInfo(true)} className="text-xs font-bold text-blue-500 underline flex items-center gap-1">
                                    <Info size={14}/> View Details
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setProtectionType('basic')}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        protectionType === 'basic' 
                                        ? 'border-blue-500 bg-white ring-2 ring-blue-100 shadow-sm' 
                                        : 'border-transparent bg-blue-100/50 hover:bg-blue-100'
                                    }`}
                                >
                                    <span className="font-bold text-sm text-gray-800 block">Basic</span>
                                    <span className="text-xs text-blue-600 font-bold">RM 1.00 <span className="text-gray-400 font-normal">/cup</span></span>
                                </button>

                                <button 
                                    onClick={() => setProtectionType('premium')}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        protectionType === 'premium' 
                                        ? 'border-blue-500 bg-white ring-2 ring-blue-100 shadow-sm' 
                                        : 'border-transparent bg-blue-100/50 hover:bg-blue-100'
                                    }`}
                                >
                                    <span className="font-bold text-sm text-gray-800 block">Premium</span>
                                    <span className="text-xs text-blue-600 font-bold">RM 2.00 <span className="text-gray-400 font-normal">/cup</span></span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span>RM {itemsTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-blue-600 font-medium">
                                <span>Protection Fee ({totalCups} cups)</span>
                                <span>RM {protectionFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xl font-black text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                <span>Total</span>
                                <span className="text-primary">RM {finalTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCheckout}
                            className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-transform active:scale-[0.98]"
                        >
                            Checkout Now
                        </button>
                    </div>
                )}
            </div>
            
            {/* --- PROTECTION INFO MODAL --- */}
            {showPackageInfo && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm" onClick={() => setShowPackageInfo(false)}>
                    <div className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg">Protection Details</h3>
                            <button onClick={() => setShowPackageInfo(false)}><X size={20}/></button>
                        </div>
                        
                        {/* Placeholder for Image */}
                        <div className="h-40 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400 flex-col gap-2">
                            <ImageIcon size={32} />
                            <span className="text-xs">Package Image Here</span>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <p className="font-bold text-blue-600 mb-1">Basic (RM 1.00)</p>
                                <ul className="list-disc pl-4 text-gray-600 space-y-1">
                                    <li>Plastic carrier</li>
                                    <li>Leak-proof paper seal</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-bold text-purple-600 mb-1">Premium (RM 2.00)</p>
                                <ul className="list-disc pl-4 text-gray-600 space-y-1">
                                    <li>Plastic carrier</li>
                                    <li>Separate Ice Cup + Holder</li>
                                    <li>Double Leak-proof seal</li>
                                </ul>
                            </div>
                        </div>
                        
                        <button onClick={() => setShowPackageInfo(false)} className="w-full py-3 bg-gray-100 font-bold rounded-xl text-gray-600">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}