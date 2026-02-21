import { useState, useEffect } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Truck, RotateCcw, Trash2, Clock, MapPin, Eye, X, Package, ClipboardList, PenTool, Coffee, ChevronDown, ChevronUp } from "lucide-react";
import { subscribeToOrdersBySlot, updateOrderStatus, deleteOrder, batchUpdateOrderStatuses } from "../../services/orderService";
import { getSlotById } from "../../services/slotService";
import RunnerCard from "../../components/RunnerCard";
import LocationBatchCard from "../../components/LocationBatchCard";

export default function RunnerBoard() {

    const {slotId} = useParams();
    const [orders, setOrders] = useState([]);
    const [slotInfo, setSlotInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("WRITE");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [runnerManifest, setRunnerManifest] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateOrderStatus(orderId, newStatus);
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const deleteOrderHandler = async (orderId) => {
        if (confirm("Delete this order?")) {
            try {
                await deleteOrder(orderId);
            } catch (error) {
                console.error("Error deleting order:", error);
            }
        }
    };

    const handleBack = () => {
        navigate("/admin/schedule", {
            state: { 
                restoredViewMode: location.state?.previousViewMode || "upcoming" 
            }
        });
    };

    const confirmBatchDelivery = async () => {
        if (!runnerManifest) return;
        try {
            await batchUpdateOrderStatuses(runnerManifest.orders, "DELIVERY");
            setRunnerManifest(null);
        } catch (error) {
            console.error("Error confirming batch delivery:", error);
        }
    };

    const formatTripTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };    

    const formatDisplayDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit', 
            month: 'short', 
            year: 'numeric'
        });
    }
    
    const readyGroups = orders
        .filter((o) => o.status === "READY")
        .reduce((acc, order) => {
            if (!acc[order.pickupPoint]) acc[order.pickupPoint] = [];
            acc[order.pickupPoint].push(order);
            return acc;
        }, {});
    const readyList = orders.filter((o) => o.status === "READY");

    const receivedList = orders.filter((o) => o.status === "RECEIVED");
    const prepList = orders.filter((o) => o.status === "PREPARING");
    const deliveryList = orders.filter((o) => o.status === "DELIVERY");
    const completedList = orders.filter((o) => o.status === "COMPLETED");
    const isPickupBoard = (slotInfo?.type || "delivery") === "pickup";
    const currentTab = activeTab;
    const outList = isPickupBoard ? completedList : [...deliveryList, ...completedList];

    useEffect(() => {
        const fetchSlotInfo = async () => {
            try {
                const slotData = await getSlotById(slotId);
                if (slotData) setSlotInfo(slotData);
            } catch (error) {
                console.error("Error fetching slot info:", error);
            }
        };
        fetchSlotInfo();

        const unsubscribe = subscribeToOrdersBySlot(
            slotId,
            (ordersData) => {
                let ordersData_filtered = ordersData.filter(
                    (order) =>
                        order.status !== "PENDING_PAYMENT" &&
                        order.status !== "CANCELLED"
                );

                ordersData_filtered.sort(
                    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
                );
                setOrders(ordersData_filtered);
                setLoading(false);
            },
            (error) => {
                console.error("Subscription error:", error);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [slotId]);

    return (
        <div className="h-screen flex flex-col bg-stone-900 text-stone-100 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-stone-800 border-b border-stone-700 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleBack}
                        className="p-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        {slotInfo ? (
                            <>
                            <h1 className="text-lg font-black text-white leading-tight">
                                {formatDisplayDate(slotInfo.dateString)}
                            </h1>
                            <p className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Clock size={12} className="text-white" />
                                <span className="text-white">
                                    Trip{" "}
                                    {isPickupBoard
                                        ? `${formatTripTime(slotInfo.openTime)} - ${formatTripTime(slotInfo.cutoffTime)}`
                                        : formatTripTime(slotInfo.deliveryTime)}
                                </span>
                            </p>
                            </>
                        ) : null}
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-primary leading-none">
                        {orders.length}
                    </span>
                    <span className="text-[10px] font-bold text-stone-500 uppercase">
                        Total Orders
                    </span>
                </div>
            </div>

            {/* Mobile Tabs */}
            <div className="md:hidden flex bg-stone-800 border-b border-stone-700 overflow-x-auto">
                {["WRITE", "PREP", "READY", "OUT"].map((tab) => {
                    let count = 0;
                    if (tab === "WRITE") count = receivedList.length;
                    if (tab === "PREP") count = prepList.length;
                    if (tab === "READY") count = isPickupBoard ? readyList.length : Object.values(readyGroups).flat().length;
                    if (tab === "OUT") count = isPickupBoard ? completedList.length : deliveryList.length;

                    const isActive = currentTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 text-xs font-bold border-b-4 transition-all ${
                                isActive
                                    ? "border-primary text-primary bg-stone-700"
                                    : "border-transparent text-stone-500 hover:text-stone-300"
                            }`}
                        >
                            {isPickupBoard && tab === "OUT" ? "COMPLETED" : tab}{" "}
                            <span className="ml-1 bg-stone-900 text-stone-400 px-1.5 py-0.5 rounded-full text-[10px] border border-stone-700">
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Board Content */}
            <div className="flex-1 overflow-hidden p-2 md:p-4 bg-stone-900 relative">
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="h-full flex gap-4 md:grid md:grid-cols-4">
                        {/* 1. WRITE CUP */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 md:flex ${
                                currentTab === "WRITE" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-rose-600 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <PenTool size={16} /> Write Cup
                                </span>
                                <span className="bg-rose-800 px-2 rounded-full text-xs">
                                    {receivedList.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-stone-800/50">
                                {receivedList.map((order) => (
                                    <RunnerCard
                                        key={order.id}
                                        order={order}
                                        accentColor="#e11d48"
                                        secondaryBtn={
                                            <button
                                                onClick={() =>
                                                    deleteOrderHandler(order.id)
                                                }
                                                className="btn-icon bg-stone-200 text-red-600"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        }
                                        actionBtn={
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        order.id,
                                                        "PREPARING"
                                                    )
                                                }
                                                className="btn-main bg-stone-900 text-white hover:bg-black"
                                            >
                                                Sent to Barista{" "}
                                                <ArrowLeft
                                                    size={16}
                                                    className="rotate-180"
                                                />
                                            </button>
                                        }
                                        setSelectedOrder={setSelectedOrder}
                                    />
                                ))}
                                {receivedList.length === 0 && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        No new orders
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. WITH BARISTA */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 md:flex ${
                                currentTab === "PREP" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-orange-500 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <Coffee size={16} /> Prep
                                </span>
                                <span className="bg-orange-700 px-2 rounded-full text-xs">
                                    {prepList.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-stone-800/50">
                                {prepList.map((order) => (
                                    <RunnerCard
                                        key={order.id}
                                        order={order}
                                        accentColor="#f97316"
                                        secondaryBtn={
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        order.id,
                                                        "RECEIVED"
                                                    )
                                                }
                                                className="btn-icon bg-stone-200 text-stone-600"
                                            >
                                                <RotateCcw size={16} />
                                            </button>
                                        }
                                        actionBtn={
                                            <button
                                                onClick={() =>
                                                    updateStatus(
                                                        order.id,
                                                        "READY"
                                                    )
                                                }
                                                className="btn-main bg-orange-500 text-white hover:bg-orange-600"
                                            >
                                                {isPickupBoard ? "Ready To Pickup " : "Cup Received "}
                                                <CheckCircle size={16} />
                                            </button>
                                        }
                                        setSelectedOrder={setSelectedOrder}
                                    />
                                ))}
                                {prepList.length === 0 && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        No orders in prep
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. READY TO DELIVER */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 md:flex ${
                                currentTab === "READY" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-blue-600 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <Package size={16} /> Ready
                                </span>
                                <span className="bg-blue-800 px-2 rounded-full text-xs">
                                    {isPickupBoard ? readyList.length : Object.values(readyGroups).flat().length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-stone-800/50">
                                {isPickupBoard
                                    ? readyList.map((order) => (
                                        <RunnerCard
                                            key={order.id}
                                            order={order}
                                            accentColor="#2563eb"
                                            secondaryBtn={
                                                <button
                                                    onClick={() =>
                                                        updateStatus(order.id, "PREPARING")
                                                    }
                                                    className="btn-icon bg-stone-200 text-stone-600"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            }
                                            actionBtn={
                                                <button
                                                    onClick={() =>
                                                        updateStatus(order.id, "COMPLETED")
                                                    }
                                                    className="btn-main bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                                                >
                                                    Mark Completed <CheckCircle size={18} />
                                                </button>
                                            }
                                            setSelectedOrder={setSelectedOrder}
                                        />
                                    ))
                                    : Object.entries(readyGroups).map(
                                        ([location, groupOrders]) => (
                                            <LocationBatchCard
                                                key={location}
                                                location={location}
                                                groupOrders={groupOrders}
                                                updateStatus={updateStatus}
                                                setRunnerManifest={setRunnerManifest}
                                            />
                                        )
                                    )}
                                {((isPickupBoard && readyList.length === 0) || (!isPickupBoard && Object.keys(readyGroups).length === 0)) && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        No ready orders
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. OUT FOR DELIVERY / COMPLETED */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 opacity-90 md:flex ${
                                currentTab === "OUT" ? "flex" : "hidden"
                            }`}
                        >
                            <div className={`p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center ${
                                isPickupBoard ? "bg-violet-600" : "bg-emerald-600"
                            }`}>
                                <span className="flex items-center gap-2">
                                    {isPickupBoard ? <CheckCircle size={16} /> : <Truck size={16} />}
                                    {isPickupBoard ? "Completed" : "On the Way"}
                                </span>
                                <span className={`px-2 rounded-full text-xs ${
                                    isPickupBoard ? "bg-violet-800" : "bg-emerald-800"
                                }`}>
                                    {isPickupBoard ? completedList.length : deliveryList.length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-stone-800/50">
                                {outList.map((order) => (
                                    <RunnerCard
                                        key={order.id}
                                        order={order}
                                        accentColor={
                                            order.status === "COMPLETED"
                                                ? "#57534e"
                                                : "#059669"
                                        }
                                        isCompleted={order.status === "COMPLETED"}
                                        secondaryBtn={
                                            !isPickupBoard &&
                                            order.status === "DELIVERY" && (
                                                <button
                                                    onClick={() =>
                                                        updateStatus(order.id, "READY")
                                                    }
                                                    className="btn-icon bg-stone-200 text-stone-600"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )
                                        }
                                        actionBtn={
                                            order.status === "COMPLETED" ? (
                                                <div className="btn-main bg-stone-200 text-stone-500 border border-stone-300 cursor-default">
                                                    Completed
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() =>
                                                        updateStatus(order.id, "COMPLETED")
                                                    }
                                                    className="btn-main bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                                                >
                                                    Mark Done <CheckCircle size={18} />
                                                </button>
                                            )
                                        }
                                        setSelectedOrder={setSelectedOrder}
                                    />
                                ))}
                                {outList.length === 0 && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        {isPickupBoard ? "No completed orders" : "No out-for-delivery orders"}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {/* Delivery Modal */}
            {runnerManifest && !isPickupBoard && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setRunnerManifest(null)}
                >
                    <div
                        className="bg-white text-stone-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-stone-900 text-white p-5 flex justify-between items-center">
                            <div>
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-wider mb-1">
                                    Batch Delivery
                                </p>
                                <h2 className="text-3xl font-black text-white">
                                    {runnerManifest.location}
                                </h2>
                            </div>
                            <div className="bg-stone-800 p-3 rounded-xl">
                                <ClipboardList size={28} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0">
                            {runnerManifest.orders.map((order, i) => (
                                <div
                                    key={order.id}
                                    className="p-4 border-b border-stone-100 flex gap-4 items-center"
                                >
                                    <div className="h-8 w-8 rounded-full bg-stone-100 text-stone-500 font-bold flex items-center justify-center text-sm">
                                        {i + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-stone-900 text-lg">
                                            {order.customerName}
                                        </h4>
                                        <div className="text-sm text-stone-500">
                                            {order.items
                                                .map(
                                                    (item) =>
                                                        `${item.quantity}x ${item.name}`
                                                )
                                                .join(", ")}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 bg-stone-50 border-t flex gap-3">
                            <button
                                onClick={() => setRunnerManifest(null)}
                                className="px-6 py-3 font-bold text-stone-500 hover:text-stone-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmBatchDelivery}
                                className="flex-1 bg-blue-600 text-white rounded-xl font-bold py-3 shadow-lg hover:bg-blue-700 active:scale-95 transition-transform flex justify-center items-center gap-2"
                            >
                                <Truck size={18} /> Start Delivery
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Modal */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div
                        className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-stone-100 p-4 border-b flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-stone-800">
                                    Order #{selectedOrder.orderId}
                                </h2>
                                <p className="text-stone-500 text-xs font-bold uppercase">
                                    {selectedOrder.status}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 bg-stone-400 border rounded-full hover:bg-stone-500 text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 text-stone-900 flex-1 overflow-y-auto overscroll-contain">
                            {/* Customer Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">
                                        Customer
                                    </p>
                                    <p className="text-lg font-bold text-stone-800">
                                        {selectedOrder.customerName}
                                    </p>
                                    <a
                                        href={`tel:${selectedOrder.customerPhone}`}
                                        className="text-blue-600 font-bold text-sm hover:underline"
                                    >
                                        {selectedOrder.customerPhone}
                                    </a>
                                </div>
                                <div className="bg-stone-50 p-4 rounded-xl border border-stone-100">
                                    <p className="text-xs font-bold text-stone-400 uppercase mb-1">
                                        Location
                                    </p>
                                    <p className="text-lg font-bold text-primary">
                                        {selectedOrder.pickupPoint}
                                    </p>
                                    {selectedOrder.address && (
                                        <p className="text-xs text-stone-500 mt-1 leading-tight">
                                            {selectedOrder.address}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Item List */}
                            <div>
                                <p className="text-xs font-bold text-stone-400 uppercase mb-2">
                                    Order Items
                                </p>
                                <div className="border border-stone-200 rounded-xl overflow-hidden">
                                    {selectedOrder.items.map((item, i) => (
                                        <div
                                            key={i}
                                            className="p-3 border-b border-stone-100 last:border-0 flex justify-between items-center bg-white"
                                        >
                                            <div className="flex gap-3 items-center">
                                                <div className="bg-stone-100 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-stone-600 text-sm">
                                                    {item.quantity}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-stone-800">
                                                            {item.name}
                                                        </span>
                                                        {selectedOrder.orderType !== "pickup" && item.protection && (
                                                            <span
                                                                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                                    item.protection ===
                                                                    "premium"
                                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                                }`}
                                                            >
                                                                {item.protection}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex gap-1 flex-wrap mt-0.5">
                                                        {item.sugarLevel && (
                                                            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 rounded">
                                                                {
                                                                    item.sugarLevel
                                                                }
                                                            </span>
                                                        )}
                                                        {item.addon && (
                                                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 rounded">
                                                                +{item.addon}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.remark && (
                                                        <div className="text-xs text-red-500 italic mt-1">
                                                            "{item.remark}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-stone-50 p-3 flex justify-between items-center font-bold text-stone-800">
                                        <span>Total Paid</span>
                                        <span>
                                            RM{" "}
                                            {selectedOrder.totalPrice?.toFixed(
                                                2
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="p-4 bg-white border-t border-stone-100 shrink-0">
                            <button
                                onClick={() => {
                                    deleteOrderHandler(selectedOrder.id);
                                    setSelectedOrder(null);
                                }}
                                className="w-full py-3 text-red-500 font-bold border border-red-100 rounded-xl hover:bg-red-50 transition-colors"
                            >
                                Delete Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .btn-icon { width: 100%; height: 2.5rem; display: flex; align-items: center; justify-content: center; border-radius: 0.5rem; font-weight: bold; transition: all 0.2s; }
        .btn-main { width: 100%; height: 2.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 0.5rem; font-weight: bold; font-size: 0.875rem; transition: all 0.2s; }
      `}</style>
        </div>
    );
}
