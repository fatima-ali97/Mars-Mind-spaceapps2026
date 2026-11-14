const MARS_RADIUS_M = 3_389_500;
const RADIANS = Math.PI / 180;
const NEIGHBORS = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function canTraverse(cell) {
  return cell?.traversable === true && Number.isFinite(cell.elevation_m)
    && Number.isFinite(cell.slope_deg) && Number.isFinite(cell.risk_score);
}

export function distanceMeters(a, b) {
  const halfLatitude = (b.lat - a.lat) * RADIANS / 2;
  const halfLongitude = (b.lon - a.lon) * RADIANS / 2;
  const haversine = Math.sin(halfLatitude) ** 2 + Math.sin(halfLongitude) ** 2
    * Math.cos(a.lat * RADIANS) * Math.cos(b.lat * RADIANS);
  const surface = 2 * MARS_RADIUS_M * Math.asin(Math.sqrt(Math.min(1, haversine)));
  return Math.hypot(surface, b.elevation_m - a.elevation_m);
}

function findPath(grid, start, finish, riskWeight) {
  const frontier = new Map([[start, 0]]);
  const costs = new Map([[start, 0]]);
  const previous = new Map();
  while (frontier.size) {
    let current, best = Infinity;
    for (const [point, priority] of frontier) {
      if (priority < best) {
        current = point;
        best = priority;
      }
    }
    if (current === finish) {
      const path = [];
      for (let point = finish; point; point = previous.get(point)) path.push(point);
      return path.reverse();
    }
    frontier.delete(current);
    for (const [dy, dx] of NEIGHBORS) {
      const next = grid[current.y + dy]?.[current.x + dx];
      if (!canTraverse(next?.cell)) continue;
      const length = distanceMeters(current.cell, next.cell);
      const risk = Math.max(current.cell.risk_score, next.cell.risk_score) / 100;
      const cost = costs.get(current) + length * (1 + riskWeight * risk);
      if (cost >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next, cost);
      previous.set(next, current);
      frontier.set(next, cost + distanceMeters(next.cell, finish.cell));
    }
  }
  return null;
}

function describePath(path) {
  let distance = 0, hours = 0, energy = 0;
  let peakRisk = path[0].cell.risk_score;
  const points = [{ ...path[0], distance, hours, energy, peakRisk }];
  for (let n = 1; n < path.length; n++) {
    const a = path[n - 1].cell, b = path[n].cell;
    const length = distanceMeters(a, b);
    const slope = Math.max(a.slope_deg, b.slope_deg);
    const speedKmH = .4 / (1 + slope / 15);
    const segmentHours = length / 1000 / speedKmH;
    distance += length;
    hours += segmentHours;
    energy += segmentHours * (25 + slope * 1.2);
    peakRisk = Math.max(peakRisk, b.risk_score);
    points.push({ ...path[n], distance, hours, energy, peakRisk });
  }
  return { points, distance, hours, energy, peakRisk };
}

export function planRoutes(rows, startCell, finishCell) {
  if (startCell === finishCell || !canTraverse(startCell) || !canTraverse(finishCell)) return null;
  const grid = rows.map((row, y) => row.map((cell, x) => ({ cell, x, y })));
  const points = grid.flat();
  const start = points.find(point => point.cell === startCell);
  const finish = points.find(point => point.cell === finishCell);
  if (!start || !finish) return null;
  const shortest = findPath(grid, start, finish, 0);
  if (!shortest) return null;
  return {
    shortest: describePath(shortest),
    lowerRisk: describePath(findPath(grid, start, finish, 5)),
  };
}

export function sampleDrive(route, progress) {
  const distance = route.distance * progress;
  const nextIndex = route.points.findIndex(point => point.distance >= distance);
  if (nextIndex <= 0) return nextIndex === 0 ? route.points[0] : route.points.at(-1);
  const before = route.points[nextIndex - 1], after = route.points[nextIndex];
  const ratio = (distance - before.distance) / (after.distance - before.distance);
  return {
    x: before.x + (after.x - before.x) * ratio,
    y: before.y + (after.y - before.y) * ratio,
  };
}
