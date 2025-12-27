import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle,
    Truck,
    RotateCcw,
    Trash2,
    Clock,
    MapPin,
    Eye,
    X,
    Package,
    ClipboardList,
    PenTool,
    Coffee,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    writeBatch,
    getDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function KitchenBoard() {
    const { slotId } = useParams();
    const [orders, setOrders] = useState([]);
    const [slotInfo, setSlotInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("WRITE");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [runnerManifest, setRunnerManifest] = useState(null);

    useEffect(() => {
        const fetchSlotInfo = async () => {
            try {
                const slotDoc = await getDoc(doc(db, "delivery_slots", slotId));
                if (slotDoc.exists()) setSlotInfo(slotDoc.data());
            } catch (error) {
                console.error(error);
            }
        };
        fetchSlotInfo();

        const q = query(
            collection(db, "orders"),
            where("slotId", "==", slotId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const ordersData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            ordersData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setOrders(ordersData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [slotId]);

    const updateStatus = async (orderId, newStatus) => {
        try {
            await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        } catch (error) {
            console.error(error);
        }
    };

    const deleteOrder = async (orderId) => {
        if (confirm("Delete this order?"))
            await deleteDoc(doc(db, "orders", orderId));
    };

    const confirmBatchDelivery = async () => {
        if (!runnerManifest) return;
        const batch = writeBatch(db);
        runnerManifest.orders.forEach((order) => {
            const ref = doc(db, "orders", order.id);
            batch.update(ref, { status: "DELIVERY" });
        });
        await batch.commit();
        setRunnerManifest(null);
    };

    const formatTripTime = (isoString) => {
        if (!isoString) return "";
        return new Date(isoString).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // --- LOCATION BATCH CARD ---
    const LocationBatchCard = ({ location, groupOrders }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        return (
            <div className="bg-white rounded-xl shadow-md border-l-8 border-blue-500 overflow-hidden mb-4 animate-fade-in">
                <div
                    className="p-4 bg-blue-50 flex justify-between items-center cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div>
                        <h3 className="font-black text-lg text-stone-800 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />{" "}
                            {location}
                        </h3>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                            {groupOrders.length} Orders Ready
                        </p>
                    </div>
                    {isExpanded ? (
                        <ChevronUp size={20} className="text-blue-400" />
                    ) : (
                        <ChevronDown size={20} className="text-blue-400" />
                    )}
                </div>
                {isExpanded && (
                    <div className="bg-white border-t border-blue-100">
                        {groupOrders.map((order, i) => (
                            <div
                                key={order.id}
                                className="p-3 border-b border-stone-100 last:border-0 flex justify-between items-center text-sm"
                            >
                                <div className="flex gap-2">
                                    <span className="font-mono text-stone-400 font-bold">
                                        #{order.orderId}
                                    </span>
                                    <span className="font-bold text-stone-800">
                                        {order.customerName}
                                    </span>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateStatus(order.id, "PREPARING");
                                    }}
                                    className="text-stone-400 hover:text-red-500"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-3 bg-white border-t border-stone-100">
                    <button
                        onClick={() =>
                            setRunnerManifest({ location, orders: groupOrders })
                        }
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold flex justify-center items-center gap-2 shadow-lg hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Truck size={18} /> DELIVER BATCH ({groupOrders.length})
                    </button>
                </div>
            </div>
        );
    };

    // --- RUNNER CARD ---
    const RunnerCard = ({
        order,
        actionBtn,
        secondaryBtn,
        accentColor,
        isCompleted,
    }) => (
        <div
            className={`bg-white rounded-xl shadow-md border-l-8 overflow-hidden flex flex-col mb-3 animate-fade-in ${
                isCompleted ? "opacity-60 grayscale" : ""
            }`}
            style={{ borderLeftColor: accentColor }}
        >
            <div
                className="p-3 bg-stone-50 border-b border-stone-100 flex justify-between items-center"
                onClick={() => setSelectedOrder(order)}
            >
                <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-stone-700">
                        #{order.orderId}
                    </span>
                    <span className="text-[10px] font-black bg-stone-800 text-white px-2 py-1 rounded uppercase tracking-wide flex items-center gap-1">
                        <MapPin size={10} /> {order.pickupPoint}
                    </span>
                </div>
                <div className="text-xs font-bold text-stone-400">
                    {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </div>
            </div>
            <div
                className="p-4 flex-1 space-y-2 cursor-pointer"
                onClick={() => setSelectedOrder(order)}
            >
                <div className="font-bold text-stone-800 text-sm">
                    {order.customerName}
                </div>
                {order.items.map((item, idx) => (
                    <div
                        key={idx}
                        className="border-b border-stone-100 pb-1 mb-1 last:border-0 last:pb-0"
                    >
                        <div className="flex justify-between items-start leading-tight">
                            <div className="flex gap-2">
                                <span className="font-black text-stone-900">
                                    {item.quantity}x
                                </span>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-stone-700 text-sm font-bold">
                                            {item.name}
                                        </span>

                                        {/* --- NEW: PROTECTION BADGE --- */}
                                        <span
                                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                item.protection === "premium"
                                                    ? "bg-purple-50 text-purple-700 border-purple-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                            }`}
                                        >
                                            {item.protection || "Basic"}
                                        </span>
                                    </div>

                                    <div className="flex gap-1 flex-wrap mt-0.5">
                                        {/* Sugar Level */}
                                        {item.sugarLevel && (
                                            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded">
                                                {item.sugarLevel}
                                            </span>
                                        )}
                                        {/* Addon */}
                                        {item.addon && (
                                            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.5 rounded">
                                                +{item.addon}
                                            </span>
                                        )}
                                    </div>

                                    {item.remark && (
                                        <p className="mt-1 text-red-600 font-bold text-xs bg-red-50 p-1 px-2 rounded inline-block">
                                            {item.remark}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-2 bg-stone-50 border-t border-stone-100 grid grid-cols-4 gap-2">
                {secondaryBtn}
                <div className="col-span-3">{actionBtn}</div>
            </div>
        </div>
    );

    const readyGroups = orders
        .filter((o) => o.status === "READY")
        .reduce((acc, order) => {
            if (!acc[order.pickupPoint]) acc[order.pickupPoint] = [];
            acc[order.pickupPoint].push(order);
            return acc;
        }, {});

    const receivedList = orders.filter((o) => o.status === "RECEIVED");
    const prepList = orders.filter((o) => o.status === "PREPARING");
    const deliveryList = orders.filter((o) => o.status === "DELIVERY");
    const completedList = orders.filter((o) => o.status === "COMPLETED"); // Keep completed orders

    // Merge 'DELIVERY' and 'COMPLETED' for the 4th column
    const outList = [...deliveryList, ...completedList];

    return (
        <div className="h-screen flex flex-col bg-stone-900 text-stone-100 font-sans overflow-hidden">
            {/* Header */}
            <div className="bg-stone-800 border-b border-stone-700 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/schedule"
                        className="p-2 bg-stone-700 hover:bg-stone-600 rounded-lg text-white"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black text-white leading-tight">
                            RUNNER BOARD
                        </h1>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            {slotInfo ? (
                                <>
                                    <Clock size={12} className="text-white" />
                                    <span className="text-white">
                                        Trip{" "}
                                        {formatTripTime(slotInfo.deliveryTime)}
                                    </span>
                                </>
                            ) : null}
                        </p>
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
                    if (tab === "READY")
                        count = Object.values(readyGroups).flat().length;
                    if (tab === "OUT") count = deliveryList.length; // Count only active delivery, not completed

                    const isActive = activeTab === tab;
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
                            {tab}{" "}
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
                                activeTab === "WRITE" ? "flex" : "hidden"
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
                                                    deleteOrder(order.id)
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
                                activeTab === "PREP" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-orange-500 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <Coffee size={16} /> With Barista
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
                                                Cup Received{" "}
                                                <CheckCircle size={16} />
                                            </button>
                                        }
                                    />
                                ))}
                                {prepList.length === 0 && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        Waiting for runner...
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. READY TO DELIVER */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 md:flex ${
                                activeTab === "READY" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-blue-600 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <Package size={16} /> Ready to Go
                                </span>
                                <span className="bg-blue-800 px-2 rounded-full text-xs">
                                    {Object.values(readyGroups).flat().length}
                                </span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-stone-800/50">
                                {Object.entries(readyGroups).map(
                                    ([location, groupOrders]) => (
                                        <LocationBatchCard
                                            key={location}
                                            location={location}
                                            groupOrders={groupOrders}
                                        />
                                    )
                                )}
                                {Object.keys(readyGroups).length === 0 && (
                                    <div className="text-center p-10 text-stone-600 text-sm">
                                        No ready orders
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 4. OUT FOR DELIVERY (Active + History) */}
                        <div
                            className={`flex-1 flex flex-col bg-stone-800 rounded-xl overflow-hidden border border-stone-700 opacity-90 md:flex ${
                                activeTab === "OUT" ? "flex" : "hidden"
                            }`}
                        >
                            <div className="bg-emerald-600 p-3 text-white font-bold text-center uppercase text-sm shadow-sm flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <Truck size={16} /> On the Way
                                </span>
                                <span className="bg-emerald-800 px-2 rounded-full text-xs">
                                    {deliveryList.length}
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
                                        isCompleted={
                                            order.status === "COMPLETED"
                                        }
                                        secondaryBtn={
                                            order.status === "DELIVERY" && (
                                                <button
                                                    onClick={() =>
                                                        updateStatus(
                                                            order.id,
                                                            "READY"
                                                        )
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
                                                        updateStatus(
                                                            order.id,
                                                            "COMPLETED"
                                                        )
                                                    }
                                                    className="btn-main bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200"
                                                >
                                                    Mark Done{" "}
                                                    <CheckCircle size={18} />
                                                </button>
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {runnerManifest && (
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
                                    {/* REMOVED TICK/CHECKBOX */}
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

            {/* --- UPDATED ORDER DETAIL MODAL --- */}
            {selectedOrder && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
                    onClick={() => setSelectedOrder(null)}
                >
                    {/* 1. Added max-h-[90dvh] and flex flex-col */}
                    <div
                        className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-scale-up flex flex-col max-h-[90dvh]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header (Fixed) */}
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

                        {/* Content Area (Scrollable) */}
                        {/* 2. Added flex-1 overflow-y-auto */}
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
                                        <div className="bg-stone-100 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-stone-600 text-sm">{item.quantity}</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-stone-800">{item.name}</span>
                                                
                                                {/* --- NEW: PROTECTION BADGE (Modal) --- */}
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                    item.protection === 'premium' 
                                                    ? 'bg-purple-50 text-purple-700 border-purple-200' 
                                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                                }`}>
                                                    {item.protection || 'Basic'}
                                                </span>
                                            </div>

                                            <div className="flex gap-1 flex-wrap mt-0.5">
                                                {item.sugarLevel && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-1.5 rounded">{item.sugarLevel}</span>}
                                                {item.addon && <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 rounded">+{item.addon}</span>}
                                            </div>
                                            {item.remark && <div className="text-xs text-red-500 italic mt-1">"{item.remark}"</div>}
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

                        {/* Footer Action (Fixed) */}
                        <div className="p-4 bg-white border-t border-stone-100 shrink-0">
                            <button
                                onClick={() => {
                                    deleteOrder(selectedOrder.id);
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
