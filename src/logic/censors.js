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
    [new RegExp(`${P}nigg`, "gi"), "$1person"], // Covers n-words
    [new RegExp(`faggot`, "gi"), "person"],
    [new RegExp(`${P}fagg`, "gi"), "$1person"],
    [new RegExp(`${P}fag`, "gi"), "$1person"],
    [new RegExp(`${P}dyke`, "gi"), "$1person"],
    [new RegExp(`${P}retard`, "gi"), "$1person"],
    [new RegExp(`${P}tranny`, "gi"), "$1person"],
    [new RegExp(`${P}chink`, "gi"), "$1person"],
    [new RegExp(`${P}kike`, "gi"), "$1person"],
    [new RegExp(`${P}jew`, "gi"), "$1person"], // Often flagged in specific contexts
    [new RegExp(`${P}gypsy`, "gi"), "$1person"],
    [new RegExp(`${P}mongol`, "gi"), "$1person"],
    [new RegExp(`white boy`, "gi"), "boy"],
    [new RegExp(`${P}cult`, "gi"), "$1group"],
    [new RegExp(`${P}trap${P}`, "gi"), "$1ambush$2"],
    [new RegExp(`${P}gay${P}`, "gi"), "$1loving$2"],
    [new RegExp(`${P}lesbian${P}`, "gi"), "$1loving$2"],
    [new RegExp(`${P}homosexual${P}`, "gi"), "$1loving$2"],
    [new RegExp(`${P}bisexual${P}`, "gi"), "$1loving$2"],
    [new RegExp(`${P}trans${P}`, "gi"), "$1loving$2"],
    [new RegExp(`${P}queer${P}`, "gi"), "$1loving$2"],

    // --- SECTION 3: Violence, Self-Harm, & Crimes ---
    // YouTube deletes "kill yourself" and "suicide" extremely fast
    [new RegExp(`kill yourself`, "gi"), "go away"],
    [new RegExp(`${P}suicide`, "gi"), "$1go to sleep"],
    [new RegExp(`${P}stays alive`, "gi"), "$1keep going"],
    [new RegExp(`${P}kill`, "gi"), "$1take out"],
    [new RegExp(`${P}murder`, "gi"), "$1attack"],
    [new RegExp(`${P}predator`, "gi"), "$1hunter"],
    [new RegExp(`${P}(r)a(pe|pist)`, "gi"), "$1not good action"],
    [new RegExp(`${P}shoot`, "gi"), "$1pew-pew"],
    [new RegExp(`${P}stab`, "gi"), "$1perform surgery"],
    [new RegExp(`${P}torture`, "gi"), "$1horror"],
    [new RegExp(`${P}bomb`, "gi"), "$1tnt"],
    [new RegExp(`${P}grenade`, "gi"), "$1hand-tnt"],
    [new RegExp(`${P}missile`, "gi"), "$1rocket"],
    [new RegExp(`${P}(g)u(n)`, "gi"), "$1pew-pew"],
    [new RegExp(`${P}(ter)r(or)i(st)`, "gi"), "$1demolition person"],

    // --- SECTION 4: Sexual Content & Anatomy ---
    [new RegExp(`${P}ntr`, "gi"), "$1cheating"],
    [new RegExp(`${P}dick`, "gi"), "$1thing"],
    [new RegExp(`${P}cock`, "gi"), "$1hot dog"],
    [new RegExp(`${P}penis`, "gi"), "$1hot dog"],
    [new RegExp(`${P}cuck`, "gi"), "$1person"],
    [new RegExp(`${P}vagina`, "gi"), "$1body part"],
    [new RegExp(`${P}clit`, "gi"), "$1body part"],
    [new RegExp(`${P}cunt`, "gi"), "$1mean person"],
    [new RegExp(`${P}anal`, "gi"), "$1thorough"],
    [new RegExp(`${P}anus`, "gi"), "$1body part"],
    [new RegExp(`${P}booty`, "gi"), "$1rear"],
    [new RegExp(`${P}boner`, "gi"), "$1bone"],
    [new RegExp(`${P}dildo`, "gi"), "$1toy"],
    [new RegExp(`${P}sexy`, "gi"), "$1good looking"],
    [new RegExp(`${P}sex`, "gi"), "$1procreation"],
    [new RegExp(`${P}porn`, "gi"), "$1grown up movies"],
    [new RegExp(`gooner`, "gi"), "degen"],
    [new RegExp(`g\\*oner`, "gi"), "degen"],
    [new RegExp(`go\\*ner`, "gi"), "degen"],
    [new RegExp(`g\\*\\*ner`, "gi"), "degen"],
    [new RegExp(`goo\\*er`, "gi"), "degen"],
    [new RegExp(`${P}goon`, "gi"), "$1go-on"],
    [new RegExp(`${P}coomer`, "gi"), "$1degen"],
    [new RegExp(`${P}coom`, "gi"), "$1co-om"],
    [new RegExp(`${P}edging`, "gi"), "$1close"],
    [new RegExp(`${P}mpreg`, "gi"), "$1birth"],
    [new RegExp(`hentai`, "gi"), "grown up anime"],
    [new RegExp(`${P}loli`, "gi"), "$1little"],
    [new RegExp(`${P}shota`, "gi"), "$1little"],
    [new RegExp(`${P}pe(do|dophile)`, "gi"), "$1bad"],
    [new RegExp(`${P}groomer`, "gi"), "$1cleaning"],
    [new RegExp(`${P}breed`, "gi"), "$1act"],
    [new RegExp(`${P}bukkake`, "gi"), "$1paint"],
    [new RegExp(`${P}masturbate`, "gi"), "$1play"],
    [new RegExp(`${P}orgasm`, "gi"), "$1finish"],
    [new RegExp(`${P}incest`, "gi"), "$1family"],
    [new RegExp(`${P}waifu`, "gi"), "$1wife"],
    [new RegExp(`${P}ball`, "gi"), "$1round object"],
    [new RegExp(`${P}sperm`, "gi"), "$1DNA"],
    [new RegExp(`${P}cum`, "gi"), "$1DNA"],
    [new RegExp(`${P}(com)m(ing)`, "gi"), "$1$2$3"],
    [new RegExp(`${P}nipple`, "gi"), "$1chest"],
    [new RegExp(`(pu)s(sy|sies)`, "gi"), "chicken"],
    [new RegExp(`${P}ti(ts|ty|tties)`, "gi"), "$1chest"],
    [new RegExp(`${P}cleavage`, "gi"), "$1chest"],
    [new RegExp(`${P}boobs`, "gi"), "$1chests"],
    [new RegExp(`${P}boob`, "gi"), "$1chest"],
    [new RegExp(`${P}butt`, "gi"), "$1rear"],
    [new RegExp(`${P}thigh`, "gi"), "$1leg"],
    [new RegExp(`fisting`, "gi"), "punching"],
    [new RegExp(`${P}fist`, "gi"), "$1hand"],
    [new RegExp(`${P}half-naked`, "gi"), "$1almost dressed"],
    [new RegExp(`${P}naked`, "gi"), "$1non dressed"],
    [new RegExp(`${P}nude`, "gi"), "$1non dressed"],
    [new RegExp(`${P}freaky`, "gi"), "$1wild"],
    [new RegExp(`${P}freak`, "gi"), "$1wild"],
    [new RegExp(`${P}pee`, "gi"), "$1leak"],
    [new RegExp(`${P}simp`, "gi"), "$1fawn"],
    [new RegExp(`${P}throb`, "gi"), "$1boop"],
    [new RegExp(`${P}condom`, "gi"), "$1protection"],
    [new RegExp(`${P}strip`, "gi"), "$1layer"],
    [new RegExp(`${P}bitch`, "gi"), "$1mean person"],
    [new RegExp(`${P}slut`, "gi"), "$1revolving door"],
    [new RegExp(`${P}panty`, "gi"), "$1undergarment"],
    [new RegExp(`${P}panties`, "gi"), "$1undergarment"],
    [new RegExp(`${P}mating`, "gi"), "$1reproduction"],
    [new RegExp(`${P}(wh)o(re|ring)`, "gi"), "$1mean person"],
    [new RegExp(`${P}(g)a(ngb)a(ng)`, "gi"), "$1group party"],
    [new RegExp(`(${P}|[^0-9])18\\+`, "gi"), "$118 up"],

    // --- SECTION 5: General Profanity ---
    [new RegExp(`(f)uck(ing)`, "gi"), "$1-$2"],
    [new RegExp(`${P}fuck`, "gi"), "$1frick"],
    [new RegExp(`${P}shit`, "gi"), "$1rot"],
    [new RegExp(`${P}(a)ss(hole|hat)`, "gi"), "$1mean person"],
    [new RegExp(`${P}([a-zA-Z]*)-ass${P}`, "gi"), "$1$2$3"],
    // [new RegExp(`${P}ass${P}`, "gi"), "$1rear$2"],
    [new RegExp(`${P}bastard`, "gi"), "$1rat"],
    [new RegExp(`${P}damn`, "gi"), "$1darn"],
    [new RegExp(`${P}crap`, "gi"), "$1nonsense"],
    [new RegExp(`${P}piss`, "gi"), "$1leak"],
    [new RegExp(`${P}douche`, "gi"), "$1rascal"],
    [new RegExp(`${P}jackass`, "gi"), "$1donkey"],

    // --- SECTION 6: Insults & Other ---
    [new RegExp(`${P}dumbass`, "gi"), "$1birdbrain"],
    [new RegExp(`${P}stupid`, "gi"), "$1unsmart"],
    [new RegExp(`${P}idiot`, "gi"), "$1fool"],
    [new RegExp(`${P}loser`, "gi"), "$1nonwinner"],
    [new RegExp(`${P}racist`, "gi"), "$1narrow-minded"],
    [new RegExp(`${P}pervert`, "gi"), "$1degen"],
    [new RegExp(`${P}hitler`, "gi"), "$1person"],
    [new RegExp(`${P}nazi`, "gi"), "$1person"],

    // --- SECTION 7: Spam & Bot Triggers ---
    [new RegExp(`${P}crypto`, "gi"), "$1digital"],
    [new RegExp(`${P}bitcoin`, "gi"), "$1digital"],
    [new RegExp(`${P}whatsapp`, "gi"), "$1social media"],
    [new RegExp(`${P}telegram`, "gi"), "$1social media"],

    // --- SOCIAL MEDIA ---
    [new RegExp(`${P}*#(\\w*[a-zA-Z]+\\w*)`, "gi"), "$1hashtag-$2"],
    [new RegExp(`${P}(mess)a(ge|ging)`, "gi"), "$1chat"],
    [new RegExp(`${P}comment`, "gi"), "$1chat"],
    [new RegExp(`${P}(tw)i(tter|tch)`, "gi"), "$1social media"],
    [new RegExp(`${P}tiktok`, "gi"), "$1social media"],
    [new RegExp(`${P}facebook`, "gi"), "$1social media"],
    [new RegExp(`${P}insta`, "gi"), "$1social media"],
    [new RegExp(`${P}discord`, "gi"), "$1social media"],

    // --- SECTION 8: Other ---
    [new RegExp(`${P}covid`, "gi"), "$1flu"],
    [new RegExp(`${P}drug(s)?`, "gi"), "$1medicine"],
    [new RegExp(`${P}weed`, "gi"), "$1medicine"],
    [new RegExp(`${P}cocaine`, "gi"), "$1medicine"],
    [new RegExp(`${P}heroin`, "gi"), "$1medicine"],
    [new RegExp(`${P}methamphetamine`, "gi"), "$1medicine"],
    [new RegExp(`${P}amphetamine`, "gi"), "$1medicine"],
    [new RegExp(`${P}ecstasy`, "gi"), "$1medicine"],
    [new RegExp(`${P}MDMA`, "gi"), "$1medicine"],
    [new RegExp(`${P}pill(s)?`, "gi"), "$1medicine"],
    [new RegExp(`${P}acid`, "gi"), "$1medicine"],
    [new RegExp(`${P}ammo`, "gi"), "$1rounds"],
    [new RegExp(`${P}bullet(s)?`, "gi"), "$1rounds"],
    [new RegExp(`${P}casino`, "gi"), "$1bet"],
    [new RegExp(`${P}slot(s)?`, "gi"), "$1bet"],
    [new RegExp(`${P}roulette`, "gi"), "$1bet"],
    [new RegExp(`${P}poker`, "gi"), "$1bet"],
    [new RegExp(`${P}baccarat`, "gi"), "$1bet"],
    [new RegExp(`${P}blackjack`, "gi"), "$1bet"],
    [new RegExp(`${P}gambl(e|ing)`, "gi"), "$1bet"],

    // --- SECTION 9: Names ---
    [new RegExp(`${P}snuffy`, "gi"), "$1Snum"],
    [new RegExp(`${P}snuffies`, "gi"), "$1Snum's"],
    [new RegExp(`${P}snuffles`, "gi"), "$1Snum's"],
    [new RegExp(`${P}snuff`, "gi"), "$1extinguish"],
    [new RegExp(`${P}sloppy`, "gi"), "$1messy"],
    [new RegExp(`${P}sloppies`, "gi"), "$1messy"],

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
