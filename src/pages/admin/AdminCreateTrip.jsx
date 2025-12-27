import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, CheckSquare, Square, Loader2, Filter } from "lucide-react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

// Fixed Categories
const CATEGORIES = ["Coffee", "Matcha", "Chocolate", "Refresher", "Pastry", "Food"];

export default function AdminCreateTrip() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // --- FORM DATA ---
    const getTodayString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };

    const [tripDate, setTripDate] = useState(getTodayString());
    const [openTime, setOpenTime] = useState("");
    const [closeTime, setCloseTime] = useState("");
    const [deliverTime, setDeliverTime] = useState("");
    const [capacity, setCapacity] = useState(20);
    
    // --- MENU DATA ---
    const [menuItems, setMenuItems] = useState([]);
    const [selectedMenuIds, setSelectedMenuIds] = useState([]);

    // Fetch Menu
    useEffect(() => {
        const fetchMenu = async () => {
            const snapshot = await getDocs(collection(db, "menu_items"));
            const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setMenuItems(items);
        };
        fetchMenu();
    }, []);

    // ... (Selection Helpers remain unchanged) ...
    // Copy toggleItem, toggleCategory, handleSelectAll, handleUnselectAll, getItemsByCategory here
    const toggleItem = (id) => {
        if (selectedMenuIds.includes(id)) {
            setSelectedMenuIds(prev => prev.filter(x => x !== id));
        } else {
            setSelectedMenuIds(prev => [...prev, id]);
        }
    };

    const toggleCategory = (categoryName) => {
        const itemsInCat = menuItems.filter(i => i.category === categoryName);
        const idsInCat = itemsInCat.map(i => i.id);
        const allSelected = idsInCat.every(id => selectedMenuIds.includes(id));
        if (allSelected) {
            setSelectedMenuIds(prev => prev.filter(id => !idsInCat.includes(id)));
        } else {
            setSelectedMenuIds(prev => [...new Set([...prev, ...idsInCat])]);
        }
    };

    const handleSelectAll = () => setSelectedMenuIds(menuItems.map(i => i.id));
    const handleUnselectAll = () => setSelectedMenuIds([]);
    const getItemsByCategory = (cat) => menuItems.filter(i => i.category === cat);

    // --- SUBMIT WITH VALIDATION ---
    const handleSubmit = async () => {
        if (!tripDate || !openTime || !closeTime || !deliverTime) return alert("Please fill in all date and time fields.");
        if (selectedMenuIds.length === 0) return alert("Please select at least one menu item.");

        // 1. DATE VALIDATION
        const todayStr = getTodayString();
        if (tripDate < todayStr) {
            return alert("Cannot create a trip for a past date.");
        }

        // 2. TIME LOGIC VALIDATION
        // Since all times are on the same 'tripDate', we can just compare the HH:MM strings directly
        if (closeTime <= openTime) {
            return alert("Close Order time must be AFTER Open Order time.");
        }
        if (deliverTime <= closeTime) {
            return alert("Delivery time must be AFTER orders close.");
        }

        // 3. CAPACITY VALIDATION
        if (parseInt(capacity) <= 0) {
            return alert("Capacity must be greater than 0.");
        }

        setLoading(true);
        try {
            const payload = {
                dateString: tripDate,
                openTime: `${tripDate}T${openTime}`,
                cutoffTime: `${tripDate}T${closeTime}`,
                deliveryTime: `${tripDate}T${deliverTime}`,
                maxCapacity: parseInt(capacity),
                currentBookings: 0,
                selectedMenuIds: selectedMenuIds
            };
            await addDoc(collection(db, "delivery_slots"), payload);
            navigate("/admin/schedule");
        } catch (error) {
            console.error(error);
            alert("Error creating trip");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/admin/schedule" className="p-2 bg-white border border-gray-200 rounded-full hover:bg-gray-50">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-800">Create New Trip</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: SETTINGS */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-5">
                        <h2 className="font-bold text-gray-800 flex items-center gap-2">
                            <span className="bg-stone-900 text-white w-6 h-6 rounded flex items-center justify-center text-xs">1</span> Schedule
                        </h2>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Trip Date</label>
                            <input 
                                type="date" 
                                min={getTodayString()} // HTML5 Validation helper
                                value={tripDate} 
                                onChange={e => setTripDate(e.target.value)} 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 appearance-none" 
                            />
                        </div>
                        
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Open</label>
                                    <input type="time" value={openTime} onChange={e => setOpenTime(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 appearance-none" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Close</label>
                                    <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 appearance-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-blue-500 uppercase mb-1 block">Delivery Time</label>
                                <input type="time" value={deliverTime} onChange={e => setDeliverTime(e.target.value)} className="w-full p-3 bg-blue-50 text-blue-900 font-bold rounded-xl border border-blue-100 appearance-none" />
                            </div>
                        </div>  

                        <div className="pt-4 border-t border-gray-100">
                            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
                                <span className="bg-stone-900 text-white w-6 h-6 rounded flex items-center justify-center text-xs">2</span> Capacity
                            </h2>
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Max Cups</label>
                            <input 
                                type="number" 
                                inputMode="numeric"
                                min="1"
                                value={capacity} 
                                onChange={e => setCapacity(e.target.value)} 
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 appearance-none" 
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: MENU SELECTOR (Unchanged from previous robust version) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col h-[700px]">
                    <div className="mb-4 flex justify-between items-end border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="font-bold text-gray-800 flex items-center gap-2 mb-1">
                                <span className="bg-stone-900 text-white w-6 h-6 rounded flex items-center justify-center text-xs">3</span> Select Menu
                            </h2>
                            <p className="text-xs text-gray-400">Choose what items are available for this trip.</p>
                        </div>
                        <div className="flex gap-2 text-xs font-bold">
                            <button onClick={handleSelectAll} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">Select All</button>
                            <button onClick={handleUnselectAll} className="px-3 py-1 bg-red-50 text-red-500 rounded hover:bg-red-100">Clear</button>
                        </div>
                    </div>

                    {/* Scrollable Category List */}
                    <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                        {CATEGORIES.map(category => {
                            const items = getItemsByCategory(category);
                            if (items.length === 0) return null;

                            const idsInCat = items.map(i => i.id);
                            const isAllSelected = idsInCat.every(id => selectedMenuIds.includes(id));

                            return (
                                <div key={category}>
                                    <div 
                                        onClick={() => toggleCategory(category)}
                                        className="flex justify-between items-center bg-gray-50 p-2 px-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-100 select-none"
                                    >
                                        <h3 className="font-bold text-gray-700">{category}</h3>
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary">
                                            {isAllSelected ? <CheckSquare size={16}/> : <Square size={16} className="text-gray-400"/>}
                                            {isAllSelected ? "All Selected" : "Select Category"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {items.map(item => {
                                            const isSelected = selectedMenuIds.includes(item.id);
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => toggleItem(item.id)}
                                                    className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition-all ${
                                                        isSelected 
                                                        ? 'border-primary bg-orange-50/30' 
                                                        : 'border-gray-100 hover:border-gray-300'
                                                    }`}
                                                >
                                                    <div className={isSelected ? "text-primary" : "text-gray-300"}>
                                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </div>
                                                    
                                                    <img src={item.image} className="w-10 h-10 rounded-lg object-cover bg-gray-200 shrink-0" />
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-800 text-sm truncate">{item.name}</h4>
                                                        <p className="text-xs text-gray-500 font-medium">RM {item.price.toFixed(2)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-500">Total Items: {menuItems.length}</span>
                        <span className="font-bold text-primary">{selectedMenuIds.length} Selected</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 z-40 md:static md:bg-transparent md:border-none md:p-0">
                <div className="max-w-5xl mx-auto">
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-gray-200 hover:bg-black transition-transform active:scale-[0.99] flex justify-center items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin" />}
                        {loading ? "Creating..." : "Confirm & Create Trip"}
                    </button>
                </div>
            </div>
        </div>
    );
}