from playwright.sync_api import sync_playwright
import json

CDP_URL = "http://127.0.0.1:9222"

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(CDP_URL)

    page = None

    for context in browser.contexts:
        for pg in context.pages:
            if "web.whatsapp.com" in pg.url:
                page = pg
                break

    if not page:
        raise Exception("WhatsApp page not found")

    input(
        "\nScroll so the floating day label says FRIDAY.\n"
        "Leave it visible.\n"
        "Press ENTER..."
    )

    data = page.evaluate("""
    () => {
        const out = [];

        const all = document.querySelectorAll('*');

        for (const el of all) {
            const txt = (el.innerText || '').trim();

            if (!txt) continue;

            const t = txt.toLowerCase();

            if (
                t === 'friday' ||
                t === 'today' ||
                t === 'yesterday'
            ) {
                out.push({
                    tag: el.tagName,
                    role: el.getAttribute('role'),
                    aria: el.getAttribute('aria-label'),
                    text: txt
                });
            }
        }

        return out.slice(0,100);
    }
    """)

    with open(
        "day_separators.json",
        "w",
        encoding="utf-8"
    ) as f:
        json.dump(data, f, indent=2)

    print("Saved day_separators.json")