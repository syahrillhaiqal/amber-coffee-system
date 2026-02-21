export const countOrderCups = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
}

export const getFilledCups = (orders, slotId) => {
    return orders
        .filter(
            (o) => 
                o.slotId === slotId &&
                o.status !== "CANCELLED" &&
                o.status !== "PENDING_PAYMENT"
        )
        .reduce((sum, o) => sum + countOrderCups(o), 0)
}

export const getRemainingCups = (trip) => {
    if (trip?.type === "pickup") return Number.POSITIVE_INFINITY;
    if (typeof trip?.maxCapacity !== "number") return 0;
    return Math.max(0, trip.maxCapacity - trip.filledCups);
}

export const getTripStatus = (trip, now = new Date()) => {

    const open = new Date(trip.openTime);
    const close = new Date(trip.cutoffTime);
    const hasCapacityLimit = trip?.type !== "pickup" && typeof trip?.maxCapacity === "number";
    const isFull = hasCapacityLimit && trip.filledCups >= trip.maxCapacity;

    if (isFull) return { text: "FULL", color: "bg-red-100 text-red-600", active: false };
    if (now >= close) return { text: "Closed", color: "bg-stone-200 text-stone-500", active: false };
    if (now < open) return { text: "Opens Soon", color: "bg-blue-100 text-blue-600", active: false };

    return { text: "Open Now", color: "bg-green-100 text-green-700", active: true };
}