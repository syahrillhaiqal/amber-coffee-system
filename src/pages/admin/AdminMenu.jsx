import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, Loader2, X, CheckSquare, Square } from "lucide-react";
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { DEFAULT_MENU_CATEGORY, MENU_CATEGORIES } from "../../lib/categories";
import { getAllMenuItems } from "../../services/menuService";

export default function AdminMenu() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        desc: "",
        category: DEFAULT_MENU_CATEGORY,
        isRecommended: false,
        image: null,
    });

    // Fetch menu items
    const fetchMenu = async () => {
        setLoading(true);

        try {
            const menuList = await getAllMenuItems();
            setItems(menuList);
        } catch (error) {
            console.error("Error fetching menu:", error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert(
                    "File too large! Please upload an image smaller than 2MB."
                );
                e.target.value = "";
                return;
            }

            setFormData({ ...formData, image: file });
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price) {
            return alert("Name and Price are required");
        }

        setUploading(true);
        try {
            let imageUrl = previewUrl; // Default to existing URL if editing

            // If there is a NEW file, upload it
            if (formData.image instanceof File) {
                const imageRef = ref(
                    storage,
                    `menu/${Date.now()}_${formData.image.name}`
                );
                await uploadBytes(imageRef, formData.image);
                imageUrl = await getDownloadURL(imageRef);
            }

            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                desc: formData.desc,
                category: formData.category,
                isRecommended: formData.isRecommended,
                image: imageUrl,
                isAvailable: true,
            };

            if (editingId) {
                // Update Existing
                await updateDoc(doc(db, "menu_items", editingId), payload);
            } else {
                // Create New
                await addDoc(collection(db, "menu_items"), payload);
            }

            setIsModalOpen(false);
            resetForm();
            fetchMenu(); // Refresh list
        } catch (error) {
            console.error("Error saving menu:", error);
            alert("Failed to save menu item.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm("Are you sure you want to delete this item permanently?")) {
            await deleteDoc(doc(db, "menu_items", id));
            fetchMenu();
        }
    };

    const openEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            price: item.price,
            desc: item.desc,
            category: item.category || DEFAULT_MENU_CATEGORY,
            isRecommended: item.isRecommended || false,
            image: null,
        });
        setPreviewUrl(item.image);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: "",
            price: "",
            desc: "",
            category: DEFAULT_MENU_CATEGORY,
            isRecommended: false,
            image: null,
        });
        setPreviewUrl("");
    };

    useEffect(() => {
        fetchMenu();
    }, []);

    return (
        <div className="space-y-6">
            {/* Header & Count */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Menu Items
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {items.length} items available on menu
                    </p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setIsModalOpen(true);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-orange-200 active:scale-95 transition-transform"
                >
                    <Plus size={18} /> Add New
                </button>
            </div>

            {/* Grid */}
            {loading ? (
                <p>Loading menu...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex gap-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all active:scale-[0.98]"
                            onClick={() => openEdit(item)}
                        >
                            {item.image ? (
                            <img
                                src={item.image}
                                className="w-24 h-24 rounded-xl object-cover bg-gray-100"
                                alt={item.name}
                            />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400">
                                    <ImageIcon size={24} />
                                </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                    <h3 className="font-bold text-gray-900">
                                        {item.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 line-clamp-1">
                                        {item.desc}
                                    </p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-primary">
                                        RM {item.price.toFixed(2)}
                                    </span>
                                    <div className="flex gap-2">
                                        <div className="p-2 bg-gray-50 rounded-lg text-gray-600">
                                            <Edit2 size={16} />
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(item.id);
                                            }}
                                            className="p-2 bg-red-50 rounded-lg text-red-500 hover:bg-red-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between">
                            <h3 className="text-xl font-bold">
                                {editingId ? "Edit Item" : "Add New Item"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)}>
                                <X />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {/* Image Upload */}
                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden h-40 group hover:border-primary transition-colors">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                ) : (
                                    <>
                                        <ImageIcon size={32} />
                                        <span className="text-xs mt-2 font-medium">
                                            Click to Upload Image
                                        </span>
                                        <span className="text-[10px] text-orange-500 mt-1 bg-orange-50 px-2 py-0.5 rounded-full">
                                            Max size: 2MB
                                        </span>
                                    </>
                                )}

                                <input
                                    type="file"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                            </div>

                            <input
                                placeholder="Item Name"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                            />

                            <div className="relative">
                                <span className="absolute left-3 top-3 text-gray-400">
                                    RM
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={formData.price}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            price: e.target.value,
                                        })
                                    }
                                    className="w-full pl-10 p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                                    Category
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            category: e.target.value,
                                        })
                                    }
                                    className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                                >
                                    {MENU_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                onClick={() =>
                                    setFormData({
                                        ...formData,
                                        isRecommended: !formData.isRecommended,
                                    })
                                }
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100"
                            >
                                {formData.isRecommended ? (
                                    <CheckSquare className="text-primary" />
                                ) : (
                                    <Square className="text-gray-400" />
                                )}
                                <span className="font-bold text-gray-700">
                                    Set as Recommended
                                </span>
                            </div>

                            <textarea
                                placeholder="Description"
                                value={formData.desc}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        desc: e.target.value,
                                    })
                                }
                                className="w-full p-3 bg-gray-50 rounded-xl border focus:border-primary outline-none"
                                rows="2"
                            />
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={uploading}
                            className="w-full py-3 bg-primary text-white rounded-xl font-bold flex justify-center items-center gap-2"
                        >
                            {uploading && (
                                <Loader2 className="animate-spin" size={18} />
                            )}
                            {uploading ? "Saving..." : "Save Item"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
