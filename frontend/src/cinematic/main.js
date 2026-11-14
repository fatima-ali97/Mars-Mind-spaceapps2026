import { createTraverse } from './traverse.js';
import { showMarsTrek } from './mars-trek.js';

(()=>{'use strict';
const $=id=>document.getElementById(id), reduced=window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const hash=(x,y)=>{let n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)},lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t);
const noise=(x,y)=>{const a=Math.floor(x),b=Math.floor(y),u=sm(x-a),v=sm(y-b);return lerp(lerp(hash(a,b),hash(a+1,b),u),lerp(hash(a,b+1),hash(a+1,b+1),u),v)};
function fbm(x,y){let sum=0,amp=.55,total=0;for(let k=0;k<4;k++){sum+=noise(x,y)*amp;total+=amp;x*=2.04;y*=2.04;amp*=.53}return sum/total}
/* Background stars: animated twinkling and slow drift, capped for smoothness */
const st=$('stars'),sc=st.getContext('2d');let points=[],starW=0,starH=0;function setupStars(){const dpr=Math.min(devicePixelRatio||1,2),r=$('home').getBoundingClientRect();starW=window.innerWidth;starH=r.height;st.width=Math.round(starW*dpr);st.height=Math.round(starH*dpr);sc.setTransform(dpr,0,0,dpr,0,0);points=Array.from({length:210},(_,i)=>({x:hash(i+9,2)*starW,y:hash(i+73,4)*starH,r:.4+hash(i,81)*1.2,a:.08+hash(i+12,13)*.55,v:.6+hash(i,45)*1.5,p:hash(i,77)*7}));}function paintStars(t){sc.clearRect(0,0,starW,starH);for(let p of points){let a=p.a*(reduced?1:.64+.36*Math.sin(t*.001*p.v+p.p));sc.fillStyle=`rgba(241,232,226,${a})`;sc.beginPath();sc.arc(p.x,p.y,p.r,0,7);sc.fill()}}setupStars();window.addEventListener('resize',()=>{setupStars();paintStars(performance.now())},{passive:true});
/* Real surface rotation on an intentionally stylized/procedural Mars sphere. */
const pc=$('planetCanvas'),pctx=pc.getContext('2d',{alpha:true});const SIZE=pc.width,TW=768,TH=384,texture=new Uint8ClampedArray(TW*TH*3),sphere=[];
const craters=Array.from({length:24},(_,i)=>({x:hash(i+33,9)*TW,y:hash(i+76,1)*TH,r:4+hash(i+44,5)*27}));
for(let y=0;y<TH;y++){for(let x=0;x<TW;x++){let j=(y*TW+x)*3,u=x/TW,v=y/TH;let n=fbm(u*7+11,v*4+5),fine=fbm(u*35+5,v*19+7),small=fbm(u*76+31,v*37+6),albedo=(n-.5)*88+(fine-.5)*42+(small-.5)*12;for(let c of craters){let dx=Math.abs(x-c.x);dx=Math.min(dx,TW-dx);let dy=y-c.y;let r=Math.hypot(dx,dy)/c.r;if(r<1.4){albedo+=12*Math.exp(-Math.pow((r-.98)*9,2))-19*Math.exp(-r*r*7)}}let dark=n>.565?-.24:0;texture[j]=Math.max(0,Math.min(255,167+albedo+dark*60));texture[j+1]=Math.max(0,Math.min(255,82+albedo*.7+dark*25));texture[j+2]=Math.max(0,Math.min(255,56+albedo*.5+dark*16));}}
let surface=[];const R=SIZE*.444,cx=SIZE/2,cy=SIZE/2;for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++){let dx=(x-cx)/R,dy=(y-cy)/R,rr=dx*dx+dy*dy;if(rr>1)continue;let z=Math.sqrt(1-rr),longitude=Math.atan2(dx,z),lat=Math.asin(dy);let diffuse=Math.max(0,dx*(-.38)+dy*(-.28)+z*.88);let rim=Math.pow(Math.max(0,1-rr),.19);let shade=(.17+.83*diffuse)*(.65+.35*rim);surface.push({at:(y*SIZE+x)*4,longitude,lat,shade})}
let planetImage=pctx.createImageData(SIZE,SIZE);function paintPlanet(phase){const d=planetImage.data;d.fill(0);for(let p of surface){let lon=(p.longitude+phase)/(Math.PI*2);lon=lon-Math.floor(lon);let u=Math.min(TW-1,Math.floor(lon*TW)),v=Math.max(0,Math.min(TH-1,Math.floor((p.lat/Math.PI+.5)*TH))),i=(v*TW+u)*3,k=p.at;d[k]=texture[i]*p.shade;d[k+1]=texture[i+1]*p.shade;d[k+2]=texture[i+2]*p.shade;d[k+3]=255;}pctx.putImageData(planetImage,0,0);pctx.beginPath();pctx.arc(cx,cy,R+1,0,7);pctx.lineWidth=2;pctx.strokeStyle='rgba(233,144,101,.25)';pctx.stroke()}
/* FastAPI integration. Vite forwards /api requests to the local backend. */
async function requestJSON(path, payload) {
  const response = await fetch('/api' + path, payload === undefined ? undefined : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Request failed (' + response.status + ')');
  return response.json();
}

const map = $('mapCanvas'), ctx = map.getContext('2d');
const traverse = createTraverse({ map, reduced });
const layerButtons = [...document.querySelectorAll('[data-layer]')];
const scan = $('scanBtn'), analysis = $('analysisResult');
const imagery = $('trekImagery');
const mapMetadata = requestJSON('/mars/map').catch(() => null);
let imageryVersion = 0;
let hasImagery = false;

async function loadImagery(bounds) {
  const version = ++imageryVersion;
  hasImagery = false;
  refreshMapLabels();
  const staging = document.createElement('div');
  try {
    const metadata = await mapMetadata;
    if (!metadata?.tile_url) return;
    await showMarsTrek(staging, metadata, bounds);
    if (version !== imageryVersion) return;
    imagery.replaceChildren(...staging.children);
    hasImagery = true;
    refreshMapLabels();
  } catch {
    // The numeric grid can still render its own terrain shading.
  }
}

function refreshMapLabels() {
  const showingImagery = layer === 'terrain' && hasImagery;
  $('mapWrap').classList.toggle('show-trek', showingImagery);
  $('trekCredit').hidden = !showingImagery;
  traverse.draw();
  $('layerName').textContent = showingImagery ? 'MOLA COLOR HILLSHADE' : layerLabels[layer];
  $('layerLegend').textContent = layer === 'hazards' ? 'LOW / MODERATE / HIGH / BLOCKED'
    : showingImagery ? 'MOLA COLOR HILLSHADE' : layerLabels[layer];
}

const layerLabels = { terrain: 'SHADED TERRAIN', elevation: 'RELATIVE ELEVATION', hazards: 'INDICATIVE HAZARDS' };
const hazardColors = { low: '#68896f', moderate: '#bb9164', high: '#ab564d', blocked: '#632d39', unknown: '#303237' };
let region = null, rows = [], currentCell = null;
let layer = 'terrain', selectionVersion = 0;

function reportTerrain(message) {
  analysis.textContent = message;
  analysis.classList.add('show');
}

function updateCell(cell) {
  currentCell = cell;
  ++selectionVersion;
  traverse.select(cell);
  updateChatControls();
  const coordinates = cell ? cell.lat.toFixed(4) + '°, ' + cell.lon.toFixed(4) + '°' : '—';
  $('siteCoords').textContent = coordinates;
  $('mapCoords').textContent = coordinates;
  $('elevation').textContent = cell?.elevation_m == null ? '—' : Math.round(cell.elevation_m).toLocaleString('en') + ' m';
  $('slope').textContent = cell?.slope_deg == null ? '—' : cell.slope_deg.toFixed(2) + '°';
  $('risk').textContent = cell?.risk_score == null ? '—' : cell.risk_score + '/100 · ' + cell.hazard;
  scan.disabled = !cell;
  scan.textContent = 'Analyze selected area ↗';
  analysis.classList.remove('show');
}

function drawTerrain() {
  const width = map.width, height = map.height;
  ctx.fillStyle = '#251c1d';
  ctx.fillRect(0, 0, width, height);
  if (!rows.length) return;
  const elevations = rows.flat().map(cell => cell.elevation_m).filter(Number.isFinite);
  const minimum = elevations.length ? Math.min(...elevations) : 0;
  const range = elevations.length ? Math.max(Math.max(...elevations) - minimum, 1) : 1;
  const tileWidth = width / rows[0].length, tileHeight = height / rows.length;
  rows.forEach((row, y) => row.forEach((cell, x) => {
    const normalized = (cell.elevation_m - minimum) / range;
    const east = row[Math.min(row.length - 1, x + 1)].elevation_m;
    const shade = east === null ? 0 : Math.max(-.14, Math.min(.14, (cell.elevation_m - east) / range));
    ctx.fillStyle = layer === 'hazards' ? hazardColors[cell.hazard] || hazardColors.unknown
      : cell.elevation_m === null ? hazardColors.unknown
      : layer === 'elevation' ? 'hsl(' + (220 - normalized * 183) + ' 42% ' + (28 + normalized * 29) + '%)'
      : 'hsl(21 45% ' + (21 + (normalized + shade) * 35) + '%)';
    ctx.fillRect(Math.floor(x * tileWidth), Math.floor(y * tileHeight), Math.ceil(tileWidth + 1), Math.ceil(tileHeight + 1));
    if (cell === currentCell) {
      ctx.strokeStyle = '#ffe0c4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc((x + .5) * tileWidth, (y + .5) * tileHeight, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
  }));
  traverse.draw();
}

function selectLayer(next) {
  layer = next;
  layerButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.layer === layer)));
  refreshMapLabels();
  drawTerrain();
}

async function loadGrid(info) {
  region = null;
  void loadImagery(info.bounds);
  rows = [];
  traverse.setGrid(rows);
  updateCell(null);
  drawTerrain();
  $('siteName').textContent = info.name;
  $('terrainSource').textContent = 'Loading terrain…';
  $('terrainMode').textContent = '—';
  $('terrainWarning').textContent = 'Terrain estimates depend on the selected dataset.';
  const buttons = [...$('regionChoices').querySelectorAll('button')];
  buttons.forEach(button => {
    button.disabled = true;
    button.setAttribute('aria-pressed', String(button.dataset.region === info.id));
  });
  try {
    const stride = Math.max(1, Math.ceil(Math.max(info.width, info.height) / 80));
    const result = await requestJSON('/terrain/grid?region_id=' + encodeURIComponent(info.id) + '&stride=' + stride);
    if (!result.rows?.length || !result.rows[0]?.length) throw new Error('Empty terrain region');
    region = result.region;
    rows = result.rows;
    traverse.setGrid(rows);
    const middle = rows[Math.floor(rows.length / 2)];
    updateCell(middle[Math.floor(middle.length / 2)]);
    $('terrainSource').textContent = region.source;
    $('terrainMode').textContent = 'NASA MOLA elevation';
    $('terrainWarning').textContent = region.warning || 'Slope and hazard are estimates from the selected dataset.';
    drawTerrain();
  } catch {
    $('terrainSource').textContent = 'Terrain unavailable';
    reportTerrain('Could not load this terrain. Select the region to try again.');
  } finally {
    buttons.forEach(button => { button.disabled = false; });
  }
}

async function loadRegions() {
  try {
    const choices = (await requestJSON('/mars/regions')).filter(info => info.source_type === 'nasa_mola_dem');
    if (!choices.length) {
      $('terrainSource').textContent = 'MOLA elevation data is unavailable';
      $('siteName').textContent = 'No measured region loaded';
      $('regionChoices').replaceChildren();
      reportTerrain('Install the Jezero MOLA dataset on the backend to enable point analysis and routes.');
      void loadImagery({ west: 77.2, east: 77.6, south: 18.3, north: 18.7 });
      return;
    }
    $('regionChoices').replaceChildren(...choices.map(info => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'loc';
      button.dataset.region = info.id;
      button.textContent = info.name;
      button.addEventListener('click', () => loadGrid(info));
      return button;
    }));
    await loadGrid(choices.find(info => info.id === 'jezero-mola') || choices[0]);
  } catch {
    $('terrainSource').textContent = 'Terrain unavailable';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'loc';
    retry.textContent = 'Retry connection';
    retry.addEventListener('click', () => { retry.disabled = true; void loadRegions(); });
    $('regionChoices').replaceChildren(retry);
    reportTerrain('Start the FastAPI backend to load regions and terrain.');
  }
}

map.addEventListener('click', event => {
  if (!rows.length) return;
  const rect = map.getBoundingClientRect();
  const y = Math.max(0, Math.min(rows.length - 1, Math.floor((event.clientY - rect.top) / rect.height * rows.length)));
  const x = Math.max(0, Math.min(rows[y].length - 1, Math.floor((event.clientX - rect.left) / rect.width * rows[y].length)));
  updateCell(rows[y][x]);
  drawTerrain();
});
map.addEventListener('keydown', event => {
  const offsets = { ArrowUp: [-1,0], ArrowDown: [1,0], ArrowLeft: [0,-1], ArrowRight: [0,1] };
  if (!currentCell || !Object.hasOwn(offsets, event.key)) return;
  event.preventDefault();
  const [dy,dx] = offsets[event.key];
  const y = rows.findIndex(row => row.includes(currentCell));
  const x = rows[y].indexOf(currentCell);
  const next = rows[y + dy]?.[x + dx];
  if (next) { updateCell(next); drawTerrain(); }
});
layerButtons.forEach(button => button.addEventListener('click', () => selectLayer(button.dataset.layer)));
scan.addEventListener('click', async () => {
  if (!region || !currentCell) return;
  const version = selectionVersion;
  scan.disabled = true;
  scan.textContent = 'Analyzing terrain…';
  $('mapWrap').classList.remove('scanning');
  void $('mapWrap').offsetWidth;
  $('mapWrap').classList.add('scanning');
  try {
    const result = await requestJSON('/terrain/explain', { region_id: region.id, lat: currentCell.lat, lon: currentCell.lon });
    if (version === selectionVersion) reportTerrain(result.explanation);
  } catch {
    if (version === selectionVersion) reportTerrain('Analysis unavailable. The selected readings are still shown above.');
  } finally {
    if (version === selectionVersion) { scan.disabled = false; scan.textContent = 'Analyze selected area ↗'; }
  }
});

const chat = $('chatArea'), input = $('chatInput'), history = [];
const chatButtons = [...document.querySelectorAll('[data-prompt], #chatForm button, #askPoint')];
let sending = false;
let provider = null;

function updateChatControls() {
  const canAsk = provider === 'gemini';
  input.disabled = sending || !canAsk;
  chatButtons.forEach(button => {
    button.disabled = sending || (button.id === 'askPoint' ? !region || !currentCell : !canAsk);
  });
}

function bubble(text, user = false) {
  const message = document.createElement('div');
  message.className = 'bubble' + (user ? ' user' : '');
  message.textContent = text;
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
  return message;
}

function formatReply(container, text) {
  const lines = text.trim().split(/\r?\n/);
  const content = document.createDocumentFragment();
  let list;
  for (const line of lines) {
    if (!line.trim()) { list = null; continue; }
    const item = line.match(/^\s*([-*]|\d+\.)\s+(.+)$/);
    let element;
    if (item) {
      const type = item[1].endsWith('.') ? 'ol' : 'ul';
      if (!list || list.localName !== type) {
        list = document.createElement(type);
        content.append(list);
      }
      element = document.createElement('li');
      list.append(element);
    } else {
      list = null;
      element = document.createElement('p');
      content.append(element);
    }
    const parts = (item?.[2] ?? line).replace(/^#{1,6}\s+/, '').split(/(\*\*[^*]+\*\*|\$[^$]+\$|`[^`]+`)/g);
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const bold = document.createElement('strong');
        bold.textContent = part.slice(2, -2);
        element.append(bold);
      } else if (/^\$[^$]+\$$/.test(part) || /^`[^`]+`$/.test(part)) {
        element.append(part.slice(1, -1).replace(/_(\d)/g, (_, digit) => '₀₁₂₃₄₅₆₇₈₉'[digit]));
      } else {
        element.append(part);
      }
    }
  }
  container.replaceChildren(content);
}

async function send(prompt, fromInput = false, point = null) {
  const message = prompt.trim();
  if (!message || sending || (!point && provider !== 'gemini')) return;
  sending = true;
  updateChatControls();
  bubble(message, true);
  const pending = bubble('ARES is responding…');
  try {
    const answer = point
      ? await requestJSON('/terrain/explain', point)
      : await requestJSON('/chat', { message, history: history.slice(-12), mission_context: 'nominal' });
    if (!point && !answer.source?.endsWith('(Gemini Live)')) {
      pending.textContent = 'The live ARES provider did not respond. Check its settings and try again.';
      if (fromInput && !input.value) input.value = message;
      return;
    }
    const reply = point ? answer.explanation : answer.reply;
    const label = point
      ? (answer.method === 'rule_based' ? 'Terrain model · Rules-based explanation' : 'Terrain model · ARES explanation')
      : answer.source;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Empty response');
    formatReply(pending, reply);
    if (label) {
      const source = document.createElement('small');
      source.className = 'mono';
      source.textContent = label;
      pending.append(source);
    }
    history.push({ role: 'user', content: message }, { role: 'assistant', content: reply });
  } catch {
    pending.textContent = point ? 'The terrain explanation is unavailable. Try this point again.'
      : 'ARES could not respond. Check the backend and try again.';
    if (fromInput && !input.value) input.value = message;
  } finally {
    sending = false;
    updateChatControls();
    chat.scrollTop = chat.scrollHeight;
  }
}

$('askPoint').addEventListener('click', () => {
  if (!region || !currentCell || sending) return;
  const { lat, lon } = currentCell;
  const point = { region_id: region.id, lat, lon };
  $('ares').scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
  void send('Explain this point in ' + region.name + ' (' + lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°).', false, point);
});
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => send(button.dataset.prompt)));
$('chatForm').addEventListener('submit', event => {
  event.preventDefault();
  if (sending || !input.value.trim()) return;
  const text = input.value;
  input.value = '';
  void send(text, true);
  input.focus();
});
updateCell(null);
selectLayer('terrain');
void loadRegions();
requestJSON('/health').then(health => {
  provider = health.ai_provider?.toLowerCase();
  $('chatStatus').textContent = provider === 'gemini' ? '' : 'Live chat needs Gemini configured';
  updateChatControls();
}).catch(() => {
  $('chatStatus').textContent = 'Live chat is unavailable';
});

/* Motion system: visibility, scroll progress, story sequence, planet parallax */
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target)}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));
let scrollY=0,mouseX=0,mouseY=0;function onScroll(){scrollY=window.scrollY;if(!reduced && scrollY<innerHeight*1.6){$('planetStage').style.translate=`0 ${Math.min(155,scrollY*.18)}px`}}window.addEventListener('scroll',onScroll,{passive:true});onScroll();
const pg=$('pointerGlow');window.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&!reduced){pg.style.opacity='1';pg.style.left=e.clientX+'px';pg.style.top=e.clientY+'px'}},{passive:true});window.addEventListener('pointerleave',()=>pg.style.opacity='0');
$('mobileToggle').addEventListener('click',()=>{const n=$('nav'),open=n.classList.toggle('open');$('mobileToggle').setAttribute('aria-expanded',String(open))});document.querySelectorAll('#nav a').forEach(a=>a.addEventListener('click',()=>{$('nav').classList.remove('open');$('mobileToggle').setAttribute('aria-expanded','false')}));

let start=performance.now(),lastPaint=0;function animate(t){if(t-lastPaint>44||reduced){paintStars(t);paintPlanet(reduced?.65:(t-start)*.000115+.2);lastPaint=t}if(!reduced)requestAnimationFrame(animate)}animate(start);
})();
