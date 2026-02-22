import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Calendar as CalIcon, Plus, Users, ArrowRight, Trash2, History, Clock } from "lucide-react";
import { subscribeToAllSlots, deleteSlot, getSlotStatus, getSlotType } from "../../services/slotService";
import { subscribeToAllOrders } from "../../services/orderService";
import { formatTime } from "../../lib/date";

export default function AdminSchedule() {

    const getTodayDate = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const location = useLocation();
    const [selectedDate, setSelectedDate] = useState(getTodayDate());
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState(location.state?.restoredViewMode || "upcoming");

    useEffect(() => {
        // Subscribe to slots
        const unsubSlots = subscribeToAllSlots(
            (allSlots) => {
                // Subscribe to orders
                const unsubOrders = subscribeToAllOrders(
                    (orders) => {
                        // Calculate cups for each slot
                        let slotsWithCups = allSlots.map(slot => {
                            const validOrders = orders.filter(o =>
                                o.slotId === slot.id &&
                                o.status !== 'CANCELLED' &&
                                o.status !== 'PENDING_PAYMENT'
                            );

                            const totalCups = validOrders.reduce((total, order) => {
                                const orderCups = order.items.reduce((sum, item) => sum + item.quantity, 0);
                                return total + orderCups;
                            }, 0);

                            return { ...slot, cupsCount: totalCups };
                        });

                        const getSlotTime = (s) => s.deliveryTime || s.openTime;

                        slotsWithCups.sort((a, b) =>
                            new Date(getSlotTime(b)) - new Date(getSlotTime(a))
                        );

                        if (viewMode === "upcoming") {
                            const filtered = slotsWithCups.filter((s) =>
                                getSlotTime(s).startsWith(selectedDate)
                            );
                            setSlots(filtered);
                        } else {
                            setSlots(slotsWithCups);
                        }
                        setLoading(false);
                    },
                    (error) => {
                        console.error("Order subscription error:", error);
                        setLoading(false);
                    }
                );

                return () => unsubOrders();
            },
            (error) => {
                console.error("Slot subscription error:", error);
                setLoading(false);
            }
        );

        return () => unsubSlots();
    }, [selectedDate, viewMode]);

    const handleDelete = async (slot) => {
        if (slot.cupsCount > 0) {
            return alert("Cannot delete a trip that has orders.");
        }
        if (confirm("Delete this slot?")) {
            try {
                await deleteSlot(slot.id);
            } catch (error) {
                console.error("Error deleting slot:", error);
            }
        }
    };

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
                    const isPickup = (slot.type || "delivery") === "pickup";
                    const typeLabel = (slot.type || "delivery").toUpperCase();
                    const type = getSlotType(slot);
                    const status = getSlotStatus(slot);
                    const slotTime = slot.type === "delivery" ? slot.deliveryTime : slot.openTime;
                    const dateStr = new Date(slotTime).toLocaleDateString([], { day: 'numeric', month: 'short' });

                    return (
                        <div key={slot.id} className={`bg-white p-5 rounded-3xl border shadow-sm relative group transition-all hover:shadow-md flex flex-col ${status.label === 'ENDED' ? 'border-stone-100 opacity-80' : 'border-stone-200'}`}>
                            
                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${status.color}`}>
                                {status.label}
                            </div>

                            {/* Trip Info */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-stone-400 uppercase">{dateStr}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type}`}>
                                        {typeLabel}
                                    </span>
                                </div>

                                <h3 className="text-3xl font-black text-stone-800 tracking-tight flex items-end gap-2">
                                    {formatTime(slotTime)}
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
                                <span className="font-bold">{slot.cupsCount}</span> 
                                <span className="text-stone-400">Cups</span>
                                {!isPickup ? (
                                    <>
                                        <span className="text-stone-300 mx-1">/</span>
                                        <span className="text-stone-400">{slot.maxCapacity} max</span>
                                    </>
                                ) : (
                                    ""
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto flex gap-2">
                                <Link to={`/admin/runner/${slot.id}`} 
                                state={{ previousViewMode: viewMode }}
                                className="flex-1 py-3 bg-stone-900 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-black transition-colors">
                                    {status.label === 'ENDED' ? 'View History' : (isPickup ? 'Barista View' : 'Runner View')} 
                                    <ArrowRight size={16} />
                                </Link>
                                {slot.cupsCount === 0 && (
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
                        <p>No trips found for this date.</p>
                    </div>
                )}
            </div>
        </div>
    );
}