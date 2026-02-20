const TIME_ZONE = "Asia/Kuala_Lumpur";

export const getTodayString = () => {
    return new Date().toLocaleDateString("en-CA", {timeZone: TIME_ZONE})
}

export const formatDisplayDate = (date = new Date()) => {
    return new Date(date).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: TIME_ZONE,
    })
}

export const combineDateTime = (dateStr, timeStr) => {
    return `${dateStr}T${timeStr}`
}

export const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}