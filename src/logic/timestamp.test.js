import { describe, expect, test } from "vitest";
import { calculateOffset, offsetToCommand, snowflakeToUnix } from "./timestamp";

describe("snowflakeToUnix", () => {
    test.each([
        [1295269071415283733, 1728886611],
        ["1295269071415283733", 1728886611],
        [1297390122215673906, 1729392309],
        ["1297390122215673906", 1729392309],
        [129526907141283733, 1450952021],
        ["129526907141283733", 1450952021],
        [12952690714128373399, 4508232515],
        ["12952690714128373399", 4508232515],
        [12952690000, 1420070403],
        ["12952690000", 1420070403],
    ])("snowflakeToUnix(%s) -> %s", (id, expected) => {
        expect(snowflakeToUnix(id)).toBe(expected);
    });

    test.each([
        ["", true],
        ["a", true],
        ["-a", true],
        ["1a", true],
        [
            "11111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
            true,
        ],
        ["NaN", true],
        ["null", true],
        [null, true],
        [undefined, true],
        ["undefined", true],
        ["1.2e*10^11", true],
        ["1.1e+10", true],
        [1.11e10, false],
    ])("snowflakeToUnix(%s) should throw error: %s", (id, shouldThrow) => {
        if (shouldThrow) {
            expect(() => snowflakeToUnix(id)).toThrowError();
        } else {
            expect(() => snowflakeToUnix(id)).not.toThrowError();
        }
    });
});

describe("calculateOffset", () => {
    test.each([
        [1728886610, 1728886610, 0, 0],
        [1728886610, 1728886610, -10, -10],
        [1728886610, 1728886610, 10, 10],
        [1728886610, 1728886620, 0, 10],
        [1728886610, 1728886620, -10, 0],
        [1728886610, 1728886620, 10, 20],
        ["1728886610", "1728886610", "0", 0],
        ["1728886610", "1728886610", "-10", -10],
        ["1728886610", "1728886610", "10", 10],
        ["1728886610", "1728886620", "0", 10],
        ["1728886610", "1728886620", "-10", 0],
        ["1728886610", "1728886620", "10", 20],
    ])("calculateOffset(%s, %s, %s) -> %s", (to, from, dOffset, expected) => {
        expect(calculateOffset(to, from, dOffset)).toBe(expected);
    });
});

describe("offsetToCommand", () => {
    test.each([
        [0, "!adjust 0"],
        ["0", "!adjust 0"],
        [1, "!adjust -1"],
        ["1", "!adjust -1"],
        [-1, "!adjust 1"],
        ["-1", "!adjust 1"],
    ])("offsetToCommand(%s) -> %s", (offset, expected) => {
        expect(offsetToCommand(offset)).toBe(expected);
    });
});
