export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system' // For showing calculation steps purely
}

export interface CalculationDetails {
  formula: string;
  variables: Record<string, number | string>;
  result: number; // Sample size per group usually
  totalSampleSize?: number;
  description: string;
  assumptions: string[];
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  calculation?: CalculationDetails;
  isThinking?: boolean;
}

export enum StudyType {
  ONE_MEAN = 'one_mean',
  ONE_PROP = 'one_prop',
  TWO_MEANS = 'two_means',
  TWO_PROPS = 'two_props'
}

export interface CalculationParams {
  type: StudyType;
  alpha?: number; // default 0.05
  power?: number; // default 0.80
  // For Means
  meanDiff?: number; // Effect size (mu1 - mu2)
  stdDev?: number; // Common standard deviation
  marginError?: number; // For estimation
  // For Proportions
  p1?: number;
  p2?: number;
  p_expected?: number; // For single proportion estimation
  width?: number; // Total width of confidence interval (2 * marginError)
}