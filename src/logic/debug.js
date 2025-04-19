/* eslint-disable no-console */

export const LOG_MSG = (...msg) => {
    if (import.meta.env.DEV) {
        console.log(...msg);
    }
};

export const LOG_WARN = (...msg) => {
    if (import.meta.env.DEV) {
        console.warn(...msg);
    }
};

export const LOG_ERROR = (...msg) => {
    if (import.meta.env.DEV) {
        console.error(...msg);
    }
};
