import { useState, useRef } from 'react'; // Import useRef
import { X, Minus, Plus, Check } from 'lucide-react';

export default function ProductModal({ item, close, add }) {
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState("");
  
  // Add-on State
  const [selectedAddon, setSelectedAddon] = useState(null); 

  // --- FIX 1: Add a ref to the textarea to control scrolling ---
  const textareaRef = useRef(null);

  const ADDONS = [
      { name: "Vanilla", price: 2.00 },
      { name: "Caramel", price: 2.00 },
      { name: "Hazelnut", price: 2.00 },
  ];

  const handleAddonToggle = (addonName) => {
      if (selectedAddon === addonName) {
          setSelectedAddon(null); 
      } else {
          setSelectedAddon(addonName);
      }
  };

  // --- FIX 2: Handle Input Focus ---
  const handleInputFocus = () => {
    // Wait 300ms for the keyboard to finish sliding up
    setTimeout(() => {
      if (textareaRef.current) {
        // Scroll the textarea to the center of the viewable area
        textareaRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
      }
    }, 300);
  };

  // Calculate Price
  const basePrice = item.price;
  const addonPrice = selectedAddon ? 2.00 : 0;
  const finalItemPrice = basePrice + addonPrice;
  const totalDisplayPrice = finalItemPrice * quantity;

  const handleAddToCart = () => {
      const itemToAdd = {
          ...item,
          price: finalItemPrice, 
          addon: selectedAddon, 
          originalPrice: item.price 
      };
      add(itemToAdd, quantity, remark);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[85dvh] relative">
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
            {/* Header Image */}
            <div className="relative h-56 shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <button 
                    onClick={close} 
                    className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white backdrop-blur-sm transition-colors z-10"
                >
                    <X size={20} />
                </button>
            </div>

            {/* FIX 3: Added 'pb-32' (Padding Bottom) 
               This adds extra empty space at the bottom of the scroll list.
               When keyboard opens, we can scroll into this empty space, pushing the textarea up. 
            */}
            <div className="p-6 pb-32">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight">{item.name}</h2>
                    <span className="text-xl font-bold text-primary whitespace-nowrap ml-4">RM {item.price.toFixed(2)}</span>
                </div>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{item.desc}</p>

                {/* --- ADD-ON SECTION --- */}
                {item.category === 'Coffee' && (
                    <div className="mb-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Add-ons (+RM2)</label>
                        <div className="flex flex-wrap gap-2">
                            {ADDONS.map((addon) => {
                                const isSelected = selectedAddon === addon.name;
                                return (
                                    <button
                                        key={addon.name}
                                        onClick={() => handleAddonToggle(addon.name)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all flex items-center gap-2 ${
                                            isSelected 
                                            ? "border-primary bg-orange-50 text-primary" 
                                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                                        }`}
                                    >
                                        {addon.name}
                                        {isSelected && <Check size={14} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Remarks */}
                <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">Special Requests</label>
                    <textarea 
                        ref={textareaRef} // Attach Ref
                        onFocus={handleInputFocus} // Trigger scroll on focus
                        className="w-full p-3 bg-gray-100 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                        placeholder="e.g. Less sugar, Extra ice..."
                        rows="2"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        style={{ fontSize: '16px' }} 
                    />
                </div>
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center bg-gray-100 rounded-xl px-4 py-3 gap-4">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-1 hover:text-primary"><Minus size={18}/></button>
                <span className="font-bold w-4 text-center">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-1 hover:text-primary"><Plus size={18}/></button>
            </div>

            <button 
                onClick={handleAddToCart}
                className="flex-1 bg-primary text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform"
            >
                Add - RM {totalDisplayPrice.toFixed(2)}
            </button>
        </div>
      </div>
    </div>
  );
}