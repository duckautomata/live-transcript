import { unixToRelative } from "./dateTime";

const STORAGE_KEY_PREFIX = "stream-summary-";

export const getStorageKey = (channel) => `${STORAGE_KEY_PREFIX}${channel || "default"}`;

export const loadSummary = (channel) => {
    try {
        const key = getStorageKey(channel);
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : { tags: [], chapters: [], groups: {} };
    } catch (e) {
        console.error("Failed to load summary", e);
        return { tags: [], chapters: [], groups: {} };
    }
};

export const saveSummary = (channel, data) => {
    try {
        const key = getStorageKey(channel);
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new Event("summaryUpdated"));
    } catch (e) {
        console.error("Failed to save summary", e);
    }
};

export const clearSummary = (channel) => {
    try {
        const key = getStorageKey(channel);
        localStorage.removeItem(key);
        window.dispatchEvent(new Event("summaryUpdated"));
    } catch (e) {
        console.error("Failed to clear summary", e);
    }
};

export const formatSummary = (data, startTime) => {
    let output = "";

    // 1. Chapters
    // 2. Tags
    // 3. Groups (removed from main list)

    // Merge tags and chapters for chronological ordering, unless we want chapters separate
    // The requirement says:
    // Tags: 00:00:00 Basic tag
    // Chapters: 00:00:00 [Chapter Title] chapters first tag...
    // Groups: 00:00:00 Group Name :: example tag...

    const allItems = [];

    data.tags.forEach(tag => {
        allItems.push({ ...tag, type: 'tag' });
    });

    data.chapters.forEach(chapter => {
        allItems.push({ ...chapter, type: 'chapter' });
    });

    Object.entries(data.groups).forEach(([groupName, groupTags]) => {
        groupTags.forEach(tag => {
            allItems.push({ ...tag, type: 'group', groupName });
        });
    });

    allItems.sort((a, b) => a.timestamp - b.timestamp);

    allItems.forEach(item => {
        const time = unixToRelative(item.timestamp, startTime);
        if (item.type === 'tag') {
            output += `${time} ${item.text}\n`;
        } else if (item.type === 'chapter') {
            // "00:00:00 [Chapter Title] chapters first tag"
            // Assuming the chapter object has a start text? Or just the title?
            // "Any text after the timestamp will a part of the chapter."
            // We'll assume the user inputs the "first tag" text in the chapter creation??
            // Re-reading: "Chapter Title" is separate.
            // Let's assume the item.text is the "first tag" content.
            output += `${time} [${item.title}] ${item.text || ""}\n`;
        } else if (item.type === 'group') {
            output += `${time} ${item.groupName} :: ${item.text}\n`;
        }
    });

    return output.trim();
};
