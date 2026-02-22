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

export const formatDisplayDateShort = (date = new Date()) => {
    return new Date(date).toLocaleDateString("en-GB", {
        day: '2-digit', 
        month: 'short', 
        year: 'numeric'
    })
}

export const combineDateTime = (dateStr, timeStr) => {
    const minutes = parseTimeToMinutes(timeStr);

    if (minutes === null) {
        return `${dateStr}T${timeStr}`;
    }

    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    return `${dateStr}T${hh}:${mm}`;
}

export const formatTime = (iso) => {
    if (!iso) return "";

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-US", {
        timeZone: TIME_ZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    }).format(date);
}

export const parseTimeToMinutes = (timeValue) => {
    if (!timeValue) return null;

    const value = String(timeValue).trim();
    if (!value) return null;

    if (value.includes("T")) {
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.getHours() * 60 + date.getMinutes();
        }
    }

    const match = value.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const meridiem = match[3]?.toUpperCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) {
        return null;
    }

    if (meridiem) {
        if (hours < 1 || hours > 12) return null;
        if (hours === 12) hours = 0;
        if (meridiem === "PM") hours += 12;
    } else if (hours < 0 || hours > 23) {
        return null;
    }

    return hours * 60 + minutes;
}

export const buildTimeOptions = (openTimeValue, cutoffTimeValue, stepMinutes = 5) => {
    if (!openTimeValue || !cutoffTimeValue) return [];

    const start = parseTimeToMinutes(openTimeValue);
    const end = parseTimeToMinutes(cutoffTimeValue);
    if (start === null || end === null || end < start) return [];

    const to12HourLabel = (totalMinutes) => {
        const hours24 = Math.floor(totalMinutes / 60);
        const minutes = String(totalMinutes % 60).padStart(2, "0");
        const period = hours24 >= 12 ? "PM" : "AM";
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        return `${hours12}:${minutes} ${period}`;
    };

    const options = [];
    for (let value = start; value <= end; value += stepMinutes) {
        options.push(to12HourLabel(value));
    }

    const cutoffLabel = to12HourLabel(end);
    if (!options.includes(cutoffLabel)) {
        options.push(cutoffLabel);
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

export const getPickupTimeMinutes = (timeValue) => {
    if (!timeValue) return null;

    const asDate = new Date(timeValue);
    if (!Number.isNaN(asDate.getTime())) {
        return asDate.getHours() * 60 + asDate.getMinutes();
    }

    const parsed = parseTimeToMinutes(timeValue);
    if (parsed !== null) return parsed;

    const text = String(timeValue).trim();
    const dottedMatch = text.match(/^(\d{1,2})[:.](\d{2})\s*([AaPp][Mm])?$/);
    if (!dottedMatch) return null;

    let hours = Number(dottedMatch[1]);
    const minutes = Number(dottedMatch[2]);
    const meridiem = dottedMatch[3]?.toUpperCase();

    if (Number.isNaN(hours) || Number.isNaN(minutes) || minutes < 0 || minutes > 59) return null;

    if (meridiem) {
        if (hours < 1 || hours > 12) return null;
        if (hours === 12) hours = 0;
        if (meridiem === "PM") hours += 12;
    } else if (hours < 0 || hours > 23) {
        return null;
    }

    return hours * 60 + minutes;
}