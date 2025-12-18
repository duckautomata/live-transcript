/* eslint-disable no-console */

/**
 * Logs messages to the console if in development environment.
 * @param {...any} msg - Messages to log.
 */
export const LOG_MSG = (...msg) => {
    if (import.meta.env.DEV) {
        console.log(...msg);
    }
};

/**
 * Logs a warning to the console if in development environment.
 * @param {...any} msg - Warning messages to log.
 */
export const LOG_WARN = (...msg) => {
    if (import.meta.env.DEV) {
        console.warn(...msg);
    }
};

/**
 * Logs an error to the console if in development environment.
 * @param {...any} msg - Error messages to log.
 */
export const LOG_ERROR = (...msg) => {
    if (import.meta.env.DEV) {
        console.error(...msg);
    }
};
