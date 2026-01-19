import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldCheck, Info, Trash2, CheckCircle2, ZoomIn, Truck } from 'lucide-react';

// Import Images
import imgBasic from "../assets/package-basic.png";
import imgPremium from "../assets/package-premium.png";

const PACKAGES = {
    basic: { 
        name: 'Basic', 
        price: 1.00,
        desc: "Drink only + Carrier + Seal",
        image: imgBasic
    },
    premium: { 
        name: 'Premium', 
        price: 2.00,
        desc: "Drink & Ice Separated + Carrier + Holder",
        image: imgPremium
    }
};

export default function CartDrawer({ cart, close, tripInfo, removeFromCart, updateCartItemProtection }) { 
    const navigate = useNavigate();
    
    // Lightbox State
    const [showFullImage, setShowFullImage] = useState(null); // stores 'basic' or 'premium'

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    // --- NEW CALCULATIONS ---
    const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Calculate Protection Fee based on INDIVIDUAL items
    const protectionFee = cart.reduce((sum, item) => {
        const type = item.protection || 'basic'; // Default to basic
        return sum + (PACKAGES[type].price * item.quantity);
    }, 0);

    // Delivery Fee Logic: 1 Cup = RM1, >1 Cup = FREE
    const deliveryFee = totalCups > 1 ? 0 : 1.00;

    const finalTotal = itemsTotal + protectionFee + deliveryFee;

    const handleCheckout = () => {
        close();
        navigate('/checkout', {
            state: { 
                cart, 
                subTotal: itemsTotal, 
                protectionFee, 
                deliveryFee,
                total: finalTotal, 
                tripInfo 
            }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white h-[100dvh] shadow-2xl flex flex-col animate-slide-in">
                
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">Your Order</h2>
                    <button onClick={close} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 overscroll-contain">
                    
                    {/* --- 1. PACKAGE INFO CARD (Inline) --- */}
                    <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100">
                        <h3 className="text-xs font-bold text-blue-600 uppercase mb-3 flex items-center gap-1">
                            <ShieldCheck size={14}/> Protection Packages
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {/* Basic Card */}
                            <div className="bg-white rounded-xl p-2 border border-blue-100 shadow-sm" onClick={() => setShowFullImage('basic')}>
                                <div className="h-20 bg-stone-50 rounded-lg mb-2 overflow-hidden flex justify-center items-center relative">
                                    <img src={imgBasic} className=" object-contain p-1" alt="Basic"/>
                                    <ZoomIn size={12} className="absolute bottom-1 right-1 text-gray-400"/>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-800">Basic (RM1)</p>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Direct Drink, Sealed</p>
                                </div>
                            </div>
                            {/* Premium Card */}
                            <div className="bg-white rounded-xl p-2 border border-purple-100 shadow-sm" onClick={() => setShowFullImage('premium')}>
                                <div className="h-20 bg-stone-50 rounded-lg mb-2 overflow-hidden flex justify-center items-center relative">
                                    <img src={imgPremium} className=" object-contain p-1" alt="Premium"/>
                                    <ZoomIn size={12} className="absolute bottom-1 right-1 text-gray-400"/>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-xs text-gray-800">Premium (RM2)</p>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Ice Separated, Holder</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- 2. ORDER LIST (With Per-Item Selector) --- */}
                    <div className="space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center mt-10 text-gray-400">Your cart is empty.</div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.cartId} className="border-b border-gray-400 pb-4 ">
                                    {/* Item Header */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-gray-800 text-sm">{item.quantity}x {item.name}</p>
                                                {/* Addons */}
                                                {item.addon && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">+{item.addon}</span>}
                                                {/* Matcha Sugar */}
                                                {item.sugarLevel && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{item.sugarLevel}</span>}
                                            </div>
                                            {item.remark && <p className="text-xs text-gray-500 italic mt-0.5">"{item.remark}"</p>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <p className="font-medium text-gray-600 text-sm">RM {(item.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromCart(item.cartId)} className="text-red-400 hover:text-red-700">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Per Item Protection Toggle */}
                                    <div className="bg-gray-100 p-2 rounded-xl flex gap-2 items-center">
                                        <p className="text-[10px] font-bold text-gray-600 uppercase w-16">Package:</p>
                                        <div className="flex-1 flex gap-2">
                                            <button 
                                                onClick={() => updateCartItemProtection(item.cartId, 'basic')}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                    (item.protection || 'basic') === 'basic' 
                                                    ? 'bg-white border-blue-500 text-blue-600 shadow-sm' 
                                                    : 'border-transparent text-gray-400 hover:bg-white'
                                                }`}
                                            >
                                                Basic
                                            </button>
                                            <button 
                                                onClick={() => updateCartItemProtection(item.cartId, 'premium')}
                                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                                    item.protection === 'premium' 
                                                    ? 'bg-white border-purple-500 text-purple-600 shadow-sm' 
                                                    : 'border-transparent text-gray-400 hover:bg-white'
                                                }`}
                                            >
                                                Premium
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="shrink-0 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                        <div className="px-4 pt-3 pb-2 space-y-1">
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>Subtotal</span>
                                <span>RM {itemsTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-blue-600 font-medium">
                                <span>Total Protection Fees</span>
                                <span>RM {protectionFee.toFixed(2)}</span>
                            </div>
                            <div className={`flex justify-between text-xs font-bold ${deliveryFee === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                <span className="flex items-center gap-1"><Truck size={12}/> Delivery Fee</span>
                                <span>{deliveryFee === 0 ? 'FREE' : `RM ${deliveryFee.toFixed(2)}`}</span>
                            </div>
                        </div>

                        <div className="px-4 pb-2 pt-1 flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-0.5">Total to pay</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">
                                    RM {finalTotal.toFixed(2)}
                                </p>
                            </div>
                            <button 
                                onClick={handleCheckout}
                                className="bg-stone-900 text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:bg-black transition-transform active:scale-[0.98]"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- LIGHTBOX (Only opens if clicked from top Reference) --- */}
            {showFullImage && (
                <div 
                    className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowFullImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white/80 p-2 rounded-full hover:bg-white/20">
                        <X size={32} />
                    </button>
                    
                    <img 
                        src={PACKAGES[showFullImage].image} 
                        alt="Full Preview"
                        className="max-w-full max-h-[90vh] object-contain animate-scale-in"
                        onClick={(e) => e.stopPropagation()} 
                    />
                    
                    {/* Caption */}
                    <div className="absolute bottom-10 bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-md font-bold">
                        {PACKAGES[showFullImage].name} - RM {PACKAGES[showFullImage].price.toFixed(2)}
                    </div>
                </div>
            )}
        </div>
    );
}