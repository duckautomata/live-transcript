import fs from "fs/promises";

const wsKey = "doki";
const WS_URL = `wss://api.duck-automata.com/live/${wsKey}/websocket`;
const REST_URL = `https://api.duck-automata.com/live/${wsKey}`;

const mockData = {
    currentStream: null,
    pastStreams: null,
    pastStreamTranscript: null,
};

async function main() {
    console.log("Connecting to WebSocket...");
    const ws = new WebSocket(WS_URL);

    let gotSync = false;
    let gotPastStreams = false;

    ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);

        if (msg.event === "sync") {
            console.log("Received sync event.");
            mockData.currentStream = msg;
            gotSync = true;
            checkDone();
        } else if (msg.event === "pastStreams") {
            console.log("Received pastStreams event.");
            mockData.pastStreams = msg;
            gotPastStreams = true;

            // Fetch transcript for the most recent past stream
            if (msg.data.streams && msg.data.streams.length > 0) {
                const streamId = msg.data.streams[0].streamId;
                console.log("Fetching past stream transcript for:", streamId);
                const res = await fetch(`${REST_URL}/transcript/${streamId}`);
                if (res.ok) {
                    mockData.pastStreamTranscript = await res.json();
                } else {
                    console.error("Failed to fetch past stream transcript", res.status);
                }
            }
            checkDone();
        }
    };

    async function checkDone() {
        if (gotSync && gotPastStreams) {
            ws.close();
            await fs.writeFile("tests/mocks/mockData.json", JSON.stringify(mockData, null, 2));
            console.log("Successfully generated tests/mocks/mockData.json");
            process.exit(0);
        }
    }

    ws.onopen = () => {
        console.log("WebSocket connected. Waiting for data...");
        // the server sends sync on connect. Maybe it also sends pastStreams?
    };

    ws.onerror = (e) => {
        console.error("WebSocket error");
    };

    // Timeout
    setTimeout(() => {
        console.log("Timed out waiting for websocket data. Current state:", { gotSync, gotPastStreams });
        process.exit(1);
    }, 15000);
}

main();
