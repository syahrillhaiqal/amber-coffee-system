import { useState, useEffect, useRef } from "react";
import { Search, ShoppingBag, Clock, Star, Flame, Loader2 } from "lucide-react"; // Added Loader2
import ProductModal from "../../components/ProductModal";
import CartDrawer from "../../components/CartDrawer";
import { useLocation, Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function MenuPage({ addToCart, removeFromCart, cart }) {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Initialize Trip Info
    const [tripInfo, setTripInfo] = useState(() => {
        return location.state || JSON.parse(localStorage.getItem("currentTrip"));
    });

    const tabsRef = useRef(null);

    // State
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true); // NEW: Specific loading state
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Recommended");

    // Fetch Menu
    useEffect(() => {
        // Safety Check: If no trip info, go back to selection
        if (!tripInfo) {
            navigate("/trip");
            return;
        }

        const fetchMenu = async () => {
            setLoading(true); // Start Loading
            try {
                const snapshot = await getDocs(collection(db, "menu_items"));
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                
                const allowedIds = tripInfo?.selectedMenuIds || [];
                
                // Debugging: Check console if list remains empty
                console.log("Allowed IDs:", allowedIds);
                console.log("Fetched Items:", data.length);

                const available = data.filter(item => 
                    allowedIds.includes(item.id) && item.isAvailable
                );
                setAllItems(available);
            } catch (error) {
                console.error("Error fetching menu:", error);
            } finally {
                setLoading(false); // Stop Loading regardless of result
            }
        };
        fetchMenu();
    }, [tripInfo, navigate]);

    // Grouping Logic
    const categories = ["Recommended", "Coffee", "Matcha", "Chocolate", "Refresher", "Pastry", "Food"];
    
    const getGroupedItems = () => {
        let filtered = allItems.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        const grouped = {};
        grouped["Recommended"] = filtered.filter(item => item.isRecommended);
        categories.forEach(cat => {
            if (cat !== "Recommended") {
                grouped[cat] = filtered.filter(item => item.category === cat);
            }
        });
        return grouped;
    };

    const groupedItems = getGroupedItems();

    // --- SCROLL SYNC LOGIC ---
    useEffect(() => {
        const handleScroll = () => {
            const offsets = categories.map(cat => {
                const element = document.getElementById(`cat-${cat}`);
                if (!element) return { cat, offset: Infinity };
                return { cat, offset: Math.abs(element.getBoundingClientRect().top - 150) };
            });

            offsets.sort((a, b) => a.offset - b.offset);
            
            if (offsets[0]?.offset < 300) {
                setActiveCategory(offsets[0].cat);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [categories]); 

    // --- AUTO SCROLL TABS LOGIC (Fix from previous request) ---
    useEffect(() => {
        if (activeCategory && tabsRef.current) {
            const activeTab = document.getElementById(`tab-${activeCategory}`);
            if (activeTab) {
                activeTab.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest', 
                    inline: 'center' 
                });
            }
        }
    }, [activeCategory]);

    const scrollToCategory = (cat) => {
        setActiveCategory(cat);
        const element = document.getElementById(`cat-${cat}`);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 140;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    // --- RENDER ---

    // 1. Show Loading Screen
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-stone-100 text-stone-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Loading menu...</p>
            </div>
        );
    }

    // 2. Show Main Content
    return (
        <div className="pb-24">
            <div className="sticky top-0 z-10 bg-stone-100 pb-2 shadow-sm">
                <div className="px-4 pt-4 max-w-md mx-auto">
                    
                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Horizontal Categories */}
                    <div 
                        ref={tabsRef} 
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
                    >
                        {categories.map(cat => {
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
                                    {cat === "Recommended" && <Star size={12} className="inline mr-1 mb-0.5" fill="currentColor"/>}
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
                    // 3. Show Empty State (Loaded but empty)
                    <div className="text-center py-20 text-stone-400">
                        <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No items available for this trip.</p>
                        <Link to="/trip" className="text-primary text-sm font-bold mt-2 inline-block">Change Trip</Link>
                    </div>
                ) : (
                    categories.map(cat => {
                        const items = groupedItems[cat];
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={cat} id={`cat-${cat}`} className="scroll-mt-40">
                                <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center gap-2">
                                    {cat === "Recommended" ? <Flame className="text-orange-500" size={20} /> : null}
                                    {cat}
                                </h3>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className="flex bg-white p-3 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform cursor-pointer"
                                        >
                                            <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl bg-gray-100" />
                                            <div className="ml-4 flex-1 flex flex-col justify-between py-1">
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{item.name}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{item.desc}</p>
                                                </div>
                                                <div className="flex justify-end">
                                                    <span className="font-bold text-primary bg-orange-50 px-2 py-1 rounded-lg text-sm">RM {item.price.toFixed(2)}</span>
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
                    add={(itemData, qty, remark) => {
                        addToCart(itemData, qty, remark);
                        setSelectedItem(null);
                    }}
                />
            )}

            {isCartOpen && (
                <CartDrawer
                    cart={cart}
                    close={() => setIsCartOpen(false)}
                    removeFromCart={removeFromCart} 
                    tripInfo={tripInfo}
                />
            )}
        </div>
    );
}