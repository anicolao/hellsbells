/** Fit live rules into their fixed card well after fonts and card size settle. */
export function fitRules(node: HTMLElement, _key?: string) {
  let frame = 0;
  const fit = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const card = node.closest<HTMLElement>('.game-card');
      const effect = node.querySelector<HTMLElement>('.effect');
      if (!card || !effect) return;
      const width = card.getBoundingClientRect().width;
      let low = width * .03, high = width * .075;
      for (let i = 0; i < 12; i++) {
        const size = (low + high) / 2;
        effect.style.fontSize = `${size}px`;
        if (node.scrollHeight <= node.clientHeight + .5 && effect.scrollWidth <= effect.clientWidth + .5) low = size;
        else high = size;
      }
      effect.style.fontSize = `${Math.max(3, (low - .15) / width * 100)}cqw`;
    });
  };
  const observer = new ResizeObserver(fit);
  observer.observe(node);
  document.fonts.ready.then(fit);
  window.addEventListener('beforeprint', fit);
  fit();
  return { update: fit, destroy() { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('beforeprint', fit); } };
}
