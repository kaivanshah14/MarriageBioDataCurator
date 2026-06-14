(() => {
  const bodyText = document.body.innerText;
  const mediaTextIndex = bodyText.toLowerCase().indexOf("media");
  const interestingText = mediaTextIndex >= 0
    ? bodyText.slice(Math.max(0, mediaTextIndex - 200), mediaTextIndex + 600)
    : "";

  const buttons = Array.from(document.querySelectorAll("button, [role='button'], [tabindex]"))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        text: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || "").slice(0, 120),
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      };
    })
    .filter((item) => item.text || item.w > 20)
    .slice(-80);

  const images = Array.from(document.images).map((img) => {
    const rect = img.getBoundingClientRect();
    return {
      alt: img.alt || "",
      srcStart: (img.currentSrc || img.src || "").slice(0, 100),
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      w: Math.round(rect.width),
      h: Math.round(rect.height)
    };
  }).filter((item) => item.x > 1000 || item.w > 80);

  return {
    hasMediaText: mediaTextIndex >= 0,
    interestingText,
    buttons,
    imageCount: images.length,
    images: images.slice(0, 40)
  };
})()
