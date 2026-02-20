import { useState } from 'react'
import { MapPin, ChevronUp, ChevronDown, RotateCcw, Truck } from "lucide-react";

export default function LocationBatchCard({location, groupOrders, updateStatus, setRunnerManifest}) {

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
    )
}
