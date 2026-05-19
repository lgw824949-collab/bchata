/**
 * Layer stack (fixed bottom nav is the floor).
 * All modals / overlays MUST use Z.modalBackdrop or higher.
 */
export const Z_NAV = 2_100_000;

export const Z = {
  nav: Z_NAV,
  modalBackdrop: Z_NAV + 100_000, // 2_200_000
  modal: Z_NAV + 100_001, // 2_200_001
  modalNested: Z_NAV + 100_010, // 2_200_010
  modalHigh: Z_NAV + 200_000, // 2_300_000 — party register, notice guide
  modalMax: Z_NAV + 300_000, // 2_400_000 — poster fullscreen, Incheon route
};
