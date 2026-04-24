import { timeToSeconds } from "../../logic/tagHelpers";

export const computeDisplayedRows = (formattedRows, controls) => {
    const enabledCollections = [];
    const timelineRows = [];

    let currentCollectionGroup = null;

    for (let i = 0; i < formattedRows.length; i++) {
        const row = formattedRows[i];

        if (row.type === "header") {
            const control = controls[row.name];
            if (row.subtype === "hbd") {
                // HBDs always go to timeline (regardless of enable state, to allow re-enable via row)
                timelineRows.push(row);
                currentCollectionGroup = null;
                continue;
            }

            if (row.subtype === "collection") {
                if (control && control.isEnabled) {
                    currentCollectionGroup = [row];
                    enabledCollections.push(currentCollectionGroup);
                } else {
                    currentCollectionGroup = null;
                }
            } else {
                if (!control || control.isEnabled) {
                    timelineRows.push(row);
                }
                currentCollectionGroup = null;
            }
        } else {
            if (row.subtype === "collection") {
                const parentName = row.parentName;
                const control = controls[parentName];

                if (control && control.isEnabled) {
                    if (currentCollectionGroup) {
                        currentCollectionGroup.push(row);
                    } else {
                        timelineRows.push(row);
                    }
                } else {
                    timelineRows.push(row);
                }
            } else if (row.subtype === "chapter") {
                timelineRows.push(row);
            } else {
                timelineRows.push(row);
            }
        }
    }

    const getSeconds = (r) => timeToSeconds(r.timestamp || "00:00");

    timelineRows.sort((a, b) => {
        const isHbdA = a.subtype === "hbd" || (!a.timestamp && a.text?.includes("HBD"));
        const isHbdB = b.subtype === "hbd" || (!b.timestamp && b.text?.includes("HBD"));
        if (isHbdA && !isHbdB) return 1;
        if (!isHbdA && isHbdB) return -1;

        return getSeconds(a) - getSeconds(b);
    });

    enabledCollections.sort((a, b) => {
        const nameA = a[0].name;
        const nameB = b[0].name;
        return (controls[nameA]?.order || 0) - (controls[nameB]?.order || 0);
    });

    const flatCollections = enabledCollections.flat();

    return [...flatCollections, ...timelineRows];
};

export const computeHighlightStats = (displayedRows, bulkEdit, controls, birthdayText, theme) => {
    const rowColors = {};
    let countTime = 0;
    let countStar = 0;
    let countCaps = 0;
    let countCensored = 0;

    const timeIds = new Set();

    if (bulkEdit.isHighlightTime) {
        const threshold = parseFloat(bulkEdit.highlightThreshold) || 0;
        let lastTime = -1;
        let lastId = null;
        displayedRows.forEach((row) => {
            const isParentDisabled = row.parentName && controls[row.parentName] && !controls[row.parentName].isEnabled;
            const isCollection = row.subtype === "collection";
            const isHbd = row.subtype === "hbd" || row.parentName === birthdayText;

            if (row.type === "tag" && row.isEnabled && !isParentDisabled && !isCollection && !isHbd) {
                const t = row.timestamp ? timeToSeconds(row.timestamp) : -1;
                if (t !== -1) {
                    if (lastTime !== -1) {
                        if (t - lastTime < threshold) {
                            timeIds.add(row.id);
                            if (lastId) timeIds.add(lastId);
                        }
                    }
                    lastTime = t;
                    lastId = row.id;
                }
            }
        });
        countTime = timeIds.size;
    }

    displayedRows.forEach((row) => {
        if (row.type !== "tag") return;

        let isCaps = false;
        if (bulkEdit.isHighlightCaps) {
            const text = row.text.trim();
            const hasLetters = /[a-zA-Z]/.test(text);
            if (hasLetters && text === text.toUpperCase()) {
                isCaps = true;
                countCaps++;
            }
        }

        let isStar = false;
        if (bulkEdit.isHighlightStar && row.text.includes("*")) {
            isStar = true;
            countStar++;
        }

        let isCensored = false;
        if (bulkEdit.isHighlightCensored && row.wasCensored) {
            isCensored = true;
            countCensored++;
        }

        let color = null;
        if (timeIds.has(row.id)) {
            color = theme.palette.background.yellow;
        }
        if (isCaps) {
            color = theme.palette.background.teal;
        }
        if (isStar) {
            color = theme.palette.background.red;
        }
        if (isCensored) {
            color = theme.palette.background.orange;
        }

        if (color) {
            rowColors[row.id] = color;
        }
    });

    return { rowColors, countTime, countStar, countCaps, countCensored };
};

export const buildFormattedOutput = (displayedRows, controls) => {
    const enabledRows = displayedRows.filter((r) => r.isEnabled);

    const childrenCount = {};
    enabledRows.forEach((r) => {
        if (r.type === "tag" && r.parentName) {
            childrenCount[r.parentName] = (childrenCount[r.parentName] || 0) + 1;
        }
    });

    const validRows = enabledRows.filter((r) => {
        if (r.type === "header") {
            return childrenCount[r.name] > 0;
        }
        return true;
    });

    const result = validRows.map((row, index) => {
        let prefix = "";
        if (index > 0) {
            const prevRow = validRows[index - 1];

            const isPrevCollection =
                prevRow.subtype === "collection" &&
                (prevRow.type === "header"
                    ? controls[prevRow.name]?.isEnabled
                    : controls[prevRow.parentName]?.isEnabled);
            const isCurrCollection =
                row.subtype === "collection" &&
                (row.type === "header" ? controls[row.name]?.isEnabled : controls[row.parentName]?.isEnabled);

            if (isPrevCollection && !isCurrCollection) {
                if (row.type !== "header") {
                    prefix = "\n";
                }
            }

            if (row.type === "header") {
                prefix = "\n";
            }
        }

        if (row.type === "header") {
            return `${prefix}*${row.name}*`;
        }
        if (prefix.length > 0) {
            return `${prefix}${row.timestamp} ${row.text}`;
        }
        return `${row.timestamp} ${row.text}`.trim();
    });
    return result.join("\n");
};
