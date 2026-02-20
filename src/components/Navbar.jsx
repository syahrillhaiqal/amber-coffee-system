import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Phone, X } from "lucide-react"; // Icons
import logo from "../assets/amber-coffee-logo1.png";

export default function Navbar() {
    const [isContactOpen, setIsContactOpen] = useState(false);

    return (
        <>
            <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-orange-100 h-16">
                <div className="flex items-center justify-between px-4 h-full relative">
                    
                    {/* Logo Section */}
                    <Link to="/" className="h-full py-2">
                        <img
                            src={logo}
                            alt="Amber Coffee"
                            className="h-full w-auto object-contain"
                        />
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
                        <Link to="/" className="hover:text-primary transition-colors">
                            Home
                        </Link>
                        <Link to="/menu" className="hover:text-primary transition-colors">
                            Order
                        </Link>
                        
                        {/* Contact Dropdown Trigger */}
                        <button 
                            onClick={() => setIsContactOpen(!isContactOpen)}
                            className={`flex items-center gap-1 transition-colors ${isContactOpen ? 'text-primary font-bold' : 'hover:text-primary'}`}
                        >
                            Contact
                        </button>
                    </div>
                </div>
            </nav>

            {/* --- CONTACT DROPDOWN (Floating) --- */}
            {isContactOpen && (
                <>
                    {/* Invisible backdrop to close when clicking outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsContactOpen(false)}></div>

                    <div className="fixed top-16 right-4 z-50 w-72 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 animate-scale-in origin-top-right">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-stone-100">
                            <h3 className="font-bold text-stone-800">Contact Us</h3>
                            <button onClick={() => setIsContactOpen(false)} className="text-stone-400 hover:text-stone-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <a 
                                href="https://wa.me/601164971911" 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-green-50 transition-colors group"
                            >
                                <div className="bg-white p-2 rounded-full shadow-sm text-stone-600 group-hover:text-green-600">
                                    <TruckIcon /> 
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase">Delivery Issues</p>
                                    <p className="font-bold text-stone-800 text-sm">Amber Runner</p>
                                    <p className="text-xs text-stone-500">+60 11-6497 1911</p>
                                </div>
                            </a>

                            <a 
                                href="https://wa.me/60108443312" 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-orange-50 transition-colors group"
                            >
                                <div className="bg-white p-2 rounded-full shadow-sm text-stone-600 group-hover:text-primary">
                                    <MessageCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase">General Enquiries</p>
                                    <p className="font-bold text-stone-800 text-sm">Amber Coffee Admin</p>
                                    <p className="text-xs text-stone-500">+60 10-844 3312</p>
                                </div>
                            </a>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

function TruckIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17h4V5H2v12h3" />
            <path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5" />
            <path d="M14 17h1" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}