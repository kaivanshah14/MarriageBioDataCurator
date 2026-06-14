(async () => {
  const input = document.querySelector('input[aria-label="Search or start a new chat"]');
  if (!input) return { ok: false, reason: "search input missing" };

  input.focus();
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
  setter.call(input, "Jainam Biodeta");
  input.dispatchEvent(new InputEvent("input", {
    bubbles: true,
    inputType: "insertText",
    data: "Jainam Biodeta"
  }));

  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    ok: true,
    text: document.body.innerText.slice(0, 2500)
  };
})()
