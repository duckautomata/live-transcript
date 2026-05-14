# live-transcript

Transcribes a live stream near real-time with a live latency of 4-6 seconds.

## Overview

_System_

- **[Live Transcript System](#live-transcript-system)**
- **[Guide](#guide)**

_Development_

- **[Tech Used](#tech-used)**
- **[Running Locally](#running-locally)**
- **[Testing](#testing)**
- **[Contributing](#contributing)**
- **[Contributing Ideas](#contrubiting-ideas)**
- **[Building a Release](#building-a-new-release)**

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
- MUI 9

### Running Locally

1. Have Node 22 or later installed
2. Clone the repo locally
3. Run `npm install` to install dependencies
4. Run `npm run dev` and open the site it gives you. Or press `o` and enter to open the site.

Every time you save, Vite will automatically refresh the cache and the site should refresh with the new changes.

To mock the transcript, go to the `src/store/transcriptSlice.ts` and change

```js
transcript: [],
```

to

```js
transcript: examples.generateTranscript(100, 3, 4);
```

where you can use anything from the examples file. generateTranscript is just the easiest to generate large amounts of data.
You can also change the initial values for the other variables to whatever you want. Just make sure to revert back to the original before committing.

#### Update Command
```bash
npx npm-check-updates -u --cooldown 7; npm install; npm audit; npm audit signatures --min-release-age=0
```

### Testing

#### Vitest tests

```bash
npm run test
```

Playwright tests are used to test the full UI - both mocked (for stability) and real.

Before running any playwright tests, you need to build the project. The tests runs against the preview server since it's significantly faster than running the dev server.

#### Mocked Playwright Tests

```bash
npm run build
npm run test:mock
```

#### Mocked Dev Playwright Tests

This will use the dev server instead of the preview server.

This is useful for catching rendering errors that are not logged in the preview server.

However, it is a lot slower than the preview server. So it should only be ran locally.

```bash
npm run test:dev
```

#### Real Playwright Tests

If you want to run the e2e tests, you'll need to update [mockconst.js](./tests/mocks/mockconst.js) with the current server data.

mockconst.js note:

- The tests require at least 2 pages of transcript lines in order for the pagination tests to work.
- Best to keep the number of searchTerm results < 5 since virtual lists do not show all results. Best if 1-3 results.
- searchLineId just needs to be one of the searchTerm results, order doesn't matter.

```bash
npm run build
npm run test:e2e
```

#### Updating Mocks

The mocks are auto generated from the server to ensure compatibility. If the server's api changes, the mocks need to be updated.

```bash
npm run test:generate-mocks
```

### Contributing

1. create a branch and put your code onto it.
2. Run `npm run test`, `npm run format`, `npm run lint` and make sure everything is all good.
3. Push, raise pr, I'll approve.

### Contributing ideas

Raise an issue and detail what idea you have or would like to see.

### Building a new release

New releases are automatically built and deployed when a new pull request is merged into master.
