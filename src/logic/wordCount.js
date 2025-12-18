/**
 * Counts occurrences of a word in a text string.
 * @param {string} text - The input text.
 * @param {string} word - The word to count.
 * @returns {number} Count of occurrences.
 */
export const countWord = (text, word) => {
    if (text === undefined || typeof text !== "string" || word.length === 0) {
        return 0;
    }

    return text.toLowerCase().split(word.toLowerCase()).length - 1;
};
