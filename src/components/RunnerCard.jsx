import React from 'react'
import { MapPin, RotateCcw, Trash2, Clock } from "lucide-react";

export default function RunnerCard({order, actionBtn, secondaryBtn, accentColor, isCompleted, setSelectedOrder}) {

    const isPickupOrder = (order?.orderType || "delivery") === "pickup";

    return (
        <div
            className={`bg-white rounded-xl shadow-md border-l-8 overflow-hidden flex flex-col mb-3 animate-fade-in ${
                isCompleted ? "opacity-60 grayscale" : ""
            }`}
            style={{ borderLeftColor: accentColor }}
        >
            {isPickupOrder && (
                <div
                    className="px-3 py-2 bg-stone-50 border-b border-stone-100"
                    onClick={() => setSelectedOrder(order)}
                >
                    <p className="text-[11px] font-black text-stone-700 uppercase tracking-wide flex items-center gap-1">
                        <Clock size={12} />
                        Pickup At: 
                        <span className="text-sm">
                        {new Date(order?.pickupTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                        </span>
                    </p>
                </div>
            )}

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
                                        {!isPickupOrder && item.protection && (
                                            <span
                                                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase border ${
                                                    item.protection === "premium"
                                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}
                                            >
                                                {item.protection}
                                            </span>
                                        )}
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
    )
}

