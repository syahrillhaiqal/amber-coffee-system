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

export const toTimeInput = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

export const parseTimeToMinutes = (timeValue) => {
    if (!timeValue || !timeValue.includes(":")) return null;
    const [hours, minutes] = timeValue.split(":").map(Number);
    return hours * 60 + minutes;
}

export const buildTimeOptions = (openTimeValue, cutoffTimeValue, stepMinutes = 15) => {
    if (!openTimeValue || !cutoffTimeValue) return [];

    const start = parseTimeToMinutes(openTimeValue);
    const end = parseTimeToMinutes(cutoffTimeValue);
    if (start === null || end === null || end < start) return [];

    const options = [];
    for (let value = start; value <= end; value += stepMinutes) {
        const hh = String(Math.floor(value / 60)).padStart(2, "0");
        const mm = String(value % 60).padStart(2, "0");
        options.push(`${hh}:${mm}`);
    }

    if (!options.includes(cutoffTimeValue)) {
        options.push(cutoffTimeValue);
    }

    return options;
}

export const getCurrentTimeMinutes = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(new Date());

    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
}