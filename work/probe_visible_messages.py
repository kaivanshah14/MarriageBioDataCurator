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
        "\nScroll so several Friday biodata images are visible.\n"
        "Do NOT open an image.\n"
        "Press ENTER when ready..."
    )

    result = page.evaluate("""
    () => {
        const items = [];

        const nodes = document.querySelectorAll('[aria-label]');

        for (const n of nodes) {
            const aria = n.getAttribute('aria-label');

            if (!aria) continue;

            if (
                aria.includes('Media') ||
                aria.includes('photo') ||
                aria.includes('photos') ||
                aria.includes('picture')
            ) {
                items.push({
                    aria: aria,
                    tag: n.tagName,
                    role: n.getAttribute('role'),
                    text: (n.innerText || '').slice(0, 300)
                });
            }
        }

        return items.slice(0, 200);
    }
    """)

    with open("visible_media_nodes.json", "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"Saved {len(result)} nodes")
