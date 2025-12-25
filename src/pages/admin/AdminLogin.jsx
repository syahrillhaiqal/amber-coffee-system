import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function AdminLogin() {
    const navigate = useNavigate();

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // UI State
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const adminEmailsString = import.meta.env.VITE_ADMIN_EMAILS || "";
    const ALLOWED_EMAILS = adminEmailsString.split(",").map(e => e.trim());

    // Check if already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if (ALLOWED_EMAILS.includes(user.email)) {
                    navigate("/admin/dashboard", { replace: true });
                } else {
                    setError("Access Denied: Account not authorized.");
                    setIsChecking(false);
                }
            } else {
                setIsChecking(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]); // You can remove ALLOWED_EMAILS from dependency since it's constant

    // Handle Login Submission
    const handleLogin = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // Check if this user is actually allowed
            if (ALLOWED_EMAILS.includes(user.email)) {
                navigate("/admin/dashboard", { replace: true });
            } else {
                setError("Access Denied: You are not an Admin.");
                // Vital: Logout immediately if they are not admin
                auth.signOut();
            }
        } catch (err) {
            console.error("Login Error:", err.code);
            if (err.code === "auth/invalid-credential") {
                setError("Wrong email or password.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many failed attempts. Try again later.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW ---
    if (isChecking) {
        return (
            <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-primary">
                        <Coffee size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Admin Portal
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Please login to continue
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle size={16} className="shrink-0" />
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-3 text-gray-400"
                                size={20}
                            />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                                placeholder="admin@gmail.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-3 text-gray-400"
                                size={20}
                            />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-base"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? "Verifying..." : "Login to Dashboard"}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-xs text-gray-400">
                        Forgot password? Contact system owner.
                    </p>
                </div>
            </div>
        </div>
    );
}
