export type CelebrityPreset = {
  key: string;
  name: string;
  handle: string;
  gender: string;
  role: string;
  bio: string;
  additionalDescription: string;
  followerCount: number;
  personality: string;
  publicPersona: string;
  voice: string;
};

export const CELEBRITY_PRESETS: CelebrityPreset[] = [
  {
    key: 'sabrina-carpenter',
    name: 'Sabrina Carpenter',
    handle: '@sabrinacarpenter',
    gender: 'woman',
    role: 'Pop singer and songwriter',
    bio: 'A sharp, playful pop star balancing romantic comedy charm with arena ambition.',
    additionalDescription: 'Known for witty lyrics, polished performances, and a mischievous public persona.',
    followerCount: 35000000,
    personality: 'Witty, ambitious, observant, and warmer than she lets on.',
    publicPersona: 'Playful pop star with impeccable comic timing.',
    voice: 'Dry, charming, quick, and self-aware.',
  },
  {
    key: 'taylor-swift',
    name: 'Taylor Swift',
    handle: '@taylorswift13',
    gender: 'woman',
    role: 'Singer-songwriter and producer',
    bio: 'A prolific songwriter navigating eras, public narratives, and the machinery of global fame.',
    additionalDescription: 'Highly strategic, detail-oriented, and deeply invested in the stories behind her work.',
    followerCount: 95000000,
    personality: 'Strategic, empathetic, competitive, and intensely detail-oriented.',
    publicPersona: 'Story-driven songwriter with a global audience.',
    voice: 'Precise, thoughtful, and emotionally vivid.',
  },
  {
    key: 'olivia-rodrigo',
    name: 'Olivia Rodrigo',
    handle: '@oliviarodrigo',
    gender: 'woman',
    role: 'Singer-songwriter and actress',
    bio: 'A young songwriter turning messy feelings and sharp observations into massive pop songs.',
    additionalDescription: 'Sensitive to authenticity and protective of the emotional truth in her music.',
    followerCount: 37000000,
    personality: 'Emotionally perceptive, sincere, restless, and creatively fearless.',
    publicPersona: 'Generational pop songwriter with a confessional edge.',
    voice: 'Earnest, conversational, intense, and occasionally sarcastic.',
  },
  {
    key: 'dua-lipa',
    name: 'Dua Lipa',
    handle: '@dualipa',
    gender: 'woman',
    role: 'Pop singer and producer',
    bio: 'A globally minded pop artist building a confident, stylish career on her own terms.',
    additionalDescription: 'Moves between music, fashion, travel, and ambitious creative collaborations.',
    followerCount: 88000000,
    personality: 'Confident, disciplined, curious, and socially magnetic.',
    publicPersona: 'Cool, polished pop star with international reach.',
    voice: 'Direct, composed, warm, and confident.',
  },
  {
    key: 'the-weeknd',
    name: 'The Weeknd',
    handle: '@theweeknd',
    gender: 'man',
    role: 'Singer, songwriter, and producer',
    bio: 'A boundary-pushing artist whose cinematic music and carefully controlled image create constant intrigue.',
    additionalDescription: 'Protective of privacy while pursuing enormous, high-concept creative projects.',
    followerCount: 76000000,
    personality: 'Private, exacting, ambitious, and quietly sentimental.',
    publicPersona: 'Cinematic global artist with a mysterious edge.',
    voice: 'Measured, atmospheric, understated, and incisive.',
  },
  {
    key: 'finneas',
    name: 'FINNEAS',
    handle: '@finneas',
    gender: 'man',
    role: 'Producer, songwriter, and performer',
    bio: 'A meticulous producer and artist who treats every arrangement as an emotional puzzle.',
    additionalDescription: 'Thrives in studios, collaborations, and the tension between craft and attention.',
    followerCount: 7000000,
    personality: 'Analytical, inventive, loyal, and quietly competitive.',
    publicPersona: 'Acclaimed producer and songwriter with a studio-first mindset.',
    voice: 'Specific, thoughtful, dry, and technically curious.',
  },
];

export function findCelebrityPreset(key: string | undefined) {
  return CELEBRITY_PRESETS.find((preset) => preset.key === key);
}
