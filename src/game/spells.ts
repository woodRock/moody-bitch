export interface Spell {
  id: 'heal' | 'calm' | 'transmute' | 'familiar' | 'fus' | 'tiid' | 'feim';
  name: string;
  school: 'RESTORATION' | 'ILLUSION' | 'ALTERATION' | 'CONJURATION' | 'SHOUTS';
  cost: number;
  description: string;
  effect: string;
  words?: string[];
}

export const SPELLS: Spell[] = [
  { id: 'heal', name: 'Heal Self', school: 'RESTORATION', cost: 30, description: 'A basic mending of the spirit.', effect: 'Prompts you to list 3 things you value about yourself today.' },
  { id: 'calm', name: 'Calm', school: 'ILLUSION', cost: 40, description: 'Soothe the racing mind.', effect: 'Guides a 60-second 4-7-8 breathing exercise.' },
  { id: 'transmute', name: 'Transmute Thought', school: 'ALTERATION', cost: 50, description: 'Turn iron worries into golden lessons.', effect: 'The scribe reframes a heavy thought into a lesson.' },
  { id: 'familiar', name: 'Summon Familiar', school: 'CONJURATION', cost: 30, description: 'Call upon a trusted ally.', effect: 'A reminder to reach out to someone you trust.' },
];

export const SHOUTS: Spell[] = [
  {
    id: 'fus', name: 'Unrelenting Focus', school: 'SHOUTS', cost: 0, words: ['FUS', 'RO', 'DAH'],
    description: 'Force your will upon the world and crush procrastination. A powerful shout that focuses your spirit for a brief period of intense productivity.',
    effect: 'Quests completed within the next 5 minutes grant double XP.',
  },
  {
    id: 'tiid', name: 'Slow Time', school: 'SHOUTS', cost: 0, words: ['TIID', 'KLO', 'UL'],
    description: 'Bending time to your will, you silence the noise of the world. All notifications and world messages are suppressed, allowing for total concentration.',
    effect: 'Pauses all notifications for 10 minutes.',
  },
  {
    id: 'feim', name: 'Ethereal Peace', school: 'SHOUTS', cost: 0, words: ['FEIM', 'ZII', 'GRON'],
    description: 'The Voice is that of the spirit, not the body. You become as a ghost, untethered from the distractions of the physical world. The HUD vanishes, leaving only your focus.',
    effect: 'Toggles Zen Mode (hides the HUD).',
  },
];

export const SCHOOLS = ['ALL', 'SHOUTS', 'ALTERATION', 'CONJURATION', 'ILLUSION', 'RESTORATION', 'ACTIVE EFFECTS'] as const;

export const RACES = [
  'Nord', 'Imperial', 'Breton', 'Redguard',
  'Altmer', 'Bosmer', 'Dunmer',
  'Orc', 'Khajiit', 'Argonian',
];

export const WISDOM_QUOTES = [
  'Rest is as vital as the battle itself.',
  'The longest journey begins with a single Shout.',
  'Iron is forged in fire; the mind is forged in challenge.',
  'Even the High King must sometimes pause to breathe.',
  'Focus is a blade that dulls if never sheathed.',
  'The stars guide those who look upward.',
  'A dragon does not concern himself with the opinions of sheep.',
  'True mastery is knowing when to strike and when to wait.',
  "The Thu'um is strongest when the heart is quiet.",
  'Your spirit is your greatest weapon. Keep it sharp.',
];

export const LORE_TIPS = [
  "Restoration is a perfectly valid school of magic. Don't let anyone tell you otherwise.",
  'Taking a brisk walk in the physical realm increases your Stamina XP significantly.',
  'The Amulet of Akatosh grants a global XP bonus. Keep it equipped for faster leveling.',
  'Reading your past chronicles in the Journal can help reveal patterns in your spirit.',
  'Even the Dragonborn needs a consistent bedtime to keep their Magicka high.',
  'Transmuting a negative thought into a lesson is the first step toward mastery of Alteration.',
  'A Sweetroll a day keeps the Thalmor away. Or at least makes the afternoon better.',
  'Scribe a log every day and your streak will shower you with bonus XP.',
  'On a phone, tap the compass to let it follow the real horizon.',
];
