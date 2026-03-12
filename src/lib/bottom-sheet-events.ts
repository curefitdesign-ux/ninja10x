/** Dispatch to hide/show the bottom nav when any sheet opens/closes */
export function notifyBottomSheet(visible: boolean) {
  window.dispatchEvent(new CustomEvent('bottom-sheet-visibility', { detail: { visible } }));
}
