(async () => {
  const candidates = Array.from(document.querySelectorAll("div, button, [role='button']"))
    .filter((el) => (el.innerText || "").includes("Media, links and docs"));
  const target = candidates
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return { el, rect };
    })
    .filter(({ rect }) => rect.x > 1000 && rect.width > 200 && rect.height > 30)
    .sort((a, b) => (a.rect.width * a.rect.height) - (b.rect.width * b.rect.height))[0]?.el;

  if (!target) return { ok: false, reason: "media panel target not found" };

  const rect = target.getBoundingClientRect();
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
    target.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    }));
  }

  await new Promise((resolve) => setTimeout(resolve, 1800));
  return {
    ok: true,
    text: document.body.innerText.slice(0, 2500),
    imageCount: document.images.length,
    url: location.href
  };
})()
