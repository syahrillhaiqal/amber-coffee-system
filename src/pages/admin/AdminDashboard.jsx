import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Truck, TrendingUp, Users } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        todaySales: 0,
        activeOrders: 0,
        tripsToday: 0,
        totalOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const todayStr = new Date().toISOString().split('T')[0];

                // 1. Get Today's Trips
                const tripsRef = collection(db, "delivery_slots");
                const tripsQ = query(tripsRef, where("dateString", "==", todayStr));
                const tripsSnap = await getDocs(tripsQ);

                // 2. Get All Orders (In a real app, you might want to limit this query)
                const ordersRef = collection(db, "orders");
                const ordersSnap = await getDocs(ordersRef);
                
                let revenue = 0;
                let active = 0;
                let total = 0;

                ordersSnap.forEach(doc => {
                    const data = doc.data();
                    const orderDate = data.createdAt.split('T')[0];
                    
                    // Calculate Today's Revenue
                    if (orderDate === todayStr) {
                        revenue += data.totalPrice || 0;
                    }

                    // Count Active Orders (Not Delivered)
                    if (data.status !== "DELIVERED" && data.status !== "COMPLETED") {
                        active++;
                    }
                    total++;
                });

                setStats({
                    todaySales: revenue,
                    activeOrders: active,
                    tripsToday: tripsSnap.size,
                    totalOrders: total
                });

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, sub }) => (
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

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-stone-800">Welcome Back, Admin</h1>
                <p className="text-stone-500">Here is what's happening at Amber Coffee today.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                    {[1,2,3,4].map(i => <div key={i} className="h-32 bg-stone-200 rounded-3xl"></div>)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                        title="Today's Revenue" 
                        value={`RM ${stats.todaySales.toFixed(2)}`} 
                        icon={DollarSign} 
                        color="bg-emerald-500" 
                    />
                    <StatCard 
                        title="Active Orders" 
                        value={stats.activeOrders} 
                        icon={ShoppingBag} 
                        color="bg-orange-500" 
                        sub="To be prepared/delivered"
                    />
                    <StatCard 
                        title="Trips Today" 
                        value={stats.tripsToday} 
                        icon={Truck} 
                        color="bg-blue-500" 
                    />
                    <StatCard 
                        title="Total Orders" 
                        value={stats.totalOrders} 
                        icon={TrendingUp} 
                        color="bg-purple-500" 
                        sub="All time"
                    />
                </div>
            )}

            {/* Quick Actions / Recent Activity Placeholder */}
            <div className="">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
                    <h3 className="font-bold text-stone-800 mb-4">Quick Actions</h3>
                    <div className="flex gap-4">
                        <a href="/admin/schedule/new" className="flex-1 bg-stone-900 text-white py-3 rounded-xl font-bold text-center hover:bg-stone-800 transition-colors">
                            + Create Trip
                        </a>
                        <a href="/admin/menu" className="flex-1 bg-white border border-stone-200 text-stone-700 py-3 rounded-xl font-bold text-center hover:bg-stone-50 transition-colors">
                            Manage Menu
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}