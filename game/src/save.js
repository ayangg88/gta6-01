const SLOT = 'solmar-heat-save-v1';

export function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SLOT) || 'null');
    if (saved && Number.isFinite(saved.cash) && Number.isInteger(saved.mission)) return saved;
  } catch {}
  return { cash: 450, mission: 0, packages: 0, safehouse: false, bestCar: false };
}

export function storeSave(state) {
  try {
    localStorage.setItem(SLOT, JSON.stringify({
      cash: state.cash, mission: state.missions.index, packages: state.packagesFound,
      safehouse: state.safehouse, bestCar: state.bestCar,
    }));
  } catch {}
}
