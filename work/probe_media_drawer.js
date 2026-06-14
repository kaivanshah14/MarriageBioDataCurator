(async () => {
  await new Promise((resolve) => setTimeout(resolve, 2500));

  const panelNodes = Array.from(document.querySelectorAll("div, span, button, [role]"))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName,
        role: el.getAttribute("role") || "",
        label: el.getAttribute("aria-label") || "",
        text: (el.innerText || el.textContent || "").slice(0, 100),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight
      };
    })
    .filter((item) => item.x >= 1340 && item.w > 20 && item.h > 0)
    .slice(0, 120);

  const images = Array.from(document.images).map((img) => {
    const rect = img.getBoundingClientRect();
    return {
      alt: img.alt || "",
      srcStart: (img.currentSrc || img.src || "").slice(0, 120),
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height)
    };
  }).filter((item) => item.x >= 1340);

  return {
    text: document.body.innerText.slice(-2000),
    panelNodes,
    imageCount: images.length,
    images: images.slice(0, 80)
  };
})()
