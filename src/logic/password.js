/**
 * Generated passwords for the account forms. A generated password is meant
 * to live in a password manager, not a memory, so it is long and drawn from
 * a wide alphabet - but without the characters people mistake for each other
 * (0/O, 1/l/I), in case one ever has to be typed from a screen.
 */

export const GENERATED_PASSWORD_LENGTH = 32;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+?";

/**
 * A random password from the browser's cryptographic generator. Each
 * character is chosen by rejection sampling so every alphabet character is
 * equally likely; with 66 symbols that is about 6 bits per character, so
 * the default length carries roughly 190 bits of entropy.
 * @param {number} [length]
 * @returns {string}
 */
export function generatePassword(length = GENERATED_PASSWORD_LENGTH) {
    const cryptoApi = globalThis.crypto;
    if (!cryptoApi || typeof cryptoApi.getRandomValues !== "function") {
        throw new Error("This browser cannot generate random passwords.");
    }
    // The largest multiple of the alphabet size that fits a byte: bytes at or
    // above it are discarded rather than folded, which would skew the draw.
    const limit = 256 - (256 % ALPHABET.length);
    const out = [];
    const buffer = new Uint8Array(length * 2);
    while (out.length < length) {
        cryptoApi.getRandomValues(buffer);
        for (let i = 0; i < buffer.length && out.length < length; i++) {
            if (buffer[i] < limit) out.push(ALPHABET[buffer[i] % ALPHABET.length]);
        }
    }
    return out.join("");
}

/** The characters generatePassword draws from, for tests and hints. */
export const GENERATED_PASSWORD_ALPHABET = ALPHABET;
