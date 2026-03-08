import { collection, getDocs, getDoc, doc, query, where, onSnapshot, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// Subscribe to delivery slots by date (real-time)
export const subscribeToSlotsByDate = (dateStr, callback, errorCallback) => {
    try {
        const q = query(
            collection(db, "delivery_slots"),
            where("dateString", "==", dateStr)
        );
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const slots = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                callback(slots);
            },
            (error) => {
                console.error("Error subscribing to slots:", error);
                if (errorCallback) errorCallback(error);
            }
        );
        return unsubscribe;
    } catch (error) {
        console.error("Error in subscribeToSlotsByDate:", error);
        throw error;
    }
};

// Subscribe to all delivery slots (real-time)
export const subscribeToAllSlots = (callback, errorCallback) => {
    try {
        const unsubscribe = onSnapshot(
            collection(db, "delivery_slots"),
            (snapshot) => {
                const slots = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                callback(slots);
            },
            (error) => {
                console.error("Error subscribing to all slots:", error);
                if (errorCallback) errorCallback(error);
            }
        );
        return unsubscribe;
    } catch (error) {
        console.error("Error in subscribeToAllSlots:", error);
        throw error;
    }
};

// Get all delivery slots (one-time fetch)
export const getAllSlots = async () => {
    try {
        const snapshot = await getDocs(collection(db, "delivery_slots"));
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching all slots:", error);
        throw error;
    }
};

// Get delivery slots by date
export const getSlotsByDate = async (dateStr) => {
    try {
        const q = query(
            collection(db, "delivery_slots"),
            where("dateString", "==", dateStr)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching slots by date:", error);
        throw error;
    }
};

// Get a single slot by ID
export const getSlotById = async (slotId) => {
    try {
        const docSnap = await getDoc(doc(db, "delivery_slots", slotId));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error("Error fetching slot by ID:", error);
        throw error;
    }
};

// Create a new delivery slot
export const createSlot = async (slotData) => {
    try {
        const docRef = await addDoc(collection(db, "delivery_slots"), slotData);
        return { id: docRef.id, ...slotData };
    } catch (error) {
        console.error("Error creating slot:", error);
        throw error;
    }
};

// Delete a delivery slot
export const deleteSlot = async (slotId) => {
    try {
        await deleteDoc(doc(db, "delivery_slots", slotId));
    } catch (error) {
        console.error("Error deleting slot:", error);
        throw error;
    }
};

export const updateSlotRider = async (slotId, rider) => {
    try {
        await updateDoc(doc(db, "delivery_slots", slotId), {
            riderId: rider?.id || "",
            riderName: rider?.name || "",
            riderPhone: rider?.phone || "",
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error updating slot rider:", error);
        throw error;
    }
};

// Check if slot is still valid (not passed cutoff)
export const isSlotValid = (slot) => {
    if (!slot) return false;
    const now = new Date();
    const cutoff = new Date(slot.cutoffTime);
    return now < cutoff;
};

// Get slot status
export const getSlotStatus = (slot) => {
    if (!slot) return { label: "INVALID", color: "bg-gray-100 text-gray-700" };

    const toDate = (v) => (v ? new Date(v) : null);

    const now = new Date();
    const open = toDate(slot.openTime);
    const close = toDate(slot.cutoffTime);
    const end = toDate(slot.deliveryTime || slot.cutoffTime); // pickup uses cutoff

    if (now > end) return { label: "ENDED", color: "bg-stone-200 text-stone-500" };
    if (now >= close && now <= end) return { label: "ONGOING", color: "bg-blue-100 text-blue-700" };
    if (now >= open && now < close) return { label: "OPEN", color: "bg-green-100 text-green-700 animate-pulse" };
    return { label: "UPCOMING", color: "bg-yellow-100 text-yellow-700" };
};

export const getSlotType = (slot) => {
    const typeLabel = (slot.type || "delivery").toUpperCase();

    const typeClass =
        typeLabel === "DELIVERY"
            ? "bg-stone-100 text-stone-700 border-stone-300"
            : "bg-primary/10 text-primary border-primary/20";

    return typeClass;
}

// Calculate remaining cups for a slot
export const calculateRemainingCups = (slot, filledCups) => {
    if (!slot) return 0;
    return Math.max(0, slot.maxCapacity - (filledCups || 0));
};

// Validate slot capacity
export const validateSlotCapacity = (slot, cupsNeeded, filledCups) => {
    const remaining = calculateRemainingCups(slot, filledCups);
    return cupsNeeded <= remaining;
};