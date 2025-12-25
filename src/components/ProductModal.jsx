import { useState } from 'react';
import { X, Minus, Plus, Check } from 'lucide-react';

export default function ProductModal({ item, close, add }) {
  const [quantity, setQuantity] = useState(1);
  const [remark, setRemark] = useState("");
  
  // Add-on State
  const [selectedAddon, setSelectedAddon] = useState(null); // 'Vanilla', 'Caramel', 'Hazelnut', or null

  const ADDONS = [
      { name: "Vanilla", price: 2.00 },
      { name: "Caramel", price: 2.00 },
      { name: "Hazelnut", price: 2.00 },
  ];

  const handleAddonToggle = (addonName) => {
      if (selectedAddon === addonName) {
          setSelectedAddon(null); // Deselect if already selected
      } else {
          setSelectedAddon(addonName);
      }
  };

  // Calculate Price including Add-on
  const basePrice = item.price;
  const addonPrice = selectedAddon ? 2.00 : 0;
  const finalItemPrice = basePrice + addonPrice;
  const totalDisplayPrice = finalItemPrice * quantity;

  const handleAddToCart = () => {
      // Create a modified item object with addon info
      const itemToAdd = {
          ...item,
          price: finalItemPrice, // Update price to include addon
          addon: selectedAddon, // Save addon name
          originalPrice: item.price // Keep reference just in case
      };
      add(itemToAdd, quantity, remark);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1">
            {/* Header Image */}
            <div className="relative h-56 shrink-0">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <button onClick={close} className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-gray-800 hover:bg-white transition-colors">
                <X size={20} />
            </button>
            </div>

            <div className="p-6 pb-24">
            <div className="flex justify-between items-start mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                <span className="text-xl font-bold text-primary">RM {item.price.toFixed(2)}</span>
            </div>
            <p className="text-gray-500 text-sm mb-6">{item.desc}</p>

            {/* --- ADD-ON SECTION (Only for Coffee) --- */}
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Special Requests</label>
                <textarea 
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                placeholder="e.g. Less sugar, Extra ice..."
                rows="2"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                />
            </div>
            </div>
        </div>

        {/* Footer Action (Sticky) */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-4">
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