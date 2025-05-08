// Uses the js .replace() api. Supports either string or regex
// [search, replacement]
// case insensitive. It will automatically match the replacement with the source format.
const replacements = [
    [/((\b|"|'|\(|\[|-|_)n)t(r)/gi, "$1*$3"], //ntr -> n*r
    [/((\b|"|'|\(|\[|-|_)d)i(ck)/gi, "$1*$3"], //dick -> d*ck
    [/((\b|"|'|\(|\[|-|_)c)o(ck)/gi, "$1*$3"], //cock -> c*ck
    [/((\b|"|'|\(|\[|-|_)cu)c(k)/gi, "$1*$3"], //cuck -> cu*k
    [/((\b|"|'|\(|\[|-|_)f)uck(ing)/gi, "$1-$3"], //fucking -> f-ing
    [/((\b|"|'|\(|\[|-|_)f)u(ck)/gi, "$1*$3"], //fuck -> f*ck
    [/((\b|"|'|\(|\[|-|_)sh)i(t)/gi, "$1*$3"], //shit -> sh*t
    [/((\b|"|'|\(|\[|-|_)wh)o(re)/gi, "$1*$3"], //whore -> wh*re
    [/((\b|"|'|\(|\[|-|_)wh)o(ring)/gi, "$1*$3"], //whoring -> wh*ring
    [/((\b|"|'|\(|\[|-|_)sl)u(t)/gi, "$1*$3"], //slut -> sl*t
    [/((\b|"|'|\(|\[|-|_)b)i(tch)/gi, "$1*$3"], //bitch -> b*tch
    [/((\b|"|'|\(|\[|-|_)str)i(p)/gi, "$1*$3"], //strip -> str*p
    [/((\b|"|'|\(|\[|-|_)cond)o(m)/gi, "$1*$3"], //condom -> cond*m
    [
        /(\b|"|'|\(|\[|-|_)(https?:\/\/)?(www\.|t\.|m\.)?([a-zA-Z0-9-]+)+\.(com|io|ai|tv|be|cc|ly|co|net|org|us|ca|net|edu|gov|mil)/gi,
        "$4's website",
    ], // www.example.com -> example's website
    [/(\b|"|'|\(|\[|-|_)([a-zA-Z0-9-]+)+\.(com|io|ai|tv|be|cc|ly|co|net|org|us|ca|net|edu|gov|mil)/gi, "$2. $3"], // end.start -> end. start
    [/(\b|"|'|\(|\[|-|_)([a-zA-Z0-9-]+)+\.(com|io|ai|tv|be|cc|ly|co|net|org|us|ca|net|edu|gov|mil)/gi, "$2. $3"], // running again for any duplicates
    [/((\b|"|'|\(|\[|-|_)mess)a(ge)/gi, "$1*$3"], //message -> mess*ge
    [/((\b|"|'|\(|\[|-|_)mess)a(ging)/gi, "$1*$3"], //messaging -> mess*ging
    [/((\b|"|'|\(|\[|-|_)comm)e(nt)/gi, "$1*$3"], //comment -> comm*nt
    [/((\b|"|'|\(|\[|-|_)f)i(st)/gi, "$1*$3"], //fist -> f*st
    [/(f)i(sting)/gi, "$1*$2"], //fisting -> f*sting (global)
    [/(\b|"|'|\(|\[|-|_| )#(\w*[a-zA-Z]+\w*)/gi, "$1hashtag-$2"], //#example -> hashtag-example
    [/((\b|"|'|\(|\[|-|_)tw)i(tter)/gi, "$1*$3"], //twitter -> tw*tter
    [/((\b|"|'|\(|\[|-|_)ti)k(tok)/gi, "$1*$3"], //tiktok -> ti*tok
    [/((\b|"|'|\(|\[|-|_)tw)i(tch)/gi, "$1*$3"], //twitch -> tw*tch
    [/((\b|"|'|\(|\[|-|_)s)e(x)/gi, "$1*$3"], //sex -> s*x
    [/(p)o(rn)/gi, "$1*$2"], //porn -> p*rn
    [/((\b|"|'|\(|\[|-|_)b)a(ll)/gi, "$1*$3"], //ball -> b*ll
    [/kill yourself/gi, "unalive"], //kill yourself -> unalive
    [/((\b|"|'|\(|\[|-|_)k)i(ll)/gi, "$1*$3"], //kill -> k*ll
    [/18\+/gi, "18 up"], //18+ -> 18 UP
    [/((\b|"|'|\(|\[|-|_)sp)e(rm)/gi, "$1*$3"], //sperm -> sp*rm
    [/((\b|"|'|\(|\[|-|_)n)i(pple)/gi, "$1*$3"], //nipple -> n*pple
    [/(pu)s(sies)/gi, "$1*$2"], //pussies -> pu*sies
    [/(pu)s(sy)/gi, "$1*$2"], //pussy -> pu*sy
    [/((\b|"|'|\(|\[|-|_)rac)i(st)/gi, "$1*$3"], //racist -> rac*st
    [/((\b|"|'|\(|\[|-|_)per)v(ert)/gi, "$1*$3"], //pervert -> per*ert
    [/((\b|"|'|\(|\[|-|_)g)a(ngb)a(ng)/gi, "$1*$3*$4"], //gangbang -> g*ngb*ng
    [/((\b|"|'|\(|\[|-|_)h)i(tler)/gi, "$1*$3"], //hitler -> h*tler
    [/((\b|"|'|\(|\[|-|_)d)u(mbass)/gi, "$1*$3"], //dumbass -> d*mbass
    [/(c)o(vid)/gi, "$1*$2"], //covid -> c*vid
    [/((\b|"|'|\(|\[|-|_)b)o(ob)/gi, "$1*$3"], //boob -> b*ob
    [/\\/g, ""], // \ -> nothing
    [/^\s*\[([\dhms]+)\] /, "$1 "], //[00:11:22] -> 00:11:22
    [/^\s*(\d )/, "00:0$1"], //adds 00:0 to any tags that do not have it
    [/^\s*(\d+ )/, "00:$1"], //adds 00: to any tags that do not have it
    [/^\s*(\d\d)s /, "00:$1 "], //34s -> 00:34
    [/^\s*(\d\d)m(\d\d)s /, "$1:$2 "], //12m34s -> 12:34
    [/^\s*(\d\d)h(\d\d)m(\d\d)s /, "$1:$2:$3 "], //01h12m34s -> 01:12:34
    [/^\s*00:00:00 /, "00:00:01 "], //00:00:00 -> 00:00:01
    [/^\s*00:00 /, "00:01 "], //00:00 -> 00:01
    [/^\s*[0-9:]+ (!adjust|!t)\b.*/, ""], //removes any accidental tags
];

const mintReplacements = [[/:memboo/gi, ":_"]];

export const genericCensor = (text) => {
    replacements.forEach((replacement) => {
        text = text.replace(replacement[0], replacement[1]);
    });

    return text;
};

export const mintCensor = (text) => {
    mintReplacements.forEach((replacement) => {
        text = text.replace(replacement[0], replacement[1]);
    });

    return text;
};
