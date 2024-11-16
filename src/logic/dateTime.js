export const unixToLocal = (unix) => {
    // Convert to milliseconds
    const date = new Date(unix * 1000);

    // Convert to local time string
    const localTime = date.toLocaleTimeString();

    return localTime;
};
