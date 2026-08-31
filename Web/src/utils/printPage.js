export const PRINT_MODES = {
  reportsOb: 'reports-print-mode',
  obDetails: 'ob-print-mode',
};

export function triggerPrint(mode) {
  document.body.classList.add(mode);

  const cleanup = () => {
    document.body.classList.remove(mode);
  };

  window.addEventListener('afterprint', cleanup, { once: true });
  window.setTimeout(cleanup, 1000);
  window.print();
}
