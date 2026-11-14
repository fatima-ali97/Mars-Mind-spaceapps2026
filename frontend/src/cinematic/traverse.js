import { canTraverse, planRoutes, sampleDrive } from './routes.js';

const KM = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });
const formatDistance = meters => KM.format(meters / 1000) + ' km';
const formatPoint = point => point ? point.lat.toFixed(4) + '°, ' + point.lon.toFixed(4) + '°' : 'Choose a point';
const formatTime = hours => {
  const minutes = Math.ceil(hours * 60);
  return minutes < 60 ? minutes + ' min' : Math.floor(minutes / 60) + ' h ' + minutes % 60 + ' min';
};

export function createTraverse({ map, reduced }) {
  const byId = id => document.getElementById(id);
  const canvas = document.createElement('canvas');
  canvas.className = 'route-overlay';
  canvas.width = map.width;
  canvas.height = map.height;
  canvas.setAttribute('aria-hidden', 'true');
  map.after(canvas);
  const ctx = canvas.getContext('2d');
  const preview = byId('simMap').getContext('2d');
  const startButton = byId('setStart'), finishButton = byId('setFinish');
  const resetButton = byId('resetRoute'), play = byId('playDrive');
  const slider = byId('simProgress'), result = byId('routeResults');
  const modeButtons = [...result.querySelectorAll('input[name="route"]')];
  let rows = [], selected = null, start = null, finish = null, routes = null;
  let mode = 'lowerRisk', progress = 0, frame = 0;
  const color = { shortest: '#ffd2ac', lowerRisk: '#c0ead3' };

  function viewPoint(point) {
    return [(point.x + .5) * canvas.width / rows[0].length, (point.y + .5) * canvas.height / rows.length];
  }

  function pin(point, label) {
    if (!point) return;
    const y = rows.findIndex(row => row.includes(point));
    const [xPixel, yPixel] = viewPoint({ x: rows[y].indexOf(point), y });
    ctx.fillStyle = '#1b1211';
    ctx.strokeStyle = '#fff0dd';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(xPixel, yPixel, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff0dd';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, xPixel, yPixel);
  }

  function trace(key, active) {
    const points = routes[key].points;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...viewPoint(points[0]));
    for (const point of points.slice(1)) ctx.lineTo(...viewPoint(point));
    if (active) {
      ctx.strokeStyle = '#1b1211';
      ctx.lineWidth = 7;
      ctx.stroke();
    }
    ctx.setLineDash(active ? [] : [5, 6]);
    ctx.strokeStyle = color[key];
    ctx.lineWidth = active ? 3.5 : 3;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (routes) {
      trace(mode === 'shortest' ? 'lowerRisk' : 'shortest', false);
      trace(mode, true);
    }
    if (selected && selected !== start && selected !== finish
        && map.parentElement.classList.contains('show-trek')) {
      const y = rows.findIndex(row => row.includes(selected));
      if (y !== -1) {
        const [x, positionY] = viewPoint({ x: rows[y].indexOf(selected), y });
        ctx.strokeStyle = '#ffe0c4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, positionY, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    pin(start, 'A');
    pin(finish, 'B');
    if (routes && progress > 0 && progress < 1) {
      const [x, y] = viewPoint(sampleDrive(routes[mode], progress));
      ctx.fillStyle = '#fff4e7';
      ctx.strokeStyle = '#221613';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    if (routes) {
      preview.drawImage(map, 0, 0);
      preview.drawImage(canvas, 0, 0);
    }
  }

  function updateProgress(value) {
    progress = value;
    slider.value = String(Math.round(progress * 100));
    byId('simPercent').textContent = slider.value + '%';
    draw();
  }

  function pause() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    play.textContent = progress === 1 ? 'Replay drive' : progress ? 'Resume drive' : 'Play drive';
  }

  function refreshMetrics() {
    const route = routes[mode];
    byId('simDistance').textContent = formatDistance(route.distance);
    byId('simTime').textContent = formatTime(route.hours);
    byId('simEnergy').textContent = Math.round(route.energy).toLocaleString('en') + ' Wh';
    byId('simRisk').textContent = route.peakRisk + '/100';
    const samePath = routes.lowerRisk.points.length === routes.shortest.points.length
      && routes.lowerRisk.points.every((point, index) => point.cell === routes.shortest.points[index].cell);
    byId('routeStatus').textContent = samePath
      ? 'Both methods selected the same path on this grid.'
      : 'Both routes are drawn on the map. The selected route is solid.';
    updateProgress(0);
    pause();
  }

  function updateRoutes() {
    pause();
    routes = start && finish ? planRoutes(rows, start, finish) : null;
    result.hidden = !routes;
    byId('routeStart').textContent = formatPoint(start);
    byId('routeFinish').textContent = formatPoint(finish);
    resetButton.disabled = !start && !finish;
    select(selected);
    if (routes) {
      for (const key of ['shortest', 'lowerRisk']) {
        const route = routes[key];
        byId(key + 'Stats').textContent = formatDistance(route.distance) + ' · Peak risk ' + route.peakRisk + '/100';
      }
      refreshMetrics();
      return;
    }
    byId('routeStatus').textContent = !rows.length ? 'Waiting for terrain.'
      : start && finish ? 'No traversable path connects these points. Choose a different start or destination.'
      : !start ? 'Select a traversable start point.' : 'Select a different traversable destination.';
    updateProgress(0);
  }

  function select(cell) {
    selected = cell;
    startButton.disabled = !canTraverse(cell) || cell === start || cell === finish;
    finishButton.disabled = !canTraverse(cell) || cell === finish || cell === start;
    const hint = cell && !canTraverse(cell) ? 'This point is outside the traversable area in the model.' : '';
    startButton.title = hint;
    finishButton.title = hint;
    byId('routePointHint').textContent = hint;
  }

  function setGrid(grid) {
    rows = grid;
    start = null;
    finish = null;
    updateRoutes();
  }

  startButton.addEventListener('click', () => { start = selected; updateRoutes(); });
  finishButton.addEventListener('click', () => { finish = selected; updateRoutes(); });
  resetButton.addEventListener('click', () => setGrid(rows));
  modeButtons.forEach(button => button.addEventListener('change', () => {
    if (!button.checked || !routes) return;
    mode = button.value;
    refreshMetrics();
  }));
  slider.addEventListener('input', () => {
    updateProgress(Number(slider.value) / 100);
    pause();
  });
  play.addEventListener('click', () => {
    if (!routes) return;
    if (frame) { pause(); return; }
    if (progress === 1) updateProgress(0);
    if (reduced) {
      updateProgress(1);
      pause();
      return;
    }
    const started = performance.now() - progress * 9000;
    play.textContent = 'Pause drive';
    function tick(time) {
      updateProgress(Math.max(0, Math.min(1, (time - started) / 9000)));
      if (progress === 1) pause();
      else frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
  });

  return { select, setGrid, draw };
}
