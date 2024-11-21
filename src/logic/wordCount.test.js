import { describe, expect, test } from "vitest";
import { countWord } from "./wordCount";

describe("countWord", () => {
    test.each([
        ["", "", 0],
        ["1", "", 0],
        ["", "1", 0],
        ["1", "1", 1],
        ["abc", "1", 0],
        ["abc", "b", 1],
        ["ababa", "a", 3],
        ["ababa", "b", 2],
        ["ABC", "b", 1],
        ["ABABA", "a", 3],
        ["ABABA", "b", 2],
        ["abc", "B", 1],
        ["ababa", "A", 3],
        ["ababa", "B", 2],
        ["abABa", "A", 3],
        ["abABa", "B", 2],
        ["ab象ㄱ国くAba", "ab", 2],
        ["ab象ㄱ国くAba", "象", 1],
        ["ab象ㄱ国くAba", "ㄱ", 1],
        ["ab象ㄱ国くAba", "国", 1],
        ["ab象ㄱ国くAba", "く", 1],
    ])("countWord(%s, %s) -> %d", (text, word, expected) => {
        expect(countWord(text, word)).toBe(expected);
    });
});
