import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, Clock, Package, AlertCircle, Loader2, Truck, Store } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { analytics, db } from "../../lib/firebase";
import logo from "../../assets/amber-coffee-logo-only.png";
import { getTodayString, formatDisplayDate, formatTime } from "../../lib/date";
import { getTripStatus, getRemainingCups, getFilledCups } from "../../lib/trip";
import { saveCurrentTrip } from "../../lib/storage";
import { subscribeToSlotsByDate } from "../../services/slotService";
import { logEvent } from "firebase/analytics";

export default function TripSelection() {

    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrderType, setSelectedOrderType] = useState("delivery");

    const today = getTodayString();
    const displayDate = formatDisplayDate();

    const handleTripSelection = (trip, status, timeStr, remainingCups, isLowStock) => {

        if (!status.active) return;

        logEvent(analytics, "select_trip", {
            trip_id: trip.id,
            trip_time: timeStr,
            trip_type: trip.type || "delivery",
            remaining_capacity: remainingCups,
            is_low_stock: isLowStock
        });

        saveCurrentTrip({ 
            tripId: trip.id, 
            name: timeStr, 
            time: timeStr, 
            selectedMenuIds: trip.selectedMenuIds,
            orderType: trip.type || "delivery",
            openTime: trip.openTime || null,
            cutoffTime: trip.cutoffTime || null
        });
    };

    const displayedTrips = trips.filter(
        (trip) => (trip.type || "delivery") === selectedOrderType
    );

    useEffect(() => {
        const unsubSlots = subscribeToSlotsByDate(today, (todaysTrips) => {
            const unsubOrders = onSnapshot(
                collection(db, "orders"),
                (ordersSnapshot) => {
                    const allOrders = ordersSnapshot.docs.map(doc => doc.data());

                    const tripsWithCapacity = todaysTrips.map(trip => {
                        const filledCups = getFilledCups(allOrders, trip.id);
                        return { ...trip, filledCups };
                    });

                    tripsWithCapacity.sort((a, b) => {
                        const aTime = a.deliveryTime || a.openTime || "";
                        const bTime = b.deliveryTime || b.openTime || "";
                        return aTime.localeCompare(bTime);
                    });

                    setTrips(tripsWithCapacity);
                    setLoading(false);
                }
            );

            return () => unsubOrders();
        });

        return () => unsubSlots();
    }, [today]);

    return (
        <div className="px-4 py-6 max-w-md mx-auto min-h-screen bg-stone-100">
            <div className="mb-5">
                <h2 className="text-2xl font-bold text-gray-800">
                    Choose {selectedOrderType === "pickup" ? "Pickup" : "Delivery"} Trip
                </h2>
                <div className="flex items-center gap-2 text-primary font-medium mt-1">
                    <Calendar size={16} />
                    <span className="text-sm">{displayDate}</span>
                </div>
            </div>
            
            <div className="mb-4 bg-white p-1 rounded-xl border border-stone-200 shadow-sm grid grid-cols-2 gap-1">
                <button
                    type="button"
                    onClick={() => setSelectedOrderType("delivery")}
                    className={`py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        selectedOrderType === "delivery"
                            ? "bg-stone-900 text-white"
                            : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                >
                    <Truck size={16} />
                    Delivery
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedOrderType("pickup")}
                    className={`py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 ${
                        selectedOrderType === "pickup"
                            ? "bg-primary text-white"
                            : "bg-stone-50 text-stone-600 hover:bg-stone-100"
                    }`}
                >
                    <Store size={16} />
                    Pickup
                </button>
            </div>

            <div className="space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-2">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-14 w-auto mb-2"
                        />
                        <div className="flex items-center gap-2 font-medium">
                            <Loader2 className="animate-spin w-5 h-5 text-primary" />
                            <span>Loading...</span>
                        </div>
                    </div>
                ) : displayedTrips.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-2xl border border-dashed border-gray-300">
                        <Calendar
                            size={48}
                            className="mx-auto mb-4 text-gray-300"
                        />
                        <p className="text-gray-500 font-bold">
                            No {selectedOrderType} trips available.
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                            Check back later or tomorrow!
                        </p>
                    </div>
                ) : (
                    displayedTrips.map((trip) => {
                        const status = getTripStatus(trip);
                        const isPickup = (trip.type || "delivery") === "pickup";
                        const timeStr = isPickup
                            ? `${formatTime(trip.openTime)} - ${formatTime(trip.cutoffTime)}`
                            : formatTime(trip.deliveryTime);
                        const openStr = formatTime(trip.openTime);
                        const cutoffStr = formatTime(trip.cutoffTime);
                        const remainingCups = getRemainingCups(trip);
                        const isLowStock = remainingCups <= 5 && remainingCups > 0;

                        // The state give to "../menu" the state, which is an object (trip data)
                        return (
                            <Link
                                key={trip.id}
                                to={status.active ? "/menu" : "#"}
                                state={
                                    status.active
                                        ? {
                                            tripId: trip.id,
                                            name: timeStr,
                                            time: timeStr,
                                            selectedMenuIds: trip.selectedMenuIds,
                                            orderType: trip.type || "delivery",
                                            openTime: trip.openTime || null,
                                            cutoffTime: trip.cutoffTime || null,
                                          }
                                        : null
                                }
                                onClick={() => handleTripSelection(trip, status, timeStr, remainingCups, isLowStock)}
                                className={`block group transition-transform active:scale-[0.98] ${
                                    !status.active &&
                                    "opacity-60 cursor-not-allowed pointer-events-none"
                                }`}
                            >
                                <div
                                    className={`border-2 bg-white p-4 rounded-xl transition-all shadow-sm ${
                                        status.active
                                            ? "border-stone-200 hover:border-primary hover:shadow-md"
                                            : "border-gray-200 bg-gray-50"
                                    }`}
                                >
                                    {/* SECTION 1: Trip Time & Status */}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                                {isPickup ? "Pickup" : "Delivery"}
                                            </p>
                                            <p className="text-2xl font-black text-gray-800">
                                                {timeStr}
                                            </p>
                                        </div>
                                        <span
                                            className={`${status.color} px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1`}
                                        >
                                            {status.active && (
                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                            )}
                                            {status.text}
                                        </span>
                                    </div>

                                    {/* SECTION 2: Capacity Info */}
                                    {status.text !== "Closed" && !isPickup && (
                                    <div className="mb-3">
                                        <div
                                            className={`flex items-center justify-between p-2 rounded-lg border ${
                                                isLowStock
                                                    ? "bg-amber-50 border-amber-200"
                                                    : remainingCups === 0
                                                    ? "bg-red-50 border-red-200"
                                                    : "bg-green-50 border-green-200"
                                            }`}
                                        >
                                            <div className="flex items-center gap-1.5">
                                                <Package
                                                    size={16}
                                                    className={
                                                        isLowStock
                                                            ? "text-amber-600"
                                                            : remainingCups ===
                                                              0
                                                            ? "text-red-600"
                                                            : "text-green-600"
                                                    }
                                                />
                                                <span className="text-xs font-semibold text-gray-700">
                                                    Cups Available
                                                </span>
                                            </div>
                                            <span
                                                className={`text-sm font-black ${
                                                    isLowStock
                                                        ? "text-amber-600"
                                                        : remainingCups === 0
                                                        ? "text-red-600"
                                                        : "text-green-600"
                                                }`}
                                            >
                                                {remainingCups === 0
                                                    ? "SOLD OUT"
                                                    : `${remainingCups} left`}
                                            </span>
                                        </div>
                                    </div>
                                    )}

                                    {/* SECTION 3: Order Window Times */}
                                    <div className="pt-2.5 border-t border-gray-100 space-y-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Clock
                                                    size={12}
                                                    className="text-blue-500"
                                                />
                                                <span className="font-medium">
                                                    Open
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-800">
                                                {openStr}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <Clock
                                                    size={12}
                                                    className="text-red-500"
                                                />
                                                <span className="font-medium">
                                                    Close
                                                </span>
                                            </div>
                                            <span className="font-bold text-gray-800">
                                                {cutoffStr}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
