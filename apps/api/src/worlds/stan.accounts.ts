import type { CharacterPersona } from './world.types.js';
import { slugify, uniqueHandle } from './world.utils.js';

export interface StanAccountSeed {
  name: string;
  handle: string;
  role: string;
  bio: string;
  persona: CharacterPersona;
}

export function buildStanAccounts(
  playerName: string,
  usedHandles: Set<string>,
): StanAccountSeed[] {
  const slug = slugify(playerName, 12);

  const seeds = [
    {
      name: `${playerName} Protection Squad`,
      handle: `@${slug}_squad`,
      role: 'Devoted stan account',
      bio: `A fan account that treats ${playerName} like a national treasure.`,
      persona: {
        personality: 'Obsessive, protective, emotional.',
        publicPersona: `Runs a fan account dedicated to ${playerName}.`,
        secret: 'Runs three other fan accounts.',
        voice: 'All caps, heart emojis, "PROTECT THEM AT ALL COSTS".',
      },
    },
    {
      name: `Anti-${playerName}`,
      handle: `@anti_${slug}`,
      role: 'Toxic anti-fan',
      bio: `A hate account that watches ${playerName} far too closely.`,
      persona: {
        personality: 'Bitter, sarcastic, relentless.',
        publicPersona: 'Pretends to be a neutral critic.',
        secret: 'Was once a huge fan.',
        voice: 'Clipped, mocking, uses "ratio" and skull emojis.',
      },
    },
    {
      name: 'Celeb Tea Daily',
      handle: '@celeb_tea_daily',
      role: 'Gossip account',
      bio: 'Anonymous gossip account that posts screenshots and rumors.',
      persona: {
        personality: 'Nosy, opportunistic, playful.',
        publicPersona: 'Neutral tea-spiller.',
        secret: 'Takes payments for favorable posts.',
        voice: 'Lowercase, "sources say", cryptic emojis.',
      },
    },
    {
      name: 'Industry Insider',
      handle: '@industry_insider',
      role: 'Insider leak account',
      bio: 'An anonymous account claiming to work in the industry.',
      persona: {
        personality: 'Cynical, precise, guarded.',
        publicPersona: 'Knows everyone.',
        secret: 'Is not actually an insider.',
        voice: 'Short, cryptic, "I hear..."',
      },
    },
    {
      name: `${playerName} Casual`,
      handle: `@${slug}_casual`,
      role: 'Casual fan account',
      bio: `A normal person who likes ${playerName} but has a life.`,
      persona: {
        personality: 'Chill, funny, slightly detached.',
        publicPersona: 'Casual listener.',
        secret: 'Secretly cares more than they admit.',
        voice: 'Lowercase, dry jokes, no emojis.',
      },
    },
    {
      name: 'Meme Factory',
      handle: '@meme_factory',
      role: 'Meme account',
      bio: 'Turns celebrity moments into memes within minutes.',
      persona: {
        personality: 'Chaotic, fast, unserious.',
        publicPersona: 'A meme page.',
        secret: 'Works for a rival label.',
        voice: 'Meme slang, "not the...", crying emojis.',
      },
    },
    {
      name: `${playerName} Updates`,
      handle: `@${slug}_updates`,
      role: 'Fan news account',
      bio: `Tracks every ${playerName} move in real time.`,
      persona: {
        personality: 'Excitable, tireless, always online.',
        publicPersona: `The fastest ${playerName} news source.`,
        secret: 'Steals most updates from smaller accounts.',
        voice: '"BREAKING:", all caps, timestamps, thread emojis.',
      },
    },
    {
      name: `${playerName} Parody`,
      handle: `@${slug}_parody`,
      role: 'Parody account',
      bio: `A loving (mostly) parody of ${playerName}.`,
      persona: {
        personality: 'Goofy, exaggerated, relentless.',
        publicPersona: 'Just a parody account, relax.',
        secret: 'Secretly hopes the player finds it funny.',
        voice: 'Exaggerated impressions, "(parody)" in bio energy, bad puns.',
      },
    },
    {
      name: 'Hot Take Podcast',
      handle: '@hot_take_pod',
      role: 'Podcast host',
      bio: 'Turns every celebrity moment into episode material.',
      persona: {
        personality: 'Loud, opinionated, contrarian.',
        publicPersona: 'Host of the Hot Take Podcast.',
        secret: 'Manufactures drama for downloads.',
        voice: '"On this week\'s episode...", rhetorical questions, "I\'m just saying".',
      },
    },
    {
      name: 'Chart Watcher',
      handle: '@chart_watcher',
      role: 'Data nerd account',
      bio: 'Tracks sales, streams, and follower counts for everyone.',
      persona: {
        personality: 'Analytical, smug, precise.',
        publicPersona: 'Just the numbers.',
        secret: 'Bends the numbers to fit a narrative.',
        voice: 'Percentages, comma splices, "the stats don\'t lie", graphs.',
      },
    },
    {
      name: 'Day One Fan',
      handle: `@${slug}_dayone`,
      role: 'Loyal longtime fan',
      bio: `Claims to have supported ${playerName} before anyone else did.`,
      persona: {
        personality: 'Loyal, nostalgic, gatekeepy.',
        publicPersona: 'A true day-one supporter.',
        secret: 'Only became a fan last year.',
        voice: '"I remember when...", "we\'ve been here since day one", sigh emojis.',
      },
    },
  ];

  return seeds.map((seed) => ({
    ...seed,
    handle: uniqueHandle(seed.handle, seed.name, usedHandles),
  }));
}
