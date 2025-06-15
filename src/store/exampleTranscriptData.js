// All example data
// smallTranscript - simple complete transcript
// transcriptWithEmptySeg - one line segment array is empty
// transcriptWithEmptyText - one segment text is empty in each line
// emptyTranscriptToSeg = all lines have empty segments array
// emptyTranscript - transcript array is empty
// generateTranscript - used to generate transcripts of any size

export const smallTranscript = [
    {
        id: 0,
        segments: [
            {
                timestamp: 1729305500,
                text: "Example seg 1.",
            },
            {
                timestamp: 1729305502,
                text: "Example seg 2.",
            },
            {
                timestamp: 1729305504,
                text: "Example seg 1.",
            },
        ],
    },
    {
        id: 1,
        segments: [
            {
                timestamp: 1729305506,
                text: "Example 2 seg 1.",
            },
            {
                timestamp: 1729305508,
                text: "Example 2 seg 2.",
            },
            {
                timestamp: 1729305510,
                text: "Example 2 seg 1.",
            },
        ],
    },
    {
        id: 2,
        segments: [
            {
                timestamp: 1729305600,
                text: "Example 3 seg 1.",
            },
            {
                timestamp: 1729305602,
                text: "Example 3 seg 2.",
            },
            {
                timestamp: 1729305604,
                text: "Example 3 seg 1.",
            },
        ],
    },
];

export const transcriptWithEmptySeg = [
    {
        id: 0,
        segments: [
            {
                timestamp: 1729305500,
                text: "Example seg 1.",
            },
            {
                timestamp: 1729305502,
                text: "Example seg 2.",
            },
            {
                timestamp: 1729305504,
                text: "Example seg 1.",
            },
        ],
    },
    {
        id: 1,
        segments: [],
    },
    {
        id: 2,
        segments: [
            {
                timestamp: 1729305600,
                text: "Example 3 seg 1.",
            },
            {
                timestamp: 1729305602,
                text: "Example 3 seg 2.",
            },
            {
                timestamp: 1729305604,
                text: "Example 3 seg 1.",
            },
        ],
    },
];

export const transcriptWithEmptyText = [
    {
        id: 0,
        segments: [
            {
                timestamp: 1729305500,
                text: "",
            },
            {
                timestamp: 1729305502,
                text: "Example seg 2.",
            },
            {
                timestamp: 1729305504,
                text: "Example seg 1.",
            },
        ],
    },
    {
        id: 1,
        segments: [
            {
                timestamp: 1729305506,
                text: "Example 2 seg 1.",
            },
            {
                timestamp: 1729305508,
                text: "",
            },
            {
                timestamp: 1729305510,
                text: "Example 2 seg 1.",
            },
        ],
    },
    {
        id: 2,
        segments: [
            {
                timestamp: 1729305600,
                text: "Example 3 seg 1.",
            },
            {
                timestamp: 1729305602,
                text: "Example 3 seg 2.",
            },
            {
                timestamp: 1729305604,
                text: "",
            },
        ],
    },
];

export const emptyTranscriptToSeg = [
    {
        id: 0,
        segments: [],
    },
    {
        id: 1,
        segments: [],
    },
    {
        id: 2,
        segments: [],
    },
];

export const emptyTranscript = [];

export const generateTranscript = (numLines, numSegPerLine, numWordsPerSeg) => {
    const transcript = [];
    const randomWords =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".split(
            " ",
        );
    for (let i = 0; i < numLines; i++) {
        const segments = [];
        for (let j = 0; j < numSegPerLine; j++) {
            const text = [];
            for (let k = 0; k < numWordsPerSeg; k++) {
                text.push(randomWords[Math.floor(Math.random() * randomWords.length)]);
            }
            const seg = {
                timestamp: 1729305500 + j * i + j,
                text: text.join(" "),
            };
            segments.push(seg);
        }
        const line = {
            id: i,
            segments: segments,
        };
        transcript.push(line);
    }

    return transcript;
};
