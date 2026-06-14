from playwright.sync_api import sync_playwright
import json

CDP_URL = "http://127.0.0.1:9222"


with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp(CDP_URL)

    contexts = browser.contexts

    print(f"Contexts: {len(contexts)}")

    for cidx, context in enumerate(contexts):
        print(f"\nContext {cidx}")

        for pidx, page in enumerate(context.pages):
            try:
                print(f"[{pidx}] {page.title()} :: {page.url}")
            except:
                pass

    input("\nOpen the WhatsApp group and navigate to Friday biodata.\n"
          "Then press ENTER here...")

    target_page = None

    for context in browser.contexts:
        for page in context.pages:
            if "web.whatsapp.com" in page.url:
                target_page = page
                break

    if not target_page:
        raise Exception("WhatsApp page not found")

    data = target_page.evaluate("""
    () => {
        return {
            title: document.title,
            url: location.href,
            bodyLength: document.body.innerHTML.length,
            ariaLabels: [...new Set(
                [...document.querySelectorAll('[aria-label]')]
                    .map(x => x.getAttribute('aria-label'))
                    .filter(Boolean)
            )].slice(0, 500),

            roles: [...new Set(
                [...document.querySelectorAll('[role]')]
                    .map(x => x.getAttribute('role'))
                    .filter(Boolean)
            )],

            imgCount: document.querySelectorAll('img').length,

            buttons: [...document.querySelectorAll('button')]
                .map(x => ({
                    text: x.innerText,
                    aria: x.getAttribute('aria-label')
                }))
                .slice(0, 200)
        };
    }
    """)

    with open("whatsapp_dom_dump.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print("\nSaved whatsapp_dom_dump.json")