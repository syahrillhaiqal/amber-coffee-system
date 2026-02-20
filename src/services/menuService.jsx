import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Get all menu items from Firestore
export const getAllMenuItems = async () => {
    try {
        const snapshot = await getDocs(collection(db, "menu_items"));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching all menu items:", error);
        throw error;
    }
};

// Get menu items by specific IDs
export const getMenuItemsByIds = async (ids, onlyAvailable = false) => {
    try {
        if (!ids || ids.length === 0) return [];

        const snapshot = await getDocs(collection(db, "menu_items"));
        let items = snapshot.docs
            .filter(doc => ids.includes(doc.id))
            .map(doc => ({ id: doc.id, ...doc.data() }));

        if (onlyAvailable) {
            items = items.filter(item => item.isAvailable !== false);
        }

        return items;
    } catch (error) {
        console.error("Error fetching menu items by IDs:", error);
        throw error;
    }
};

// Get a single menu item by ID
export const getMenuItemById = async (id) => {
    try {
        const docSnap = await getDoc(doc(db, "menu_items", id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching menu item:", error);
        throw error;
    }
};


// Get menu items by category
export const getMenuItemsByCategory = async (category) => {
    try {
        const snapshot = await getDocs(collection(db, "menu_items"));
        return snapshot.docs
            .filter(doc => doc.data().category === category)
            .map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching menu by category:", error);
        throw error;
    }
};

// Get recommended menu items
export const getRecommendedItems = async () => {
    try {
        const snapshot = await getDocs(collection(db, "menu_items"));
        return snapshot.docs
            .filter(doc => doc.data().isRecommended === true)
            .map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching recommended items:", error);
        throw error;
    }
};