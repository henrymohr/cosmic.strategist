// Celestia — AI chat simulation
// Generates contextually accurate astrological responses using real ephemeris data

import {
  getAllPlanetPositions, getAspectsBetweenCharts,
  isRetrograde, getRetrogrades, getIngresses, PLANETS, SIGNS
} from './ephemeris.js';
import {
  getAspectInterpretation, getPlanetInSignInterpretation,
  getRetrogradeMeaning, capitalize, DAILY_COSMIC_WEATHER
} from './interpretations.js';

// Parse a date or period from natural language
function parseIntent(message) {
  const msg = message.toLowerCase();
  const today = new Date();

  // Specific date patterns
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/,
    /(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*(\d{4})?/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\s*(\d{4})?/i,
  ];

  const monthMap = { jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11 };

  for (const pattern of datePatterns) {
    const match = msg.match(pattern);
    if (match) {
      let date;
      if (match[0].match(/\d[\/\-]\d/)) {
        const parts = match[0].split(/[\/\-]/);
        date = new Date(
          parts[2] ? (parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])) : today.getFullYear(),
          parseInt(parts[1]) - 1,
          parseInt(parts[0])
        );
      } else {
        const monthStr = (match[1] || match[3] || '').toLowerCase().substring(0, 3);
        const month = monthMap[monthStr];
        const day = parseInt(match[2] || match[1]);
        const year = parseInt(match[3] || match[4]) || today.getFullYear();
        if (!isNaN(month) && !isNaN(day)) {
          date = new Date(year, month, day);
        }
      }
      if (date && !isNaN(date)) return { type: 'date', date, range: 1 };
    }
  }

  // Relative time
  if (msg.includes('yesterday')) {
    const d = new Date(today); d.setDate(d.getDate() - 1);
    return { type: 'date', date: d, range: 1 };
  }
  if (msg.includes('today') || msg.includes('right now') || msg.includes('currently')) {
    return { type: 'date', date: today, range: 1 };
  }
  if (msg.includes('tomorrow')) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    return { type: 'date', date: d, range: 1 };
  }
  if (msg.includes('this week') || msg.includes('next week')) {
    const offset = msg.includes('next week') ? 7 : 0;
    const d = new Date(today); d.setDate(d.getDate() + offset);
    return { type: 'period', date: d, range: 7, label: msg.includes('next') ? 'next week' : 'this week' };
  }
  if (msg.includes('this month') || msg.includes('next month')) {
    const offset = msg.includes('next month') ? 30 : 0;
    const d = new Date(today); d.setDate(d.getDate() + offset);
    return { type: 'period', date: d, range: 30, label: msg.includes('next') ? 'next month' : 'this month' };
  }
  if (msg.includes('this year') || msg.includes('rest of the year') || msg.includes('year ahead')) {
    return { type: 'period', date: today, range: 365, label: 'this year' };
  }
  if (msg.includes('next') && msg.match(/(\d+)\s+(day|week|month)/)) {
    const m = msg.match(/(\d+)\s+(day|week|month)/);
    const n = parseInt(m[1]);
    const unit = m[2];
    const range = unit === 'day' ? n : unit === 'week' ? n * 7 : n * 30;
    return { type: 'period', date: today, range, label: `the next ${n} ${unit}${n > 1 ? 's' : ''}` };
  }

  // Topic intents
  if (msg.match(/retrograd/)) return { type: 'topic', topic: 'retrograde' };
  if (msg.match(/birth ?chart|natal chart|my chart/)) return { type: 'topic', topic: 'birthchart' };
  if (msg.match(/ris(e|ing)|ascendant/)) return { type: 'topic', topic: 'rising' };
  if (msg.match(/love|relationship|partner|romance/)) return { type: 'topic', topic: 'love', date: today, range: 30 };
  if (msg.match(/career|work|job|money|finance/)) return { type: 'topic', topic: 'career', date: today, range: 30 };
  if (msg.match(/health|body|energy|wellbeing/)) return { type: 'topic', topic: 'health', date: today, range: 30 };

  return { type: 'date', date: today, range: 7 };
}

function formatDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getSignEmoji(signName) {
  const map = { aries:'♈',taurus:'♉',gemini:'♊',cancer:'♋',leo:'♌',virgo:'♍',
                libra:'♎',scorpio:'♏',sagittarius:'♐',capricorn:'♑',aquarius:'♒',pisces:'♓' };
  return map[signName?.toLowerCase()] || '✦';
}

function buildTransitSummary(natalPositions, targetDate, rangeLabel) {
  const transit = getAllPlanetPositions(targetDate);
  const aspects = getAspectsBetweenCharts(natalPositions, transit);
  const topAspects = aspects.filter(a => a.aspect.exactness < 3).slice(0, 4);

  const activeRetrogrades = Object.keys(PLANETS).filter(p => isRetrograde(p, targetDate));
  const ingresses = getIngresses(
    new Date(targetDate.getTime() - 3 * 86400000),
    new Date(targetDate.getTime() + 3 * 86400000)
  );

  let response = '';

  // Opening — contextual to date
  const dateStr = rangeLabel || formatDate(targetDate);
  const sunSign = transit.sun?.sign?.name || '';
  response += `Looking at ${dateStr} for your chart — the Sun is in ${sunSign} ${getSignEmoji(sunSign)}, painting the backdrop of this period.\n\n`;

  // Ingresses — these are the biggest events
  if (ingresses.length > 0) {
    for (const ing of ingresses) {
      response += `✦ **${capitalize(ing.planet)} enters ${ing.sign}** — ${ing.note}. This is a significant collective shift, and how it lands for you personally depends on where ${ing.sign} falls in your chart.\n\n`;
    }
  }

  // Active retrogrades
  if (activeRetrogrades.length > 0) {
    const retros = activeRetrogrades.map(p => capitalize(p)).join(', ');
    response += `✦ **Retrograde watch**: ${retros} ${activeRetrogrades.length === 1 ? 'is' : 'are'} retrograde during this period. `;
    if (activeRetrogrades.includes('mercury')) {
      response += `Mercury retrograde is active — tread carefully with contracts, travel, and important conversations. Review, don't launch.\n\n`;
    } else {
      response += `Retrogrades ask you to turn inward and review rather than charge forward.\n\n`;
    }
  }

  // Personal transits from chart
  if (topAspects.length > 0) {
    response += `**What this means for your chart specifically:**\n\n`;
    for (const a of topAspects) {
      const interp = getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet);
      const symbol = a.aspect.symbol;
      response += `✦ **${capitalize(a.transitPlanet)} ${symbol} your natal ${capitalize(a.natalPlanet)}** — ${interp}\n\n`;
    }
  } else {
    // General reading when no tight aspects
    const weather = DAILY_COSMIC_WEATHER[Math.floor(Math.random() * DAILY_COSMIC_WEATHER.length)];
    response += `The skies aren't pressing hard on any single point in your chart right now — this is a relatively open window. ${weather}\n\n`;
  }

  return response;
}

function buildBirthChartSummary(natalPositions, userData) {
  let response = `Here's the essence of your natal chart, ${userData.name}.\n\n`;

  const sun = natalPositions.sun;
  const moon = natalPositions.moon;
  const rising = natalPositions.ascendant;

  if (sun) {
    response += `✦ **Sun in ${sun.sign.name}** ${getSignEmoji(sun.sign.name)} — ${getPlanetInSignInterpretation('sun', sun.sign.name)}\n\n`;
  }
  if (moon) {
    response += `✦ **Moon in ${moon.sign.name}** ${getSignEmoji(moon.sign.name)} — ${getPlanetInSignInterpretation('moon', moon.sign.name)}\n\n`;
  }
  if (rising) {
    response += `✦ **Rising in ${rising.sign.name}** ${getSignEmoji(rising.sign.name)} — Your rising sign is the mask you wear and the first impression you make on the world.\n\n`;
  }

  response += `Your Venus in ${natalPositions.venus?.sign?.name || '—'} shapes how you love, and your Mars in ${natalPositions.mars?.sign?.name || '—'} drives how you act. Want me to go deeper on any of these, or shall we look at what the current transits are activating in your chart?`;

  return response;
}

function buildRetrogradeSummary(targetDate) {
  const today = targetDate || new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 90);

  const activeNow = Object.keys(PLANETS).filter(p => isRetrograde(p, today));
  const upcoming = getRetrogrades(today, endDate).filter(r => r.start > today);

  let response = `**Retrograde Landscape**\n\n`;

  if (activeNow.length > 0) {
    response += `Currently retrograde: **${activeNow.map(capitalize).join(', ')}**\n\n`;
    for (const planet of activeNow) {
      const meaning = getRetrogradeMeaning(planet);
      response += `✦ **${capitalize(planet)} Retrograde** — ${meaning.general}\n\n`;
    }
  } else {
    response += `No major planets are retrograde right now — a relatively clear window for forward motion.\n\n`;
  }

  if (upcoming.length > 0) {
    response += `**Coming up in the next 90 days:**\n\n`;
    for (const r of upcoming.slice(0, 3)) {
      response += `✦ **${capitalize(r.planet)} goes retrograde** in ${r.sign} on ${formatDate(r.start)} — ${getRetrogradeMeaning(r.planet).themes.slice(0, 2).join(', ')}.\n\n`;
    }
  }

  return response;
}

function buildTopicResponse(topic, natalPositions, targetDate) {
  const transit = getAllPlanetPositions(targetDate);
  const aspects = getAspectsBetweenCharts(natalPositions, transit);

  const topicPlanets = {
    love:   ['venus', 'moon', 'mars'],
    career: ['saturn', 'sun', 'mars', 'jupiter'],
    health: ['mars', 'sun', 'chiron'],
  };

  const relevant = aspects.filter(a =>
    topicPlanets[topic]?.includes(a.natalPlanet) ||
    topicPlanets[topic]?.includes(a.transitPlanet)
  ).slice(0, 3);

  const topicIntros = {
    love:   `Looking at love and relationships in your chart right now`,
    career: `On the career and ambition front`,
    health: `Around your energy and physical wellbeing`,
  };

  let response = `${topicIntros[topic] || 'Looking at this area of your chart'}:\n\n`;

  if (relevant.length > 0) {
    for (const a of relevant) {
      const interp = getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet);
      response += `✦ **${capitalize(a.transitPlanet)} ${a.aspect.symbol} your natal ${capitalize(a.natalPlanet)}** — ${interp}\n\n`;
    }
  } else {
    const venusSigns = natalPositions.venus?.sign?.name;
    response += `Your Venus in ${venusSigns || 'your chart'} shapes this area deeply. The transits aren't pressing on this part of your chart with great urgency right now — which can actually mean steady ground to work from rather than reactive energy.\n\n`;
  }

  return response;
}

// Greeting responses
const GREETINGS = [
  (name) => `Hello ${name} ✦ The stars are listening. What would you like to explore — a specific date, a life area, or your chart as a whole?`,
  (name) => `Welcome back, ${name}. The sky is always in motion. Shall we look at what it's doing for you right now, or is there a specific period on your mind?`,
  (name) => `${name} ✦ I'm here. What are you wanting clarity on — a date, a theme, or something you're currently navigating?`,
];

const THANKS_RESPONSES = [
  "Always here when you need to read the sky. ✦",
  "The cosmos doesn't stop moving — come back whenever you need a read.",
  "Take what resonates, leave the rest. ✦ The stars are patient.",
];

function generateResponse(message, userData, natalPositions) {
  const msg = message.toLowerCase().trim();

  // Greetings
  if (msg.match(/^(hi|hello|hey|hiya|morning|evening|night|sup|yo)\b/)) {
    const fn = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    return fn(userData.name);
  }

  // Thanks
  if (msg.match(/^(thank|thanks|cheers|perfect|great|amazing|brilliant|wow)\b/)) {
    return THANKS_RESPONSES[Math.floor(Math.random() * THANKS_RESPONSES.length)];
  }

  // What can you do
  if (msg.match(/what can you|what do you do|help|capabilities/)) {
    return `I can read the sky for you, ${userData.name}.\n\nAsk me about:\n✦ **A specific date** — "How does 14 June look for me?"\n✦ **A time period** — "What's this month looking like?"\n✦ **A life area** — "What do the planets say about my love life right now?"\n✦ **Your birth chart** — "Tell me about my natal chart"\n✦ **Retrogrades** — "What retrogrades are coming?"\n✦ **Past periods** — "Why was last March so intense?"\n\nI use your exact birth chart against real planetary positions — no generic readings here.`;
  }

  const intent = parseIntent(message);

  if (intent.type === 'topic') {
    if (intent.topic === 'retrograde') return buildRetrogradeSummary(new Date());
    if (intent.topic === 'birthchart') return buildBirthChartSummary(natalPositions, userData);
    if (intent.topic === 'rising') {
      const rising = natalPositions.ascendant;
      if (rising) return `Your Rising sign is **${rising.sign.name}** ${getSignEmoji(rising.sign.name)}. This is the mask you present to the world — your first impression, your physical appearance, how others experience you before they know you. Your ${rising.sign.name} rising means you come across as ${getRisingDescription(rising.sign.name)}.`;
      return `Your Rising sign depends on your exact birth time and location. If you entered those in your profile, it's already in your chart — tap the Chart tab to see it.`;
    }
    return buildTopicResponse(intent.topic, natalPositions, intent.date || new Date());
  }

  if (intent.type === 'date' || intent.type === 'period') {
    return buildTransitSummary(natalPositions, intent.date, intent.label);
  }

  // Default — treat as general "right now"
  return buildTransitSummary(natalPositions, new Date(), 'right now');
}

function getRisingDescription(sign) {
  const desc = {
    aries:       "bold, direct, and full of energy — you make an impression immediately",
    taurus:      "calm, grounded, and magnetic — people sense your steadiness",
    gemini:      "quick, curious, and socially fluid — you seem to know everyone",
    cancer:      "warm, nurturing, and quietly intuitive — people feel safe around you",
    leo:         "radiant, confident, and commanding — you light up a room",
    virgo:       "composed, precise, and quietly observant — you notice everything",
    libra:       "charming, elegant, and naturally diplomatic — beauty follows you",
    scorpio:     "intense, magnetic, and a little mysterious — people are drawn in and can't explain why",
    sagittarius: "free-spirited, enthusiastic, and immediately likeable — you bring adventure with you",
    capricorn:   "composed, capable, and quietly authoritative — people take you seriously instantly",
    aquarius:    "original, a little otherworldly, and intriguing — you stand apart without trying",
    pisces:      "dreamy, gentle, and ethereal — people sense something soft and otherworldly about you",
  };
  return desc[sign?.toLowerCase()] || "uniquely yourself";
}

export { generateResponse, parseIntent };
