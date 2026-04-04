// oxlint-disable no-console
import fs from "fs";
const data = JSON.parse(fs.readFileSync("tests/mocks/mockData.json", "utf8"));
let transcript = data.currentStream.data.transcript;
const title = data.currentStream.data.streamTitle;

function getText(line) {
    if (!line || !line.segments) return "";
    let text = line.segments
        .map((s) => s.text)
        .join(" ")
        .toLowerCase()
        .trim();
    // Ignore lines that are too short to be unique searches
    if (text.length < 5) return "";
    return text;
}

// Shift the array so that the pagination 300-line boundary falls exactly on lines that have text!
let N = transcript.length;
let foundPad = false;
let drop = 0;
// Page 0 boundary is N-1 to N-300
// Next Page (Page 1) boundary is N-301 to N-600
for (drop = 0; drop < 100; drop++) {
    const topOfPage1 = N - drop - 301; // top of page 1
    const bottomOfPage0 = N - drop - 300; // bottom of page 0 (one line AFTER top of page 1)
    const midOfPage0 = N - drop - 150; // middle of page 0

    if (topOfPage1 >= 0) {
        if (getText(transcript[topOfPage1]) && getText(transcript[bottomOfPage0]) && getText(transcript[midOfPage0])) {
            foundPad = true;
            break;
        }
    }
}

if (foundPad && drop > 0) {
    transcript = transcript.slice(0, N - drop);
    data.currentStream.data.transcript = transcript;
    fs.writeFileSync("tests/mocks/mockData.json", JSON.stringify(data, null, 2));
    console.log(`Trimmed ${drop} elements from end to align pagination boundaries on non-empty lines.`);
    N = transcript.length;
}

const wordCounts = {};
transcript.forEach((t) => {
    if (!t.segments) return;
    const text = t.segments.map((s) => s.text).join(" ");
    // words > 4 chars
    const desc = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
    desc.forEach((w) => {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
});

// find a word that appears exactly 2 times
const searchTermVal =
    Object.keys(wordCounts).find((w) => wordCounts[w] === 2) ||
    Object.keys(wordCounts).find((w) => wordCounts[w] > 2) ||
    "fallback";
const searchMatches = transcript.filter(
    (t) =>
        t.segments &&
        t.segments
            .map((s) => s.text)
            .join(" ")
            .toLowerCase()
            .includes(searchTermVal),
);
const searchLineId = searchMatches.length > 0 ? searchMatches[0].id : transcript[10].id;
const searchTermSize = searchMatches.length > 0 ? searchMatches.length : 1;

const emptyLineId = transcript[transcript.length - 1].id;

const topOfPage1Idx = N - 301;
const bottomOfPage0Idx = N - 300;
const midOfPage0Idx = N - 150;

const topSearchText = getText(transcript[topOfPage1Idx]);
const botSearchText = getText(transcript[bottomOfPage0Idx]);
const midSearchText = getText(transcript[midOfPage0Idx]);

const mockconstOutput = `
/**
 * NOTE: Auto-generated from mockData.json
 */

export const keyName = "doki";
export const title = "${title}";
export const searchTerm = "${searchTermVal}";
export const searchTermSize = ${searchTermSize};
export const emptyLineId = ${emptyLineId};
export const searchLineId = ${searchLineId};

export const paginationSearchTop = "${topSearchText}";
export const paginationTopLineId = ${transcript[topOfPage1Idx].id};
export const paginationSearchBottom = "${botSearchText}";
export const paginationBottomLineId = ${transcript[bottomOfPage0Idx].id};
export const paginationSearchMiddle = "${midSearchText}";
export const paginationMiddleLineId = ${transcript[midOfPage0Idx].id};
`;

fs.writeFileSync("tests/mocks/mockconst.js", mockconstOutput);
console.log("Saved tests/mocks/mockconst.js");
