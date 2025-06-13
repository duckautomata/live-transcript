# live-transcript

Transcribes a live stream near real-time with a live latency of 4-6 seconds.

## Overview

_System_

- **[Live Transcript System](#live-transcript-system)**
- **[Guide](#guide)**

_Development_

- **[Tech Used](#tech-used)**
- **[Running Locally](#running-locally)**
- **[Contributing](#contributing)**
- **[Contributing Ideas](#contrubiting-ideas)**
- **[Building a Release](#building-a-new-release)**
- **[Release Process](#release-process)**

## System

### Live Transcript System

Live Transcript is a system that contains three programs:

- Worker: [live-transcript-worker](https://github.com/duckautomata/live-transcript-worker)
- Server: [live-transcript-server](https://github.com/duckautomata/live-transcript-server)
- Client: [live-transcript](https://github.com/duckautomata/live-transcript)

All three programs work together to transcribe a livestream for us to use in real-time.

- Worker will process a livestream, transcribe the audio, and then upload the results to the server.
- Server acts as a cache layer between Worker and Client. It will store the current transcript. Once it receives a new transcript line, it will be broadcast to all connected clients.
- Client (this) is the UI that renders the transcript for us to use.

### Guide

A guide on how to use the website can be found by clicking the `Help` question mark icon on the sidebar.

![help button](/docs/help-button.png)

## Development

### Tech Used

- Node 22
- Vite to run locally
- React19
- MUI 7

### Running Locally

1. Have Node 20 or later installed
2. Clone the repo locally
3. Run `npm install` to install dependencies
4. Run `npm run dev` and open the site it gives you. Or press `o` and enter to open the site.

Every time you save, Vite will automatically refresh the cache and the site should refresh with the new changes.

To mock the transcript, go to the `src/providers/TranscriptProvider.jsx` and change

```js
const [transcript, setTranscript] = useState([]);
```

to

```js
const [transcript, setTranscript] = useState(examples.generateTranscript(100, 3, 4));
```

where you can use anything from the examples file. generateTranscript is just the easiest to generate large amounts of data.
You can also change the initial values for the other variables to whatever you want. Just make sure to revert back to the original before committing.

### Contributing

1. create a branch and put your code onto it.
2. Run `npm run test`, `npm run format`, `npm run lint` and make sure everything is all good.
3. Push, raise pr, I'll approve.

### Contrubiting ideas

Raise an issue and detail what idea you have or would like to see.

### Building a new release

This repo holds the dev code. The release code is stored on the `duckautomata.github.io` repo.
I do it this way to ensure that I only have one GitHub Pages repo. And it makes it easier to integrate all apps and make it look consistent.

#### Release Process

Once a new version of the app is ready to go.

1. Run `npm run build`
2. Copy the contents of `/live-transcript` and paste them into this repos folder over in the `duckautomata.github.io` repo. (make sure to delete the existing folder first)
3. Push changes to a new branch and open a PR.
4. Once PR is merged. Changes should be released.
