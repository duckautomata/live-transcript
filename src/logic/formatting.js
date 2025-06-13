// takes in a string of every tag. Formats it so that every tag with hbd get moved to the bottom
export const HBD_formatting = (tags) => {
    if (!tags || tags.trim().length === 0) {
        return tags ?? "";
    }

    // non-global, meaning we only search for the first match
    const hbdLineRegex = /[\d:]+\s+HBD\s*.*/i;
    const hbdRegex = /\s*HBD\s*/i;
    const hbdHeader = "*Dragoon Birthdays*";
    const lines = tags.trim().split("\n");
    const hbds = lines
        .filter((line) => hbdLineRegex.test(line))
        .map((line) => line.replace(hbdRegex, " ").trim())
        .join("\n");
    const tagsWithoutHBD = lines.filter((line) => !hbdLineRegex.test(line)).join("\n");

    if (tagsWithoutHBD.trim().length === 0 && hbds.trim().length === 0) {
        return "";
    }

    if (tagsWithoutHBD.trim().length === 0) {
        return `${hbdHeader}\n${hbds}`;
    }

    if (hbds.trim().length === 0) {
        return tags;
    }

    return `${tagsWithoutHBD}\n\n${hbdHeader}\n${hbds}`;
};

// takes in a string of every tag. Formats it so that chapter tags get converted
export const chapter_formatting = (tags) => {
    if (!tags || tags.trim().length === 0) {
        return tags ?? "";
    }

    const chapterRegex = /([\d:]+)\s+\[(.*?)\]\s*(.*)/i;
    return tags
        .split("\n")
        .map((line, index) => {
            const match = line.match(chapterRegex);
            if (!match || match.length != 4) {
                return line;
            }
            const timestamp = match[1];
            const chapter = match[2];
            const firstTag = match[3];

            let newLine = "";

            if (firstTag.length === 0) {
                newLine = `*${chapter}*`;
            } else {
                newLine = `*${chapter}*\n${timestamp} ${firstTag}`;
            }

            if (index != 0) {
                newLine = `\n${newLine}`;
            }

            return newLine;
        })
        .join("\n");
};

// ignores case, space, and returns the percentage of match between the keys. From 0 [no match] - 100 [full match]
export const compareKeys = (key1, key2) => {
    const preprocessKey = (key) => {
        if (typeof key !== "string") {
            return "";
        }
        return key.toLowerCase().replace(/\s/g, "");
    };

    const processedKey1 = preprocessKey(key1);
    const processedKey2 = preprocessKey(key2);
    const len1 = processedKey1.length;
    const len2 = processedKey2.length;

    // if both keys are empty, then they match, if only one is empty, then they do not match
    if (processedKey1 === "" && processedKey2 === "") {
        return 100;
    }
    if (processedKey1 === "" || processedKey2 === "") {
        return 0;
    }

    // Calculate Longest Common Subsequence (LCS)
    const dp = Array(len1 + 1)
        .fill(null)
        .map(() => Array(len2 + 1).fill(0));

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            if (processedKey1[i - 1] === processedKey2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const lcsLength = dp[len1][len2];

    // Determine the reference length for the calculation.
    // Using the length of the longer string seems reasonable for "overall similarity".
    const referenceLength = Math.max(len1, len2);

    // If referenceLength is 0 (both strings were empty after processing and not caught above),
    // it implies a match.
    if (referenceLength === 0) {
        return 100;
    }

    const matchPercentage = (lcsLength / referenceLength) * 100;

    return Math.floor(matchPercentage);
};

export const collection_formatting = (tags) => {
    if (!tags || tags.trim().length === 0) {
        return tags ?? "";
    }

    const groups = new Map();
    const collectionRegex = /([\d:]+)\s+(.*?)\s*::\s*(.*)/i;
    const lines = tags.split("\n");

    // Extract and group tags
    lines.forEach((line) => {
        const match = line.match(collectionRegex);
        if (match && match.length === 4) {
            const timestamp = match[1];
            const name = match[2];
            const text = match[3];

            // Use case-insensitive key lookup. The first occurrence of a collection will determine it's name capitalization.
            const key = [...groups.keys()].find((k) => compareKeys(k, name) >= 90) || name;

            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(`${timestamp} ${text}`);
        }
    });

    if ([...groups.keys()].length === 0) {
        return tags ?? "";
    }

    const tagsWithoutGroups = lines.filter((line) => !collectionRegex.test(line)).join("\n");
    let groupTags = "";
    for (const name of groups.keys()) {
        groupTags += `\n\n*${name}*\n${groups.get(name).join("\n")}`;
    }

    if (tagsWithoutGroups.trim().length === 0) {
        return groupTags.trim();
    }

    return groupTags.trim() + "\n\n" + tagsWithoutGroups;
};
