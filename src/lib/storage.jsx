/* HANDLE TRIP STORAGE */
const TRIP_KEY = "currentTrip";

export const saveCurrentTrip = (trip) => {
    return sessionStorage.setItem(TRIP_KEY, JSON.stringify(trip));
};

export const loadCurrentTrip = () => {
    const raw = sessionStorage.getItem(TRIP_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const clearCurrentTrip = () => {
    return sessionStorage.removeItem(TRIP_KEY);
};

/* HANDLE CART STORAGE */
const CART_KEY = "Cart";

export const saveCurrentCart = (cart) => {
    return sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
};

export const loadCurrentCart = () => {
    const raw = sessionStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
};

export const clearCurrentCart = () => {
    return sessionStorage.removeItem(CART_KEY);
};