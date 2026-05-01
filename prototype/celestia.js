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

function calcIntensity(aspects, activeRetrogrades = []) {
  let score = 28;
  for (const a of aspects) {
    const weight = a.aspect.type === 'major' ? 12 : 5;
    const tightness = Math.max(0, 1 - a.aspect.exactness / 8);
    score += Math.round(weight * tightness);
  }
  if (activeRetrogrades.includes('mercury')) score += 15;
  if (activeRetrogrades.includes('venus'))   score += 10;
  if (activeRetrogrades.includes('mars'))    score += 8;
  if (activeRetrogrades.includes('saturn'))  score += 6;
  return Math.min(100, score);
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

  const dateStr = rangeLabel || formatDate(targetDate);
  const sunSign = transit.sun?.sign?.name || '';
  const intensity = calcIntensity(topAspects, activeRetrogrades);

  let response = `**1. The Setup — ${dateStr}**\n`;
  response += `**Vibe:** Sun in ${sunSign} ${getSignEmoji(sunSign)}`;

  if (ingresses.length > 0) {
    response += ` with ${capitalize(ingresses[0].planet)} just moving into ${ingresses[0].sign} — the collective energy is shifting noticeably right now`;
  }
  response += `.\n\n`;

  if (activeRetrogrades.length > 0) {
    const retros = activeRetrogrades.map(p => capitalize(p)).join(', ');
    response += `**2. Retrograde Watch**\n`;
    response += `**Impact:** ${retros} ${activeRetrogrades.length === 1 ? 'is' : 'are'} retrograde. `;
    if (activeRetrogrades.includes('mercury')) {
      response += `Mercury retrograde is the loud one here — contracts, travel, and key conversations all need a second look before you commit.\n\n`;
    } else {
      response += `This is a pull-back-and-reassess energy, not a charge-forward one.\n\n`;
    }
  }

  if (topAspects.length > 0) {
    response += `**${activeRetrogrades.length > 0 ? 3 : 2}. Your Chart Specifically**\n`;
    const a = topAspects[0];
    const interp = getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet);
    response += `**Impact:** ${capitalize(a.transitPlanet)} ${a.aspect.symbol} your natal ${capitalize(a.natalPlanet)} — ${interp}\n\n`;

    if (topAspects.length > 1) {
      const extras = topAspects.slice(1).map(a2 => {
        const i2 = getAspectInterpretation(a2.transitPlanet, a2.aspect.name, a2.natalPlanet);
        return `${capitalize(a2.transitPlanet)} ${a2.aspect.symbol} natal ${capitalize(a2.natalPlanet)}: ${i2}`;
      });
      response += extras.map(e => `✦ ${e}`).join('\n') + '\n\n';
    }

    const nature = topAspects[0].aspect.nature;
    response += `**Advice:** ${
      nature === 'harmonious' ? `Lean into this — it\'s one of the easier windows you\'ll get for a while. Move on things that matter.` :
      nature === 'tense'      ? `Don\'t force outcomes right now. The friction is real but it\'s also useful — it\'s showing you exactly where the pressure points are.` :
                                `Stay aware. This is a defining moment, not just background noise.`
    }\n\n`;

    response += `**Verdict:** ${intensity >= 70 ? `High-activity window — the sky is talking directly to your chart.` : intensity >= 45 ? `Moderate activation — worth paying attention but not a crisis.` : `Low pressure period — use the quiet intentionally.`}\n\n`;
  } else {
    const weather = DAILY_COSMIC_WEATHER[Math.floor(Math.random() * DAILY_COSMIC_WEATHER.length)];
    const sectionNum = activeRetrogrades.length > 0 ? 3 : 2;
    response += `**${sectionNum}. Your Chart Specifically**\n`;
    response += `**Impact:** No tight transits are hitting your personal planets right now.\n\n`;
    response += `**Advice:** ${weather} Use this open window deliberately — the absence of pressure is actually a gift.\n\n`;
    response += `**Verdict:** Quiet skies. Forward motion is available, but you have to initiate it.\n\n`;
  }

  response += `**Intensity: ${intensity}/100**\n\n`;
  response += pickFollowUp('transit', sunSign);
  return response;
}

function buildBirthChartSummary(natalPositions, userData) {
  const sun    = natalPositions.sun;
  const moon   = natalPositions.moon;
  const rising = natalPositions.ascendant;
  const venus  = natalPositions.venus;
  const mars   = natalPositions.mars;

  let response = `**1. Your Core Identity**\n`;
  if (sun) {
    response += `**Vibe:** Sun in ${sun.sign.name} ${getSignEmoji(sun.sign.name)} — ${getPlanetInSignInterpretation('sun', sun.sign.name)}\n\n`;
  }

  response += `**2. Your Emotional World**\n`;
  if (moon) {
    response += `**Impact:** Moon in ${moon.sign.name} ${getSignEmoji(moon.sign.name)} — ${getPlanetInSignInterpretation('moon', moon.sign.name)}\n\n`;
  }

  if (rising) {
    response += `**3. How the World Sees You**\n`;
    response += `**Vibe:** Rising in ${rising.sign.name} ${getSignEmoji(rising.sign.name)} — you come across as ${getRisingDescription(rising.sign.name)}.\n\n`;
  }

  response += `**4. Love & Drive**\n`;
  response += `**Impact:** Venus in ${venus?.sign?.name || '—'} is how you love. Mars in ${mars?.sign?.name || '—'} is how you act. That combination is the engine under everything you do.\n\n`;

  response += `**Advice:** Your Sun and Moon ${sun && moon && sun.sign.name === moon.sign.name ? `are in the same sign — your public self and inner world are unusually aligned. That\'s rare.` : `are pulling in different directions sometimes, and that tension is actually where your growth lives.`}\n\n`;

  response += `**Verdict:** This is a chart that ${sun?.sign?.element === 'Fire' ? `moves fast and asks questions later` : sun?.sign?.element === 'Earth' ? `builds slow and lasts long` : sun?.sign?.element === 'Air' ? `thinks first, feels second` : `feels everything, whether it wants to or not`}.\n\n`;

  response += pickFollowUp('birthchart', sun?.sign?.name);
  return response;
}

function buildRetrogradeSummary(targetDate) {
  const today = targetDate || new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 90);

  const activeNow = Object.keys(PLANETS).filter(p => isRetrograde(p, today));
  const upcoming = getRetrogrades(today, endDate).filter(r => r.start > today);

  let response = `**1. Right Now**\n`;

  if (activeNow.length > 0) {
    response += `**Vibe:** ${activeNow.map(capitalize).join(' and ')} ${activeNow.length === 1 ? 'is' : 'are'} retrograde — the sky is asking you to slow down in specific areas.\n\n`;
    for (const planet of activeNow) {
      const meaning = getRetrogradeMeaning(planet);
      response += `✦ **${capitalize(planet)} Rx** — ${meaning.general}\n\n`;
    }
  } else {
    response += `**Vibe:** No major planets retrograde right now. That\'s genuinely unusual — a clean window for forward motion.\n\n`;
  }

  if (upcoming.length > 0) {
    response += `**2. Coming Up (next 90 days)**\n`;
    response += `**Impact:** ${upcoming.length} retrograde period${upcoming.length > 1 ? 's' : ''} incoming — worth knowing about before they hit.\n\n`;
    for (const r of upcoming.slice(0, 3)) {
      response += `✦ **${capitalize(r.planet)} goes Rx** in ${r.sign} on ${formatDate(r.start)} — themes: ${getRetrogradeMeaning(r.planet).themes.slice(0, 2).join(', ')}.\n\n`;
    }
    response += `**Advice:** The window before a retrograde station is often the most useful — finish what you\'re starting, and don\'t kick off anything you can\'t pause mid-stream.\n\n`;
  }

  const hasMercury = activeNow.includes('mercury') || upcoming.some(r => r.planet === 'mercury');
  response += `**Verdict:** ${hasMercury ? `Mercury is in the picture — communication, travel, and tech are the live wires right now. Double-check everything.` : activeNow.length === 0 ? `Unusually clear sky. This kind of window doesn\'t last long — use it.` : `Outer planet retrogrades are long and slow. They\'re background pressure, not emergencies.`}\n\n`;

  response += pickFollowUp('retrograde');
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

  const topicTitles = {
    love:   'Love & Relationships',
    career: 'Career & Ambition',
    health: 'Energy & Wellbeing',
  };

  const intensity = calcIntensity(relevant, []);

  let response = `**1. ${topicTitles[topic] || 'This Area of Your Chart'} Right Now**\n`;

  if (relevant.length > 0) {
    const first = relevant[0];
    const firstInterp = getAspectInterpretation(first.transitPlanet, first.aspect.name, first.natalPlanet);
    response += `**Vibe:** ${capitalize(first.transitPlanet)} ${first.aspect.symbol} your natal ${capitalize(first.natalPlanet)} — ${firstInterp}\n\n`;

    if (relevant.length > 1) {
      response += `**2. Supporting Influences**\n`;
      for (const a of relevant.slice(1)) {
        const interp = getAspectInterpretation(a.transitPlanet, a.aspect.name, a.natalPlanet);
        response += `✦ ${capitalize(a.transitPlanet)} ${a.aspect.symbol} natal ${capitalize(a.natalPlanet)} — ${interp}\n\n`;
      }
    }

    const dominant = relevant[0].aspect.nature;
    response += `**Advice:** ${
      topic === 'love'   && dominant === 'harmonious' ? `This is a genuinely good window for connection — don\'t overthink it, just show up.` :
      topic === 'love'   && dominant === 'tense'      ? `Tension in relationships right now is information, not a verdict. Ask what it\'s pointing at.` :
      topic === 'career' && dominant === 'harmonious' ? `Put yourself forward. The timing supports recognition and progress.` :
      topic === 'career' && dominant === 'tense'      ? `Pressure at work is real but productive. Push through, don\'t avoid.` :
      topic === 'health' && dominant === 'tense'      ? `Your energy levels are probably uneven right now. Work with that, not against it.` :
      `Stay intentional in this area — the planets are paying attention to it.`
    }\n\n`;
  } else {
    const anchor = topic === 'love' ? `Venus in ${natalPositions.venus?.sign?.name || 'your chart'}` :
                   topic === 'career' ? `Saturn and your natal Sun` : `Mars in your chart`;
    response += `**Vibe:** No tight transits hitting this area right now.\n\n`;
    response += `**Impact:** ${anchor} is the baseline shaping this, but the sky isn\'t actively pushing or pulling on it. That\'s neutral, not bad.\n\n`;
    response += `**Advice:** Steady ground to build from. Initiate rather than wait.\n\n`;
  }

  response += `**Verdict:** ${intensity >= 60 ? `The planets are loud on this topic right now — take the signals seriously.` : `Moderate energy here. Not urgent, but not invisible either.`}\n\n`;
  response += `**Intensity: ${intensity}/100**\n\n`;
  response += pickFollowUp(topic);
  return response;
}

const FOLLOW_UPS = {
  transit:    [
    'Want me to zoom in on any of those aspects specifically, or look at a different date?',
    'Is there a particular area of life — love, career, health — you want me to filter this through?',
    'Anything coming up in the next few weeks you want me to look at more closely?',
  ],
  birthchart: [
    'Want to go deeper on any of those placements — or see how the current sky is activating your chart right now?',
    'Should I look at what transits are hitting your chart this month?',
    'Want me to break down your Venus or Mars placement in more detail?',
  ],
  retrograde: [
    'Want me to look at how any of these retrogrades are specifically hitting your natal chart?',
    'Is there a particular planet you want to understand better?',
    'Should I pull up what the sky looks like for a specific date during one of these periods?',
  ],
  love: [
    'Want me to look at a specific date or window for your love life?',
    'Should I check what Venus and Mars are doing in your chart long-term?',
    'Is there a specific situation or question you want me to read against your chart?',
  ],
  career: [
    'Want me to look at a specific date or window for career moves?',
    'Should I check what Jupiter is doing in your chart — that\'s your expansion and opportunity planet?',
    'Is there a deadline or opportunity coming up you want me to look at?',
  ],
  health: [
    'Want me to look at your energy levels over a specific period?',
    'Should I check Mars transits — that\'s your physical drive and stamina planet?',
    'Is there a particular period you\'re worried about or preparing for?',
  ],
};

function pickFollowUp(type, context) {
  const pool = FOLLOW_UPS[type] || FOLLOW_UPS.transit;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Greeting responses
const GREETINGS = [
  (name) => `Hey ${name}. I've got your chart loaded and the sky in real time — what do you want to look at? A specific date, a life area, or your chart as a whole?`,
  (name) => `${name}. The sky's been busy — where do you want to start? I can look at a specific date, a period, or zoom in on love, career, or anything else.`,
  (name) => `Good to hear from you, ${name}. What are we looking at — something coming up, something you\'re in the middle of, or just the general vibe right now?`,
];

const THANKS_RESPONSES = [
  "Glad it was useful. Come back when the sky moves again — it always does.",
  "Any time. The chart doesn't change, but the transits never stop.",
  "That's what I'm here for. What else do you want to look at?",
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
    return `Here's what I can do, ${userData.name}:\n\n**1. Specific dates** — "How does 14 June look for me?"\n**2. Time periods** — "What's this month looking like?"\n**3. Life areas** — "What's the sky saying about my love life right now?"\n**4. Your birth chart** — "Walk me through my natal chart"\n**5. Retrogrades** — "What retrogrades are coming up?"\n**6. Past periods** — "Why was last March so rough?"\n\nEverything is read against your exact birth chart — not generic sun sign stuff.\n\nWhat do you want to start with?`;
  }

  const intent = parseIntent(message);

  if (intent.type === 'topic') {
    if (intent.topic === 'retrograde') return buildRetrogradeSummary(new Date());
    if (intent.topic === 'birthchart') return buildBirthChartSummary(natalPositions, userData);
    if (intent.topic === 'rising') {
      const rising = natalPositions.ascendant;
      if (rising) {
        return `**1. Your Rising Sign**\n**Vibe:** ${rising.sign.name} ${getSignEmoji(rising.sign.name)} rising — you come across as ${getRisingDescription(rising.sign.name)}.\n\n**Impact:** The Rising sign is your social mask — the first impression you make before people know you. It shapes your appearance, your instinctive reactions, and how the world receives you.\n\n**Verdict:** Your ${rising.sign.name} rising and your inner chart might feel like different people sometimes. That gap is actually useful — it gives you range.\n\nWant me to look at how transits are currently hitting your Rising, or go deeper on another placement?`;
      }
      return `Your Rising sign needs your exact birth time and location to calculate. If you added those in your profile it\'s already in your chart — check the Chart tab. Want me to walk through what a Rising sign actually means while you dig that up?`;
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
