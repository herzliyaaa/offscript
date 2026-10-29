export interface ScenarioTemplate {
  key: string;
  title: string;
  tagline: string;
  description: string;
  setting: string;
  playerRole: string;
  goal: string;
  tone: string;
  themes: string[];
  statLabels: string[];
  castGuidance: string;
  openingHook: string;
}

export type ScenarioSummary = Omit<
  ScenarioTemplate,
  'castGuidance' | 'openingHook'
>;
