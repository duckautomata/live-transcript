import { describe, expect, it } from "vitest";
import { GENERATED_PASSWORD_ALPHABET, GENERATED_PASSWORD_LENGTH, generatePassword } from "./password";

describe("generatePassword", () => {
    it("is 32 characters from the alphabet by default", () => {
        const pw = generatePassword();
        expect(pw).toHaveLength(GENERATED_PASSWORD_LENGTH);
        expect(GENERATED_PASSWORD_LENGTH).toBe(32);
        for (const ch of pw) expect(GENERATED_PASSWORD_ALPHABET).toContain(ch);
    });

    it("honours a length and never repeats itself", () => {
        expect(generatePassword(12)).toHaveLength(12);
        const seen = new Set(Array.from({ length: 50 }, () => generatePassword()));
        expect(seen.size).toBe(50);
    });

    it("leaves out the characters people confuse", () => {
        for (const ch of "0O1lI") expect(GENERATED_PASSWORD_ALPHABET).not.toContain(ch);
    });

    it("uses every part of the alphabet over many draws", () => {
        const counts = new Map();
        for (let i = 0; i < 200; i++) for (const ch of generatePassword()) counts.set(ch, (counts.get(ch) || 0) + 1);
        for (const ch of GENERATED_PASSWORD_ALPHABET) expect(counts.get(ch) || 0).toBeGreaterThan(0);
    });
});
