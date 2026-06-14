(() => {
  const nodes = Array.from(document.querySelectorAll("div, section, main, [role]"));
  const scrollables = nodes
    .map((el, index) => {
      const rect = el.getBoundingClientRect();
      return {
        index,
        tag: el.tagName,
        role: el.getAttribute("role") || "",
        label: el.getAttribute("aria-label") || "",
        className: String(el.className || "").slice(0, 80),
        text: (el.innerText || "").slice(0, 80),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
        overflowY: getComputedStyle(el).overflowY
      };
    })
    .filter((item) => item.scrollHeight > item.clientHeight || item.overflowY !== "visible")
    .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))
    .slice(0, 60);

  return {
    viewport: { w: innerWidth, h: innerHeight },
    bodyTextLength: document.body.innerText.length,
    scrollables
  };
})()
