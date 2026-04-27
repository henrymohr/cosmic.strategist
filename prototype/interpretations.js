// Astrological interpretations database

const PLANET_IN_SIGN = {
  sun: {
    aries:       "You lead with boldness and act on instinct. Your identity is tied to action and independence.",
    taurus:      "You build your identity through stability, loyalty, and a deep appreciation for beauty.",
    gemini:      "Your sense of self is fluid, curious, and expressive. You thrive on connection and ideas.",
    cancer:      "Your identity runs deep — emotional, intuitive, and fiercely protective of those you love.",
    leo:         "You were born to shine. Creative expression, warmth, and natural leadership define you.",
    virgo:       "You find purpose through precision, service, and improvement. Your mind is your greatest tool.",
    libra:       "Harmony, fairness, and connection are your core drives. You are built for partnership.",
    scorpio:     "Intensity is your signature. You transform everything you touch and fear nothing beneath the surface.",
    sagittarius: "Freedom, truth, and adventure fuel you. You need a philosophy to live by.",
    capricorn:   "Ambition and structure are in your bones. You build with intention and play a long game.",
    aquarius:    "You think in systems and futures. Original, humanitarian, and refreshingly independent.",
    pisces:      "You feel everything. Compassion, creativity, and spiritual sensitivity define your essence.",
  },
  moon: {
    aries:       "Your emotions are quick and passionate — you feel first and think later. Needs independence emotionally.",
    taurus:      "You find emotional security in comfort, routine, and sensory pleasure. Slow to change, deeply loyal.",
    gemini:      "Your emotional world is verbal and restless. You process feelings through conversation and curiosity.",
    cancer:      "The Moon is at home here. Deep empathy, powerful intuition, and a need for emotional safety.",
    leo:         "You need to feel admired and seen. Generous with love but wounded by being overlooked.",
    virgo:       "You feel better when things are in order. Anxiety often masquerades as criticism — of self and others.",
    libra:       "You crave emotional balance and harmony. Conflict feels physically uncomfortable to you.",
    scorpio:     "Your emotional depths are volcanic. Intensely private, highly perceptive, slow to trust.",
    sagittarius: "You need emotional freedom and optimism. Feel suffocated by heaviness or routine.",
    capricorn:   "You manage emotions rather than express them. Responsible, resilient, but emotionally reserved.",
    aquarius:    "You process emotions intellectually. You care deeply for humanity but struggle with personal intimacy.",
    pisces:      "Your emotional boundaries are porous. You absorb everything around you — sensitivity as both gift and curse.",
  },
  mercury: {
    aries:       "Fast, direct, and decisive in thought. You say what you mean — sometimes before thinking it through.",
    taurus:      "Slow and deliberate thinker. You form views carefully and hold them firmly once formed.",
    gemini:      "Mercury rules here — quick wit, rapid connections, and an insatiable curiosity about everything.",
    cancer:      "Your mind is guided by intuition and memory. You think in feelings as much as facts.",
    leo:         "You communicate with confidence and flair. Ideas need an audience to come alive for you.",
    virgo:       "Mercury at its sharpest. Analytical, precise, and attuned to detail that others miss.",
    libra:       "You weigh every side before speaking. Diplomatic, fair-minded, and skilled at finding common ground.",
    scorpio:     "Your mind goes deep and misses nothing. Probing, perceptive, and drawn to hidden truths.",
    sagittarius: "You think in big pictures and philosophies. Inspiring to talk to, but impatient with small details.",
    capricorn:   "Practical, structured, and strategic in thought. You communicate with authority and purpose.",
    aquarius:    "Your thinking is original and often ahead of its time. You see patterns others can't.",
    pisces:      "Intuitive and poetic in thought. Logic bends to imagination — your mind works in metaphor.",
  },
  venus: {
    aries:       "You love fast and directly. Passion over patience — you want to pursue and be pursued.",
    taurus:      "Venus rules here. Sensual, loyal, and deeply committed. You love through touch and quality.",
    gemini:      "You love through conversation and mental connection. Variety keeps desire alive.",
    cancer:      "You love deeply and protectively. Home is where your heart lives — literally.",
    leo:         "Grand gestures, romance, and devotion. You love royally and expect the same in return.",
    virgo:       "You show love through service and thoughtfulness. Small gestures mean more than grand ones.",
    libra:       "Venus rules here too. You were made for partnership — romantic, charming, and deeply fair.",
    scorpio:     "Total merger or nothing. Your love is transformative, possessive, and unforgettable.",
    sagittarius: "You love with freedom. Adventure and growth must be shared — caged love won't survive.",
    capricorn:   "Slow to open, loyal once committed. You build love like you build everything else — for keeps.",
    aquarius:    "You need an intellectual equal. Unconventional relationships suit you — friendship first.",
    pisces:      "Romantic to the core. You dissolve into love — the challenge is not losing yourself in it.",
  },
  mars: {
    aries:       "Mars at home. Pure drive, direct action, zero patience. You were born to initiate.",
    taurus:      "Slow to anger, slow to act — but immovable once in motion. Your energy is endurance.",
    gemini:      "Energy scattered across many pursuits. Witty aggression — your weapon is words.",
    cancer:      "Indirect drive. You fight for those you love but resist direct confrontation for yourself.",
    leo:         "Dramatic, passionate, and competitive. You perform your drive — it must be witnessed.",
    virgo:       "Precise and systematic energy. You work harder than anyone but rarely show it.",
    libra:       "You argue diplomatically. Motivated by fairness — you fight best when the cause is just.",
    scorpio:     "Mars co-rules here. Strategic, relentless, and deeply powerful. You outlast everyone.",
    sagittarius: "Energy goes into exploration and expansion. Enthusiastic, fast-moving, freedom-seeking.",
    capricorn:   "Disciplined and goal-oriented drive. You are tireless when you have a worthy target.",
    aquarius:    "You fight for causes, not personal gain. Rebellious energy, innovating through disruption.",
    pisces:      "Diffuse and spiritual drive. Energy waxes and wanes. Creative passion over direct ambition.",
  },
  jupiter: {
    aries:       "Growth through bold initiative and taking the first leap. Lucky when you act without waiting.",
    taurus:      "Abundance through patience, pleasure, and building steadily. Material fortune favours you.",
    gemini:      "Expansion through ideas, communication, and learning. The more you know, the more you grow.",
    cancer:      "Growth through nurturing and home. Family, intuition, and emotional wisdom bring luck.",
    leo:         "Fortune through creative self-expression and leadership. Your generosity attracts abundance.",
    virgo:       "Growth through mastery and service. The details you perfect become your greatest assets.",
    libra:       "Expansion through partnerships and collaboration. Your biggest wins come through others.",
    scorpio:     "Growth through depth, transformation, and investigation. You prosper by going where others won't.",
    sagittarius: "Jupiter at home. Boundless optimism, travel, and philosophical expansion. Born lucky.",
    capricorn:   "Growth through structure, ambition, and long-term strategy. Fortune rewards your discipline.",
    aquarius:    "Expansion through innovation and community. Your luck is collective, not solo.",
    pisces:      "Jupiter at home. Spiritual abundance, creative flow, and compassion attract blessings.",
  },
  saturn: {
    aries:       "Your lessons involve patience, follow-through, and tempering impulsiveness with strategy.",
    taurus:      "Lessons around security, material stability, and not hoarding out of fear.",
    gemini:      "Lessons around focus, depth, and finishing what the mind starts.",
    cancer:      "Lessons around emotional boundaries, nurturing without martyrdom, and family patterns.",
    leo:         "Lessons around ego, recognition, and learning to shine authentically rather than performatively.",
    virgo:       "Lessons around perfectionism, self-criticism, and the courage to do imperfect things.",
    libra:       "Saturn exalted here. Lessons around fair commitment and building lasting partnerships.",
    scorpio:     "Deep lessons around control, power, and surrendering what no longer serves.",
    sagittarius: "Lessons around commitment to a belief system and responsible freedom.",
    capricorn:   "Saturn at home. Discipline, structure, and authority are your path and your reward.",
    aquarius:    "Saturn at home. Lessons around responsible innovation and earned rebellion.",
    pisces:      "Lessons around boundaries, sacrifice, and distinguishing spiritual surrender from avoidance.",
  },
  uranus: {
    aries:       "Revolution in identity and individual expression. Your generation reinvents what it means to be a self.",
    taurus:      "Revolution in material systems, money, and the body. Your generation disrupts economic structures.",
    gemini:      "Revolution in communication and information. Your generation transforms how minds connect.",
    cancer:      "Revolution in family, home, and emotional norms. Your generation redefines belonging.",
    leo:         "Revolution in creativity, performance, and leadership. Your generation reinvents self-expression.",
    virgo:       "Revolution in health, work, and service. Your generation disrupts systems of daily life.",
    libra:       "Revolution in relationships and justice. Your generation reinvents what partnership means.",
    scorpio:     "Revolution in power, sexuality, and transformation. Your generation exposes hidden systems.",
    sagittarius: "Revolution in belief, travel, and meaning. Your generation expands the horizon of truth.",
    capricorn:   "Revolution in authority and institutions. Your generation dismantles old power structures.",
    aquarius:    "Uranus at home. Revolution in technology and collective identity. Your generation is the future.",
    pisces:      "Revolution in spirituality and the unconscious. Your generation dissolves old illusions.",
  },
  neptune: {
    aries:       "A new spiritual frontier opens. Collective idealism is channelled into bold new directions.",
    taurus:      "Spiritualising the material. Collective dreams around beauty, nature, and value.",
    gemini:      "Spiritual communication, illusion in media, mystical ideas spreading rapidly.",
    cancer:      "Deep collective longing for home, roots, and belonging. Idealism in family life.",
    leo:         "Glamour, creative transcendence, and collective fantasy around celebrity and performance.",
    virgo:       "Spiritual service and healing. Collective dissolution of unhealthy systems.",
    libra:       "Spiritual partnerships and idealism in love. A generation that dreams of perfect union.",
    scorpio:     "Collective transformation, spiritual depth, and dissolution of old taboos.",
    sagittarius: "Spiritual expansion, religious idealism, and a generation seeking transcendent meaning.",
    capricorn:   "Spiritual ambition, dissolving old institutions, and collective disillusionment with authority.",
    aquarius:    "Collective spiritual awakening through technology and community. Utopian dreams.",
    pisces:      "Neptune at home. Peak spiritual sensitivity. A generation of mystics, artists, and healers.",
  },
  pluto: {
    aries:       "Generational destruction and rebirth of individual identity and personal power.",
    taurus:      "Transformation of material systems, finance, and humanity's relationship with the Earth.",
    gemini:      "Revolution in thought, language, and how information shapes reality.",
    cancer:      "Transformation of family structures, nationalism, and emotional foundations of society.",
    leo:         "Transformation of power, creativity, and leadership — the rise and fall of great egos.",
    virgo:       "Transformation of health systems, work, and the nature of service.",
    libra:       "Transformation of relationships, marriage, and collective ideas of justice.",
    scorpio:     "Pluto at home. Deep generational transformation, shadow work, and psychological revolution.",
    sagittarius: "Transformation of belief systems, globalisation, and what humanity calls truth.",
    capricorn:   "Dismantling of institutional power structures. A generation tearing down and rebuilding systems.",
    aquarius:    "Transformation through technology, collective power, and the nature of humanity itself.",
    pisces:      "Spiritual dissolution, transformation of the unconscious, and generational healing.",
  },
};

const ASPECT_INTERPRETATIONS = {
  'jupiter_conjunction_sun':  "A golden period of confidence, luck, and expansion. Opportunities come easily now. Say yes.",
  'jupiter_trine_sun':        "Ease and opportunity flow to you. Growth happens naturally — lean into it.",
  'jupiter_square_sun':       "Jupiter pushes you to grow but through friction. Overconfidence is the risk — stay grounded.",
  'jupiter_opposition_sun':   "Growth comes through relationships and balancing your needs with others. Don't go it alone.",
  'saturn_conjunction_sun':   "A defining chapter of discipline, responsibility, and restructuring who you are. Hard but formative.",
  'saturn_trine_sun':         "Structure supports you now. Your efforts compound. Slow, steady wins.",
  'saturn_square_sun':        "Reality checks are incoming. Obstacles exist to redirect and strengthen you. Don't quit.",
  'saturn_opposition_sun':    "A moment of reckoning with authority, ambition, or the weight of responsibility.",
  'uranus_conjunction_sun':   "Your life is being shaken loose from old patterns. Radical change in identity. Embrace it.",
  'uranus_trine_sun':         "Exciting, liberating change comes without chaos. Freedom and authenticity are the rewards.",
  'uranus_square_sun':        "Disruption to your core identity. You can resist or reinvent — reinvention wins.",
  'neptune_conjunction_sun':  "A mystical, confusing, dissolving period. Who you are is in flux. Trust the process.",
  'pluto_conjunction_sun':    "A profound transformation of identity. The old you is dying. Let it.",
  'pluto_trine_sun':          "Deep empowerment. You are being strengthened from the inside out.",
  'jupiter_conjunction_moon': "Emotional abundance and warmth. Home, family, and inner life feel blessed.",
  'saturn_conjunction_moon':  "Emotional weight and maturity. You are being asked to grow up emotionally.",
  'uranus_conjunction_moon':  "Emotional upheaval or liberation. Your feeling life is breaking free of old patterns.",
  'jupiter_conjunction_venus':"Love and abundance align. Relationships expand, beauty is everywhere, money flows.",
  'saturn_conjunction_venus': "Love is being tested for depth and commitment. What's real will last.",
  'uranus_conjunction_venus': "Sudden changes in love and attraction. Electric connections or unexpected endings.",
  'jupiter_conjunction_mars': "Energy and ambition are amplified. Act boldly — fortune rewards initiative now.",
  'saturn_conjunction_mars':  "Discipline your drive. Patience and strategy beat raw force right now.",
};

const RETROGRADE_MEANINGS = {
  mercury: {
    general:  "Mercury retrograde slows communication and technology. Review, revise, and reconnect — but avoid signing contracts or launching new projects.",
    themes:   ["communication delays", "technology glitches", "revisiting old conversations", "rethinking decisions"],
  },
  venus: {
    general:  "Venus retrograde asks you to reassess what — and who — you truly value. Old loves may resurface. Not the time for major relationship decisions.",
    themes:   ["revisiting relationships", "reassessing values", "old flames", "delayed pleasure"],
  },
  mars: {
    general:  "Mars retrograde turns energy inward. Frustration rises when action is blocked. Channel it into reflection and strategy, not force.",
    themes:   ["internalised energy", "reassessing goals", "frustration", "strategic pause"],
  },
  jupiter: {
    general:  "Jupiter retrograde asks you to find growth from within rather than seeking it externally. Inner wisdom is your resource.",
    themes:   ["inner growth", "questioning beliefs", "reassessing luck", "philosophical review"],
  },
  saturn: {
    general:  "Saturn retrograde brings lessons from the past back for resolution. Old structures are reviewed — keep what truly supports you.",
    themes:   ["revisiting structure", "old karma", "rebuilding foundations", "delayed accountability"],
  },
  uranus: {
    general:  "Uranus retrograde internalises the revolution. Change goes underground — inner awakening, not external disruption.",
    themes:   ["inner rebellion", "reconsidering change", "hidden breakthroughs"],
  },
  neptune: {
    general:  "Neptune retrograde briefly lifts the veil of illusion. Clarity about confusion in your spiritual life and relationships is possible.",
    themes:   ["seeing clearly", "disillusionment", "spiritual re-evaluation"],
  },
  pluto: {
    general:  "Pluto retrograde turns transformation inward. Shadow work, power dynamics, and deep psychological excavation are the themes.",
    themes:   ["shadow work", "inner power", "releasing control", "deep psychological process"],
  },
};

const DAILY_COSMIC_WEATHER = [
  "Mercury is active — sharp thinking, fast conversations, make the call.",
  "Venus lights up the sky — beauty, connection, and pleasure are heightened.",
  "The Moon is in a tense aspect — emotions run high. Breathe before reacting.",
  "Jupiter casts a benevolent eye — optimism is well-founded today.",
  "Saturn demands attention — show up, do the work, no shortcuts.",
  "Mars energises the day — act decisively, channel the drive.",
  "A harmonious trine softens the day — things flow with less effort.",
  "The Sun aspects Neptune — intuition is sharp, logic is foggy.",
  "Uranus stirs the pot — expect the unexpected and stay flexible.",
  "Pluto works in the background — what's hidden is surfacing.",
];

const NOTABLE_DAY_DESCRIPTIONS = {
  conjunction: (transit, natal) => `${capitalize(transit)} meets your natal ${capitalize(natal)} — a powerful activation of this part of your chart.`,
  trine:       (transit, natal) => `${capitalize(transit)} trines your natal ${capitalize(natal)} — energy flows easily into this area of life.`,
  square:      (transit, natal) => `${capitalize(transit)} squares your natal ${capitalize(natal)} — friction that demands attention and growth.`,
  opposition:  (transit, natal) => `${capitalize(transit)} opposes your natal ${capitalize(natal)} — a culmination or turning point in this theme.`,
  sextile:     (transit, natal) => `${capitalize(transit)} opens a door to your natal ${capitalize(natal)} — opportunity if you reach for it.`,
};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getAspectInterpretation(transitPlanet, aspectName, natalPlanet) {
  const key = `${transitPlanet}_${aspectName.toLowerCase()}_${natalPlanet}`;
  if (ASPECT_INTERPRETATIONS[key]) return ASPECT_INTERPRETATIONS[key];

  // Fallback generic interpretations
  const aspectFeel = {
    conjunction: "intense activation and focus",
    trine:       "ease, flow, and natural support",
    square:      "tension, challenge, and growth pressure",
    opposition:  "a culmination, reflection, or external pressure",
    sextile:     "opportunity that rewards initiative",
    quincunx:    "adjustment, awkwardness, and the need to recalibrate",
  };
  const planetThemes = {
    sun:     "identity and vitality",
    moon:    "emotions and instincts",
    mercury: "mind and communication",
    venus:   "love and values",
    mars:    "drive and action",
    jupiter: "growth and opportunity",
    saturn:  "structure and discipline",
    uranus:  "change and liberation",
    neptune: "spirituality and dreams",
    pluto:   "transformation and power",
    chiron:  "wounds and healing",
  };
  const transitTheme = planetThemes[transitPlanet] || transitPlanet;
  const natalTheme = planetThemes[natalPlanet] || natalPlanet;
  const feel = aspectFeel[aspectName.toLowerCase()] || "an interesting interaction";
  return `${capitalize(transitPlanet)} brings ${feel} to your natal ${capitalize(natalPlanet)} — the themes of ${transitTheme} are intersecting with your ${natalTheme}.`;
}

function getPlanetInSignInterpretation(planet, sign) {
  const signKey = sign.toLowerCase();
  const planetKey = planet.toLowerCase();
  if (PLANET_IN_SIGN[planetKey] && PLANET_IN_SIGN[planetKey][signKey]) {
    return PLANET_IN_SIGN[planetKey][signKey];
  }
  return `${capitalize(planet)} in ${capitalize(sign)} — a unique placement that blends ${planet}'s energy with ${sign}'s qualities.`;
}

function getRetrogradeMeaning(planet) {
  return RETROGRADE_MEANINGS[planet.toLowerCase()] || {
    general: `${capitalize(planet)} retrograde turns this planet's energy inward for review and reconsideration.`,
    themes: ["review", "reconsideration", "internalisation"],
  };
}

function getNotableDayDescription(aspectName, transitPlanet, natalPlanet) {
  const fn = NOTABLE_DAY_DESCRIPTIONS[aspectName.toLowerCase()];
  if (fn) return fn(transitPlanet, natalPlanet);
  return `${capitalize(transitPlanet)} forms a ${aspectName} with your natal ${capitalize(natalPlanet)}.`;
}

export {
  PLANET_IN_SIGN, ASPECT_INTERPRETATIONS, RETROGRADE_MEANINGS,
  getAspectInterpretation, getPlanetInSignInterpretation,
  getRetrogradeMeaning, getNotableDayDescription, capitalize,
  DAILY_COSMIC_WEATHER,
};
