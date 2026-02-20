import React from "react";

export default function StatCard({ title, value, icon: Icon, color, sub }) {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100 flex items-center gap-4">
            <div className={`p-4 rounded-2xl ${color} text-white`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-stone-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-stone-800">{value}</h3>
                {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
            </div>
        </div>
    );
}