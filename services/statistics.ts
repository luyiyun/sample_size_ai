import { CalculationDetails, CalculationParams, StudyType } from '../types';

// Standard Normal Distribution Quantile Function (Inverse CDF) approx
// For Z_alpha/2 and Z_beta
function getZScore(probability: number): number {
  // Approximation of Probit function
  // return Math.sqrt(2) * erfinv(2 * p - 1);
  // Using a simpler approximation for standard values (0.05, 0.01, 0.20) or a library
  // Since we don't have a stats library, we use a lookup for common values or a decent approximation
  // approximation for p > 0.5
  if (probability > 0.5) return -getZScore(1 - probability);
  
  const p = probability;
  if (p < 0.000001) return -4.5;
  if (p > 0.999999) return 4.5;

  // Abramowitz and Stegun approximation
  const t = Math.sqrt(-2.0 * Math.log(p));
  const c0 = 2.515517; 
  const c1 = 0.802853; 
  const c2 = 0.010328; 
  const d1 = 1.432788; 
  const d2 = 0.189269; 
  const d3 = 0.001308;
  return -((c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t) - t);
}

// Helper to get Z for alpha (two-tailed) and beta (one-tailed)
const getZ = (alpha: number, power: number) => {
  const z_alpha = Math.abs(getZScore(alpha / 2));
  const z_beta = Math.abs(getZScore(1 - power));
  return { z_alpha, z_beta };
};

export const performCalculation = (params: CalculationParams): CalculationDetails => {
  const alpha = params.alpha ?? 0.05;
  const power = params.power ?? 0.80;
  
  const { z_alpha, z_beta } = getZ(alpha, power);
  
  let result = 0;
  let formula = '';
  let description = '';
  let assumptions: string[] = [];
  let variables: Record<string, number | string> = {
    'α (Alpha)': alpha,
    '1-β (Power)': power,
    'Z_α/2': z_alpha.toFixed(3),
    'Z_β': z_beta.toFixed(3)
  };

  switch (params.type) {
    case StudyType.TWO_MEANS: {
      const muDiff = Math.abs(params.meanDiff || 0);
      const sigma = params.stdDev || 1;
      
      if (muDiff === 0) throw new Error("Difference in means cannot be zero.");
      
      // Formula: n = 2 * ((Z_alpha + Z_beta)^2 * sigma^2) / (mu1 - mu2)^2
      const num = 2 * Math.pow(z_alpha + z_beta, 2) * Math.pow(sigma, 2);
      const den = Math.pow(muDiff, 2);
      result = Math.ceil(num / den);

      formula = `n = \\frac{2\\sigma^2(Z_{\\alpha/2} + Z_{\\beta})^2}{(\\mu_1 - \\mu_2)^2}`;
      description = "Sample size per group for comparing two independent means (Student's t-test equivalent for large samples).";
      variables = { ...variables, 'σ (SD)': sigma, '|μ1 - μ2|': muDiff };
      assumptions = ['Equal variances', 'Normal distribution', 'Independent samples'];
      break;
    }

    case StudyType.TWO_PROPS: {
      const p1 = params.p1 || 0.5;
      const p2 = params.p2 || 0.5;
      if (p1 === p2) throw new Error("Proportions cannot be equal for power calculation.");
      
      const p_bar = (p1 + p2) / 2;
      const q_bar = 1 - p_bar;
      
      // Formula: n = (Z_alpha * sqrt(2*p_bar*q_bar) + Z_beta * sqrt(p1q1 + p2q2))^2 / (p1-p2)^2
      const term1 = z_alpha * Math.sqrt(2 * p_bar * q_bar);
      const term2 = z_beta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2));
      const num = Math.pow(term1 + term2, 2);
      const den = Math.pow(p1 - p2, 2);
      
      result = Math.ceil(num / den);
      
      formula = `n = \\frac{(Z_{\\alpha/2}\\sqrt{2\\bar{p}(1-\\bar{p})} + Z_{\\beta}\\sqrt{p_1(1-p_1) + p_2(1-p_2)})^2}{(p_1 - p_2)^2}`;
      description = "Sample size per group for comparing two independent proportions (Chi-square/Z-test).";
      variables = { ...variables, 'p1': p1, 'p2': p2, 'p_bar': p_bar.toFixed(3) };
      assumptions = ['Independent samples', 'Normal approximation valid'];
      break;
    }

    case StudyType.ONE_MEAN: {
      const sigma = params.stdDev || 1;
      const E = params.marginError || 0.1; // Margin of error
      
      // Formula: n = (Z_alpha * sigma / E)^2
      // Usually for estimation, we use Z_alpha/2 for CI
      const z = z_alpha; // Corresponds to 95% CI usually
      result = Math.ceil(Math.pow((z * sigma) / E, 2));

      formula = `n = (\\frac{Z_{\\alpha/2} \\cdot \\sigma}{E})^2`;
      description = "Sample size to estimate a population mean with specific precision.";
      variables = { 'α': alpha, 'Z_α/2': z.toFixed(3), 'σ (SD)': sigma, 'E (Margin of Error)': E };
      assumptions = ['Normal distribution or Large Sample'];
      break;
    }

    case StudyType.ONE_PROP: {
      const p = params.p_expected || 0.5;
      const E = params.marginError || 0.05;

      // Formula: n = (Z^2 * p * (1-p)) / E^2
      const z = z_alpha;
      const num = Math.pow(z, 2) * p * (1 - p);
      const den = Math.pow(E, 2);
      result = Math.ceil(num / den);

      formula = `n = \\frac{Z_{\\alpha/2}^2 \\cdot p(1-p)}{E^2}`;
      description = "Sample size to estimate a population proportion with specific precision.";
      variables = { 'α': alpha, 'Z_α/2': z.toFixed(3), 'p (expected)': p, 'E (Margin of Error)': E };
      assumptions = ['Random sampling', 'Large population'];
      break;
    }
    
    default:
      throw new Error("Unknown study type");
  }

  return {
    formula,
    variables,
    result,
    totalSampleSize: params.type === StudyType.TWO_MEANS || params.type === StudyType.TWO_PROPS ? result * 2 : result,
    description,
    assumptions
  };
};