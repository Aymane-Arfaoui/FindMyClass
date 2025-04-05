export const getLocalDateString = (dateTime) => {
    if (!dateTime) return "No date";
    const date = new Date(dateTime);
    return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
};

export const getLocalDate = () => {
    return new Date().toLocaleDateString("en-CA");
};

export const formatDateToLocalDate = (dateString) => {
    if (!dateString) return null;
    // If the input is already in "YYYY-MM-DD" format, return it as-is
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    // Create a new Date object with the same year, month, and day to avoid timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const formatDateForHeader = (dateString) => {
    return new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }).format(new Date(dateString + "T00:00:00"));
};

export const formatTime = (dateTime) => {
    if (!dateTime) return "All day";
    return new Date(dateTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};