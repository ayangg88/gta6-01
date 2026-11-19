export const WORLD = { width: 3000, height: 2200, road: 112, block: 250 };
export const DISTRICTS = [
  { name: 'BRISA BEACH', x: 0, y: 1740, w: 1960, h: 460, color: '#d7c487' },
  { name: 'EAST QUAY', x: 2240, y: 0, w: 760, h: 2200, color: '#4a7778' },
  { name: 'GLASS MILE', x: 870, y: 610, w: 1170, h: 970, color: '#526c68' },
  { name: 'NORTH GARDENS', x: 0, y: 0, w: 2240, h: 600, color: '#617b58' },
  { name: 'OLD SOLMAR', x: 0, y: 610, w: 850, h: 1090, color: '#947d60' },
];
export const SAFEHOUSE = { x: 400, y: 280, name: 'PALMA COURT' };
export const GARAGE = { x: 2700, y: 1530, name: 'TIDELINE SPRAY' };

export function roadAt(x, y) {
  const dx = Math.abs((x + 76) % WORLD.block - WORLD.block / 2);
  const dy = Math.abs((y + 68) % WORLD.block - WORLD.block / 2);
  return dx < WORLD.road / 2 || dy < WORLD.road / 2;
}

export function buildingAt(x, y) {
  if (x < 0 || y < 0 || x > WORLD.width || y > WORLD.height) return true;
  if (y > 1740) return x > 2040;
  if (x > 2250 && (y < 400 || y > 1790)) return false;
  return !roadAt(x, y) && !(x > 2040 && x < 2250);
}

export function nearestRoad(x, y) {
  const block = WORLD.block;
  const rx = Math.round((x - WORLD.road / 2) / block) * block + WORLD.road / 2;
  const ry = Math.round((y - WORLD.road / 2) / block) * block + WORLD.road / 2;
  const vx = Math.max(56, Math.min(WORLD.width - 56, rx));
  const hy = Math.max(56, Math.min(1700, ry));
  return Math.abs(vx - x) < Math.abs(hy - y) ? { x: vx, y } : { x, y: hy };
}

export function isBlocked(x, y, radius = 15) {
  return buildingAt(x - radius, y - radius) || buildingAt(x + radius, y - radius) ||
    buildingAt(x - radius, y + radius) || buildingAt(x + radius, y + radius);
}
