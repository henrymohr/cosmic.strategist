import {
  getAllPlanetPositions, getAspectsBetweenCharts, findNotableDays,
  calcRisingSign, getRetrogrades, getIngresses, isRetrograde,
  PLANETS, SIGNS
} from './ephemeris.js';
import {
  getPlanetInSignInterpretation, getAspectInterpretation,
  getRetrogradeMeaning, getNotableDayDescription,
  capitalize, DAILY_COSMIC_WEATHER
} from './interpretations.js';
import { generateResponse } from './celestia.js';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  user: null,
  natalPositions: null,
  currentTab: 'dashboard',
  chatHistory: [],
  dashboardPeriod: 'daily',
};

// ─── Persistence ──────────────────────────────────────────────────────────────
function saveUser(user) {
  try { localStorage.setItem('cosmicmind_user', JSON.stringify(user)); } catch {}
}
function loadUser() {
  try { return JSON.parse(localStorage.getItem('cosmicmind_user')); } catch { return null; }
}

// ─── Birth Chart Calculation ──────────────────────────────────────────────────
function buildNatalChart(user) {
  const birthDate = new Date(user.birthDate);
  const positions = getAllPlanetPositions(birthDate);

  if (user.birthTime) {
    const [h, m] = user.birthTime.split(':').map(Number);
    const hour = h + m / 60;
    const lat = user.birthLat || 51.5;
    positions.ascendant = calcRisingSign(birthDate, hour, lat);
  }
  return positions;
}

// ─── Onboarding ──────────────────────────────────────────────────────────────
function showOnboarding() {
  document.getElementById('onboarding').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  initStarfield(document.getElementById('onboarding-canvas'));
}

function showApp() {
  document.getElementById('onboarding').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  initStarfield(document.getElementById('app-canvas'));
  switchTab('dashboard');
}

// ─── Tab Navigation ───────────────────────────────────────────────────────────
function switchTab(tab) {
  state.currentTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-content').forEach(c =>
    c.classList.toggle('active', c.id === `tab-${tab}`)
  );
  if (tab === 'dashboard')   renderDashboard();
  if (tab === 'celestia')    renderCelestia();
  if (tab === 'chart')       renderChart();
  if (tab === 'retrogrades') renderRetrogrades();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = `${greeting}, ${state.user.name}`;

  const weather = DAILY_COSMIC_WEATHER[today.getDate() % DAILY_COSMIC_WEATHER.length];
  document.getElementById('dash-weather').textContent = weather;

  renderPeriodReading(state.dashboardPeriod);
  renderNotableDays();
}

function renderPeriodReading(period) {
  state.dashboardPeriod = period;
  document.querySelectorAll('.period-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.period === period)
  );

  const today = new Date();
  const reading = period === 'daily'
    ? buildDailyReading(today)
    : buildPeriodReading(period, today);

  document.getElementById('period-reading-content').innerHTML = renderMarkdown(reading);
}

function buildDailyReading(today) {
  const transit = getAllPlanetPositions(today);
  const aspects = getAspectsBetweenCharts(state.natalPositions, transit);
  const top = aspects.filter(a => a.aspect.exactness < 4).slice(0, 3);

  const sunSign = transit.sun?.sign?.name || '';
  const moonSign = transit.moon?.sign?.name || '';

  let text = `The Sun moves through **${sunSign}** today, and the Moon is in **${moonSign}** — setting the emotional tone as ${getMoonMood(moonSign)}.\n\n`;

  if (top.length > 0) {
    const a = top[0];
    const interp = getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet);
    text += `The most significant energy today: **${capitalize(a.transitPlanet)} ${a.aspect.symbol} your natal ${capitalize(a.natalPlanet)}** — ${interp}`;
  } else {
    text += `The transits today don't press hard on your personal planets — a relatively clean day. Good for steady, intentional work rather than reactive energy.`;
  }
  return text;
}

function buildPeriodReading(period, today) {
  const days = { weekly: 7, monthly: 30, yearly: 365 }[period] || 30;
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const retros = getRetrogrades(today, endDate);
  const ingresses = getIngresses(today, endDate);

  let text = '';

  for (const ing of ingresses.slice(0, 2)) {
    text += `✦ ${ing.note}\n\n`;
  }

  for (const r of retros.slice(0, 2)) {
    const m = getRetrogradeMeaning(r.planet);
    text += `✦ **${capitalize(r.planet)} retrograde** in ${r.sign} — ${m.general}\n\n`;
  }

  if (!text) {
    const transit = getAllPlanetPositions(today);
    const aspects = getAspectsBetweenCharts(state.natalPositions, transit).slice(0, 2);
    for (const a of aspects) {
      text += `✦ **${capitalize(a.transitPlanet)} ${a.aspect.symbol} your natal ${capitalize(a.natalPlanet)}** — ${getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet)}\n\n`;
    }
  }

  return text || `The skies are relatively quiet for this period — a time for steady progress rather than dramatic shifts.`;
}

function getMoonMood(sign) {
  const moods = {
    aries:'restless and ready for action', taurus:'grounded and sensory',
    gemini:'chatty and mentally lively', cancer:'emotional and introspective',
    leo:'expressive and warm', virgo:'detail-oriented and analytical',
    libra:'social and harmony-seeking', scorpio:'intense and perceptive',
    sagittarius:'optimistic and freedom-craving', capricorn:'serious and focused',
    aquarius:'detached and idealistic', pisces:'dreamy and empathetic',
  };
  return moods[sign?.toLowerCase()] || 'shifting and reflective';
}

function renderNotableDays() {
  const today = new Date();
  const notable = findNotableDays(state.natalPositions, today, 90);
  const container = document.getElementById('notable-days-list');

  if (!notable.length) {
    container.innerHTML = '<p class="subtle">No major activations in the next 90 days — steady skies ahead.</p>';
    return;
  }

  const sorted = [...notable].sort((a, b) => a.date - b.date).slice(0, 6);
  container.innerHTML = sorted.map(day => {
    const dateStr = day.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    let desc = '';
    if (day.ingresses.length > 0)       desc = day.ingresses[0].note;
    else if (day.retroStations.length > 0) {
      const r = day.retroStations[0];
      const isStart = Math.abs(r.start - day.date) < 86400000;
      desc = `${capitalize(r.planet)} ${isStart ? 'goes retrograde' : 'stations direct'} in ${r.sign}`;
    } else if (day.aspects.length > 0) {
      const a = day.aspects[0];
      desc = getNotableDayDescription(a.aspect.name, a.transitPlanet, a.natalPlanet);
    }
    const intensity = day.score >= 3 ? 'high' : day.score >= 2 ? 'medium' : 'low';
    return `
      <div class="notable-day" data-intensity="${intensity}">
        <div class="notable-date">${dateStr}</div>
        <div class="notable-desc">${escapeHtml(desc)}</div>
        <div class="intensity-dot intensity-${intensity}"></div>
      </div>`;
  }).join('');
}

// ─── Chart Tab ────────────────────────────────────────────────────────────────
function renderChart() {
  const natal = state.natalPositions;
  document.getElementById('chart-wheel-container').innerHTML = drawChartWheel(natal);

  const list = document.getElementById('planet-list');
  list.innerHTML = Object.entries(PLANETS).map(([key, planet]) => {
    const pos = natal[key];
    if (!pos) return '';
    const birthDate = new Date(state.user.birthDate);
    const rx = isRetrograde(key, birthDate) ? ' ℞' : '';
    return `
      <div class="planet-row">
        <span class="planet-symbol" style="color:${planet.color}">${planet.symbol}</span>
        <span class="planet-name">${planet.name}${rx}</span>
        <span class="planet-sign">${pos.sign.symbol} ${pos.sign.name}</span>
        <span class="planet-deg">${pos.degInSign}°</span>
      </div>`;
  }).join('');

  const rising = natal.ascendant;
  document.getElementById('rising-display').innerHTML = rising
    ? `<span class="rising-label">Rising</span> <span class="rising-sign">${rising.sign.symbol} ${rising.sign.name}</span>`
    : `<span class="rising-label">Rising</span> <span style="color:var(--ivory-faint);font-size:13px">Add birth time for rising sign</span>`;
}

function drawChartWheel(natal) {
  const size = 300;
  const cx = size / 2, cy = size / 2;
  const outerR = 130, signR = 112, planetR = 82, innerR = 52;
  const signColors = ['#E87060','#D4C4A0','#7ECACA','#C8D8E8','#F5C842','#B8C8A0',
                      '#E8C99A','#C090A8','#C9A87A','#908878','#80A8C8','#A898C8'];

  let svg = `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stop-color="#1a1040" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#08081a" stop-opacity="0.9"/>
      </radialGradient>
    </defs>
    <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="url(#bgGrad)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
    <circle cx="${cx}" cy="${cy}" r="${signR}"  fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${planetR}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
    <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="rgba(8,8,26,0.7)" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>`;

  // Sign dividers and symbols
  for (let i = 0; i < 12; i++) {
    const startAngle = (i * 30 - 90) * Math.PI / 180;
    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + signR  * Math.cos(startAngle);
    const y2 = cy + signR  * Math.sin(startAngle);
    svg += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>`;

    const midAngle = ((i * 30 + 15) - 90) * Math.PI / 180;
    const mr = (outerR + signR) / 2;
    const tx = cx + mr * Math.cos(midAngle);
    const ty = cy + mr * Math.sin(midAngle);
    svg += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10" fill="${signColors[i]}" opacity="0.9">${SIGNS[i].symbol}</text>`;
  }

  // Planets
  const plotted = [];
  for (const [key, planet] of Object.entries(PLANETS)) {
    const pos = natal[key];
    if (!pos) continue;
    const angle = (pos.longitude - 90) * Math.PI / 180;
    const nearby = plotted.filter(p => Math.abs(p.lon - pos.longitude) < 10);
    const r = planetR - 14 * nearby.length;
    const px = (cx + r * Math.cos(angle)).toFixed(1);
    const py = (cy + r * Math.sin(angle)).toFixed(1);
    svg += `<circle cx="${px}" cy="${py}" r="9" fill="rgba(8,8,26,0.95)" stroke="${planet.color}" stroke-width="1.2"/>`;
    svg += `<text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="${planet.color}">${planet.symbol}</text>`;
    plotted.push({ lon: pos.longitude, key });
  }

  // Ascendant line
  if (natal.ascendant) {
    const angle = (natal.ascendant.longitude - 90) * Math.PI / 180;
    const x1 = (cx + innerR * Math.cos(angle)).toFixed(1);
    const y1 = (cy + innerR * Math.sin(angle)).toFixed(1);
    const x2 = (cx + outerR * Math.cos(angle)).toFixed(1);
    const y2 = (cy + outerR * Math.sin(angle)).toFixed(1);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(201,168,76,0.6)" stroke-width="1.5" stroke-dasharray="3,2"/>`;
  }

  svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" font-size="8" fill="rgba(255,255,255,0.2)" letter-spacing="1">ASC</text>`;
  svg += `</svg>`;
  return svg;
}

// ─── Retrogrades Tab ──────────────────────────────────────────────────────────
function renderRetrogrades() {
  const today = new Date();
  const yearEnd = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
  const retros = getRetrogrades(new Date(today.getFullYear(), 0, 1), yearEnd);
  const container = document.getElementById('retrograde-list');

  const grouped = {};
  for (const r of retros) {
    if (!grouped[r.planet]) grouped[r.planet] = [];
    grouped[r.planet].push(r);
  }

  const planetOrder = ['mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'];

  container.innerHTML = planetOrder.map(planet => {
    const periods = grouped[planet];
    if (!periods) return '';
    const p = PLANETS[planet];
    const meaning = getRetrogradeMeaning(planet);
    const activeNow = isRetrograde(planet, today);

    return `
      <div class="retrograde-card ${activeNow ? 'active-now' : ''}">
        <div class="retro-header">
          <span class="retro-symbol" style="color:${p.color}">${p.symbol}</span>
          <span class="retro-name">${p.name} Retrograde</span>
          ${activeNow ? '<span class="retro-badge">Active Now</span>' : ''}
        </div>
        <p class="retro-meaning">${meaning.general}</p>
        <div class="retro-periods">
          ${periods.map(r => {
            const past   = r.end < today;
            const active = r.start <= today && r.end >= today;
            const cls    = active ? 'active' : past ? 'past' : 'future';
            return `<div class="retro-period ${cls}">
              ${r.start.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} —
              ${r.end.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} in ${r.sign}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }).join('');
}

// ─── Celestia Chat ────────────────────────────────────────────────────────────
function renderCelestia() {
  if (state.chatHistory.length === 0) {
    addCelestiaMessage(
      `Welcome, ${state.user.name}. I'm Celestia — your personal astrologer.\n\nI know your exact birth chart and I read the sky in real time against it. Ask me about any date, time period, or area of life. No generic readings here — everything is tailored to you.\n\nWhat would you like to explore?`
    );
  }
}

function addCelestiaMessage(text) {
  state.chatHistory.push({ role: 'celestia', text });
  renderChatHistory();
}

function addUserMessage(text) {
  state.chatHistory.push({ role: 'user', text });
  renderChatHistory();
}

function renderChatHistory() {
  const container = document.getElementById('chat-messages');
  container.innerHTML = state.chatHistory.map(msg =>
    msg.role === 'user'
      ? `<div class="chat-bubble user-bubble">${escapeHtml(msg.text)}</div>`
      : `<div class="chat-bubble celestia-bubble">${renderMarkdown(msg.text)}</div>`
  ).join('');
  container.scrollTop = container.scrollHeight;
}

function handleChatSend() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  addUserMessage(text);

  const container = document.getElementById('chat-messages');
  const typing = document.createElement('div');
  typing.className = 'chat-bubble celestia-bubble typing-indicator';
  typing.innerHTML = '<span></span><span></span><span></span>';
  container.appendChild(typing);
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    typing.remove();
    const response = generateResponse(text, state.user, state.natalPositions);
    addCelestiaMessage(response);
  }, 700 + Math.random() * 700);
}

// ─── Markdown renderer ────────────────────────────────────────────────────────
function renderMarkdown(text) {
  return '<p>' + text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    + '</p>';
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── Starfield ────────────────────────────────────────────────────────────────
function initStarfield(canvas) {
  if (!canvas) return;
  canvas.width  = canvas.offsetWidth  || window.innerWidth;
  canvas.height = canvas.offsetHeight || window.innerHeight;
  const ctx = canvas.getContext('2d');

  const stars = Array.from({ length: 200 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 1.4 + 0.2,
    opacity: Math.random() * 0.65 + 0.2,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.018 + 0.004,
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.phase += s.speed;
      const alpha = s.opacity * (0.55 + 0.45 * Math.sin(s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── Init ─────────────────────────────────────────────────────────────────────
function init() {
  // Tab navigation
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  // Period buttons (delegated)
  document.addEventListener('click', e => {
    if (e.target.classList.contains('period-btn')) {
      renderPeriodReading(e.target.dataset.period);
    }
  });

  // Celestia CTA
  document.getElementById('celestia-cta-btn')?.addEventListener('click', () => switchTab('celestia'));

  // Chat
  document.getElementById('chat-send')?.addEventListener('click', handleChatSend);
  document.getElementById('chat-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChatSend(); }
  });

  // Auto-resize textarea
  document.getElementById('chat-input')?.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });

  // Onboarding form
  document.getElementById('onboarding-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const name      = document.getElementById('ob-name').value.trim();
    const birthDate = document.getElementById('ob-date').value;
    const birthTime = document.getElementById('ob-time').value;
    const birthPlace = document.getElementById('ob-place').value.trim();
    if (!name || !birthDate) return;

    const user = { name, birthDate, birthTime, birthLocation: birthPlace, birthLat: 51.5 };
    state.user = user;
    state.natalPositions = buildNatalChart(user);
    saveUser(user);
    showApp();
  });

  // Restore session
  const saved = loadUser();
  if (saved) {
    state.user = saved;
    state.natalPositions = buildNatalChart(saved);
    showApp();
  } else {
    showOnboarding();
  }
}

document.addEventListener('DOMContentLoaded', init);
