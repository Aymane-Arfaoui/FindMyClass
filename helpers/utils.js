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
    return new Date(dateString).toLocaleDateString("en-CA");
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