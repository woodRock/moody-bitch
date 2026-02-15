export interface Perk {
  id: string;
  name: string;
  x: number;
  y: number;
  description: string;
}

export interface Constellation {
  name: string;
  skillKey: string;
  description: string;
  perks: Perk[];
  lines: [number, number][];
  spectralPaths: string[];
}

export const CONSTELLATIONS: Constellation[] = [
  {
    name: 'RESTORATION',
    skillKey: 'RESTORATION',
    description: 'The art of mending the spirit through rest and healing.',
    spectralPaths: [
      "M 100,400 L 150,350 L 200,250 L 280,220 L 350,150 L 420,200 L 380,350 Z",
      "M 150,350 Q 50,350 50,300 Q 50,250 150,250",
      "M 280,220 Q 300,300 380,350",
      "M 350,150 Q 400,100 450,150 Q 480,200 420,200"
    ],
    perks: [
      { id: 'rest_1', name: 'Consistent Bedtime', x: 100, y: 400, description: 'Going to bed at the same time for 3 days.' },
      { id: 'rest_2', name: 'Digital Detox', x: 150, y: 350, description: 'No screens 1 hour before sleep.' },
      { id: 'rest_3', name: 'Deep REM', x: 200, y: 250, description: 'Achieving a high-quality sleep score.' },
      { id: 'rest_4', name: 'Self-Compassion', x: 280, y: 220, description: 'Forgiving yourself for a low-energy day.' },
      { id: 'rest_5', name: 'Boundary Setter', x: 350, y: 150, description: 'Saying no to protect your energy.' },
      { id: 'rest_6', name: 'Restorative Silence', x: 420, y: 200, description: 'Spending 10 minutes in complete stillness.' },
      { id: 'rest_7', name: 'Waking Grace', x: 380, y: 350, description: 'Waking up without hitting the snooze button.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]]
  },
  {
    name: 'SPEECH',
    skillKey: 'SPEECH',
    description: 'Your influence on the realm through truth and connection.',
    spectralPaths: [
      "M 150,100 L 120,300 L 150,450",
      "M 350,100 L 380,300 L 350,450",
      "M 120,300 L 250,250 L 380,300",
      "M 130,100 A 20,20 0 1,1 170,100 M 330,100 A 20,20 0 1,1 370,100"
    ],
    perks: [
      { id: 'speech_1', name: 'Inner Dialogue', x: 150, y: 100, description: 'Replacing one negative thought with a neutral one.' },
      { id: 'speech_2', name: 'Active Listening', x: 350, y: 100, description: 'Truly hearing a friend without planning a response.' },
      { id: 'speech_3', name: 'Vulnerability', x: 120, y: 300, description: 'Sharing a difficult feeling with someone you trust.' },
      { id: 'speech_4', name: 'Truth-Teller', x: 250, y: 250, description: 'Expressing a need clearly and without apology.' },
      { id: 'speech_5', name: 'The Scribe', x: 150, y: 450, description: 'Maintaining a 3-day journaling streak.' },
      { id: 'speech_6', name: 'Conflict Resolver', x: 350, y: 450, description: 'Addressing a tension before it becomes a dragon.' },
    ],
    lines: [[0, 2], [2, 4], [1, 3], [3, 5], [2, 3]]
  },
  {
    name: 'ALCHEMY',
    skillKey: 'ALCHEMY',
    description: 'The science of nourishing the body and mind.',
    spectralPaths: [
      "M 100,150 L 180,350 L 250,200 L 320,350 L 400,150",
      "M 50,400 H 450 M 100,400 V 450 M 400,400 V 450",
      "M 250,200 Q 250,100 250,50"
    ],
    perks: [
      { id: 'alch_1', name: 'Hydration Potion', x: 100, y: 150, description: 'Drinking 2L of water in a single day.' },
      { id: 'alch_2', name: 'Nutrient Gatherer', x: 180, y: 350, description: 'Eating three balanced meals.' },
      { id: 'alch_3', name: 'Sobriety Scroll', x: 250, y: 200, description: 'Avoiding a toxic substance for a day.' },
      { id: 'alch_4', name: 'Focus Flux', x: 320, y: 350, description: 'Reducing caffeine to improve mental stability.' },
      { id: 'alch_5', name: 'Master Alchemist', x: 400, y: 150, description: 'Cooking a meal from scratch with love.' },
    ],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4]]
  }
];
