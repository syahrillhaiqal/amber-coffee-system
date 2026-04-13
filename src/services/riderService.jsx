import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const RIDER_COLLECTION = "riders";

const sortByName = (rows) => {
    return [...rows].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
    );
};

export const subscribeToRiders = (callback, errorCallback) => {
    try {
        const unsubscribe = onSnapshot(
            collection(db, RIDER_COLLECTION),
            (snapshot) => {
                const riders = snapshot.docs.map((docSnap) => ({
                    id: docSnap.id,
                    ...docSnap.data(),
                }));
                callback(sortByName(riders));
            },
            (error) => {
                console.error("Error subscribing riders:", error);
                if (errorCallback) errorCallback(error);
            }
        );

        return unsubscribe;
    } catch (error) {
        console.error("Error in subscribeToRiders:", error);
        throw error;
    }
};

export const subscribeToActiveRiders = (callback, errorCallback) => {
    return subscribeToRiders(
        (riders) => callback(riders.filter((rider) => rider.active !== false)),
        errorCallback
    );
};

export const getActiveRiders = async () => {
    try {
        const snapshot = await getDocs(collection(db, RIDER_COLLECTION));
        const riders = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        }));

        return sortByName(riders.filter((rider) => rider.active !== false));
    } catch (error) {
        console.error("Error fetching active riders:", error);
        throw error;
    }
};

export const createRider = async (payload) => {
    try {
        const now = new Date().toISOString();

        const riderPayload = {
            name: (payload.name || "").trim(),
            phone: (payload.phone || "").trim(),
            active: payload.active !== false,
            createdAt: now,
            updatedAt: now,
        };

        const riderRef = await addDoc(
            collection(db, RIDER_COLLECTION),
            riderPayload
        );
        return riderRef.id;
    } catch (error) {
        console.error("Error creating rider:", error);
        throw error;
    }
};

export const updateRider = async (riderId, payload) => {
    try {
        await updateDoc(doc(db, RIDER_COLLECTION, riderId), {
            name: (payload.name || "").trim(),
            phone: (payload.phone || "").trim(),
            active: payload.active !== false,
            updatedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Error updating rider:", error);
        throw error;
    }
};

export const deleteRider = async (riderId) => {
    try {
        await deleteDoc(doc(db, RIDER_COLLECTION, riderId));
    } catch (error) {
        console.error("Error deleting rider:", error);
        throw error;
    }
};