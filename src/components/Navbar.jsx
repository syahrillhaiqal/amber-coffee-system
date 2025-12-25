import { Link } from "react-router-dom";
import logo from "../assets/amber-coffee-logo1.png";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-orange-100 h-16">
            <div className="flex items-center justify-between px-4 h-full">
                
                {/* Logo Section */}
                <Link to="/" className="h-full">
                    <img
                        src={logo}
                        alt="Amber Coffee"
                        // 3. h-full forces it to touch top and bottom edges
                        className="h-full w-auto object-contain"
                    />
                </Link>

                {/* Simple Text Links */}
                <div className="flex gap-4 text-sm font-medium text-gray-600">
                    <Link to="/" className="hover:text-primary transition-colors">
                        Home
                    </Link>
                    <Link to="/menu" className="hover:text-primary transition-colors">
                        Order
                    </Link>
                </div>
            </div>
        </nav>
    );
}