(async () => {
  const x = 340;
  const y = 270;
  const el = document.elementFromPoint(x, y);
  if (!el) return { ok: false, reason: "no element at point" };

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
    activeElement: document.activeElement && {
      tag: document.activeElement.tagName,
      text: (document.activeElement.innerText || document.activeElement.value || "").slice(0, 120),
      label: document.activeElement.getAttribute("aria-label")
    }
  };
})()
