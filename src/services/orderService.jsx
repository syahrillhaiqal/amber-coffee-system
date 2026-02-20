import { collection, getDocs, doc, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

// Subscribe to orders by slot ID (real-time)
export const subscribeToOrdersBySlot = (slotId, callback, errorCallback) => {
    try {
        const q = query(
            collection(db, "orders"),
            where("slotId", "==", slotId)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            callback(orders);
        }, (error) => {
            console.error("Error subscribing to orders by slot:", error);
            if (errorCallback) errorCallback(error);
        });
        return unsubscribe;
    } catch (error) {
        console.error("Error in subscribeToOrdersBySlot:", error);
        throw error;
    }
};

// Subscribe to all orders (real-time)
export const subscribeToAllOrders = (callback, errorCallback) => {
    try {
        const unsubscribe = onSnapshot(
            collection(db, "orders"),
            (snapshot) => {
                const orders = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                callback(orders);
            },
            (error) => {
                console.error("Error subscribing to all orders:", error);
                if (errorCallback) errorCallback(error);
            }
        );
        return unsubscribe;
    } catch (error) {
        console.error("Error in subscribeToAllOrders:", error);
        throw error;
    }
};

// Get orders by slot ID (one-time fetch)
export const getOrdersBySlotId = async (slotId) => {
    try {
        const q = query(
            collection(db, "orders"),
            where("slotId", "==", slotId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching orders by slot:", error);
        throw error;
    }
};

// Get orders by order ID (find single order)
export const getOrderByOrderId = async (orderId) => {
    try {
        const q = query(
            collection(db, "orders"),
            where("orderId", "==", orderId)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error("Error fetching order by orderId:", error);
        throw error;
    }
};

// Get all paid orders for today
export const getTodayPaidOrders = async (todayStr) => {
    try {
        const snapshot = await getDocs(collection(db, "orders"));
        return snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(data => {
                if (data.paymentStatus === "PAID") {
                    const orderDate = data.createdAt?.split("T")[0];
                    return orderDate === todayStr;
                }
                return false;
            });
    } catch (error) {
        console.error("Error fetching today paid orders:", error);
        throw error;
    }
};

// Create a new order
export const createOrder = async (orderPayload) => {
    try {
        const docRef = await addDoc(collection(db, "orders"), orderPayload);
        return { id: docRef.id, ...orderPayload };
    } catch (error) {
        console.error("Error creating order:", error);
        throw error;
    }
};

// Update order status
export const updateOrderStatus = async (orderId, newStatus) => {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

// Update order with payment info
export const updateOrderPayment = async (orderId, paymentData) => {
    try {
        await updateDoc(doc(db, "orders", orderId), paymentData);
    } catch (error) {
        console.error("Error updating order payment:", error);
        throw error;
    }
};

// Delete an order
export const deleteOrder = async (orderId) => {
    try {
        await deleteDoc(doc(db, "orders", orderId));
    } catch (error) {
        console.error("Error deleting order:", error);
        throw error;
    }
};

// Batch update order statuses
export const batchUpdateOrderStatuses = async (orders, newStatus) => {
    try {
        const batch = writeBatch(db);
        orders.forEach((order) => {
            const ref = doc(db, "orders", order.id);
            batch.update(ref, { status: newStatus });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error batch updating orders:", error);
        throw error;
    }
};

// Get filled cups count for a slot
export const getFilledCupsForSlot = async (slotId) => {
    try {
        const orders = await getOrdersBySlotId(slotId);
        let totalCups = 0;
        orders.forEach(order => {
            if (order.status !== "CANCELLED" && order.status !== "PENDING_PAYMENT") {
                const orderCups = order.items.reduce((sum, item) => sum + item.quantity, 0);
                totalCups += orderCups;
            }
        });
        return totalCups;
    } catch (error) {
        console.error("Error calculating filled cups:", error);
        throw error;
    }
};

// Get orders by status
export const getOrdersByStatus = async (status) => {
    try {
        const q = query(
            collection(db, "orders"),
            where("status", "==", status)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        console.error("Error fetching orders by status:", error);
        throw error;
    }
};

// Get orders grouped by location (for delivery)
export const getOrdersGroupedByLocation = async (status = "READY") => {
    try {
        const orders = await getOrdersByStatus(status);
        const grouped = {};
        orders.forEach(order => {
            const location = order.pickupPoint || "Unknown";
            if (!grouped[location]) grouped[location] = [];
            grouped[location].push(order);
        });
        return grouped;
    } catch (error) {
        console.error("Error grouping orders by location:", error);
        throw error;
    }
};