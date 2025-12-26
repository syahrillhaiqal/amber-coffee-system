import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, ShieldCheck, Info, Trash2, CheckCircle2, ZoomIn } from 'lucide-react'; // Added ChevronDown

// Import Images
import imgBasic from "../assets/package-basic.png";
import imgPremium from "../assets/package-premium.png";

const PACKAGES = {
    basic: { 
        name: 'Basic Protection', 
        price: 1.00,
        features: [
            "1 cup (drink only)",
            "T-plastic bag carrier",
            "Proof paper cover",
            "Straw"
        ],
        image: imgBasic
    },
    premium: { 
        name: 'Premium Protection', 
        price: 2.00,
        features: [
            "2 cups (drink + ice separated)",
            "T-plastic bag carrier (both cups)",
            "Proof paper cover (both cups)",
            "Cup holder",
            "Straw"
        ],
        image: imgPremium
    }
};

export default function CartDrawer({ cart, close, tripInfo, removeFromCart }) { 
    const navigate = useNavigate();
    const [protectionType, setProtectionType] = useState('basic'); 
    const [showPackageInfo, setShowPackageInfo] = useState(false);
    const [modalTab, setModalTab] = useState('basic');
    
    // NEW: State for Full Screen Image Preview
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

    const openInfoModal = () => {
        setModalTab(protectionType);
        setShowPackageInfo(true);
    };

    const itemsTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);
    const protectionFee = PACKAGES[protectionType].price * totalCups;
    const finalTotal = itemsTotal + protectionFee;

    const handleCheckout = () => {
        close();
        navigate('/checkout', {
            state: { cart, subTotal: itemsTotal, protectionFee, total: finalTotal, protectionType: PACKAGES[protectionType].name, tripInfo }
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm bg-white h-[100dvh] shadow-2xl flex flex-col animate-slide-in">
                
                {/* ... Header, List, and Footer remain unchanged ... */}
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">Your Order</h2>
                    <button onClick={close} className="p-2 hover:bg-gray-200 rounded-full text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
                    {cart.length === 0 ? (
                        <div className="text-center mt-20 text-gray-400">Your cart is empty.</div>
                    ) : (
                        cart.map((item) => (
                            <div key={item.cartId} className="flex justify-between items-start border-b border-gray-100 pb-4 last:border-0 group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800 text-sm">{item.quantity}x {item.name}</p>
                                        {item.addon && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded">+{item.addon}</span>}
                                    </div>
                                    {item.remark && <p className="text-xs text-gray-500 italic mt-0.5">Note: "{item.remark}"</p>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <p className="font-medium text-gray-600 text-sm">RM {(item.price * item.quantity).toFixed(2)}</p>
                                    <button onClick={() => removeFromCart(item.cartId)} className="text-gray-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="shrink-0 border-t bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.05)] pb-[calc(1rem+env(safe-area-inset-bottom))]">
                         <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck size={12}/> Cup Protection
                                </p>
                                <button onClick={openInfoModal} className="text-[10px] font-bold text-blue-500 underline flex items-center gap-1">
                                    <Info size={12}/> What's included?
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setProtectionType('basic')} className={`flex-1 py-2 px-2 rounded-lg border text-center transition-all relative overflow-hidden ${protectionType === 'basic' ? 'border-blue-500 bg-white shadow-sm ring-1 ring-blue-100' : 'border-transparent bg-blue-100/50 hover:bg-blue-100 text-gray-500'}`}>
                                    {protectionType === 'basic' && <div className="absolute top-0 right-0 bg-blue-500 text-white p-0.5 rounded-bl"><CheckCircle2 size={10}/></div>}
                                    <div className={`font-bold text-xs ${protectionType === 'basic' ? 'text-blue-700' : ''}`}>Basic</div>
                                    <div className="text-[10px] font-medium">RM 1.00 <span className="opacity-70">/cup</span></div>
                                </button>
                                <button onClick={() => setProtectionType('premium')} className={`flex-1 py-2 px-2 rounded-lg border text-center transition-all relative overflow-hidden ${protectionType === 'premium' ? 'border-purple-500 bg-white shadow-sm ring-1 ring-purple-100' : 'border-transparent bg-purple-100/50 hover:bg-purple-100 text-gray-500'}`}>
                                    {protectionType === 'premium' && <div className="absolute top-0 right-0 bg-purple-500 text-white p-0.5 rounded-bl"><CheckCircle2 size={10}/></div>}
                                    <div className={`font-bold text-xs ${protectionType === 'premium' ? 'text-purple-700' : ''}`}>Premium</div>
                                    <div className="text-[10px] font-medium">RM 2.00 <span className="opacity-70">/cup</span></div>
                                </button>
                            </div>
                        </div>
                        <div className="px-4 py-2 flex justify-between text-xs text-gray-400">
                            <span>Subtotal: RM{itemsTotal.toFixed(2)}</span>
                            <span>Protection: RM{protectionFee.toFixed(2)}</span>
                        </div>
                        <div className="px-4 flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-0.5">Total to pay</p>
                                <p className="text-2xl font-black text-gray-900 leading-none">RM {finalTotal.toFixed(2)}</p>
                            </div>
                            <button onClick={handleCheckout} className="bg-stone-900 text-white px-8 py-3.5 rounded-xl font-bold text-base shadow-lg hover:bg-black transition-transform active:scale-[0.98]">Checkout</button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* --- INFO MODAL --- */}
            {showPackageInfo && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowPackageInfo(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-xs shadow-2xl animate-scale-in flex flex-col max-h-[85dvh]" onClick={e => e.stopPropagation()}>
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b shrink-0">
                            <button onClick={() => setModalTab('basic')} className={`flex-1 py-4 text-sm font-bold transition-colors ${modalTab === 'basic' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-600'}`}>Basic (RM1)</button>
                            <button onClick={() => setModalTab('premium')} className={`flex-1 py-4 text-sm font-bold transition-colors ${modalTab === 'premium' ? 'bg-purple-50 text-purple-600 border-b-2 border-purple-500' : 'text-gray-400 hover:text-gray-600'}`}>Premium (RM2)</button>
                        </div>

                        {/* Content Area */}
                        <div className="p-6 overflow-y-auto overscroll-contain relative">
                            
                            {/* CLICKABLE IMAGE CONTAINER */}
                            <div 
                                onClick={() => setShowFullImage(true)} // Open Full Image
                                className="h-52 w-full bg-stone-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden border border-stone-100 shrink-0 relative cursor-zoom-in group"
                            >
                                <img 
                                    src={PACKAGES[modalTab].image} 
                                    alt={PACKAGES[modalTab].name}
                                    className="w-full h-full object-contain p-2" 
                                />
                                {/* Magnifying Glass Overlay */}
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1.5 rounded-lg backdrop-blur-sm">
                                    <ZoomIn size={14} />
                                </div>
                            </div>

                            <div className="space-y-4 pb-2">
                                <h3 className={`text-lg font-bold ${modalTab === 'basic' ? 'text-blue-600' : 'text-purple-600'}`}>
                                    {PACKAGES[modalTab].name}
                                </h3>
                                <ul className="space-y-2">
                                    {PACKAGES[modalTab].features.map((feature, i) => (
                                        <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                            <CheckCircle2 size={16} className={`mt-0.5 shrink-0 ${modalTab === 'basic' ? 'text-blue-400' : 'text-purple-400'}`} />
                                            <span className="leading-snug">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 h-6  from-white to-transparent pointer-events-none"></div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 shrink-0 rounded-b-3xl">
                            <button onClick={() => setShowPackageInfo(false)} className="flex-1 py-3 text-gray-500 font-bold text-sm">Close</button>
                            <button onClick={() => { setProtectionType(modalTab); setShowPackageInfo(false); }} className={`flex-1 py-3 rounded-xl font-bold text-sm text-white shadow-lg ${modalTab === 'basic' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'}`}>
                                Select {modalTab === 'basic' ? 'Basic' : 'Premium'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- NEW: FULL SCREEN IMAGE LIGHTBOX --- */}
            {showFullImage && (
                <div 
                    className="fixed inset-0 z-[70] bg-black/95 flex items-center justify-center p-4 animate-fade-in"
                    onClick={() => setShowFullImage(false)}
                >
                    <button className="absolute top-4 right-4 text-white/80 p-2 rounded-full hover:bg-white/20">
                        <X size={32} />
                    </button>
                    
                    <img 
                        src={PACKAGES[modalTab].image} 
                        alt="Full Preview"
                        className="max-w-full max-h-[90vh] object-contain animate-scale-in"
                        onClick={(e) => e.stopPropagation()} // Clicking image doesn't close
                    />
                </div>
            )}
        </div>
    );
}