/** Fit live rules into their fixed card well after fonts and card size settle. */
export function fitRules(node: HTMLElement, _key?: string) {
  let frame = 0;
  const applyFit = () => {
    const card = node.closest<HTMLElement>('.game-card');
    const effect = node.querySelector<HTMLElement>('.effect');
    if (!card || !effect) return;
    const width = parseFloat(getComputedStyle(card).width) || card.clientWidth; // Layout pixels stay stable under print-preview zoom and rotation.
    if (!width) return;
    let low = width * .03, high = width * .075;
    for (let i = 0; i < 12; i++) {
      const size = (low + high) / 2;
      effect.style.fontSize = `${size}px`;
      if (effect.offsetTop + effect.offsetHeight <= node.clientHeight - 1 && effect.scrollWidth <= effect.clientWidth) low = size;
      else high = size;
    }
    effect.style.fontSize = `${Math.max(3, (low - .25) / width * 100)}cqw`;
  };
  const fit = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(applyFit); };
  const beforePrint = () => { cancelAnimationFrame(frame); applyFit(); };
  let lastWidth = -1;
  const observer = new ResizeObserver(entries => {
    const width = entries[0]?.contentRect.width ?? 0;
    if (width === lastWidth) return;
    lastWidth = width;
    fit();
  });
  observer.observe(node.closest<HTMLElement>('.game-card') ?? node);
  document.fonts.ready.then(fit);
  window.addEventListener('beforeprint', beforePrint);
  fit();
  return { update: fit, destroy() { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('beforeprint', beforePrint); } };
}
