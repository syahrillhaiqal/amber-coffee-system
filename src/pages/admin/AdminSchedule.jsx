import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar as CalIcon, Plus, Users, ArrowRight, Trash2, History, Clock } from "lucide-react";
import { collection, getDocs, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminSchedule() {

const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [viewMode, setViewMode] = useState("upcoming");
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            // 1. Fetch Slots
            const slotsSnap = await getDocs(collection(db, "delivery_slots"));
            let allSlots = slotsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // 2. Fetch Orders
            const ordersSnap = await getDocs(collection(db, "orders"));
            const orders = ordersSnap.docs.map(doc => doc.data());

            // 3. Calculate Counts (CUPS, not Orders)
            allSlots = allSlots.map(slot => {
                // Filter: Match Slot ID AND Status is NOT Cancelled AND NOT Pending
                // We only count CONFIRMED (Paid) orders.
                const validOrders = orders.filter(o => 
                    o.slotId === slot.id && 
                    o.status !== 'CANCELLED' && 
                    o.status !== 'PENDING_PAYMENT' 
                );

                // Sum quantities of all items in valid orders
                const totalCups = validOrders.reduce((total, order) => {
                    const orderCups = order.items.reduce((sum, item) => sum + item.quantity, 0);
                    return total + orderCups;
                }, 0);

                return { ...slot, realCount: totalCups };
            });

            // 4. Sort
            allSlots.sort((a, b) => new Date(b.deliveryTime) - new Date(a.deliveryTime));

            if (viewMode === "upcoming") {
                const filtered = allSlots.filter((s) => s.deliveryTime.startsWith(selectedDate));
                setSlots(filtered);
            } else {
                setSlots(allSlots);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);

        // 1. Listen to SLOTS (so new trips appear instantly)
        const unsubSlots = onSnapshot(collection(db, "delivery_slots"), (slotsSnapshot) => {
            let allSlots = slotsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            // 2. Listen to ORDERS (so cup counts update instantly)
            // Note: In a huge app, listening to ALL orders is expensive. 
            // Better to query only today's orders or active orders.
            const unsubOrders = onSnapshot(collection(db, "orders"), (ordersSnapshot) => {
                const orders = ordersSnapshot.docs.map(doc => doc.data());

                // 3. Merge & Calculate
                allSlots = allSlots.map(slot => {
                    const validOrders = orders.filter(o => 
                        o.slotId === slot.id && 
                        o.status !== 'CANCELLED' && 
                        o.status !== 'PENDING_PAYMENT' 
                    );

                    const totalCups = validOrders.reduce((total, order) => {
                        return total + order.items.reduce((sum, item) => sum + item.quantity, 0);
                    }, 0);

                    return { ...slot, realCount: totalCups };
                });

                // 4. Sort & Filter
                allSlots.sort((a, b) => new Date(b.deliveryTime) - new Date(a.deliveryTime));

                if (viewMode === "upcoming") {
                    setSlots(allSlots.filter((s) => s.deliveryTime.startsWith(selectedDate)));
                } else {
                    setSlots(allSlots);
                }
                setLoading(false);
            });

            return () => unsubOrders(); // Cleanup orders listener
        });

        return () => unsubSlots(); // Cleanup slots listener
    }, [selectedDate, viewMode]);

    const handleDelete = async (slot) => {
        if (slot.realCount > 0) {
            return alert("Cannot delete a trip that has orders.");
        }
        if (confirm("Delete this slot?")) {
            await deleteDoc(doc(db, "delivery_slots", slot.id));
            fetchSlots();
        }
    };

    const getStatus = (slot) => {
        const now = new Date();
        const open = new Date(slot.openTime);
        const close = new Date(slot.cutoffTime);
        const delivery = new Date(slot.deliveryTime);

        if (now > delivery) return { label: "ENDED", color: "bg-stone-200 text-stone-500" };
        if (now >= close && now <= delivery) return { label: "ONGOING", color: "bg-blue-100 text-blue-700" };
        if (now >= open && now < close) return { label: "OPEN", color: "bg-green-100 text-green-700 animate-pulse" };
        return { label: "UPCOMING", color: "bg-yellow-100 text-yellow-700" };
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                
                {/* Tabs */}
                <div className="flex bg-white p-1 rounded-xl border border-stone-200 shadow-sm w-full md:w-auto">
                    <button 
                        onClick={() => setViewMode("upcoming")}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all text-center ${viewMode === 'upcoming' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
                    >
                        Daily View
                    </button>
                    <button 
                        onClick={() => setViewMode("history")}
                        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${viewMode === 'history' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-500 hover:bg-stone-100'}`}
                    >
                        <History size={16} /> All History
                    </button>
                </div>

                {/* Date Picker */}
                {viewMode === "upcoming" && (
                    <div className="bg-white px-4 py-3 md:py-2 rounded-xl shadow-sm border border-stone-200 flex items-center gap-3 w-full md:w-auto">
                        <div className="text-primary"><CalIcon size={20} /></div>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="font-bold bg-transparent outline-none text-stone-700 w-full"
                        />
                    </div>
                )}

                {/* Create Button */}
                <Link to="new" className="bg-primary text-white px-5 py-3 rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-orange-200 hover:scale-105 transition-transform w-full md:w-auto">
                    <Plus size={20} /> <span className="md:hidden">Create New Trip</span><span className="hidden md:inline">New Trip</span>
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {slots.map((slot) => {
                    const status = getStatus(slot);
                    const dateStr = new Date(slot.deliveryTime).toLocaleDateString([], { day: 'numeric', month: 'short' });

                    return (
                        <div key={slot.id} className={`bg-white p-5 rounded-3xl border shadow-sm relative group transition-all hover:shadow-md flex flex-col ${status.label === 'ENDED' ? 'border-stone-100 opacity-80' : 'border-stone-200'}`}>
                            
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${status.color}`}>
                                {status.label}
                            </div>

                            {/* Trip Info - REVERTED TO CLEANER DESIGN */}
                            <div className="mb-4">
                                <p className="text-xs font-bold text-stone-400 uppercase mb-1">{dateStr}</p>
                                <h3 className="text-3xl font-black text-stone-800 tracking-tight flex items-end gap-2">
                                    {formatTime(slot.deliveryTime)}
                                    <span className="text-sm font-bold text-stone-400 mb-1">Trip</span>
                                </h3>
                                {/* Minimalist Open/Close Times */}
                                <p className="text-xs text-stone-500 mt-2 font-medium">
                                    Open: <span className="text-stone-800">{formatTime(slot.openTime)}</span> 
                                    <span className="mx-2 text-stone-300">|</span> 
                                    Close: <span className="text-stone-800">{formatTime(slot.cutoffTime)}</span>
                                </p>
                            </div>

                            {/* Counter */}
                            <div className="flex items-center gap-2 text-sm text-stone-600 mb-6 bg-stone-50 p-2 rounded-lg w-fit">
                                <Users size={16} /> 
                                <span className="font-bold">{slot.realCount}</span> 
                                <span className="text-stone-400">Cups</span>
                                <span className="text-stone-300 mx-1">/</span>
                                <span className="text-stone-400">{slot.maxCapacity} max</span>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex gap-2">
                                <Link to={`/admin/kitchen/${slot.id}`} className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors">
                                    {status.label === 'ENDED' ? 'View History' : 'Runner View'} 
                                    <ArrowRight size={16} />
                                </Link>
                                {slot.realCount === 0 && (
                                    <button onClick={() => handleDelete(slot)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {slots.length === 0 && (
                    <div className="col-span-full py-20 text-center text-stone-400">
                        <Clock size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No trips found for this criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
}