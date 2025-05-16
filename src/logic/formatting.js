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

export const collection_formatting = (tags) => {
    if (!tags || tags.trim().length === 0) {
        return tags ?? "";
    }

    const groups = new Map();
    const collectionRegex = /([\d:]+)\s+(.*?)\s*\|\s*(.*)/i;
    const lines = tags.split("\n");

    // Extract and group tags
    lines.forEach((line) => {
        const match = line.match(collectionRegex);
        if (match && match.length === 4) {
            const timestamp = match[1];
            const name = match[2];
            const text = match[3];

            // Use case-insensitive key lookup. The first occurrence of a collection will determine it's name capitalization.
            const key = [...groups.keys()].find((k) => k.toLowerCase() === name.toLowerCase()) || name;

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
