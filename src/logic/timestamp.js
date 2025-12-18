/**
 * Checks if a value is an integer or can be parsed as one.
 * @param {any} num - The value to check.
 * @returns {boolean} True if it's an integer.
 */
const isInt = (num) => {
    return num !== "" && num !== null && Number.isInteger(+num);
};

/**
 * Converts a Discord snowflake (string or number) to a Unix timestamp (seconds).
 * @param {string|number} snowflake - The Discord snowflake.
 * @returns {number} Unix timestamp in seconds.
 * @throws {Error} If snowflake is invalid or too small.
 */
export const snowflakeToUnix = (snowflake) => {
    if (!isInt(snowflake)) {
        throw Error("snowflake is not an int");
    }

    if (Number(snowflake) < 4194304) {
        throw Error("Snowflake is too small");
    }

    const discordEpochSec = 1420070400;
    // https://discord.com/developers/docs/reference#snowflakes

    // Use BigInt to prevent js from using scientific notation
    const milliseconds = BigInt(snowflake) >> 22n;

    // Verify that the number is still within the safe range
    if (milliseconds > Number.MAX_SAFE_INTEGER) {
        throw Error("Number is outside the safe int range");
    }

    const seconds = Number(milliseconds / BigInt(1000));

    return seconds + discordEpochSec;
};

/**
 * The return value is how far off (in seconds) your tag is from when it happened on stream.
 * So an offset of -10 means the tag is 10 seconds before when it happened. and 10 means it is 10 seconds after when it happened.
 * @param {number} toUnix the timestamp from the transcript
 * @param {number} fromUnix the timestamp from snowflake message id
 * @param {number} defaultOffset the defaut offset taggerbot is set to
 * @returns {number} offset
 */
export const calculateOffset = (toUnix, fromUnix, defaultOffset) => {
    if (!isInt(toUnix) || !isInt(fromUnix) || !isInt(defaultOffset)) {
        throw Error("parameters need to be an int");
    }

    const offset = +fromUnix + +defaultOffset - +toUnix;
    return offset;
};

/**
 * Converts an offset value to a bot adjustment command.
 * @param {number|string} offset - The offset in seconds.
 * @returns {string} The adjustment command (e.g., "!adjust -10").
 */
export const offsetToCommand = (offset) => {
    if (!isInt(offset)) {
        throw Error("offset need to be an int");
    }

    const op = +offset > 0 ? "-" : "";

    return `!adjust ${op}${Math.abs(+offset)}`;
};
