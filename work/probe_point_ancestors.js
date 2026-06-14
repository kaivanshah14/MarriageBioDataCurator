(() => {
  const x = 1600;
  const y = 444;
  let el = document.elementFromPoint(x, y);
  const chain = [];
  while (el && chain.length < 12) {
    const rect = el.getBoundingClientRect();
    chain.push({
      tag: el.tagName,
      role: el.getAttribute("role") || "",
      label: el.getAttribute("aria-label") || "",
      tabindex: el.getAttribute("tabindex") || "",
      text: (el.innerText || el.textContent || "").slice(0, 160),
      className: String(el.className || "").slice(0, 100),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height)
    });
    el = el.parentElement;
  }
  return chain;
})()
