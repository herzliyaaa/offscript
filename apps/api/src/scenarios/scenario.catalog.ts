import type { ScenarioSummary, ScenarioTemplate } from './scenario.types.js';

const templates: ScenarioTemplate[] = [
  {
    key: 'kpop-idol-producer',
    title: 'Idol to Producer',
    tagline: 'From center stage to the control room.',
    description:
      'You are a chart-topping K-pop idol who wants to be taken seriously as a music producer. Navigate label politics, celebrity egos, and a fandom that has an opinion about everything.',
    setting:
      "Seoul's entertainment industry in 2026: music-show backstages, label boardrooms, late-night studios, variety shows, and a relentlessly online fandom.",
    playerRole: 'A famous idol transitioning into music production',
    goal: 'Produce a #1 album for another artist without losing your own career.',
    tone: 'Dramatic, witty, emotionally charged, with sharp industry satire.',
    themes: ['fame', 'reinvention', 'rivalry', 'creative control'],
    statLabels: ['Fame', 'Talent', 'Reputation', 'Money', 'Wellbeing'],
    castGuidance:
      'Include 4-5 celebrities: a rival idol, a legendary reclusive producer, a calculating label executive, a breakout rookie, and a gossip journalist or influencer. Give each one a public persona and a private secret.',
    openingHook:
      'A leaked demo and a label ultimatum put your producing debut on the line.',
  },
  {
    key: 'rising-actress',
    title: 'Rising Actress',
    tagline: 'Everyone loves you until the next headline.',
    description:
      'You are a breakout actress during awards season. Every interview, rivalry, and late-night decision shapes whether you become a star or a cautionary tale.',
    setting:
      'Hollywood during awards season: film sets, press junkets, after-parties, streaming executives, and tabloid newsrooms.',
    playerRole: 'A breakout actress chasing her first major award',
    goal: 'Win your first major award without losing yourself in the process.',
    tone: 'Glossy, tense, intimate, with dark Hollywood humor.',
    themes: ['ambition', 'identity', 'public image', 'loyalty'],
    statLabels: ['Fame', 'Talent', 'Reputation', 'Money', 'Wellbeing'],
    castGuidance:
      'Include 4-5 celebrities: an acclaimed director, a charismatic co-star, a ruthless agent, a rival actress, and a tabloid journalist. Give each one a public persona and a private secret.',
    openingHook:
      'A career-defining role lands the same week a damaging rumor goes viral.',
  },
  {
    key: 'reality-star',
    title: 'Reality Star',
    tagline: 'The cameras never stop.',
    description:
      'You are the fan favorite on a hit reality show. Turn fifteen minutes of fame into a real career while the producers edit your life into a story you barely recognize.',
    setting:
      'A luxury reality-TV mansion, confessionals, brand-deal meetings, reunion specials, and a fanbase that watches every move.',
    playerRole: 'A fan-favorite reality star',
    goal: 'Turn reality-TV fame into a lasting career.',
    tone: 'Campy, fast-paced, funny, with moments of genuine vulnerability.',
    themes: ['fame', 'authenticity', 'manipulation', 'belonging'],
    statLabels: ['Fame', 'Influence', 'Reputation', 'Money', 'Wellbeing'],
    castGuidance:
      'Include 4-5 celebrities: a scheming co-star, a producer who controls the edit, a popular influencer, a former winner, and a brand executive. Give each one a public persona and a private secret.',
    openingHook:
      'A clip of you goes viral for the wrong reason on finale week.',
  },
  {
    key: 'indie-breakout',
    title: 'Indie Breakout',
    tagline: 'One viral song changes everything.',
    description:
      'You are an independent musician on the edge of stardom. A viral moment opens doors, but every offer comes with strings attached.',
    setting:
      'A DIY music scene, small venues, cramped studios, streaming playlists, and the messy business of being discovered.',
    playerRole: 'An independent musician with one viral song',
    goal: 'Get signed without selling out your sound or your people.',
    tone: 'Raw, warm, bittersweet, with dry humor.',
    themes: ['art vs commerce', 'friendship', 'integrity', 'luck'],
    statLabels: ['Fame', 'Craft', 'Reputation', 'Money', 'Wellbeing'],
    castGuidance:
      'Include 4-5 celebrities: a jaded A&R scout, a rival indie artist, a loyal bandmate, a popular producer, and a music critic. Give each one a public persona and a private secret.',
    openingHook:
      'Your song explodes overnight while you are still working a day job.',
  },
];

const byKey = new Map(templates.map((template) => [template.key, template]));

export const scenarioCatalog = templates;

export function findScenario(key: string): ScenarioTemplate | undefined {
  return byKey.get(key);
}

export function toScenarioSummary(template: ScenarioTemplate): ScenarioSummary {
  const {
    castGuidance: _castGuidance,
    openingHook: _openingHook,
    ...summary
  } = template;
  return summary;
}
