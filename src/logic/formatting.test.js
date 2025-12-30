import { describe, expect, test } from "vitest";
import { chapter_formatting, collection_formatting, compareKeys, HBD_formatting } from "./formatting";

const hbdText = "Dragoon Birthdays";
const hbdHeader = `*${hbdText}*`;

describe("compareKeys", () => {
    test.each([
        ["", "", 100],
        [" ", "", 100],
        ["", " ", 100],
        ["a", "a", 100],
        ["a Bc", "Ab c", 100],
        ["a", "", 0],
        ["0123456789", "0123456789", 100],
        ["0123456789", "_123456789", 90],
        ["01234_6789", "0123456789", 90],
        ["01234__789", "0123456789", 80],
        ["0123456789", "0_23456_89", 80],
        ["0123456__c", "0123456789", 70],
        ["0123456789", "0_2_4c6789", 70],
        ["012345____", "0123456789", 60],
        ["0123456789", "01_34__78_", 60],
        ["01", "00", 50],
        ["012345678", "0012345678", 90],
        ["Life Update", "lifeupdates", 90],
        ["update", "updates", 85],
        ["hbd", "HBD's", 60],
        ["boss", "bosses", 66],
        ["Chapter", "Chapter's", 77],
    ])("compareKeys(%s, %s) -> %s", (key1, key2, expected) => {
        expect(compareKeys(key1, key2)).toBe(expected);
    });
});

describe("HBD_formatting", () => {
    test.each([
        ["", ""],
        [" ", " "],
        [" a ", " a "],
        ["\na\n", "\na\n"],
        [undefined, ""],
        ["\n preserve \n\n\tformatting\n", "\n preserve \n\n\tformatting\n"],
        ["hbd", "hbd"],
        ["00:01 example", "00:01 example"],
        ["00:01 hbd", `${hbdHeader}\n00:01`],
        ["\n00:01 hbd test\n", `${hbdHeader}\n00:01 test`],
        ["\n00:01 hbd test\n\n\n\n00:02 hbd test2\n\n", `${hbdHeader}\n00:01 test\n00:02 test2`],
        ["00:01 example\n00:02 hbd", `00:01 example\n\n${hbdHeader}\n00:02`],
        ["00:01 hbd\n00:02 example", `00:02 example\n\n${hbdHeader}\n00:01`],
        ["00:01 hbd\n00:02 example\n00:03 hbd", `00:02 example\n\n${hbdHeader}\n00:01\n00:03`],
        [
            "00:01 hbd name\n00:02 example\n00:03 hbd multiple space names",
            `00:02 example\n\n${hbdHeader}\n00:01 name\n00:03 multiple space names`,
        ],
        [
            "00:01 HBD name\n00:02 hBd\n00:03 HbD multiple space names",
            `${hbdHeader}\n00:01 name\n00:02\n00:03 multiple space names`,
        ],
        [
            "00:01 hbd name\n00:02 example\n00:03 hbd dude but gets another hbd !",
            `00:02 example\n\n${hbdHeader}\n00:01 name\n00:03 dude but gets another hbd !`,
        ],
    ])("HBD_formatting(%s) -> %s", (tags, expected) => {
        expect(HBD_formatting(tags, hbdText)).toBe(expected);
    });
});

describe("chapter_formatting", () => {
    test.each([
        ["", ""],
        [" ", " "],
        [" a ", " a "],
        ["\na\n", "\na\n"],
        [undefined, ""],
        ["\n preserve \n\n\tformatting\n", "\n preserve \n\n\tformatting\n"],
        ["test", "test"],
        ["00:01 example", "00:01 example"],
        ["00:01 [chapter]", "*chapter*"],
        ["00:01 [chapter] test", "*chapter*\n00:01 test"],
        ["00:01 [chapter] test\n00:02 test2", "*chapter*\n00:01 test\n00:02 test2"],
        ["00:01 first tag\n00:02 [chapter] test", "00:01 first tag\n\n*chapter*\n00:02 test"],
        ["00:01 first tag\n00:02 [start]\n00:03 third", "00:01 first tag\n\n*start*\n00:03 third"],
        [
            "00:01 first tag\n00:02 [start]\n00:03 third\n00:04 example tag\n00:05 [Next chapter] this is a chapter tag",
            "00:01 first tag\n\n*start*\n00:03 third\n00:04 example tag\n\n*Next chapter*\n00:05 this is a chapter tag",
        ],
    ])("chapter_formatting(%s) -> %s", (tags, expected) => {
        expect(chapter_formatting(tags)).toBe(expected);
    });
});

describe("collection_formatting", () => {
    test.each([
        ["", ""],
        [" ", " "],
        [" a ", " a "],
        ["\na\n", "\na\n"],
        [undefined, ""],
        ["\n preserve \n\n\tformatting\n", "\n preserve \n\n\tformatting\n"],
        ["test", "test"],
        ["00:01 example", "00:01 example"],
        ["00:01 ab::", "*ab*\n00:01"],
        ["00:01 ab ::", "*ab*\n00:01"],
        ["00:01 ab::text", "*ab*\n00:01 text"],
        ["00:01 ab ::text", "*ab*\n00:01 text"],
        ["00:01 ab :: text", "*ab*\n00:01 text"],
        ["00:01 Ab::text", "*Ab*\n00:01 text"],
        ["00:01 AB::text\n00:02 ab::text2\n00:03 aB::text3", "*AB*\n00:01 text\n00:02 text2\n00:03 text3"],
        ["00:01 ab::multi space text", "*ab*\n00:01 multi space text"],
        [
            "00:01 ab : ::multi space text :: with more than one :: bracket",
            "*ab :*\n00:01 multi space text :: with more than one :: bracket",
        ],
        ["00:01 normal\n00:02 ab::text", "*ab*\n00:02 text\n\n00:01 normal"],
        ["00:01 normal\n00:02 ab::text\n00:03 ab::text2", "*ab*\n00:02 text\n00:03 text2\n\n00:01 normal"],
        ["00:01 normal\n00:02 ab::text\n00:03 text2", "*ab*\n00:02 text\n\n00:01 normal\n00:03 text2"],
        [
            "00:01 normal\n00:02 ab::text\n00:03 ab::text2\n00:04 normal2\n00:05 ac::textC1\n00:06 ac::textC2\n00:07 normal3",
            "*ab*\n00:02 text\n00:03 text2\n\n*ac*\n00:05 textC1\n00:06 textC2\n\n00:01 normal\n00:04 normal2\n00:07 normal3",
        ],
    ])("collection_formatting(%s) -> %s", (tags, expected) => {
        expect(collection_formatting(tags)).toBe(expected);
    });
});

describe("Formatting is commutative", () => {
    const data = [
        ["", ""],
        [" ", " "],
        [" a ", " a "],
        ["\na\n", "\na\n"],
        [undefined, ""],
        ["\n preserve \n\n\tformatting\n", "\n preserve \n\n\tformatting\n"],
        ["hbd", "hbd"],
        ["00:01 example", "00:01 example"],
        ["00:01 hbd", `${hbdHeader}\n00:01`],
        ["\n00:01 hbd test\n", `${hbdHeader}\n00:01 test`],
        ["\n00:01 hbd test\n\n\n\n00:02 hbd test2\n\n", `${hbdHeader}\n00:01 test\n00:02 test2`],
        ["00:01 example\n00:02 hbd", `00:01 example\n\n${hbdHeader}\n00:02`],
        ["00:01 hbd\n00:02 example", `00:02 example\n\n${hbdHeader}\n00:01`],
        ["00:01 hbd\n00:02 example\n00:03 hbd", `00:02 example\n\n${hbdHeader}\n00:01\n00:03`],
        [
            "00:01 hbd name\n00:02 example\n00:03 hbd multiple space names",
            `00:02 example\n\n${hbdHeader}\n00:01 name\n00:03 multiple space names`,
        ],
        [
            "00:01 HBD name\n00:02 hBd\n00:03 HbD multiple space names",
            `${hbdHeader}\n00:01 name\n00:02\n00:03 multiple space names`,
        ],
        [
            "00:01 hbd name\n00:02 example\n00:03 hbd dude but gets another hbd !",
            `00:02 example\n\n${hbdHeader}\n00:01 name\n00:03 dude but gets another hbd !`,
        ],
        ["test", "test"],
        ["00:01 example", "00:01 example"],
        ["00:01 [chapter]", "*chapter*"],
        ["00:01 [chapter] test", "*chapter*\n00:01 test"],
        ["00:01 [chapter] test\n00:02 test2", "*chapter*\n00:01 test\n00:02 test2"],
        ["00:01 first tag\n00:02 [chapter] test", "00:01 first tag\n\n*chapter*\n00:02 test"],
        ["00:01 first tag\n00:02 [start]\n00:03 third", "00:01 first tag\n\n*start*\n00:03 third"],
        [
            "00:01 first tag\n00:02 [start]\n00:03 third\n00:04 example tag\n00:05 [Next chapter] this is a chapter tag",
            "00:01 first tag\n\n*start*\n00:03 third\n00:04 example tag\n\n*Next chapter*\n00:05 this is a chapter tag",
        ],
        ["00:01 ab::", "*ab*\n00:01"],
        ["00:01 ab ::", "*ab*\n00:01"],
        ["00:01 ab::text", "*ab*\n00:01 text"],
        ["00:01 ab ::text", "*ab*\n00:01 text"],
        ["00:01 ab :: text", "*ab*\n00:01 text"],
        ["00:01 Ab::text", "*Ab*\n00:01 text"],
        ["00:01 AB::text\n00:02 ab::text2\n00:03 aB::text3", "*AB*\n00:01 text\n00:02 text2\n00:03 text3"],
        ["00:01 ab::multi space text", "*ab*\n00:01 multi space text"],
        [
            "00:01 ab : ::multi space text :: with more than one :: bracket",
            "*ab :*\n00:01 multi space text :: with more than one :: bracket",
        ],
        ["00:01 normal\n00:02 ab::text", "*ab*\n00:02 text\n\n00:01 normal"],
        ["00:01 normal\n00:02 ab::text\n00:03 ab::text2", "*ab*\n00:02 text\n00:03 text2\n\n00:01 normal"],
        ["00:01 normal\n00:02 ab::text\n00:03 text2", "*ab*\n00:02 text\n\n00:01 normal\n00:03 text2"],
        [
            "00:01 normal\n00:02 ab::text\n00:03 ab::text2\n00:04 normal2\n00:05 ac::textC1\n00:06 ac::textC2\n00:07 normal3",
            "*ab*\n00:02 text\n00:03 text2\n\n*ac*\n00:05 textC1\n00:06 textC2\n\n00:01 normal\n00:04 normal2\n00:07 normal3",
        ],
    ];
    // A: HBD_formatting
    // B: chapter_formatting
    // C: collection_formatting
    // All possible permutations (without repetition):  abc, acb, bac, bca, cab, cba
    test.each(data)("A(B(C(%s))) -> %s", (tags, expected) => {
        expect(HBD_formatting(chapter_formatting(collection_formatting(tags)), hbdText)).toBe(expected);
    });
    test.each(data)("A(C(B(%s))) -> %s", (tags, expected) => {
        expect(HBD_formatting(collection_formatting(chapter_formatting(tags)), hbdText)).toBe(expected);
    });
    test.each(data)("B(A(C(%s))) -> %s", (tags, expected) => {
        expect(chapter_formatting(HBD_formatting(collection_formatting(tags), hbdText))).toBe(expected);
    });
    test.each(data)("B(C(A(%s))) -> %s", (tags, expected) => {
        expect(chapter_formatting(collection_formatting(HBD_formatting(tags, hbdText)))).toBe(expected);
    });
    test.each(data)("C(A(B(%s))) -> %s", (tags, expected) => {
        expect(collection_formatting(HBD_formatting(chapter_formatting(tags), hbdText))).toBe(expected);
    });
    test.each(data)("C(B(A(%s))) -> %s", (tags, expected) => {
        expect(collection_formatting(chapter_formatting(HBD_formatting(tags, hbdText)))).toBe(expected);
    });
});
