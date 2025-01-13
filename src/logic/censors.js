// Uses the js .replace() api. Supports either string or regex
// [search, replacement]
// case insensitive. It will automatically match the replacement with the source format.
const replacements = [
    [/(\bn)t(r)/gi, "$1*$2"], //ntr -> n*r
    [/(\bd)i(ck)/gi, "$1*$2"], //dick -> d*ck
    [/(\bc)u(ck)/gi, "$1*$2"], //cuck -> c*ck
    [/(\bf)uck(ing)/gi, "$1-$2"], //fucking -> f-ing
    [/(\bf)u(ck)/gi, "$1*$2"], //fuck -> f*ck
    [/(\bsh)i(t)/gi, "$1*$2"], //shit -> sh*t
    [/(\bwh)o(re)/gi, "$1*$2"], //whore -> wh*re
    [/(\bsl)u(t)/gi, "$1*$2"], //slut -> sl*t
    [/(\bb)i(tch)/gi, "$1*$2"], //bitch -> b*tch
    [/(\bstr)i(p)/gi, "$1*$2"], //strip -> str*p
    [/(\bcond)o(m)/gi, "$1*$2"], //condom -> cond*m
    [/\b(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}/gi, "$3's website"], // www.example.com -> example's website
    [/\b(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}/gi, "$3"], // running multiple times for any .com.ca domains
    [/\b(https?:\/\/)?(www\.)?([a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}/gi, "$3"],
    [/(\bmess)a(ge)/gi, "$1*$2"], //message -> mess*ge
    [/(\bcomm)e(nt)/gi, "$1*$2"], //comment -> comm*nt
    [/\b#(\w+)/gi, "hashtag-$1"], //#example -> hashtag-example
    [/(\btw)i(tter)/gi, "$1*$2"], //twitter -> tw*tter
    [/(\bti)k(tok)/gi, "$1*$2"], //tiktok -> ti*tok
    [/(\btw)i(tch)/gi, "$1*$2"], //twitch -> tw*tch
    [/(\bs)e(x)/gi, "$1*$2"], //sex -> s*x
    [/(\bp)o(rn)/gi, "$1*$2"], //porn -> p*rn
    [/(\bb)a(ll)/gi, "$1*$2"], //ball -> b*ll
    [/kill yourself/gi, "unalive"], //kill yourself -> unalive
    [/18\+/gi, "18 up"], //ball -> b*ll
    [/(\bsp)e(rm)/gi, "$1*$2"], //sperm -> sp*rm
    [/(\bn)i(pple)/gi, "$1*$2"], //nipple -> n*pple
    [/(\bp)u(ssies)/gi, "$1*$2"], //pussies -> p*ssies
    [/(\bp)u(ssy)/gi, "$1*$2"], //pussy -> p*ssy
    [/(\brac)i(st)/gi, "$1*$2"], //racist -> rac*st
    [/(\bper)v(ert)/gi, "$1*$2"], //pervert -> per*ert
    [/(\bg)a(ngb)a(ng)/gi, "$1*$2*$3"], //gangbang -> g*ngb*ng
    [/(\bh)i(tler)/gi, "$1*$2"], //hitler -> h*tler
    [/(\bd)u(mbass)/gi, "$1*$2"], //dumbass -> d*mbass
    [/(\bc)o(vid)/gi, "$1*$2"], //covid -> c*vid
    [/(\bb)o(bb)/gi, "$1*$2"], //boob -> b*oob
    ["\\", ""], //\ -> nothing
    [/^(\d+ )/, "00:$1"], //adds 00: to any tags that do not have it
    [/^00:00/, "00:01"], //00:00 -> 00:01
    [/^(!adjust|!t)\b.*/, ""], //removes any accidental tags
    [/^00:00/, "00:01"], //00:00 -> 00:01
];

export const genericCensor = (text) => {
    replacements.forEach((replacement) => {
        text = text.replace(replacement[0], replacement[1]);
    });

    return text;
};
