import { describe, expect, test } from "vitest";
import { genericCensor, mintCensor } from "./censors";

describe("genericCensor", () => {
    test.each([
        ["nt", "nt"],
        ["ntr", "n*r"],
        ["tr", "tr"],
        ["bintr", "bintr"],
        ["NTR", "N*R"],
        ["Ntr", "N*r"],
        ["ntr a ntr", "n*r a n*r"],
        ["ntr'd", "n*r'd"],
        ["ntred", "n*red"],
        ["ntring", "n*ring"],
        ['"ntr"', '"n*r"'],
        ["'ntr'", "'n*r'"],
        ["(ntr)", "(n*r)"],
        ["-ntr-", "-n*r-"],
        ["_ntr_", "_n*r_"],
    ])("ntr genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["dic", "dic"],
        ["dick", "d*ck"],
        ["ick", "ick"],
        ["tradick", "tradick"],
        ["DICK", "D*CK"],
        ["Dick", "D*ck"],
        ["dick a dick", "d*ck a d*ck"],
        ["dick'd", "d*ck'd"],
        ["dicked", "d*cked"],
        ["dicking", "d*cking"],
        ['"dick"', '"d*ck"'],
        ["'dick'", "'d*ck'"],
        ["(dick)", "(d*ck)"],
        ["-dick-", "-d*ck-"],
        ["_dick_", "_d*ck_"],
    ])("dick genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["coc", "coc"],
        ["cock", "c*ck"],
        ["ock", "ock"],
        ["tracock", "tracock"],
        ["COCK", "C*CK"],
        ["Cock", "C*ck"],
        ["cock a cock", "c*ck a c*ck"],
        ["cock'd", "c*ck'd"],
        ["cocked", "c*cked"],
        ["cocking", "c*cking"],
        ['"cock"', '"c*ck"'],
        ["'cock'", "'c*ck'"],
        ["(cock)", "(c*ck)"],
        ["-cock-", "-c*ck-"],
        ["_cock_", "_c*ck_"],
    ])("cock genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["cuc", "cuc"],
        ["cuck", "cu*k"],
        ["uck", "uck"],
        ["tracuck", "tracuck"],
        ["CUCK", "CU*K"],
        ["Cuck", "Cu*k"],
        ["cuck a cuck", "cu*k a cu*k"],
        ["cuck'd", "cu*k'd"],
        ["cucked", "cu*ked"],
        ["cucking", "cu*king"],
        ['"cuck"', '"cu*k"'],
        ["'cuck'", "'cu*k'"],
        ["(cuck)", "(cu*k)"],
        ["-cuck-", "-cu*k-"],
        ["_cuck_", "_cu*k_"],
    ])("cuck genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fucking", "f-ing"],
        ["ucking", "ucking"],
        ["trafucking", "trafucking"],
        ["FUCKING", "F-ING"],
        ["Fucking", "F-ing"],
        ["fucking a fucking", "f-ing a f-ing"],
        ["fucking'd", "f-ing'd"],
        ['"fucking"', '"f-ing"'],
        ["'fucking'", "'f-ing'"],
        ["(fucking)", "(f-ing)"],
        ["-fucking-", "-f-ing-"],
        ["_fucking_", "_f-ing_"],
    ])("fucking genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fuc", "fuc"],
        ["fuck", "f*ck"],
        ["trafuck", "trafuck"],
        ["FUCK", "F*CK"],
        ["Fuck", "F*ck"],
        ["fuck a fuck", "f*ck a f*ck"],
        ["fuck'd", "f*ck'd"],
        ["fucked", "f*cked"],
        ['"fuck"', '"f*ck"'],
        ["'fuck'", "'f*ck'"],
        ["(fuck)", "(f*ck)"],
        ["-fuck-", "-f*ck-"],
        ["_fuck_", "_f*ck_"],
    ])("fuck genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["shi", "shi"],
        ["shit", "sh*t"],
        ["hit", "hit"],
        ["trashit", "trashit"],
        ["SHIT", "SH*T"],
        ["Shit", "Sh*t"],
        ["shit a shit", "sh*t a sh*t"],
        ["shit'd", "sh*t'd"],
        ["shitted", "sh*tted"],
        ["shitting", "sh*tting"],
        ['"shit"', '"sh*t"'],
        ["'shit'", "'sh*t'"],
        ["(shit)", "(sh*t)"],
        ["-shit-", "-sh*t-"],
        ["_shit_", "_sh*t_"],
    ])("shit genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["whor", "whor"],
        ["whore", "wh*re"],
        ["ore", "ore"],
        ["trawhore", "trawhore"],
        ["WHORE", "WH*RE"],
        ["Whore", "Wh*re"],
        ["whore a whore", "wh*re a wh*re"],
        ["whore'd", "wh*re'd"],
        ["whored", "wh*red"],
        ["whoring", "wh*ring"],
        ['"whore"', '"wh*re"'],
        ["'whore'", "'wh*re'"],
        ["(whore)", "(wh*re)"],
        ["-whore-", "-wh*re-"],
        ["_whore_", "_wh*re_"],
        ['"whoring"', '"wh*ring"'],
        ["'whoring'", "'wh*ring'"],
        ["(whoring)", "(wh*ring)"],
        ["-whoring-", "-wh*ring-"],
        ["_whoring_", "_wh*ring_"],
    ])("whore genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["slu", "slu"],
        ["slut", "sl*t"],
        ["lut", "lut"],
        ["traslut", "traslut"],
        ["SLUT", "SL*T"],
        ["Slut", "Sl*t"],
        ["slut a slut", "sl*t a sl*t"],
        ["slut'd", "sl*t'd"],
        ["slutted", "sl*tted"],
        ["slutting", "sl*tting"],
        ['"slut"', '"sl*t"'],
        ["'slut'", "'sl*t'"],
        ["(slut)", "(sl*t)"],
        ["-slut-", "-sl*t-"],
        ["_slut_", "_sl*t_"],
    ])("slut genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["bitc", "bitc"],
        ["bitch", "b*tch"],
        ["itch", "itch"],
        ["trabitch", "trabitch"],
        ["BITCH", "B*TCH"],
        ["Bitch", "B*tch"],
        ["bitch a bitch", "b*tch a b*tch"],
        ["bitch'd", "b*tch'd"],
        ["bitched", "b*tched"],
        ["bitching", "b*tching"],
        ['"bitch"', '"b*tch"'],
        ["'bitch'", "'b*tch'"],
        ["(bitch)", "(b*tch)"],
        ["-bitch-", "-b*tch-"],
        ["_bitch_", "_b*tch_"],
    ])("bitch genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["stri", "stri"],
        ["strip", "str*p"],
        ["trip", "trip"],
        ["trastrip", "trastrip"],
        ["STRIP", "STR*P"],
        ["Strip", "Str*p"],
        ["strip a strip", "str*p a str*p"],
        ["strip'd", "str*p'd"],
        ["stripped", "str*pped"],
        ["stripping", "str*pping"],
        ['"strip"', '"str*p"'],
        ["'strip'", "'str*p'"],
        ["(strip)", "(str*p)"],
        ["-strip-", "-str*p-"],
        ["_strip_", "_str*p_"],
    ])("strip genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["condo", "condo"],
        ["condom", "cond*m"],
        ["ondom", "ondom"],
        ["tracondom", "tracondom"],
        ["CONDOM", "COND*M"],
        ["Condom", "Cond*m"],
        ["condom a condom", "cond*m a cond*m"],
        ["condom'd", "cond*m'd"],
        ["condomed", "cond*med"],
        ["condoming", "cond*ming"],
        ['"condom"', '"cond*m"'],
        ["'condom'", "'cond*m'"],
        ["(condom)", "(cond*m)"],
        ["-condom-", "-cond*m-"],
        ["_condom_", "_cond*m_"],
    ])("condom genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["a.", "a."],
        [".b", ".b"],
        ["a.b", "a.b"],
        ["a.b.c.d", "a.b.c.d"],
        ["hello.there", "hello.there"],
        ["example.com", "example's website"],
        ["www.example.com", "example's website"],
        ["http://example.com", "example's website"],
        ["http://www.example.com", "example's website"],
        ["https://example.com", "example's website"],
        ["https://www.example.com", "example's website"],
        ["example.com.ca", "example's website. ca"],
        ["www.example.com.ca", "example's website. ca"],
        ["http://example.com.ca", "example's website. ca"],
        ["http://www.example.com.ca", "example's website. ca"],
        ["https://example.com.ca", "example's website. ca"],
        ["https://www.example.com.ca", "example's website. ca"],
    ])("url genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["messag", "messag"],
        ["message", "mess*ge"],
        ["essage", "essage"],
        ["tramessage", "tramessage"],
        ["MESSAGE", "MESS*GE"],
        ["Message", "Mess*ge"],
        ["message a message", "mess*ge a mess*ge"],
        ["message'd", "mess*ge'd"],
        ["messaged", "mess*ged"],
        ["messaging", "mess*ging"],
        ['"message"', '"mess*ge"'],
        ["'message'", "'mess*ge'"],
        ["(message)", "(mess*ge)"],
        ["[message]", "[mess*ge]"],
        ["-message-", "-mess*ge-"],
        ["_message_", "_mess*ge_"],
    ])("message genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["commen", "commen"],
        ["comment", "comm*nt"],
        ["omment", "omment"],
        ["tracomment", "tracomment"],
        ["COMMENT", "COMM*NT"],
        ["Comment", "Comm*nt"],
        ["comment a comment", "comm*nt a comm*nt"],
        ["comment'd", "comm*nt'd"],
        ["commented", "comm*nted"],
        ["commenting", "comm*nting"],
        ['"comment"', '"comm*nt"'],
        ["'comment'", "'comm*nt'"],
        ["(comment)", "(comm*nt)"],
        ["[comment]", "[comm*nt]"],
        ["-comment-", "-comm*nt-"],
        ["_comment_", "_comm*nt_"],
    ])("comment genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["fis", "fis"],
        ["fist", "f*st"],
        ["ist", "ist"],
        ["trafist", "trafist"],
        ["FIST", "F*ST"],
        ["Fist", "F*st"],
        ["fist a fist", "f*st a f*st"],
        ["fist'd", "f*st'd"],
        ["fisted", "f*sted"],
        ["fisting", "f*sting"],
        ['"fist"', '"f*st"'],
        ["'fist'", "'f*st'"],
        ["(fist)", "(f*st)"],
        ["[fist]", "[f*st]"],
        ["-fist-", "-f*st-"],
        ["_fist_", "_f*st_"],
    ])("fist genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["trafisting", "traf*sting"],
        ["TRAFISTING", "TRAF*STING"],
        ["Trafisting", "Traf*sting"],
        ['"trafisting"', '"traf*sting"'],
        ["'trafisting'", "'traf*sting'"],
        ["(trafisting)", "(traf*sting)"],
        ["[trafisting]", "[traf*sting]"],
        ["-trafisting-", "-traf*sting-"],
        ["_trafisting_", "_traf*sting_"],
    ])("fisting global genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["a #", "a #"],
        ["a #2", "a #2"],
        ["a #2b", "a hashtag-2b"],
        ["a #example", "a hashtag-example"],
        ["tra#example", "trahashtag-example"],
        ["a #EXAMPLE", "a hashtag-EXAMPLE"],
        ["a #Example", "a hashtag-Example"],
        ["a #example a #example", "a hashtag-example a hashtag-example"],
        ['"#example"', '"hashtag-example"'],
        ["'#example'", "'hashtag-example'"],
        ["(#example)", "(hashtag-example)"],
        ["[#example]", "[hashtag-example]"],
        ["-#example-", "-hashtag-example-"],
        ["_#example_", "_hashtag-example_"],
    ])("hashtag genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["twitt", "twitt"],
        ["twitter", "tw*tter"],
        ["witter", "witter"],
        ["tratwitter", "tratwitter"],
        ["TWITTER", "TW*TTER"],
        ["Twitter", "Tw*tter"],
        ["twitter a twitter", "tw*tter a tw*tter"],
        ["twitter'd", "tw*tter'd"],
        ["twittered", "tw*ttered"],
        ["twittering", "tw*ttering"],
        ['"twitter"', '"tw*tter"'],
        ["'twitter'", "'tw*tter'"],
        ["(twitter)", "(tw*tter)"],
        ["[twitter]", "[tw*tter]"],
        ["-twitter-", "-tw*tter-"],
        ["_twitter_", "_tw*tter_"],
    ])("twitter genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["tikto", "tikto"],
        ["tiktok", "ti*tok"],
        ["iktok", "iktok"],
        ["tratiktok", "tratiktok"],
        ["TIKTOK", "TI*TOK"],
        ["Tiktok", "Ti*tok"],
        ["tiktok a tiktok", "ti*tok a ti*tok"],
        ["tiktok'd", "ti*tok'd"],
        ["tiktoked", "ti*toked"],
        ["tiktoking", "ti*toking"],
        ['"tiktok"', '"ti*tok"'],
        ["'tiktok'", "'ti*tok'"],
        ["(tiktok)", "(ti*tok)"],
        ["[tiktok]", "[ti*tok]"],
        ["-tiktok-", "-ti*tok-"],
        ["_tiktok_", "_ti*tok_"],
    ])("tiktok genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["twitc", "twitc"],
        ["twitch", "tw*tch"],
        ["witch", "witch"],
        ["tratwitch", "tratwitch"],
        ["TWITCH", "TW*TCH"],
        ["Twitch", "Tw*tch"],
        ["twitch a twitch", "tw*tch a tw*tch"],
        ["twitch'd", "tw*tch'd"],
        ["twitched", "tw*tched"],
        ["twitching", "tw*tching"],
        ['"twitch"', '"tw*tch"'],
        ["'twitch'", "'tw*tch'"],
        ["(twitch)", "(tw*tch)"],
        ["[twitch]", "[tw*tch]"],
        ["-twitch-", "-tw*tch-"],
        ["_twitch_", "_tw*tch_"],
    ])("twitch genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["se", "se"],
        ["sex", "s*x"],
        ["ex", "ex"],
        ["trasex", "trasex"],
        ["SEX", "S*X"],
        ["Sex", "S*x"],
        ["sex a sex", "s*x a s*x"],
        ["sex'd", "s*x'd"],
        ["sexed", "s*xed"],
        ["sexing", "s*xing"],
        ['"sex"', '"s*x"'],
        ["'sex'", "'s*x'"],
        ["(sex)", "(s*x)"],
        ["[sex]", "[s*x]"],
        ["-sex-", "-s*x-"],
        ["_sex_", "_s*x_"],
    ])("sex genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["por", "por"],
        ["porn", "p*rn"],
        ["orn", "orn"],
        ["traporn", "trap*rn"],
        ["PORN", "P*RN"],
        ["Porn", "P*rn"],
        ["porn a porn", "p*rn a p*rn"],
        ["porn'd", "p*rn'd"],
        ["porned", "p*rned"],
        ["porning", "p*rning"],
        ['"porn"', '"p*rn"'],
        ["'porn'", "'p*rn'"],
        ["(porn)", "(p*rn)"],
        ["[porn]", "[p*rn]"],
        ["-porn-", "-p*rn-"],
        ["_porn_", "_p*rn_"],
    ])("porn genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["bal", "bal"],
        ["ball", "b*ll"],
        ["all", "all"],
        ["traball", "traball"],
        ["BALL", "B*LL"],
        ["Ball", "B*ll"],
        ["ball a ball", "b*ll a b*ll"],
        ["ball'd", "b*ll'd"],
        ["balled", "b*lled"],
        ["balling", "b*lling"],
        ['"ball"', '"b*ll"'],
        ["'ball'", "'b*ll'"],
        ["(ball)", "(b*ll)"],
        ["[ball]", "[b*ll]"],
        ["-ball-", "-b*ll-"],
        ["_ball_", "_b*ll_"],
    ])("ball genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["kill yourself", "unalive"],
        ["ill yourself", "ill yourself"],
        ["kill yoursel", "k*ll yoursel"],
        ["kil", "kil"],
        ["kill", "k*ll"],
        ["ill", "ill"],
        ["trakill", "trakill"],
        ["KILL", "K*LL"],
        ["Kill", "K*ll"],
        ["kill a kill", "k*ll a k*ll"],
        ["kill'd", "k*ll'd"],
        ["killed", "k*lled"],
        ["killing", "k*lling"],
        ['"kill"', '"k*ll"'],
        ["'kill'", "'k*ll'"],
        ["(kill)", "(k*ll)"],
        ["[kill]", "[k*ll]"],
        ["-kill-", "-k*ll-"],
        ["_kill_", "_k*ll_"],
        ['"kill yourself"', '"unalive"'],
        ["'kill yourself'", "'unalive'"],
        ["(kill yourself)", "(unalive)"],
        ["[kill yourself]", "[unalive]"],
        ["-kill yourself-", "-unalive-"],
        ["_kill yourself_", "_unalive_"],
    ])("kill genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["a 18", "a 18"],
        ["a 18+", "a 18 up"],
        ["a 8+", "a 8+"],
        ["tra18+", "tra18 up"],
        ["a 18+ a 18+", "a 18 up a 18 up"],
        ["a 18+'d", "a 18 up'd"],
        ["a 18+ed", "a 18 uped"],
        ["a 18+ing", "a 18 uping"],
        ['"18+"', '"18 up"'],
        ["'18+'", "'18 up'"],
        ["(18+)", "(18 up)"],
        ["[18+]", "[18 up]"],
        ["-18+-", "-18 up-"],
        ["_18+_", "_18 up_"],
    ])("18+ genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["sper", "sper"],
        ["sperm", "sp*rm"],
        ["perm", "perm"],
        ["trasperm", "trasperm"],
        ["SPERM", "SP*RM"],
        ["Sperm", "Sp*rm"],
        ["sperm a sperm", "sp*rm a sp*rm"],
        ["sperm'd", "sp*rm'd"],
        ["spermed", "sp*rmed"],
        ["sperming", "sp*rming"],
        ['"sperm"', '"sp*rm"'],
        ["'sperm'", "'sp*rm'"],
        ["(sperm)", "(sp*rm)"],
        ["[sperm]", "[sp*rm]"],
        ["-sperm-", "-sp*rm-"],
        ["_sperm_", "_sp*rm_"],
    ])("sperm genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["nippl", "nippl"],
        ["nip", "nip"],
        ["nipple", "n*pple"],
        ["perm", "perm"],
        ["tranipple", "tranipple"],
        ["NIPPLE", "N*PPLE"],
        ["Nipple", "N*pple"],
        ["nipple a nipple", "n*pple a n*pple"],
        ["nipple'd", "n*pple'd"],
        ["nippleed", "n*ppleed"],
        ["nippleing", "n*ppleing"],
        ['"nipple"', '"n*pple"'],
        ["'nipple'", "'n*pple'"],
        ["(nipple)", "(n*pple)"],
        ["[nipple]", "[n*pple]"],
        ["-nipple-", "-n*pple-"],
        ["_nipple_", "_n*pple_"],
    ])("nipple genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["puss", "puss"],
        ["pussy", "pu*sy"],
        ["uss", "uss"],
        ["trapussy", "trapu*sy"],
        ["pussy", "pu*sy"],
        ["pussy", "pu*sy"],
        ["pussy a pussy", "pu*sy a pu*sy"],
        ["pussy'd", "pu*sy'd"],
        ["pussyed", "pu*syed"],
        ["pussying", "pu*sying"],
        ['"pussy"', '"pu*sy"'],
        ["'pussy'", "'pu*sy'"],
        ["(pussy)", "(pu*sy)"],
        ["[pussy]", "[pu*sy]"],
        ["-pussy-", "-pu*sy-"],
        ["_pussy_", "_pu*sy_"],
    ])("pussies genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["puss", "puss"],
        ["pussies", "pu*sies"],
        ["ussies", "ussies"],
        ["trapussies", "trapu*sies"],
        ["PUSSIES", "PU*SIES"],
        ["Pussies", "Pu*sies"],
        ["pussies a pussies", "pu*sies a pu*sies"],
        ["pussies'd", "pu*sies'd"],
        ["pussiesed", "pu*siesed"],
        ["pussiesing", "pu*siesing"],
        ['"pussies"', '"pu*sies"'],
        ["'pussies'", "'pu*sies'"],
        ["(pussies)", "(pu*sies)"],
        ["[pussies]", "[pu*sies]"],
        ["-pussies-", "-pu*sies-"],
        ["_pussies_", "_pu*sies_"],
    ])("pussies genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["pussy", "pu*sy"],
        ["ussy", "ussy"],
        ["trapussy", "trapu*sy"],
        ["PUSSY", "PU*SY"],
        ["Pussy", "Pu*sy"],
        ["pussy a pussy", "pu*sy a pu*sy"],
        ["pussy'd", "pu*sy'd"],
        ["pussyed", "pu*syed"],
        ["pussying", "pu*sying"],
        ['"pussy"', '"pu*sy"'],
        ["'pussy'", "'pu*sy'"],
        ["(pussy)", "(pu*sy)"],
        ["[pussy]", "[pu*sy]"],
        ["-pussy-", "-pu*sy-"],
        ["_pussy_", "_pu*sy_"],
    ])("pussy genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["race", "race"],
        ["racist", "rac*st"],
        ["perm", "perm"],
        ["traracist", "traracist"],
        ["RACIST", "RAC*ST"],
        ["Racist", "Rac*st"],
        ["racist a racist", "rac*st a rac*st"],
        ["racist'd", "rac*st'd"],
        ["racisted", "rac*sted"],
        ["racisting", "rac*sting"],
        ['"racist"', '"rac*st"'],
        ["'racist'", "'rac*st'"],
        ["(racist)", "(rac*st)"],
        ["[racist]", "[rac*st]"],
        ["-racist-", "-rac*st-"],
        ["_racist_", "_rac*st_"],
    ])("racist genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["perv", "perv"],
        ["pervert", "per*ert"],
        ["perm", "perm"],
        ["trapervert", "trapervert"],
        ["PERVERT", "PER*ERT"],
        ["Pervert", "Per*ert"],
        ["pervert a pervert", "per*ert a per*ert"],
        ["pervert'd", "per*ert'd"],
        ["perverted", "per*erted"],
        ["perverting", "per*erting"],
        ['"pervert"', '"per*ert"'],
        ["'pervert'", "'per*ert'"],
        ["(pervert)", "(per*ert)"],
        ["[pervert]", "[per*ert]"],
        ["-pervert-", "-per*ert-"],
        ["_pervert_", "_per*ert_"],
    ])("pervert genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["gang", "gang"],
        ["gangbang", "g*ngb*ng"],
        ["bang", "bang"],
        ["tragangbang", "tragangbang"],
        ["GANGBANG", "G*NGB*NG"],
        ["Gangbang", "G*ngb*ng"],
        ["gangbang a gangbang", "g*ngb*ng a g*ngb*ng"],
        ["gangbang'd", "g*ngb*ng'd"],
        ["gangbanged", "g*ngb*nged"],
        ["gangbanging", "g*ngb*nging"],
        ['"gangbang"', '"g*ngb*ng"'],
        ["'gangbang'", "'g*ngb*ng'"],
        ["(gangbang)", "(g*ngb*ng)"],
        ["[gangbang]", "[g*ngb*ng]"],
        ["-gangbang-", "-g*ngb*ng-"],
        ["_gangbang_", "_g*ngb*ng_"],
    ])("gangbang genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["hitle", "hitle"],
        ["hitler", "h*tler"],
        ["itler", "itler"],
        ["trahitler", "trahitler"],
        ["HITLER", "H*TLER"],
        ["Hitler", "H*tler"],
        ["hitler a hitler", "h*tler a h*tler"],
        ["hitler'd", "h*tler'd"],
        ["hitlered", "h*tlered"],
        ["hitlering", "h*tlering"],
        ['"hitler"', '"h*tler"'],
        ["'hitler'", "'h*tler'"],
        ["(hitler)", "(h*tler)"],
        ["[hitler]", "[h*tler]"],
        ["-hitler-", "-h*tler-"],
        ["_hitler_", "_h*tler_"],
    ])("hitler genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["dumb", "dumb"],
        ["dumbass", "d*mbass"],
        ["umbass", "umbass"],
        ["tradumbass", "tradumbass"],
        ["DUMBASS", "D*MBASS"],
        ["Dumbass", "D*mbass"],
        ["dumbass a dumbass", "d*mbass a d*mbass"],
        ["dumbass'd", "d*mbass'd"],
        ["dumbassed", "d*mbassed"],
        ["dumbassing", "d*mbassing"],
        ['"dumbass"', '"d*mbass"'],
        ["'dumbass'", "'d*mbass'"],
        ["(dumbass)", "(d*mbass)"],
        ["[dumbass]", "[d*mbass]"],
        ["-dumbass-", "-d*mbass-"],
        ["_dumbass_", "_d*mbass_"],
    ])("dumbass genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["covi", "covi"],
        ["covid", "c*vid"],
        ["ovid", "ovid"],
        ["tracovid", "trac*vid"],
        ["COVID", "C*VID"],
        ["Covid", "C*vid"],
        ["covid a covid", "c*vid a c*vid"],
        ["covid'd", "c*vid'd"],
        ["covided", "c*vided"],
        ["coviding", "c*viding"],
        ['"covid"', '"c*vid"'],
        ["'covid'", "'c*vid'"],
        ["(covid)", "(c*vid)"],
        ["[covid]", "[c*vid]"],
        ["-covid-", "-c*vid-"],
        ["_covid_", "_c*vid_"],
    ])("covid genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["goo", "goo"],
        ["goon", "g*on"],
        ["oon", "oon"],
        ["dragoon", "dragoon"],
        ["GOON", "G*ON"],
        ["Goon", "G*on"],
        ["goon a goon", "g*on a g*on"],
        ["goon'd", "g*on'd"],
        ["gooned", "g*oned"],
        ["gooning", "g*oning"],
        ['"goon"', '"g*on"'],
        ["'goon'", "'g*on'"],
        ["(goon)", "(g*on)"],
        ["[goon]", "[g*on]"],
        ["-goon-", "-g*on-"],
        ["_goon_", "_g*on_"],
    ])("goon genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
    });

    test.each([
        ["boo", "boo"],
        ["boob", "b*ob"],
        ["oob", "oob"],
        ["traboob", "traboob"],
        ["BOOB", "B*OB"],
        ["Boob", "B*ob"],
        ["boob a boob", "b*ob a b*ob"],
        ["boob'd", "b*ob'd"],
        ["boobed", "b*obed"],
        ["boobing", "b*obing"],
        ['"boob"', '"b*ob"'],
        ["'boob'", "'b*ob'"],
        ["(boob)", "(b*ob)"],
        ["[boob]", "[b*ob]"],
        ["-boob-", "-b*ob-"],
        ["_boob_", "_b*ob_"],
    ])("boob genericCensor(%s) -> %s", (text, expected) => {
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
    ])("accidential tags genericCensor(%s) -> %s", (text, expected) => {
        expect(genericCensor(text)).toBe(expected);
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
