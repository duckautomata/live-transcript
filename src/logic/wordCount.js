export const countWord = (text, word) => {
    if (text === undefined || typeof text !== "string" || word.length === 0) {
        return 0;
    }

    return text.toLowerCase().split(word.toLowerCase()).length - 1;
};
