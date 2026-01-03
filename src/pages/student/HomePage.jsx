import { Link } from "react-router-dom";
import mainPage from "../../assets/mainpage.jpeg";
import { analytics } from "../../lib/firebase";
import { logEvent } from "firebase/analytics";

export default function HomePage() {
    const handleOrderClick = () => {
        logEvent(analytics, "click_lets_order", {
            component: "HomePage",
            button_name: "lets_order_now",
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 text-center bg-secondary">
            <div className="w-full max-w-md space-y-6">
                <img
                    src={mainPage}
                    alt="Coffee"
                    className="w-full h-64 object-cover rounded-2xl shadow-lg rotate-1"
                />

                <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    Fuel Your Study{" "}
                    <span className="text-primary">Session</span>
                </h1>

                <p className="text-gray-600 text-lg">
                    Welcome to Amber Coffee! We deliver fresh brews directly to
                    you with love. Skip the walk, keep the focus.
                </p>

                <Link
                    to="/trip"
                    onClick={handleOrderClick}
                    className="block w-full py-4 bg-primary text-white text-lg font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                >
                    Let's Order Now
                </Link>
            </div>
        </div>
    );
}
