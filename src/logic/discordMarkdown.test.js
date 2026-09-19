import { describe, expect, it } from "vitest";
import { discordTimestamp, escapeHtml, relativeTime, renderDiscordMarkdown } from "./discordMarkdown";

describe("escapeHtml", () => {
    it("neutralises markup", () => {
        expect(escapeHtml(`<b onclick="x">&'`)).toBe("&lt;b onclick=&quot;x&quot;&gt;&amp;&#39;");
        expect(escapeHtml(null)).toBe("");
    });
});

describe("renderDiscordMarkdown", () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);

    it("renders emphasis, code and links", () => {
        expect(renderDiscordMarkdown("**bold** *it* __u__ ~~s~~ `c`")).toBe(
            "<strong>bold</strong> <em>it</em> <u>u</u> <s>s</s> <code>c</code>",
        );
        expect(renderDiscordMarkdown("[Open](https://example.test/a?b=1)")).toBe(
            '<a href="https://example.test/a?b=1" target="_blank" rel="noopener">Open</a>',
        );
    });

    it("never lets template text become markup", () => {
        const html = renderDiscordMarkdown('<img src=x onerror="alert(1)"> [x](javascript:alert(1))');
        expect(html).not.toContain("<img");
        expect(html).not.toContain('href="javascript:');
        expect(html).toContain("&lt;img");
    });

    it("shows mentions and timestamps the way Discord does", () => {
        expect(renderDiscordMarkdown("<@&123> <@456> <#789> @everyone")).toBe(
            '<span class="dc-mention">@role 123</span> <span class="dc-mention">@user 456</span> <span class="dc-mention">#channel 789</span> <span class="dc-mention">@everyone</span>',
        );
        const inTwoHours = Math.floor(now / 1000) + 7200;
        expect(renderDiscordMarkdown(`<t:${inTwoHours}:R>`, now)).toBe('<span class="dc-timestamp">in 2 hours</span>');
    });

    it("keeps line breaks", () => {
        expect(renderDiscordMarkdown("a\nb")).toBe("a<br />b");
    });

    it("never rewrites the inside of a link target", () => {
        const html = renderDiscordMarkdown('[x](https://a.com/<t:1>) [y](https://a.com/**b**) [a"b](https://a.com/)');
        expect(html).toContain('href="https://a.com/&lt;t:1&gt;"');
        expect(html).toContain('href="https://a.com/**b**"');
        expect(html).toContain('href="https://a.com/"');
        expect(html).toContain(">a&quot;b</a>");
        expect(html).not.toMatch(/on\w+=/);
        expect(html).not.toMatch(/href="[^"]*</);
    });

    it("formats link labels but not their targets", () => {
        expect(renderDiscordMarkdown("[**bold**](https://a.com/)")).toBe(
            '<a href="https://a.com/" target="_blank" rel="noopener"><strong>bold</strong></a>',
        );
        expect(renderDiscordMarkdown("a\0b [x](https://a.com/)")).toBe(
            'ab <a href="https://a.com/" target="_blank" rel="noopener">x</a>',
        );
    });

    const link = (url, label = url) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;

    it("links bare addresses the way Discord does", () => {
        expect(renderDiscordMarkdown("Watch https://a.test/x?b=1 now")).toBe(
            `Watch ${link("https://a.test/x?b=1")} now`,
        );
        expect(renderDiscordMarkdown("http://a.test\nhttps://b.test")).toBe(
            `${link("http://a.test")}<br />${link("https://b.test")}`,
        );
        // An ampersand is escaped once, in the address and in its text alike.
        expect(renderDiscordMarkdown("https://a.test/?x=1&y=2")).toBe(link("https://a.test/?x=1&amp;y=2"));
        expect(renderDiscordMarkdown("https://a.test/?x=1&")).toBe(link("https://a.test/?x=1&amp;"));
    });

    it("shows a <https://…> link without its brackets", () => {
        expect(renderDiscordMarkdown("Merch: <https://shop.test/a> today")).toBe(
            `Merch: ${link("https://shop.test/a")} today`,
        );
        // The form the server writes into a message for a description's own masked links.
        expect(renderDiscordMarkdown("[Shop](<https://shop.test/a>)")).toBe(link("https://shop.test/a", "Shop"));
        // Brackets around anything else are still just text.
        expect(renderDiscordMarkdown("<ftp://a.test> <not a link>")).toBe("&lt;ftp://a.test&gt; &lt;not a link&gt;");
    });

    it("leaves sentence punctuation and a closing bracket outside the link", () => {
        expect(renderDiscordMarkdown("See https://a.test/x, or https://b.test/y.")).toBe(
            `See ${link("https://a.test/x")}, or ${link("https://b.test/y")}.`,
        );
        expect(renderDiscordMarkdown("Really https://a.test/x?!")).toBe(`Really ${link("https://a.test/x")}?!`);
        expect(renderDiscordMarkdown("(https://a.test/x)")).toBe(`(${link("https://a.test/x")})`);
        expect(renderDiscordMarkdown("(see https://a.test/x).")).toBe(`(see ${link("https://a.test/x")}).`);
        expect(renderDiscordMarkdown("https://en.wikipedia.org/wiki/Foo_(bar)")).toBe(
            link("https://en.wikipedia.org/wiki/Foo_(bar)"),
        );
        expect(renderDiscordMarkdown('"https://a.test/x"')).toBe(`&quot;${link("https://a.test/x")}&quot;`);
        // A scheme with nothing after it is not an address.
        expect(renderDiscordMarkdown("https://.")).toBe("https://.");
    });

    it("never rewrites the inside of an address", () => {
        expect(renderDiscordMarkdown("https://a.test/__init__.py and https://a.test/a*b*c")).toBe(
            `${link("https://a.test/__init__.py")} and ${link("https://a.test/a*b*c")}`,
        );
        expect(renderDiscordMarkdown("<https://a.test/__x__/**y**>")).toBe(link("https://a.test/__x__/**y**"));
        expect(renderDiscordMarkdown("https://a.test/~~x~~/<t:1>")).toBe(
            `${link("https://a.test/~~x~~/")}<span class="dc-timestamp">${discordTimestamp(1, "f")}</span>`,
        );
    });

    it("keeps emphasis and code around an address working", () => {
        expect(renderDiscordMarkdown("**https://a.test/x**")).toBe(`<strong>${link("https://a.test/x")}</strong>`);
        expect(renderDiscordMarkdown("**Watch: https://a.test/x**")).toBe(
            `<strong>Watch: ${link("https://a.test/x")}</strong>`,
        );
        expect(renderDiscordMarkdown("__<https://a.test/x>__")).toBe(`<u>${link("https://a.test/x")}</u>`);
        // Emphasis nobody opened belongs to the address.
        expect(renderDiscordMarkdown("https://a.test/__init__")).toBe(link("https://a.test/__init__"));
        // Inside `code` Discord shows an address as written.
        expect(renderDiscordMarkdown("`https://a.test/x` and `<https://a.test/y>`")).toBe(
            "<code>https://a.test/x</code> and <code>&lt;https://a.test/y&gt;</code>",
        );
    });

    it("is not thrown by a lone backtick earlier on the line", () => {
        // A kaomoji, or a backtick typed for an apostrophe, opens no code span.
        expect(renderDiscordMarkdown("(´・ω・`) Twitter: https://x.test/abc")).toBe(
            `(´・ω・\`) Twitter: ${link("https://x.test/abc")}`,
        );
        expect(renderDiscordMarkdown("(´・ω・`) <https://x.test/abc>")).toBe(
            `(´・ω・\`) ${link("https://x.test/abc")}`,
        );
        expect(renderDiscordMarkdown("`a` and ` then https://a.test/x")).toBe(
            `<code>a</code> and \` then ${link("https://a.test/x")}`,
        );
    });

    it("does not count the underscores of an earlier address as emphasis", () => {
        expect(renderDiscordMarkdown("https://a.test/my_page https://twitter.test/user_")).toBe(
            `${link("https://a.test/my_page")} ${link("https://twitter.test/user_")}`,
        );
        expect(renderDiscordMarkdown("https://a.test/a*b https://b.test/c*")).toBe(
            `${link("https://a.test/a*b")} ${link("https://b.test/c*")}`,
        );
        // Emphasis that really was opened still closes after the address.
        expect(renderDiscordMarkdown("**https://a.test/x** and **https://b.test/y**")).toBe(
            `<strong>${link("https://a.test/x")}</strong> and <strong>${link("https://b.test/y")}</strong>`,
        );
    });

    it("stays fast on a hostile address", () => {
        // Someone else's text, up to 5000 characters of it: a long run of
        // markers and punctuation must not turn the tail split quadratic.
        const hostile = [
            "https://a/" + "*".repeat(2700) + "x" + ".".repeat(1300),
            "_ https://a/" + "_.".repeat(2400),
            "https://a/" + ")".repeat(4900),
        ];
        const started = performance.now();
        for (const text of hostile) renderDiscordMarkdown(text);
        expect(performance.now() - started).toBeLessThan(1000);
    });

    it("never links an address twice", () => {
        expect(renderDiscordMarkdown("[https://a.test](https://b.test/x) https://c.test")).toBe(
            `${link("https://b.test/x", "https://a.test")} ${link("https://c.test")}`,
        );
        expect(renderDiscordMarkdown("https://a.test/[x](https://b.test)")).toBe(
            `${link("https://a.test/")}${link("https://b.test", "x")}`,
        );
    });

    it("only ever links http and https, and nothing escapes the href", () => {
        const html = renderDiscordMarkdown(
            `javascript:alert(1) <javascript:alert(1)> data:text/html,x vbscript:x https://a.test/"onmouseover="alert(1) https://b.test/'><img src=x onerror=alert(1)>`,
        );
        expect(html).not.toMatch(/href="(?!https?:\/\/)/);
        expect(html).not.toContain("<img");
        expect(html).not.toMatch(/<a [^>]*\son\w+=/);
        // The quotes stay entities inside the attribute, and the markup after an address stays text.
        expect(html).toContain('href="https://a.test/&quot;onmouseover=&quot;alert(1)"');
        expect(html).toContain(`${link("https://b.test/")}&#39;&gt;&lt;img src=x onerror=alert(1)&gt;`);
        // Every attribute value is closed by the quote that opened it: no raw quote or bracket inside one.
        for (const [, href] of html.matchAll(/href="([^"]*)"/g)) expect(href).not.toMatch(/[<>"']/);
        expect(renderDiscordMarkdown("JAVASCRIPT:alert(1)//https://a.test")).not.toMatch(/href="javascript/i);
    });
});

describe("relativeTime", () => {
    const now = Date.UTC(2026, 0, 1, 12, 0, 0);
    const at = (seconds) => Math.floor(now / 1000) + seconds;

    it("reads like Discord's relative style", () => {
        expect(relativeTime(at(1), now)).toBe("in 1 second");
        expect(relativeTime(at(-45), now)).toBe("45 seconds ago");
        expect(relativeTime(at(-120), now)).toBe("2 minutes ago");
        expect(relativeTime(at(3 * 3600), now)).toBe("in 3 hours");
        expect(relativeTime(at(-2 * 86400), now)).toBe("2 days ago");
    });

    it("is what the R style renders", () => {
        expect(discordTimestamp(at(60), "R", now)).toBe("in 1 minute");
    });
});
