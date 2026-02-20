const PACKAGES = {
    basic: { price: 1.0 },
    premium: { price: 2.0 },
};

export const calcTotals = (cart) => {
    
    // Calculate each item inside array with total formula
    const subTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalCups = cart.reduce((sum, item) => sum + item.quantity, 0);

    const protectionFee = cart.reduce((sum, item) => {
        const type = item.protection || "basic";
        return sum + PACKAGES[type].price * item.quantity;
    }, 0);

    const deliveryFee = totalCups > 1 ? 0 : 1.0;

    const finalTotal = subTotal + protectionFee + deliveryFee;

    return { subTotal, protectionFee, deliveryFee, finalTotal, totalCups };
}

// 1. NR Logic: RM3.00 Base, Free if 5+ cups
// 2. Standard Logic: RM1.00 Base, Free if >1 cup
export const calcDeliveryFee = (pickupPoint, totalCups) => {

    if (pickupPoint === "NR") return totalCups >= 5 ? 0 : 3.0;

    return totalCups > 1 ? 0 : 1.0;
}