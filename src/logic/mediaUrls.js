import { server } from "../config";

/**
 * @param {string} mediaBaseUrl the mediaBaseUrl that we received from the server
 * @param {string} wsKey the key that we are currently connected to
 * @param {string} streamId the stream of the audio we want to grab
 * @param {string} fileId the id of the audio file you want to play
 * @returns {string} the full url to play the audio
 */
export const playAudioUrl = (mediaBaseUrl, wsKey, streamId, fileId) => {
    if (!wsKey || !streamId || !fileId) {
        return undefined;
    } else if (mediaBaseUrl === "") {
        return `${server}/${wsKey}/stream/${streamId}/audio/${fileId}.m4a`;
    } else {
        return `${mediaBaseUrl}/${wsKey}/${streamId}/audio/${fileId}.m4a`;
    }
};

/**
 * @param {string} mediaBaseUrl the mediaBaseUrl that we received from the server
 * @param {string} wsKey the key that we are currently connected to
 * @param {string} streamId the stream of the audio
 * @param {string} fileId the id of the audio file
 * @param {string} lineId the id of the line this is for. Used to name the download file.
 * @returns {string} the full url to download the audio
 */
export const downloadAudioUrl = (mediaBaseUrl, wsKey, streamId, fileId, lineId) => {
    if (!wsKey || !streamId || !fileId) {
        return undefined;
    } else if (mediaBaseUrl === "") {
        return `${server}/${wsKey}/download/${streamId}/audio/${fileId}.m4a?name=${streamId}_${lineId}`;
    } else {
        return `${mediaBaseUrl}/${wsKey}/${streamId}/audio/${fileId}.m4a?download=true&name=${streamId}_${lineId}.m4a`;
    }
};

/**
 * @param {string} mediaBaseUrl the mediaBaseUrl that we received from the server
 * @param {string} wsKey the key that we are currently connected to
 * @param {string} streamId the stream of the clip
 * @param {string} fileId the id of the clip file
 * @param {string} fileFormat the id of the line this is for. Used to name the download file.
 * @returns {string} the full url to play the clip
 */
export const playClipUrl = (mediaBaseUrl, wsKey, streamId, fileId, fileFormat) => {
    if (!wsKey || !streamId || !fileId) {
        return undefined;
    } else if (mediaBaseUrl === "") {
        return `${server}/${wsKey}/stream/${streamId}/clips/${fileId}.${fileFormat}`;
    } else {
        return `${mediaBaseUrl}/${wsKey}/${streamId}/clips/${fileId}.${fileFormat}`;
    }
};

/**
 * @param {string} mediaBaseUrl the mediaBaseUrl that we received from the server
 * @param {string} wsKey the key that we are currently connected to
 * @param {string} streamId the stream of the clip
 * @param {string} fileId the id of the clip file
 * @param {string} fileFormat the id of the line this is for. Used to name the download file.
 * @param {string} downloadName the id of the line this is for. Used to name the download file.
 * @returns {string} the full url to download the clip
 */
export const downloadClipUrl = (mediaBaseUrl, wsKey, streamId, fileId, fileFormat, downloadName) => {
    if (!downloadName) {
        downloadName = `clip_${streamId}_${fileId}`;
    }
    if (!wsKey || !streamId || !fileId || !fileFormat) {
        return undefined;
    } else if (mediaBaseUrl === "") {
        return `${server}/${wsKey}/download/${streamId}/clips/${fileId}.${fileFormat}?name=${encodeURIComponent(downloadName)}`;
    } else {
        return `${mediaBaseUrl}/${wsKey}/${streamId}/clips/${fileId}.${fileFormat}?download=true&name=${encodeURIComponent(downloadName)}.${fileFormat}`;
    }
};

/**
 * @param {string} mediaBaseUrl the mediaBaseUrl that we received from the server
 * @param {string} wsKey the key that we are currently connected to
 * @param {string} streamId the stream of the clip
 * @param {string} fileId the id of the clip file
 * @returns {string} the full url to play the clip
 */
export const getFrameUrl = (mediaBaseUrl, wsKey, streamId, fileId) => {
    if (!wsKey || !streamId || !fileId) {
        return undefined;
    } else if (mediaBaseUrl === "") {
        return `${server}/${wsKey}/frame/${streamId}/${fileId}.jpg`;
    } else {
        return `${mediaBaseUrl}/${wsKey}/${streamId}/frame/${fileId}.jpg`;
    }
};
