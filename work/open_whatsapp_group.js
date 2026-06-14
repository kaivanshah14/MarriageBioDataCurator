(async () => {
  const candidates = Array.from(document.querySelectorAll('[role="listitem"], [role="gridcell"], div, span'))
    .filter((el) => (el.innerText || el.textContent || "").includes("Jainam Biodeta (B)"));

  const target = candidates
    .map((el) => el.closest('[role="listitem"], [role="gridcell"]') || el)
    .find((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 100 && rect.height > 20;
    });

  if (!target) {
    return { ok: false, reason: "group result not found" };
  }

  target.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
  target.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
  target.click();
  await new Promise((resolve) => setTimeout(resolve, 1800));

  return {
    ok: true,
    title: document.title,
    text: document.body.innerText.slice(0, 2500)
  };
})()
