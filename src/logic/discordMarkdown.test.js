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
