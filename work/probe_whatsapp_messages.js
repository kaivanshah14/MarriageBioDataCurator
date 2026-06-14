(async () => {
  const imageNodes = Array.from(document.images).map((img) => ({
    alt: img.alt || "",
    srcStart: (img.currentSrc || img.src || "").slice(0, 120),
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    rect: (() => {
      const rect = img.getBoundingClientRect();
      return { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };
    })()
  }));

  const text = document.body.innerText;
  const messages = Array.from(document.querySelectorAll('[data-id], [role="row"], [role="listitem"]'))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        dataId: el.getAttribute("data-id") || "",
        role: el.getAttribute("role") || "",
        text: (el.innerText || "").slice(0, 300),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) }
      };
    })
    .filter((item) => item.text || item.dataId)
    .slice(-30);

  return {
    hasSeeMoreHistory: text.includes("See more chat history on the app"),
    imageCount: imageNodes.length,
    images: imageNodes.slice(-20),
    messageLikeCount: messages.length,
    messages
  };
})()
