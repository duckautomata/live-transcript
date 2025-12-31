import { describe, expect, test } from "vitest";
import { genericCensor, mintCensor } from "./censors";

describe("genericCensor", () => {
    // Special tests that can't be generilzed
    test.each([
        ["example.com", "example's website"],
        ["www.example.com", "example's website"],
        ["http://example.com", "example's website"],
        ["https://example.com", "example's website"],
        ["http://www.example.com", "example's website"],
        ["https://www.example.com", "example's website"],
        ["aexample.com", "aexample's website"],
        ["example.coma", "example's websitea"],
        ["aexample.coma", "aexample's websitea"],
        ["xample.com", "xample's website"],
        ["example.co", "example's website"],
        ["example.com example.com", "example's website example's website"],
        [`"example.com"`, `"example's website"`],
        [`'example.com'`, `'example's website'`],
        [`(example.com)`, `(example's website)`],
        [`[example.com]`, `[example's website]`],
        [`-example.com-`, `-example's website-`],
        [`_example.com_`, `_example's website_`],
    ])("website genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["\\*", "*"],
        ["\\*test\\*", "*test*"],
        ["\\", ""],
        ["/", "/"],
    ])("esacape character genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["", ""],
        ["a", "a"],
        ["1", "1"],
        ["1 a", "00:01 a"],
        ["a 1", "a 1"],
        ["02 a", "00:02 a"],
        ["00:03 a", "00:03 a"],
        ["00:00 a", "00:01 a"],
    ])("tag time genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["01:01:01 !", "01:01:01 !"],
        ["01:01:01 !a", "01:01:01 !a"],
        ["01:01:01 !t", ""],
        ["01:01:01 !adjust", ""],
        ["01:01:01 example !adjust", "01:01:01 example !adjust"],
        ["01:01:01 example !t", "01:01:01 example !t"],
        ["01:01:01 !adjust example", ""],
        ["01:01:01 !t example", ""],
    ])("accidental tags genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["kill yourself", "go away"],
        ["akill yourself", "ago away"],
        ["kill yourselfa", "go awaya"],
        ["akill yourselfa", "ago awaya"],
        ["ill yourself", "ill yourself"],
        ["kill yoursel", "take out yoursel"],
        ["kill yourself kill yourself", "go away go away"],
        [`"kill yourself"`, `"go away"`],
        [`'kill yourself'`, `'go away'`],
        [`(kill yourself)`, `(go away)`],
        [`[kill yourself]`, `[go away]`],
        [`-kill yourself-`, `-go away-`],
        [`_kill yourself_`, `_go away_`],
    ])("kill yourself genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["#test", "hashtag-test"],
        ["a#test", "ahashtag-test"],
        ["#testa", "hashtag-testa"],
        ["a#testa", "ahashtag-testa"],
        ["#1", "#1"],
        ["#1a", "hashtag-1a"],
        ["#a1", "hashtag-a1"],
        ["# test", "# test"],
        ["#test #test", "hashtag-test hashtag-test"],
        [`"#test"`, `"hashtag-test"`],
        [`'#test'`, `'hashtag-test'`],
        [`(#test)`, `(hashtag-test)`],
        [`[#test]`, `[hashtag-test]`],
        [`-#test-`, `-hashtag-test-`],
        [`_#test_`, `_hashtag-test_`],
    ])("hashtag genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fucking", "f-ing"],
        ["afucking", "af-ing"],
        ["fuckinga", "f-inga"],
        ["afuckinga", "af-inga"],
        ["ucking", "ucking"],
        ["fuckin", "frickin"],
        ["uckin", "uckin"],
        ["fucking fucking", "f-ing f-ing"],
        [`"fucking"`, `"f-ing"`],
        [`'fucking'`, `'f-ing'`],
        [`(fucking)`, `(f-ing)`],
        [`[fucking]`, `[f-ing]`],
        [`-fucking-`, `-f-ing-`],
        [`_fucking_`, `_f-ing_`],
    ])("fucking genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["18+", "00:18 up"],
        ["a18+", "a18 up"],
        ["18+a", "00:18 upa"],
        ["a18+a", "a18 upa"],
        ["8+", "8+"],
        ["18", "18"],
        ["118+", "118+"],
        ["18+ 18+", "00:18 up 18 up"],
        [`"18+"`, `"18 up"`],
        [`'18+'`, `'18 up'`],
        [`(18+)`, `(18 up)`],
        [`[18+]`, `[18 up]`],
        [`-18+-`, `-18 up-`],
        [`_18+_`, `_18 up_`],
    ])("18+ genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["half-naked", "almost dressed"],
        ["ahalf-naked", "ahalf-non dressed"],
        ["half-nakeda", "almost dresseda"],
        ["ahalf-nakeda", "ahalf-non dresseda"],
        ["alf-naked", "alf-non dressed"],
        ["half-nake", "half-nake"],
        ["alf-nake", "alf-nake"],
        ["half-naked half-naked", "almost dressed almost dressed"],
        [`"half-naked"`, `"almost dressed"`],
        [`'half-naked'`, `'almost dressed'`],
        [`(half-naked)`, `(almost dressed)`],
        [`[half-naked]`, `[almost dressed]`],
        [`-half-naked-`, `-almost dressed-`],
        [`_half-naked_`, `_almost dressed_`],
    ])("half-naked genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fisting", "punching"],
        ["afisting", "apunching"],
        ["fistinga", "punchinga"],
        ["afistinga", "apunchinga"],
        ["isting", "isting"],
        ["fistin", "handin"],
        ["istin", "istin"],
        ["fisting fisting", "punching punching"],
        [`"fisting"`, `"punching"`],
        [`'fisting'`, `'punching'`],
        [`(fisting)`, `(punching)`],
        [`[fisting]`, `[punching]`],
        [`-fisting-`, `-punching-`],
        [`_fisting_`, `_punching_`],
    ])("fisting genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["gooner", "degen"],
        ["agooner", "adegen"],
        ["goonera", "degena"],
        ["agoonera", "adegena"],
        ["ooner", "ooner"],
        ["goone", "go-one"],
        ["ooner", "ooner"],
        ["gooner gooner", "degen degen"],
        [`"gooner"`, `"degen"`],
        [`'gooner'`, `'degen'`],
        [`(gooner)`, `(degen)`],
        [`[gooner]`, `[degen]`],
        [`-gooner-`, `-degen-`],
        [`_gooner_`, `_degen_`],
    ])("gooner genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fag", "person"],
        ["fagg", "person"],
        ["faggot", "person"],
        ["afag", "afag"],
        ["afagg", "afagg"],
        ["afaggot", "aperson"],
        ["aggot", "aggot"],
        ["fag fag", "person person"],
        ["fagg fagg", "person person"],
        ["faggot faggot", "person person"],
        [`"fag"`, `"person"`],
        [`"fagg"`, `"person"`],
        [`"faggot"`, `"person"`],
        [`'fag'`, `'person'`],
        [`'fagg'`, `'person'`],
        [`'faggot'`, `'person'`],
        [`(fag)`, `(person)`],
        [`(fagg)`, `(person)`],
        [`(faggot)`, `(person)`],
        [`[fag]`, `[person]`],
        [`[fagg]`, `[person]`],
        [`[faggot]`, `[person]`],
        [`-fag-`, `-person-`],
        [`-fagg-`, `-person-`],
        [`-faggot-`, `-person-`],
        [`_fag_`, `_person_`],
        [`_fagg_`, `_person_`],
        [`_faggot_`, `_person_`],
    ])("fag genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    /**
     * Helper to generate 12 test cases for a word
     * @param {string} word
     * @param {string} replacement
     * @param {"prefix" | "full" | "literal"} type
     */
    function createCensorTests(word, replacement, type) {
        const cases = [];

        // 1. word with 1 letter missing at the end (if len > 1)
        // Don't do this for "s" because the s-less version already has a test
        if (word.length > 1 && word.charAt(word.length - 1) !== "s") {
            const partial = word.slice(0, -1);
            // Expected: no match (unless it matches another pattern, assuming isolated)
            cases.push([partial, partial]);
        }

        // 2. word with 1 letter missing at the start (if len > 1)
        if (word.length > 1) {
            const partial = word.slice(1);
            // Expected: no match
            cases.push([partial, partial]);
        }

        // 3. Word itself
        cases.push([word, replacement]);

        // 4. word with an extra letter in front of it
        // e.g. "aword"
        // If type is prefix or full, boundary check prevents match.
        // If type is literal, it might match if regex is just string.
        const prefixInput = "a" + word;
        let prefixExpected = prefixInput;
        if (type === "literal") {
            // Literal "kill yourself" matches in "akill yourself".
            // Replacement: "a" + replacement
            prefixExpected = "a" + replacement;
        }
        cases.push([prefixInput, prefixExpected]);

        // 5. word with an extra letter behind it
        // e.g. "worda"
        // If type is prefix, it matches start boundary, replacing "word" -> "replacement". "a" remains. -> "replacementa"
        // If type is full, it enforces end boundary. "worda" -> no match -> "worda"
        // If type is literal, it matches. -> "replacementa"
        const suffixInput = word + "a";
        let suffixExpected = suffixInput;
        if (type === "prefix" || type === "literal") {
            suffixExpected = replacement + "a";
        }
        // Special case handling for regexes that might capture groups incorrectly in this simple logic
        // But generally correct for censors.js logic.
        cases.push([suffixInput, suffixExpected]);

        // 6. two of the same words in the same string
        cases.push([`${word} ${word}`, `${replacement} ${replacement}`]);

        // 7. word wrapped in ""
        cases.push([`"${word}"`, `"${replacement}"`]);

        // 8. word wrapped in ''
        cases.push([`'${word}'`, `'${replacement}'`]);

        // 9. word wrapped in ()
        cases.push([`(${word})`, `(${replacement})`]);

        // 10. word wrapped in []
        cases.push([`[${word}]`, `[${replacement}]`]);

        // 11. word wrapped in --
        cases.push([`-${word}-`, `-${replacement}-`]);

        // 12. word wrapped in __
        cases.push([`_${word}_`, `_${replacement}_`]);

        return cases;
    }

    // Define the word lists and types
    // Type "prefix": Regex is P(word). Matches boundary start. Suffix allowed.
    // Type "full": Regex is P(word)P. Matches boundary start and end. Exact word.
    // Type "literal": Regex is just string literal (or simple regex without boundary char logic).

    const prefixWords = [
        // Section 2
        ["nigg", "person"],
        ["dyke", "person"],
        ["retard", "person"],
        ["tranny", "person"],
        ["chink", "person"],
        ["kike", "person"],
        ["jew", "person"],
        ["gypsy", "person"],
        ["mongol", "person"],
        ["cult", "group"],

        // Section 3
        ["suicide", "go to sleep"],
        ["stays alive", "keep going"],
        ["kill", "take out"],
        ["murder", "attack"],
        ["predator", "hunter"],
        ["rape", "r*pe"],
        ["rapist", "r*pist"],
        ["shoot", "pew-pew"],
        ["stab", "st*b"],
        ["torture", "horror"],
        ["bomb", "tnt"],
        ["grenade", "hand-tnt"],
        ["missile", "rocket"],
        ["gun", "pew-pew"],
        ["terrorist", "ter-or-st"],

        // Section 4
        ["ntr", "cheating"],
        ["dick", "d*ck"],
        ["cock", "c*ck"],
        ["cuck", "cu*k"],
        ["penis", "p*nis"],
        ["vagin", "v*gin"],
        ["clit", "c*it"],
        ["cunt", "c*nt"],
        ["anal", "a*al"],
        ["anus", "a*us"],
        ["booty", "b**ty"],
        ["boner", "b*ner"],
        ["dildo", "d**do"],
        ["sex", "s*x"],
        ["porn", "grown up anime"],
        ["goon", "go-on"],
        ["coomer", "degen"],
        ["edging", "close"],
        ["mpreg", "birth"],
        ["loli", "little"],
        ["shota", "little"],
        ["pedo", "bad"],
        ["groomer", "cleaning"],
        ["breed", "act"],
        ["bukkake", "paint"],
        ["masturbate", "m*sturbate"],
        ["orgasm", "o*gasm"],
        ["incest", "i*cest"],
        ["waifu", "w*ifu"],
        ["ball", "b*ll"],
        ["sperm", "sp*rm"],
        ["cum", "c*m"],
        ["comming", "coming"],
        ["nipple", "n*pple"],
        ["tits", "chest"],
        ["tity", "chest"],
        ["titties", "chest"],
        ["cleavage", "chest"],
        ["boob", "chest"],
        ["boobs", "chests"],
        ["butt", "rear"],
        ["thigh", "leg"],
        ["fist", "hand"],
        ["naked", "non dressed"],
        ["nude", "non dressed"],
        ["freak", "wild"],
        ["pee", "leak"],
        ["simp", "fawn"],
        ["throb", "boop"],
        ["condom", "cond*m"],
        ["strip", "line"],
        ["bitch", "b*tch"],
        ["slut", "sl*t"],
        ["whore", "wh*re"],
        ["whoring", "wh*ring"],
        ["gangbang", "g*ngb*ng"],

        // Section 5
        ["fuck", "frick"],
        ["shit", "rot"],
        ["asshole", "mean person"],
        ["asshat", "mean person"],
        ["bastard", "rat"],
        ["damn", "darn"],
        ["crap", "nonsense"],
        ["piss", "leak"],
        ["douche", "rascal"],
        ["jackass", "donkey"],

        // Section 6
        ["dumbass", "birdbrain"],
        ["stupid", "unsmart"],
        ["idiot", "fool"],
        ["loser", "nonwinner"],
        ["racist", "narrow-minded"],
        ["pervert", "degen"],
        ["hitler", "person"],
        ["nazi", "person"],

        // Section 7
        ["crypto", "digital"],
        ["bitcoin", "digital"],
        ["whatsapp", "social media"],
        ["telegram", "social media"],

        // Social Media
        ["message", "chat"],
        ["messaging", "chat"],
        ["comment", "chat"],
        ["twitter", "social media"],
        ["twitch", "social media"],
        ["tiktok", "social media"],
        ["facebook", "social media"],
        ["insta", "social media"],
        ["discord", "social media"],

        // Section 8
        ["covid", "flu"],
        ["drug", "medicine"],
        ["weed", "medicine"],
        ["cocaine", "medicine"],
        ["heroin", "medicine"],
        ["methamphetamine", "medicine"],
        ["amphetamine", "medicine"],
        ["ecstasy", "medicine"],
        ["MDMA", "medicine"],
        ["pill", "medicine"],
        ["pills", "medicine"],
        ["acid", "medicine"],
        ["ammo", "rounds"],
        ["bullet", "rounds"],
        ["bullets", "rounds"],
        ["casino", "bet"],
        ["slot", "bet"],
        ["slots", "bet"],
        ["roulette", "bet"],
        ["poker", "bet"],
        ["baccarat", "bet"],
        ["blackjack", "bet"],
        ["gamble", "bet"],
        ["gambling", "bet"],

        // Section 9
        ["snuff", "extinguish"],
        ["snuffles", "racoon friends"],
    ];

    // P(word)P
    const fullWords = [
        ["trap", "ambush"],
        ["gay", "loving"],
        ["lesbian", "loving"],
        ["homosexual", "loving"],
        ["bisexual", "loving"],
        ["trans", "loving"],
        ["queer", "loving"],
        ["ass", "bad"],
    ];

    // word in any position
    const literalWords = [
        ["white boy", "boy"],
        ["hentai", "grown up anime"],
        ["pussy", "pu*sy"],
        ["pussies", "pu*sies"],
    ];

    // Execution
    prefixWords.forEach(([word, repl]) => {
        test.each(createCensorTests(word, repl, "prefix"))(`prefix word genericCensor(%s) -> %s`, (text, expected) => {
            expect(genericCensor(text)).toBe(expected);
        });
    });

    fullWords.forEach(([word, repl]) => {
        test.each(createCensorTests(word, repl, "full"))(`full word genericCensor(%s) -> %s`, (text, expected) => {
            expect(genericCensor(text)).toBe(expected);
        });
    });

    literalWords.forEach(([word, repl]) => {
        test.each(createCensorTests(word, repl, "literal"))(
            `literal word genericCensor(%s) -> %s`,
            (text, expected) => {
                expect(genericCensor(text)).toBe(expected);
            },
        );
    });
});

describe("mintCensor", () => {
    test.each([
        ["memboo", "memboo"],
        [":", ":"],
        [":membo", ":membo"],
        [":memboo", ":_"],
        [":membootest", ":_test"],
        [":membootest:", ":_test:"],
        ["tra:membootest:", "tra:_test:"],
        [":MEMBOOtest:", ":_test:"],
        [":Membootest:", ":_test:"],
        [":membootest: a :membootest:", ":_test: a :_test:"],
        [":membootest:'d", ":_test:'d"],
        [":membootest:ed", ":_test:ed"],
        [":membootest:ing", ":_test:ing"],
        ['":membootest:"', '":_test:"'],
        ["':membootest:'", "':_test:'"],
        ["(:membootest:)", "(:_test:)"],
        ["[:membootest:]", "[:_test:]"],
        ["-:membootest:-", "-:_test:-"],
        ["_:membootest:_", "_:_test:_"],
    ])("memboo emote mintCensor(%s) -> %s", (text, expected) => {
        expect(mintCensor(text)).toBe(expected);
    });
});
