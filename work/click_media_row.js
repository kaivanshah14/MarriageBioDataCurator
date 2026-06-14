(async () => {
  const x = 1600;
  const y = 444;
  const el = document.elementFromPoint(x, y);
  if (!el) return { ok: false, reason: "no element at media row point" };

  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
    el.dispatchEvent(new MouseEvent(type, {
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
    clicked: (el.innerText || el.textContent || el.tagName || "").slice(0, 200),
    text: document.body.innerText.slice(0, 2500),
    imageCount: document.images.length
  };
})()
