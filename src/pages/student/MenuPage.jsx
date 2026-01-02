import { useState, useEffect, useRef } from "react";
import {
    Search,
    ShoppingBag,
    Star,
    Flame,
    Loader2,
    X,
    Gift,
    ArrowRight,
} from "lucide-react";
import ProductModal from "../../components/ProductModal";
import CartDrawer from "../../components/CartDrawer";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import logo from "../../assets/amber-coffee-logo-only.png";

export default function MenuPage({
    addToCart,
    removeFromCart,
    cart,
    updateCartItemProtection,
}) {
    const location = useLocation();
    const navigate = useNavigate();

    const [tripInfo, setTripInfo] = useState(() => {
        return (
            location.state || JSON.parse(sessionStorage.getItem("currentTrip"))
        );
    });

    const tabsRef = useRef(null);

    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Recommended");

    // NEW: Modal State
    const [showUpsellModal, setShowUpsellModal] = useState(false);

    // Fetch Menu
    useEffect(() => {
        if (!tripInfo) {
            navigate("/trip");
            return;
        }

        const fetchMenu = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, "menu_items"));
                const data = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                const allowedIds = tripInfo?.selectedMenuIds || [];

                const available = data.filter(
                    (item) => allowedIds.includes(item.id) && item.isAvailable
                );
                setAllItems(available);
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMenu();
    }, [tripInfo, navigate]);

    // Grouping Logic
    const categories = [
        "Recommended",
        "Coffee",
        "Matcha",
        "Chocolate",
        "Refresher",
        "Pastry",
        "Food",
    ];

    const getGroupedItems = () => {
        let filtered = allItems.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const grouped = {};
        grouped["Recommended"] = filtered.filter((item) => item.isRecommended);
        categories.forEach((cat) => {
            if (cat !== "Recommended") {
                grouped[cat] = filtered.filter((item) => item.category === cat);
            }
        });
        return grouped;
    };

    const groupedItems = getGroupedItems();

    // Scroll Sync
    useEffect(() => {
        const handleScroll = () => {
            const offsets = categories.map((cat) => {
                const element = document.getElementById(`cat-${cat}`);
                if (!element) return { cat, offset: Infinity };
                return {
                    cat,
                    offset: Math.abs(element.getBoundingClientRect().top - 150),
                };
            });

            offsets.sort((a, b) => a.offset - b.offset);

            if (offsets[0]?.offset < 300) {
                setActiveCategory(offsets[0].cat);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [categories]);

    // Auto Scroll Tabs
    useEffect(() => {
        if (activeCategory && tabsRef.current) {
            const activeTab = document.getElementById(`tab-${activeCategory}`);
            if (activeTab) {
                activeTab.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                });
            }
        }
    }, [activeCategory]);

    const scrollToCategory = (cat) => {
        setActiveCategory(cat);
        const element = document.getElementById(`cat-${cat}`);
        if (element) {
            const y =
                element.getBoundingClientRect().top + window.scrollY - 140;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    if (loading) {
        return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-2">
                        <img
                            src={logo}
                            alt="Logo"
                            className="h-14 w-auto mb-2"
                        />
                        <div className="flex items-center gap-2 font-medium">
                            <Loader2 className="animate-spin w-5 h-5 text-primary" />
                            <span>Loading...</span>
                        </div>
                    </div>
        );
    }

    const currentCups = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleAddToCartWrapper = (item, qty, remark) => {
        addToCart(item, qty, remark);

        // UPSELL LOGIC: If total becomes 1, show modal
        if (currentCups === 0 && qty === 1) {
            setShowUpsellModal(true);
        }
    };

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-10 bg-stone-100 pb-2 shadow-sm">
                <div className="px-4 pt-4 max-w-md mx-auto">
                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <Search
                            className="absolute left-3 top-2.5 text-gray-400"
                            size={18}
                        />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            className="w-full pl-10 pr-10 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 bg-white"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* Horizontal Categories */}
                    <div
                        ref={tabsRef}
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                        {categories.map((cat) => {
                            if (groupedItems[cat]?.length === 0) return null;
                            return (
                                <button
                                    key={cat}
                                    id={`tab-${cat}`}
                                    onClick={() => scrollToCategory(cat)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                                        activeCategory === cat
                                            ? "bg-primary text-white shadow-md shadow-orange-200"
                                            : "bg-white text-gray-500 border border-gray-200"
                                    }`}
                                >
                                    {cat === "Recommended" && (
                                        <Star
                                            size={12}
                                            className="inline mr-1 mb-0.5"
                                            fill="currentColor"
                                        />
                                    )}
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Menu List */}
            <div className="px-4 max-w-md mx-auto space-y-8 mt-4">
                {allItems.length === 0 ? (
                    <div className="text-center py-20 text-stone-400">
                        <ShoppingBag
                            size={48}
                            className="mx-auto mb-4 opacity-20"
                        />
                        <p>No items available for this trip.</p>
                        <Link
                            to="/trip"
                            className="text-primary text-sm font-bold mt-2 inline-block"
                        >
                            Change Trip
                        </Link>
                    </div>
                ) : (
                    categories.map((cat) => {
                        const items = groupedItems[cat];
                        if (!items || items.length === 0) return null;

                        return (
                            <div
                                key={cat}
                                id={`cat-${cat}`}
                                className="scroll-mt-40"
                            >
                                <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                                    {cat === "Recommended" ? (
                                        <Flame
                                            className="text-orange-500"
                                            size={20}
                                        />
                                    ) : null}
                                    {cat}
                                </h3>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() =>
                                                setSelectedItem(item)
                                            }
                                            className="flex bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-24 h-24 object-cover rounded-xl bg-gray-100"
                                            />

                                            {/* FIX: Added 'min-w-0' here. This stops the text overflow. */}
                                            <div className="ml-4 flex-1 min-w-0 flex flex-col justify-between py-1">
                                                <div>
                                                    {/* Added 'truncate' to cut off very long titles with '...' */}
                                                    {/* OR remove 'truncate' if you want it to wrap to the next line */}
                                                    <p className="text-sm font-bold text-gray-900">
                                                        {item.name}
                                                    </p>

                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                                                        {item.desc}
                                                    </p>
                                                </div>
                                                <div className="flex justify-end">
                                                    <span className="font-bold text-primary bg-orange-50 px-2 py-1 rounded-lg text-sm">
                                                        RM{" "}
                                                        {item.price.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Floating Cart */}
            {cart.length > 0 && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="fixed bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-xl shadow-orange-300 flex items-center gap-2 z-40 animate-bounce"
                >
                    <ShoppingBag size={24} />
                    <span className="font-bold">{cart.length}</span>
                </button>
            )}

            {selectedItem && (
                <ProductModal
                    item={selectedItem}
                    close={() => setSelectedItem(null)}
                    add={handleAddToCartWrapper}
                    currentCartTotal={currentCups}
                />
            )}

            {isCartOpen && (
                <CartDrawer
                    cart={cart}
                    close={() => setIsCartOpen(false)}
                    removeFromCart={removeFromCart}
                    tripInfo={tripInfo}
                    updateCartItemProtection={updateCartItemProtection}
                />
            )}

            {/* --- NEW: UPSELL POPUP MODAL --- */}
            {showUpsellModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up text-center relative overflow-hidden">
                        {/* Decorative background circle */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-green-100 rounded-full opacity-50"></div>

                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
                            <Gift size={32} />
                        </div>

                        <h2 className="text-xl font-black text-gray-900 mb-2">
                            Wait! Don't miss out.
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                            You currently have <b>1 item</b> in your cart.{" "}
                            <br />
                            <span className="text-green-600 font-bold">
                                Add 1 more to get FREE Delivery!
                            </span>
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={() => setShowUpsellModal(false)}
                                className="w-full bg-green-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                            >
                                <ShoppingBag size={18} /> Add More Items
                            </button>
                            <button
                                onClick={() => {
                                    setShowUpsellModal(false);
                                    setIsCartOpen(true); // Open cart if they ignore offer
                                }}
                                className="w-full text-gray-400 font-bold text-sm py-2 hover:text-gray-600"
                            >
                                No thanks, continue to payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
