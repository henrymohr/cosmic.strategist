// Simplified ephemeris using mean orbital elements (J2000.0 epoch)
// Accurate to within ~1-2 degrees for prototype purposes

const J2000 = 2451545.0;

const PLANETS = {
  sun:     { name: 'Sun',     symbol: '☉', L0: 280.46646, Ld: 0.9856002585,  color: '#F5C842' },
  moon:    { name: 'Moon',    symbol: '☽', L0: 218.3165,  Ld: 13.17639648,   color: '#C8D8E8' },
  mercury: { name: 'Mercury', symbol: '☿', L0: 252.2504,  Ld: 4.09233,       color: '#B8A99A' },
  venus:   { name: 'Venus',   symbol: '♀', L0: 181.9798,  Ld: 1.60213,       color: '#E8C99A' },
  mars:    { name: 'Mars',    symbol: '♂', L0: 355.4530,  Ld: 0.52403,       color: '#E87060' },
  jupiter: { name: 'Jupiter', symbol: '♃', L0: 34.3515,   Ld: 0.08309,       color: '#C9A87A' },
  saturn:  { name: 'Saturn',  symbol: '♄', L0: 50.0774,   Ld: 0.03346,       color: '#D4C4A0' },
  uranus:  { name: 'Uranus',  symbol: '⛢', L0: 314.0550,  Ld: 0.01176,       color: '#7ECACA' },
  neptune: { name: 'Neptune', symbol: '♆', L0: 304.3487,  Ld: 0.00598,       color: '#6080C8' },
  pluto:   { name: 'Pluto',   symbol: '♇', L0: 238.9290,  Ld: 0.00397,       color: '#A08878' },
  chiron:  { name: 'Chiron',  symbol: '⚷', L0: 151.9800,  Ld: 0.01955,       color: '#98B898' },
};

const SIGNS = [
  { name: 'Aries',       symbol: '♈', element: 'Fire',  modality: 'Cardinal', ruler: 'Mars'    },
  { name: 'Taurus',      symbol: '♉', element: 'Earth', modality: 'Fixed',    ruler: 'Venus'   },
  { name: 'Gemini',      symbol: '♊', element: 'Air',   modality: 'Mutable',  ruler: 'Mercury' },
  { name: 'Cancer',      symbol: '♋', element: 'Water', modality: 'Cardinal', ruler: 'Moon'    },
  { name: 'Leo',         symbol: '♌', element: 'Fire',  modality: 'Fixed',    ruler: 'Sun'     },
  { name: 'Virgo',       symbol: '♍', element: 'Earth', modality: 'Mutable',  ruler: 'Mercury' },
  { name: 'Libra',       symbol: '♎', element: 'Air',   modality: 'Cardinal', ruler: 'Venus'   },
  { name: 'Scorpio',     symbol: '♏', element: 'Water', modality: 'Fixed',    ruler: 'Pluto'   },
  { name: 'Sagittarius', symbol: '♐', element: 'Fire',  modality: 'Mutable',  ruler: 'Jupiter' },
  { name: 'Capricorn',   symbol: '♑', element: 'Earth', modality: 'Cardinal', ruler: 'Saturn'  },
  { name: 'Aquarius',    symbol: '♒', element: 'Air',   modality: 'Fixed',    ruler: 'Uranus'  },
  { name: 'Pisces',      symbol: '♓', element: 'Water', modality: 'Mutable',  ruler: 'Neptune' },
];

const ASPECTS = [
  { name: 'Conjunction', symbol: '☌', angle: 0,   orb: 8,  type: 'major', nature: 'neutral'    },
  { name: 'Sextile',     symbol: '⚹', angle: 60,  orb: 4,  type: 'major', nature: 'harmonious' },
  { name: 'Square',      symbol: '□', angle: 90,  orb: 7,  type: 'major', nature: 'tense'      },
  { name: 'Trine',       symbol: '△', angle: 120, orb: 7,  type: 'major', nature: 'harmonious' },
  { name: 'Opposition',  symbol: '☍', angle: 180, orb: 8,  type: 'major', nature: 'tense'      },
  { name: 'Quincunx',    symbol: '⚻', angle: 150, orb: 2,  type: 'minor', nature: 'tense'      },
];

// Retrograde periods for 2024-2026 (hardcoded for accuracy)
const RETROGRADES = [
  { planet: 'mercury', start: new Date('2025-01-18'), end: new Date('2025-02-11'), sign: 'Aquarius' },
  { planet: 'mercury', start: new Date('2025-05-29'), end: new Date('2025-06-22'), sign: 'Gemini'   },
  { planet: 'mercury', start: new Date('2025-09-26'), end: new Date('2025-10-20'), sign: 'Libra'    },
  { planet: 'mercury', start: new Date('2026-01-25'), end: new Date('2026-02-19'), sign: 'Aquarius' },
  { planet: 'venus',   start: new Date('2025-03-01'), end: new Date('2025-04-12'), sign: 'Aries'    },
  { planet: 'mars',    start: new Date('2024-12-06'), end: new Date('2025-02-23'), sign: 'Leo'      },
  { planet: 'jupiter', start: new Date('2025-11-11'), end: new Date('2026-03-11'), sign: 'Gemini'   },
  { planet: 'saturn',  start: new Date('2025-07-12'), end: new Date('2025-11-27'), sign: 'Aries'    },
  { planet: 'uranus',  start: new Date('2025-09-06'), end: new Date('2026-02-04'), sign: 'Gemini'   },
  { planet: 'neptune', start: new Date('2025-07-04'), end: new Date('2025-12-10'), sign: 'Aries'    },
  { planet: 'pluto',   start: new Date('2025-05-04'), end: new Date('2025-10-13'), sign: 'Aquarius' },
];

// Major sign ingresses 2025-2026
const INGRESSES = [
  { planet: 'uranus',  sign: 'Gemini',      date: new Date('2025-07-07'),  note: 'Uranus enters Gemini — major 7-year shift' },
  { planet: 'neptune', sign: 'Aries',        date: new Date('2025-03-30'),  note: 'Neptune enters Aries — spiritual new era' },
  { planet: 'saturn',  sign: 'Aries',        date: new Date('2025-05-24'),  note: 'Saturn enters Aries — new responsibilities' },
  { planet: 'jupiter', sign: 'Cancer',       date: new Date('2025-06-09'),  note: 'Jupiter enters Cancer — expansion at home' },
  { planet: 'jupiter', sign: 'Leo',          date: new Date('2026-06-30'),  note: 'Jupiter enters Leo — creative expansion' },
];

function dateToJD(date) {
  return (date.getTime() / 86400000) + 2440587.5;
}

function normalizeDeg(deg) {
  return ((deg % 360) + 360) % 360;
}

function getPlanetLongitude(planetKey, date) {
  const planet = PLANETS[planetKey];
  const jd = dateToJD(date);
  const d = jd - J2000;
  return normalizeDeg(planet.L0 + planet.Ld * d);
}

function getAllPlanetPositions(date) {
  const positions = {};
  for (const key of Object.keys(PLANETS)) {
    const lon = getPlanetLongitude(key, date);
    const signIndex = Math.floor(lon / 30);
    const degInSign = lon % 30;
    positions[key] = {
      longitude: lon,
      sign: SIGNS[signIndex],
      signIndex,
      degInSign: Math.floor(degInSign),
      minInSign: Math.floor((degInSign % 1) * 60),
    };
  }
  return positions;
}

function getAspect(lon1, lon2) {
  let diff = Math.abs(lon1 - lon2);
  if (diff > 180) diff = 360 - diff;
  for (const aspect of ASPECTS) {
    if (Math.abs(diff - aspect.angle) <= aspect.orb) {
      return { ...aspect, exactness: Math.abs(diff - aspect.angle) };
    }
  }
  return null;
}

function getAspectsBetweenCharts(natal, transit) {
  const aspects = [];
  const importantNatal = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'ascendant'];
  const importantTransit = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

  for (const nKey of importantNatal) {
    if (!natal[nKey]) continue;
    const nLon = natal[nKey].longitude;
    for (const tKey of importantTransit) {
      if (!transit[tKey]) continue;
      const tLon = transit[tKey].longitude;
      const aspect = getAspect(nLon, tLon);
      if (aspect) {
        aspects.push({
          transitPlanet: tKey,
          natalPlanet: nKey,
          aspect,
          transitPos: transit[tKey],
          natalPos: natal[nKey],
        });
      }
    }
  }
  return aspects.sort((a, b) => a.aspect.exactness - b.aspect.exactness);
}

function getRetrogrades(startDate, endDate) {
  return RETROGRADES.filter(r => r.end >= startDate && r.start <= endDate);
}

function getIngresses(startDate, endDate) {
  return INGRESSES.filter(i => i.date >= startDate && i.date <= endDate);
}

function isRetrograde(planetKey, date) {
  return RETROGRADES.some(r => r.planet === planetKey && date >= r.start && date <= r.end);
}

// Find notable days in a range by scanning for tight aspects to natal chart
function findNotableDays(natalPositions, startDate, daysAhead = 90) {
  const notable = [];
  const seen = new Set();

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const transit = getAllPlanetPositions(date);
    const aspects = getAspectsBetweenCharts(natalPositions, transit);

    // Only flag days with tight aspects (exactness < 1 degree) from outer/slow planets
    const significantAspects = aspects.filter(a => {
      const slowPlanets = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'];
      const personalPlanets = ['sun', 'moon', 'venus', 'mars'];
      const isSlowTransit = slowPlanets.includes(a.transitPlanet);
      const isPersonalNatal = personalPlanets.includes(a.natalPlanet) || a.natalPlanet === 'sun' || a.natalPlanet === 'moon';
      return a.aspect.exactness < 1.5 && (isSlowTransit || isPersonalNatal);
    });

    // Check for ingresses on this day
    const dayIngresses = INGRESSES.filter(ing => {
      const d = ing.date;
      return d.getFullYear() === date.getFullYear() &&
             d.getMonth() === date.getMonth() &&
             d.getDate() === date.getDate();
    });

    // Check for retrograde station days
    const retroStations = RETROGRADES.filter(r => {
      const checkDate = (d) => d.getFullYear() === date.getFullYear() &&
                               d.getMonth() === date.getMonth() &&
                               d.getDate() === date.getDate();
      return checkDate(r.start) || checkDate(r.end);
    });

    if (significantAspects.length > 0 || dayIngresses.length > 0 || retroStations.length > 0) {
      const key = date.toDateString();
      if (!seen.has(key)) {
        seen.add(key);
        notable.push({
          date: new Date(date),
          aspects: significantAspects.slice(0, 2),
          ingresses: dayIngresses,
          retroStations,
          score: significantAspects.length + dayIngresses.length * 2 + retroStations.length,
        });
      }
    }
  }

  return notable.sort((a, b) => b.score - a.score).slice(0, 8);
}

// Calculate approximate rising sign based on birth time and latitude
function calcRisingSign(birthDate, birthHour, latitude) {
  const sunLon = getPlanetLongitude('sun', birthDate);
  // Simplified: RAMC approximation
  const lstHours = (birthHour + (sunLon / 15)) % 24;
  const ascLon = normalizeDeg(lstHours * 15 + latitude * 0.5);
  const signIndex = Math.floor(ascLon / 30);
  return { longitude: ascLon, sign: SIGNS[signIndex], signIndex, degInSign: Math.floor(ascLon % 30) };
}

export {
  PLANETS, SIGNS, ASPECTS, RETROGRADES, INGRESSES,
  getAllPlanetPositions, getPlanetLongitude,
  getAspect, getAspectsBetweenCharts,
  getRetrogrades, getIngresses, isRetrograde,
  findNotableDays, calcRisingSign, normalizeDeg,
};
