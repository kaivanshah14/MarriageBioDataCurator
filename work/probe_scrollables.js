(() => {
  return Array.from(document.querySelectorAll("div"))
    .map((el, index) => {
      const rect = el.getBoundingClientRect();
      return {
        index,
        role: el.getAttribute("role") || "",
        label: el.getAttribute("aria-label") || "",
        text: (el.innerText || "").slice(0, 120),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      };
    })
    .filter((item) => item.scrollHeight > item.clientHeight + 20 && item.w > 200 && item.h > 100)
    .sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight))
    .slice(0, 20);
})()
