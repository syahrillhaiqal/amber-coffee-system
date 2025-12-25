import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Loader2, Coffee } from 'lucide-react';
import logo from "../assets/amber-coffee-logo-only.png";

export default function RequireAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center animate-pulse">
                    <img src={logo} alt="Logo" className="h-14 w-auto" />
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Loader2 className="animate-spin w-5 h-5 text-primary" />
                        <span>Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}