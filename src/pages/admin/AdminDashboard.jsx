import { useState, useEffect } from "react";
import { DollarSign, ShoppingBag, Truck, TrendingUp } from "lucide-react";
import { subscribeToSlotsByDate } from "../../services/slotService";
import { subscribeToAllOrders } from "../../services/orderService";
import StatCard from "../../components/StatCard";

export default function AdminDashboard() {

    const [stats, setStats] = useState({
        todaySales: 0,
        activeOrders: 0,
        tripsToday: 0,
        totalOrders: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        // Subscribe to today's trips
        const unsubscribeTrips = subscribeToSlotsByDate(todayStr, (trips) => {
            setStats(prev => ({
                ...prev,
                tripsToday: trips.length
            }));
        });

        // Subscribe to all orders
        const unsubscribeOrders = subscribeToAllOrders((orders) => {
            let revenue = 0;
            let active = 0;
            let total = 0;

            orders.forEach(data => {
                if (data.paymentStatus !== 'PAID') return;

                const orderDate = data.createdAt?.split('T')[0];
                if (orderDate !== todayStr) return;

                revenue += data.totalPrice || 0;
                total++;

                const isFinished = ["DELIVERED", "COMPLETED", "CANCELLED"].includes(data.status);
                if (!isFinished) {
                    active++;
                }
            });

            setStats(prev => ({
                ...prev,
                todaySales: revenue,
                activeOrders: active,
                totalOrders: total
            }));
            
            setLoading(false);
        }, (error) => {
            console.error("Real-time Error:", error);
            setLoading(false);
        });

        return () => {
            unsubscribeTrips();
            unsubscribeOrders();
        };
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold text-stone-800">Welcome Back, Admin</h1>
                <p className="text-stone-500">Live overview of Amber Coffee.</p>
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
                        sub="Paid orders only"
                    />
                    <StatCard 
                        title="Active Queue" 
                        value={stats.activeOrders} 
                        icon={ShoppingBag} 
                        color="bg-orange-500" 
                        sub="Today's paid orders still in progress"
                    />
                    <StatCard 
                        title="Trips Today" 
                        value={stats.tripsToday} 
                        icon={Truck} 
                        color="bg-blue-500" 
                    />
                    <StatCard 
                        title="Today Orders" 
                        value={stats.totalOrders} 
                        icon={TrendingUp} 
                        color="bg-purple-500" 
                        sub="Total paid orders today"
                    />
                </div>
            )}

            {/* Quick Actions */}
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