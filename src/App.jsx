import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentLayout from "./components/StudentLayout";
import HomePage from "./pages/student/HomePage";
import TripSelection from "./pages/student/TripSelection";
import MenuPage from "./pages/student/MenuPage";
import CheckoutPage from "./pages/student/CheckoutPage";
import ReceiptPage from "./pages/student/ReceiptPage";
import ScrollToTop from "./components/ScrollToTop";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminMenu from "./pages/admin/AdminMenu";
import KitchenBoard from "./pages/admin/KitchenBoard";
import RequireAuth from "./components/RequireAuth";
import AdminCreateTrip from "./pages/admin/AdminCreateTrip";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PaymentStatusPage from "./pages/student/PaymentStatusPage";

function App() {

    const [cart, setCart] = useState(() => {
        const saved = sessionStorage.getItem("amberCart");
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        sessionStorage.setItem("amberCart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item, quantity, remark) => {
        const cartItem = { 
            ...item, 
            quantity, 
            remark, 
            cartId: Date.now() + Math.random() 
        };
        setCart([...cart, cartItem]);
    };

    const removeFromCart = (cartId) => {
        if (window.confirm("Remove this item from cart?")) {
            setCart(cart.filter(item => item.cartId !== cartId));
        }
    };

    const clearCart = () => {
        setCart([]);
        sessionStorage.removeItem("amberCart"); 
    };

    return (
        <BrowserRouter>
            <ScrollToTop />
            <div className="min-h-screen bg-stone-100 font-sans text-gray-800">

                <Routes>
                    {/* --- STUDENT PAGES --- */}
                    <Route element={<StudentLayout />}>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/trip" element={<TripSelection />} />
                        <Route
                            path="/menu"
                            element={
                                <MenuPage 
                                    addToCart={addToCart} 
                                    removeFromCart={removeFromCart} 
                                    cart={cart} 
                                />
                            }
                        />
                        <Route
                        path="/checkout"
                        element={<CheckoutPage cart={cart} clearCart={clearCart} />}
                        />
                        <Route path="/payment-status" element={<PaymentStatusPage clearCart={clearCart} />} />
                        <Route path="/receipt" element={<ReceiptPage />} />
                    </Route>

                    {/* --- ADMIN PAGES --- */}
                    
                    {/* Admin Login */}
                    <Route path="/login" element={<AdminLogin />} />

                    {/* Protected Admin Dashboard */}
                    <Route element={<RequireAuth />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminDashboard />} />
                            <Route path="dashboard" element={<AdminDashboard />} /> 
                            <Route path="schedule" element={<AdminSchedule />} />
                            <Route path="schedule/new" element={<AdminCreateTrip />} />
                            <Route path="menu" element={<AdminMenu />} />
                        </Route>
                        <Route path="/admin/kitchen/:slotId" element={<KitchenBoard />} />
                    </Route>
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;