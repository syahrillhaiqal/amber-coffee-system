import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { Coffee, Calendar, LogOut, LayoutDashboard } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import logo from "../assets/amber-coffee-logo-only.png";

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActivePath = (path) => {
        if (path === "/admin") {
            // Special case for root admin dashboard if you have one
            return location.pathname === path;
        }
        return location.pathname.startsWith(path);
    };

    // Helper for Desktop Sidebar styling
    const getLinkClass = (path) => {
        const active = isActivePath(path); 

        let classes =
            "flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ";
        classes += active
            ? "bg-primary text-white shadow-lg shadow-orange-200"
            : "text-stone-500 hover:bg-stone-100 hover:text-stone-900";
        return classes;
    };

    // Helper for Mobile Tab styling (To keep code clean)
    const getMobileTabClass = (path) => {
        const active = isActivePath(path); 

        return `flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap border ${
            active
                ? "bg-primary border-primary text-white shadow-md"
                : "bg-white border-stone-200 text-stone-600"
        }`;
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/admin");
        } catch (err) {
            console.error("Logout Error:", err);
        }
    };

    const NavLinks = () => (
        <>
            <Link to="/admin/dashboard" className={getLinkClass("/admin/dashboard")}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
            </Link>
            <Link to="/admin/schedule" className={getLinkClass("/admin/schedule")}>
                <Calendar size={20} />
                <span>Delivery Schedule</span>
            </Link>
            <Link to="/admin/menu" className={getLinkClass("/admin/menu")}>
                <Coffee size={20} />
                <span>Menu Maintenance</span>
            </Link>
        </>
    );

    return (
        <div className="min-h-screen font-sans flex bg-stone-100">
            {/* --- 1. DESKTOP SIDEBAR --- */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-stone-200 fixed h-full z-20 shadow-sm">
                {/* Logo Area */}
                <div className="p-6 border-b border-stone-100">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-stone-800">
                        <img src={logo} alt="Logo" className="h-8 w-auto" />
                        <span>
                            Amber<span className="text-primary">Admin</span>
                        </span>
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLinks />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-100">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-stone-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* --- 2. MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col min-h-screen md:ml-64">
                {/* MOBILE HEADER */}
                <div className="md:hidden bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
                    <nav className="px-4 py-3 flex justify-between items-center">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-stone-800">
                            <img src={logo} alt="Logo" className="h-8 w-auto" />
                            <span>
                                Amber<span className="text-primary">Admin</span>
                            </span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </nav>

                    {/* Mobile Tabs */}
                    <div className="px-4 py-2 flex gap-2 overflow-x-auto pb-3 bg-stone-50">
                        <Link
                            to="/admin/dashboard"
                            className={getMobileTabClass("/admin/dashboard")}
                        >
                            <Calendar size={16} /> Dashboard
                        </Link>
                        <Link
                            to="/admin/schedule"
                            className={getMobileTabClass("/admin/schedule")}
                        >
                            <Calendar size={16} /> Schedule
                        </Link>
                        <Link
                            to="/admin/menu"
                            className={getMobileTabClass("/admin/menu")}
                        >
                            <Coffee size={16} /> Menu
                        </Link>
                    </div>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
