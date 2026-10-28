/** LEGACY3 L3-020 — browser placeholder only. No gameplay or external data. */
const checkButton = document.querySelector<HTMLButtonElement>('#check-button');
const resultNode = document.querySelector<HTMLParagraphElement>('#check-result');
if (checkButton === null || resultNode === null) {
  throw new Error('LEGACY3 placeholder: required DOM elements were not found');
}
document.documentElement.dataset.jsReady = 'true';
checkButton.addEventListener('click', () => {
  resultNode.textContent = 'Browser module loaded and interaction verified.';
  checkButton.setAttribute('aria-pressed', 'true');
});

export {};
