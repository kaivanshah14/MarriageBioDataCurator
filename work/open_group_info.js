(async () => {
  const x = 1120;
  const y = 30;
  const el = document.elementFromPoint(x, y);
  if (!el) return { ok: false, reason: "no element at header point" };

  for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) {
    el.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y
    }));
  }

  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    ok: true,
    clicked: (el.innerText || el.textContent || el.tagName || "").slice(0, 160),
    text: document.body.innerText.slice(0, 3000),
    imageCount: document.images.length
  };
})()
