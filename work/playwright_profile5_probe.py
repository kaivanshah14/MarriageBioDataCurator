from playwright.sync_api import sync_playwright

PROFILE_DIR = r"C:\Users\Kivn\AppData\Local\Google\Chrome\User Data"

with sync_playwright() as p:
    context = p.chromium.launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        channel="chrome",
        headless=False
    )

    page = context.new_page()
    page.goto("https://web.whatsapp.com")

    print("Opened WhatsApp")
    input("Press ENTER to close...")

    context.close()