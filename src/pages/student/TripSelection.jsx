import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function TripSelection() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Get Today's Date String in local time
    const getTodayString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        return localDate.toISOString().split('T')[0];
    };
    
    const today = getTodayString();
    const displayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    useEffect(() => {
        setLoading(true);

        // 1. Listen to Today's Slots (Real-time)
        const slotsQuery = query(collection(db, "delivery_slots"), where("dateString", "==", today));
        
        const unsubSlots = onSnapshot(slotsQuery, (slotsSnapshot) => {
            const todaysTrips = slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // 2. Listen to Orders (Real-time Cup Counting)
            // We listen to ALL orders to ensure we catch every update.
            // In a larger app, you'd optimize this query to only fetch today's orders.
            const unsubOrders = onSnapshot(collection(db, "orders"), (ordersSnapshot) => {
                const allOrders = ordersSnapshot.docs.map(doc => doc.data());

                // 3. Merge & Calculate Capacity
                const tripsWithCapacity = todaysTrips.map(trip => {
                    // Filter orders for this specific trip
                    const validOrders = allOrders.filter(o => 
                        o.slotId === trip.id && 
                        o.status !== 'CANCELLED' && 
                        o.status !== 'PENDING_PAYMENT' 
                    );
                    
                    // Sum up the quantity of every item in every valid order
                    const filledCups = validOrders.reduce((total, order) => {
                        const orderCups = order.items.reduce((sum, item) => sum + item.quantity, 0);
                        return total + orderCups;
                    }, 0);

                    return { ...trip, filledCups };
                });

                // Sort by time
                tripsWithCapacity.sort((a, b) => a.deliveryTime.localeCompare(b.deliveryTime));
                
                setTrips(tripsWithCapacity);
                setLoading(false);
            });

            return () => unsubOrders(); // Cleanup orders listener when slots update
        });

        return () => unsubSlots(); // Cleanup slots listener on unmount
    }, [today]);

    const getTripStatus = (trip) => {
        const now = new Date();
        const open = new Date(trip.openTime);
        const close = new Date(trip.cutoffTime);
        
        // Logic Priority: Full -> Closed -> Opens Soon -> Open
        const isFull = trip.filledCups >= trip.maxCapacity;

        if (isFull) return { text: "FULL", color: "bg-red-100 text-red-600", active: false };
        if (now >= close) return { text: "Closed", color: "bg-stone-200 text-stone-500", active: false };
        if (now < open) return { text: "Opens Soon", color: "bg-gray-100 text-gray-500", active: false };
        
        return { text: "Order Open", color: "bg-green-100 text-green-700", active: true };
    };

    return (
        <div className="px-4 py-8 max-w-md mx-auto">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Choose Delivery Trip</h2>
                <div className="flex items-center gap-2 text-primary font-medium mt-1">
                    <Calendar size={18} />
                    <span>{displayDate}</span>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? <p className="text-center text-gray-400">Loading schedules...</p> : trips.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-300">
                        <p className="text-gray-500">No delivery trips scheduled for today.</p>
                    </div>
                ) : (
                    trips.map(trip => {
                        const status = getTripStatus(trip);
                        const timeStr = new Date(trip.deliveryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        const cutoffStr = new Date(trip.cutoffTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        // Percentage for progress bar
                        const percentFull = Math.min(100, Math.round((trip.filledCups / trip.maxCapacity) * 100));

                        return (
                            <Link 
                                key={trip.id}
                                to={status.active ? "/menu" : "#"}
                                state={status.active ? { tripId: trip.id, name: timeStr, time: timeStr, selectedMenuIds: trip.selectedMenuIds } : null}
                                onClick={() => {
                                    if(status.active) {
                                        sessionStorage.setItem("currentTrip", JSON.stringify({ 
                                            tripId: trip.id, 
                                            name: timeStr, 
                                            time: timeStr, 
                                            selectedMenuIds: trip.selectedMenuIds 
                                        }));
                                    }
                                }}
                                className={`block group ${!status.active && 'opacity-60 cursor-not-allowed pointer-events-none'}`}
                            >
                                <div className={`border-2 bg-white p-5 rounded-2xl transition-all shadow-sm ${status.active ? 'border-orange-100 hover:border-primary' : 'border-gray-100'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`${status.color} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}>
                                            {status.text}
                                        </span>
                                        {/* Live Cup Counter */}
                                        <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                                            <span>{trip.filledCups} / {trip.maxCapacity} Cups</span>
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold text-gray-800">Trip: {timeStr} Arrival</h3>
                                    
                                    {/* Capacity Bar */}
                                    <div className="w-full bg-gray-100 h-2 rounded-full mt-3 mb-1 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${percentFull >= 100 ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${percentFull}%` }}
                                        ></div>
                                    </div>
                                    
                                    <p className="text-gray-500 text-sm mt-1">
                                        Order before <strong>{cutoffStr}</strong>
                                    </p>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}