import { genericCensor, mintCensor } from "./censors";
import { HBD_formatting, compareKeys } from "./formatting";

export const timeToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.trim().split(":").map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
};

export const secondsToTime = (seconds) => {
    if (seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const recalculateStructure = (rows) => {
    // 1. Separate into categories
    const collectionHeaders = [];
    const collectionTags = [];
    const hbdRows = [];
    const timelineRows = [];

    rows.forEach((row) => {
        if (row.subtype === "collection") {
            if (row.type === "header") {
                collectionHeaders.push(row);
            } else {
                collectionTags.push(row);
            }
        } else if (row.subtype === "hbd") {
            hbdRows.push(row);
        } else {
            timelineRows.push(row);
        }
    });

    // 2. Reconstruct Collections
    const reconstructedCollections = [];
    collectionHeaders.forEach((header) => {
        const children = collectionTags.filter((tag) => tag.parentName === header.name);
        children.sort((a, b) => timeToSeconds(a.timestamp) - timeToSeconds(b.timestamp));

        if (children.length > 0) {
            header.timestamp = children[0].timestamp;
        }

        reconstructedCollections.push(header);
        reconstructedCollections.push(...children);
    });

    // 3. Sort Timeline Rows by Timestamp
    timelineRows.sort((a, b) => {
        const timeA = timeToSeconds(a.timestamp);
        const timeB = timeToSeconds(b.timestamp);
        return timeA - timeB;
    });

    // 4. Re-assign Parents for Timeline Tags
    let currentChapter = null;
    const updatedTimelineRows = timelineRows.map((row) => {
        if (row.type === "header" && row.subtype === "chapter") {
            currentChapter = row.name;
            return row;
        } else if (row.type === "tag") {
            return { ...row, parentName: currentChapter };
        }
        return row;
    });

    return [...reconstructedCollections, ...updatedTimelineRows, ...hbdRows];
};

let rowIdCounter = 0;
export const generateId = (prefix) => `${prefix}-${Date.now()}-${rowIdCounter++}`;

export const parseRawInput = (textToFormat, wsKey_or_CensorType, birthdayText) => {
    // 1. HBD Formatting
    let processed = HBD_formatting(textToFormat, birthdayText);

    // 2. Parsing
    const lines = processed.split("\n").filter((line) => line.trim().length > 0);
    const newRows = [];
    const newControls = {};

    const collectionRegex = /([\d:]+)\s+(.*?)\s*::\s*(.*)/i;
    const chapterRegex = /([\d:]+)\s+\[(.*?)\]\s*(.*)/i;
    const hbdHeaderRegex = new RegExp(`\\*(${birthdayText.replace("!", "\\!")})\\*`, "i");

    const collectionGroups = new Map(); // name -> [lines]
    const remainingLines = [];

    // Helper to censor and flag
    const processText = (text) => {
        if (!text) return { text: "", wasCensored: false };
        let censored = genericCensor(text);
        // Only flag if genericCensor changed it (as requested)
        const wasCensored = censored !== text;

        if (wsKey_or_CensorType === "mint") {
            censored = mintCensor(censored);
        }
        return { text: censored, wasCensored };
    };

    lines.forEach((line) => {
        const match = line.match(collectionRegex);
        if (match) {
            const timestamp = match[1];
            const rawName = match[2];
            const rawText = match[3];

            const procName = processText(rawName);
            const procText = processText(rawText);

            // Use censored name for grouping
            const keyName = procName.text;
            const key = [...collectionGroups.keys()].find((k) => compareKeys(k, keyName) >= 90) || keyName;

            if (!collectionGroups.has(key)) {
                // If the key itself was censored, we might want to flag the header?
                // For now, simpler to flag items.
                // Or store checking logic in build step?
                // Let's store metadata.
                collectionGroups.set(key, { items: [], wasHeaderCensored: procName.wasCensored });
            }
            // Use existing group's wasHeaderCensored status if merging?
            // If new key matches old fuzzy key, we use old key.
            // If old key was censored, it persists.

            collectionGroups.get(key).items.push({
                timestamp,
                text: procText.text,
                originalLine: line,
                name: key,
                wasCensored: procText.wasCensored,
            });
        } else {
            remainingLines.push(line);
        }
    });

    // Build Collection Rows
    [...collectionGroups.keys()].forEach((name, index) => {
        newControls[name] = { isEnabled: true, type: "collection", order: index };

        const groupData = collectionGroups.get(name);
        const groupItems = groupData.items;
        const firstTimestamp = groupItems.length > 0 ? groupItems[0].timestamp : "00:00";

        newRows.push({
            id: generateId("col-header"),
            type: "header",
            subtype: "collection",
            name: name,
            originalName: name,
            timestamp: firstTimestamp,
            isEnabled: true,
            // If header name was censored
            wasCensored: groupData.wasHeaderCensored,
        });

        groupItems.forEach((item) => {
            newRows.push({
                id: generateId("tag"),
                type: "tag",
                subtype: "collection",
                parentName: name,
                timestamp: item.timestamp,
                text: item.text,
                originalText: item.text,
                isEnabled: true,
                isEditing: false,
                wasCensored: item.wasCensored,
            });
        });
    });

    let inHbdSection = false;
    let currentChapter = null;

    remainingLines.forEach((line) => {
        if (hbdHeaderRegex.test(line) || line.includes(`*${birthdayText}*`)) {
            inHbdSection = true;
            currentChapter = null;
            if (!newControls[birthdayText]) {
                newControls[birthdayText] = { isEnabled: true, type: "hbd" };
            }

            newRows.push({
                id: generateId("hbd-header"),
                type: "header",
                subtype: "hbd",
                name: birthdayText,
                originalName: birthdayText,
                isEnabled: true,
            });
            return;
        }

        const chapterMatch = line.match(chapterRegex);
        if (chapterMatch) {
            const timestamp = chapterMatch[1];
            const rawName = chapterMatch[2];
            const rawText = chapterMatch[3];

            const procName = processText(rawName);
            currentChapter = procName.text;

            if (!newControls[currentChapter]) {
                newControls[currentChapter] = { isEnabled: true, type: "chapter" };
            }

            newRows.push({
                id: generateId("chap-header"),
                type: "header",
                subtype: "chapter",
                name: currentChapter,
                originalName: currentChapter,
                timestamp: timestamp,
                isEnabled: true,
                wasCensored: procName.wasCensored,
            });

            if (rawText && rawText.trim().length > 0) {
                const procText = processText(rawText);
                newRows.push({
                    id: generateId("tag"),
                    type: "tag",
                    subtype: "chapter",
                    parentName: currentChapter,
                    timestamp: timestamp,
                    text: procText.text,
                    originalText: procText.text,
                    isEnabled: true,
                    isEditing: false,
                    wasCensored: procText.wasCensored,
                });
            }
        } else {
            const timestampMatch = line.match(/^([\d:]+)\s+(.*)/);
            if (timestampMatch) {
                const timestamp = timestampMatch[1];
                const rawText = timestampMatch[2];
                const procText = processText(rawText);

                newRows.push({
                    id: generateId("tag"),
                    type: "tag",
                    subtype: inHbdSection ? "hbd" : "normal",
                    parentName: inHbdSection ? birthdayText : currentChapter,
                    timestamp: timestamp,
                    text: procText.text,
                    originalText: procText.text,
                    isEnabled: true,
                    isEditing: false,
                    wasCensored: procText.wasCensored,
                });
            } else {
                const procText = processText(line);
                newRows.push({
                    id: generateId("tag"),
                    type: "tag",
                    subtype: inHbdSection ? "hbd" : "normal",
                    timestamp: "",
                    text: procText.text,
                    originalText: procText.text,
                    isEnabled: true,
                    isEditing: false,
                    wasCensored: procText.wasCensored,
                });
            }
        }
    });

    return { newRows, newControls };
};

export const mergeTags = (currentRows, currentControls, newRows, newControls, birthdayText) => {
    const mergedControls = { ...currentControls };
    let rowsToAdd = [];

    // Determine max current order
    const maxOrder = Object.values(currentControls).reduce(
        (max, c) => (c.type === "collection" ? Math.max(max, c.order || 0) : max),
        -1,
    );
    let nextOrder = maxOrder + 1;

    // Use a copy to mutate
    let updatedRows = [...currentRows];
    const matchedOldIds = new Set();
    const matchedHeaderIds = new Set();

    // 1. Process Headers
    newRows.forEach((newRow) => {
        if (newRow.type !== "header") return;

        const match = updatedRows.find(
            (r) =>
                r.type === "header" &&
                r.subtype === newRow.subtype &&
                (r.name === newRow.name || (r.originalName && r.originalName === newRow.name)) &&
                !matchedHeaderIds.has(r.id),
        );

        if (match) {
            matchedHeaderIds.add(match.id);
            if (match.timestamp !== newRow.timestamp) {
                match.timestamp = newRow.timestamp;
            }
        } else {
            // Chapter Rename
            let renamedMatch = null;
            if (newRow.subtype === "chapter") {
                renamedMatch = updatedRows.find(
                    (r) =>
                        r.type === "header" &&
                        r.subtype === "chapter" &&
                        r.timestamp === newRow.timestamp &&
                        !matchedHeaderIds.has(r.id),
                );
            }

            if (renamedMatch) {
                matchedHeaderIds.add(renamedMatch.id);
                // Rename
                const oldName = renamedMatch.name;
                const newName = newRow.name;

                renamedMatch.name = newName;
                renamedMatch.originalName = newName;

                if (mergedControls[oldName]) {
                    mergedControls[newName] = { ...mergedControls[oldName] };
                    delete mergedControls[oldName];
                } else if (newControls[newName]) {
                    mergedControls[newName] = newControls[newName];
                }
            } else {
                // New Header
                const alreadyAdded = rowsToAdd.find(
                    (r) => r.type === "header" && r.name === newRow.name && r.subtype === newRow.subtype,
                );
                if (!alreadyAdded) {
                    rowsToAdd.push(newRow);
                    if (newControls[newRow.name]) {
                        mergedControls[newRow.name] = {
                            ...newControls[newRow.name],
                            order: nextOrder++,
                        };
                    }
                }
            }
        }
    });

    // 2. Process Tags
    newRows.forEach((newRow) => {
        if (newRow.type !== "tag") return;

        // Exact/Original Match
        const exactMatch = updatedRows.find((r) => {
            const textMatches = r.text === newRow.text || (r.originalText && r.originalText === newRow.text);
            const timeMatches = r.timestamp === newRow.timestamp;
            return r.type === "tag" && textMatches && timeMatches && !matchedOldIds.has(r.id);
        });

        if (exactMatch) {
            matchedOldIds.add(exactMatch.id);
            if (newRow.parentName && exactMatch.parentName !== newRow.parentName) {
                exactMatch.parentName = newRow.parentName;
            }
            return;
        }

        // Timestamp Match -> Update Text
        const timeMatch = updatedRows.find(
            (r) => r.type === "tag" && r.timestamp === newRow.timestamp && !matchedOldIds.has(r.id),
        );
        if (timeMatch) {
            matchedOldIds.add(timeMatch.id);
            timeMatch.text = newRow.text;
            timeMatch.originalText = newRow.text;
            if (newRow.parentName && timeMatch.parentName !== newRow.parentName) {
                timeMatch.parentName = newRow.parentName;
            }
            return;
        }

        // Text Match -> Update Timestamp
        const textMatch = updatedRows.find((r) => {
            const textMatches = r.text === newRow.text || (r.originalText && r.originalText === newRow.text);
            return r.type === "tag" && textMatches && !matchedOldIds.has(r.id);
        });
        if (textMatch) {
            matchedOldIds.add(textMatch.id);
            textMatch.timestamp = newRow.timestamp;
            if (newRow.parentName && textMatch.parentName !== newRow.parentName) {
                textMatch.parentName = newRow.parentName;
            }
            return;
        }

        rowsToAdd.push(newRow);
    });

    updatedRows = [...updatedRows, ...rowsToAdd];

    // 3. Cleanup Orphans
    const childrenCounts = {};
    updatedRows.forEach((r) => {
        if (r.type === "tag" && r.parentName) {
            childrenCounts[r.parentName] = (childrenCounts[r.parentName] || 0) + 1;
        }
    });

    updatedRows = updatedRows.filter((r) => {
        if (r.type === "header") {
            if (r.subtype === "hbd" || r.subtype === "chapter") return true;
            return (childrenCounts[r.name] || 0) > 0;
        }
        return true;
    });

    // 4. Sync Controls
    const livingHeaders = new Set(updatedRows.filter((r) => r.type === "header").map((r) => r.name));
    Object.keys(mergedControls).forEach((key) => {
        if (!livingHeaders.has(key) && key !== birthdayText) {
            delete mergedControls[key];
        }
    });

    const collectionKeys = Object.keys(mergedControls).filter((key) => mergedControls[key].type === "collection");
    collectionKeys.sort((a, b) => (mergedControls[a].order || 0) - (mergedControls[b].order || 0));
    collectionKeys.forEach((key, index) => {
        mergedControls[key].order = index;
    });

    // Recalculate Structure
    updatedRows = recalculateStructure(updatedRows);

    return { rows: updatedRows, controls: mergedControls };
};
