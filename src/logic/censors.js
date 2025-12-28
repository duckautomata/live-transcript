// 1. Common Regex Pattern.
// Matches: Word boundary OR quote, apostrophe, bracket, dash, underscore.
const P = `(\\b|["'(\\[\\-_])`;

// Uses the js .replace() api. Supports either string or regex
// [search, replacement]
// case insensitive. It will automatically match the replacement with the source format.
/** @type {[string|RegExp, string][]} */
const replacements = [
    // --- SECTION 1: URLs & Domains (Must be at the top) ---
    [
        new RegExp(
            `${P}(https?:\\/\\/)?(www\\.|t\\.|m\\.)?([a-zA-Z0-9-]+)\\.(com|io|ai|tv|be|cc|ly|co|net|org|us|ca|edu|gov|mil)`,
            "gi",
        ),
        "$1$4's website",
    ],
    [new RegExp(`${P}([a-zA-Z0-9-]+)\\.(com|io|ai|tv|be|cc|ly|co|net|org|us|ca|edu|gov|mil)`, "gi"), "$1$2. $3"],

    // --- SECTION 2: Hate Speech & Slurs (High Risk for Shadowban) ---
    // Covering various racial, homophobic, and ableist slurs
    [new RegExp(`${P}(n)i(gg)`, "gi"), "$1$2*$3"], // Covers n-words
    [new RegExp(`${P}(f)a(g|ggot)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)y(ke)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(r)e(tard)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(t)r(anny)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)h(ink)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(k)i(ke)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(j)e(w)`, "gi"), "$1$2*$3"], // Often flagged in specific contexts
    [new RegExp(`${P}(g)y(psy)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(m)o(ngol)`, "gi"), "$1$2*$3"],

    // --- SECTION 3: Violence, Self-Harm, & Crimes ---
    // YouTube deletes "kill yourself" and "suicide" extremely fast
    [new RegExp(`kill yourself`, "gi"), "unalive"],
    [new RegExp(`${P}(s)u(icide)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(k)i(ll)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(m)u(rder)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(r)a(pe|pist)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(t)e(rrorist)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(sh)oo(t)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(st)a(b)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)o(mb)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(g)u(n)`, "gi"), "$1$2*$3"],

    // --- SECTION 4: Sexual Content & Anatomy ---
    [new RegExp(`${P}(n)t(r)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)i(ck)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)o(ck)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(cu)c(k)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(p)e(nis)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(v)a(gina)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)l(it)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)u(nt)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(a)n(al)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(a)n(us)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)oo(ty)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(t)i(ts|tties)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)o(ner)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)i(ldo)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(s)e(x)`, "gi"), "$1$2*$3"],
    [new RegExp(`(p)o(rn)`, "gi"), "$1*$2"],
    [new RegExp(`(h)en(tai)`, "gi"), "$1*$2"],
    [new RegExp(`${P}(m)a(sturbat)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(o)r(gasm)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(i)n(cest)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(p)e(do|dophile)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(g)r(oomer)`, "gi"), "$1$2*$3"], // Very high heat word on YT right now
    [new RegExp(`${P}(w)a(ifu)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)a(ll)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(sp)e(rm)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)u(m)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(n)i(pple)`, "gi"), "$1$2*$3"],
    [new RegExp(`(pu)s(sy|sies)`, "gi"), "$1*$2"],
    [new RegExp(`${P}(b)o(ob)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(g)o(on)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(f)i(st)`, "gi"), "$1$2*$3"],
    [new RegExp(`(f)i(sting)`, "gi"), "$1*$2"],
    [new RegExp(`${P}(cond)o(m)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(str)i(p)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)i(tch)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(sl)u(t)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(wh)o(re|ring)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(g)a(ngb)a(ng)`, "gi"), "$1$2*$3*$4"],
    [/18\+/gi, "18 up"],

    // --- SECTION 5: General Profanity ---
    [new RegExp(`${P}(f)u(ck)(?!ing)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(f)uck(ing)`, "gi"), "$1$2-$3"],
    [new RegExp(`${P}(sh)i(t)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(a)ss(hole|hat)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(a)s(s)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)a(stard)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)a(mn)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(c)r(ap)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(p)i(ss)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)o(uche)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(jacka)s(s)`, "gi"), "$1$2*$3"],

    // --- SECTION 6: Insults & Other ---
    [new RegExp(`${P}(d)u(mbass)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(i)d(iot)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(l)o(ser)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(rac)i(st)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(per)v(ert)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(h)i(tler)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(n)a(zi)`, "gi"), "$1$2*$3"],
    [new RegExp(`(c)o(vid)`, "gi"), "$1*$2"],

    // --- SECTION 7: Spam & Bot Triggers ---
    [new RegExp(`${P}(c)r(ypto)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(b)i(tcoin)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(w)h(atsapp)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(t)e(legram)`, "gi"), "$1$2*$3"],

    // --- SOCIAL MEDIA ---
    [new RegExp(`(\\b|[\\s"'(\\[\\-_])#(\\w*[a-zA-Z]+\\w*)`, "gi"), "$1hashtag-$2"],
    [new RegExp(`${P}(mess)a(ge|ging)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(comm)e(nt)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(tw)i(tter|tch)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(ti)k(tok)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(f)a(cebook)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(i)n(sta)`, "gi"), "$1$2*$3"],
    [new RegExp(`${P}(d)i(scord)`, "gi"), "$1$2*$3"],

    // --- CLEANUP ---
    [/\\/g, ""],
    [/^\s*\[([\dhms]+)\] /i, "$1 "],
    [/^\s*(\d )/, "00:0$1"],
    [/^\s*(\d+ )/, "00:$1"],
    [/^\s*(\d\d)s /i, "00:$1 "],
    [/^\s*(\d\d)m(\d\d)s /i, "$1:$2 "],
    [/^\s*(\d\d)h(\d\d)m(\d\d)s /i, "$1:$2:$3 "],
    [/^\s*00:00:00 /, "00:00:01 "],
    [/^\s*00:00 /, "00:01 "],
    [/^\s*[0-9:]+ (!adjust|!t)\b.*/i, ""],
];

/** @type {[string|RegExp, string][]} */
const mintReplacements = [[/:memboo/gi, ":_"]];

/**
 * Generic text censorship based on a list of predefined replacements.
 * @param {string} text - The input text to censor.
 * @returns {string} The censored text.
 */
export const genericCensor = (text) => {
    replacements.forEach((replacement) => {
        text = text.replace(replacement[0], replacement[1]);
    });

    return text;
};

/**
 * Censors specific keywords for "mint" context.
 * @param {string} text - The input text to censor.
 * @returns {string} The censored text.
 */
export const mintCensor = (text) => {
    mintReplacements.forEach((replacement) => {
        text = text.replace(replacement[0], replacement[1]);
    });

    return text;
};
