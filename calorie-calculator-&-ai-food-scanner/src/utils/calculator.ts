import { ActivityLevel, ActivityOption, CalculationResult, CalculatorInputs, GoalCalorieTier, MacroSplit, PrimaryGoal } from '../types';

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  {
    value: 'sedentary',
    label: 'Sedentary',
    multiplier: 1.2,
    description: 'Little or no exercise, desk job',
    daysText: '0 days/wk',
  },
  {
    value: 'light',
    label: 'Lightly Active',
    multiplier: 1.375,
    description: 'Light exercise or sports',
    daysText: '1–3 days/wk',
  },
  {
    value: 'moderate',
    label: 'Moderately Active',
    multiplier: 1.55,
    description: 'Moderate exercise or sports',
    daysText: '3–5 days/wk',
  },
  {
    value: 'very',
    label: 'Very Active',
    multiplier: 1.725,
    description: 'Hard exercise or sports',
    daysText: '6–7 days/wk',
  },
  {
    value: 'extra',
    label: 'Extremely Active',
    multiplier: 1.9,
    description: 'Hard daily exercise or physical job',
    daysText: '2x/day or athlete',
  },
];

/**
 * Mifflin-St Jeor Equation (Clinical Standard)
 * Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
 * Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
 */
export function calculateBMR(
  gender: 'male' | 'female',
  age: number,
  heightCm: number,
  weightKg: number,
  formula: 'mifflin' | 'harris' = 'mifflin'
): number {
  if (formula === 'harris') {
    if (gender === 'male') {
      return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
    }
  }

  // Mifflin-St Jeor Equation
  const sexAdjustment = gender === 'male' ? 5 : -161;
  return (10 * weightKg) + (6.25 * heightCm) - (5 * age) + sexAdjustment;
}

/**
 * Goal-specific macronutrient calculations:
 * - Cutting: Higher protein (35%), moderate carbs (35%), lower fat (30%)
 * - Maintenance: Balanced (30% protein, 40% carbs, 30% fat)
 * - Bulking: High carbs (50%), protein (25%), fat (25%)
 */
export function calculateMacroSplit(totalKcal: number, weightKg: number, goalMode: 'cutting' | 'maintenance' | 'bulking'): MacroSplit {
  let proteinPct = 0.30;
  let carbsPct = 0.40;
  let fatPct = 0.30;

  if (goalMode === 'cutting') {
    proteinPct = 0.35;
    carbsPct = 0.35;
    fatPct = 0.30;
  } else if (goalMode === 'bulking') {
    proteinPct = 0.25;
    carbsPct = 0.50;
    fatPct = 0.25;
  }

  const proteinKcal = totalKcal * proteinPct;
  const carbsKcal = totalKcal * carbsPct;
  const fatKcal = totalKcal * fatPct;

  const proteinG = Math.round(proteinKcal / 4);
  const carbsG = Math.round(carbsKcal / 4);
  const fatG = Math.round(fatKcal / 9);

  return {
    proteinG,
    proteinKcal: Math.round(proteinKcal),
    proteinPct: Math.round(proteinPct * 100),
    carbsG,
    carbsKcal: Math.round(carbsKcal),
    carbsPct: Math.round(carbsPct * 100),
    fatG,
    fatKcal: Math.round(fatKcal),
    fatPct: Math.round(fatPct * 100),
  };
}

export function computeCalorieReport(inputs: CalculatorInputs): CalculationResult | null {
  const age = Number(inputs.age);
  const height = Number(inputs.heightCm);
  const weight = Number(inputs.weightKg);

  if (!age || !height || !weight || age < 10 || age > 120 || height < 50 || weight < 20) {
    return null;
  }

  const activity = ACTIVITY_OPTIONS.find((a) => a.value === inputs.activityLevel) || ACTIVITY_OPTIONS[0];
  const bmr = Math.round(calculateBMR(inputs.gender, age, height, weight, inputs.formula));
  const tdee = Math.round(bmr * activity.multiplier);

  // BMI Calculation
  const heightMeters = height / 100;
  const bmi = Number((weight / (heightMeters * heightMeters)).toFixed(1));

  let bmiCategory = 'Normal weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Obesity';

  // Ideal weight range (BMI 18.5 - 24.9)
  const minIdealWeight = Number((18.5 * heightMeters * heightMeters).toFixed(1));
  const maxIdealWeight = Number((24.9 * heightMeters * heightMeters).toFixed(1));

  // Water Target: 35 ml / kg body weight + extra for active days
  const activityWaterBonus = activity.multiplier >= 1.725 ? 0.6 : activity.multiplier >= 1.55 ? 0.4 : 0;
  const waterLiters = Number(((weight * 0.035) + activityWaterBonus).toFixed(1));
  const waterOz = Math.round(waterLiters * 33.814);

  // Maintenance Tier
  const maintenanceTier: GoalCalorieTier = {
    id: 'maintain',
    title: 'Maintain',
    paceType: 'maintain',
    calories: tdee,
    diff: 0,
    paceDescription: '0 kcal maintenance',
    timeframeDescription: 'Maintain · 0 kcal maintenance',
    macros: calculateMacroSplit(tdee, weight, 'maintenance'),
    weeklyFatChangeKg: 0,
  };

  // Weight Loss Tiers (-250, -500, -750)
  const mildLossKcal = Math.max(1000, Math.round(tdee - 250));
  const standardLossKcal = Math.max(1000, Math.round(tdee - 500));
  const aggressiveLossKcal = Math.max(1000, Math.round(tdee - 750));

  const weightLossTiers: GoalCalorieTier[] = [
    {
      id: 'loss-mild',
      title: 'Mild Loss',
      paceType: 'mild',
      calories: mildLossKcal,
      diff: -250,
      paceDescription: '0.25 kg / week (0.5 lb)',
      timeframeDescription: 'Lose · 250 kcal deficit',
      macros: calculateMacroSplit(mildLossKcal, weight, 'cutting'),
      weeklyFatChangeKg: -0.25,
    },
    {
      id: 'loss-standard',
      title: 'Standard Loss',
      paceType: 'standard',
      calories: standardLossKcal,
      diff: -500,
      paceDescription: '0.50 kg / week (1.1 lb)',
      timeframeDescription: 'Lose · 500 kcal deficit',
      macros: calculateMacroSplit(standardLossKcal, weight, 'cutting'),
      weeklyFatChangeKg: -0.5,
    },
    {
      id: 'loss-aggressive',
      title: 'Aggressive Loss',
      paceType: 'aggressive',
      calories: aggressiveLossKcal,
      diff: -750,
      paceDescription: '0.75 kg / week (1.65 lb)',
      timeframeDescription: 'Lose · 750 kcal deficit',
      macros: calculateMacroSplit(aggressiveLossKcal, weight, 'cutting'),
      weeklyFatChangeKg: -0.75,
    },
  ];

  // Weight Gain Tiers (+250, +500)
  const mildGainKcal = Math.round(tdee + 250);
  const standardGainKcal = Math.round(tdee + 500);

  const weightGainTiers: GoalCalorieTier[] = [
    {
      id: 'gain-mild',
      title: 'Lean Gain',
      paceType: 'mild',
      calories: mildGainKcal,
      diff: 250,
      paceDescription: '+0.25 kg / week (+0.5 lb)',
      timeframeDescription: 'Gain · 250 kcal surplus',
      macros: calculateMacroSplit(mildGainKcal, weight, 'bulking'),
      weeklyFatChangeKg: 0.25,
    },
    {
      id: 'gain-standard',
      title: 'Steady Mass',
      paceType: 'standard',
      calories: standardGainKcal,
      diff: 500,
      paceDescription: '+0.50 kg / week (+1.1 lb)',
      timeframeDescription: 'Gain · 500 kcal surplus',
      macros: calculateMacroSplit(standardGainKcal, weight, 'bulking'),
      weeklyFatChangeKg: 0.5,
    },
  ];

  // Pick Active Goal Tier based on inputs.goal
  let activeGoalTier = maintenanceTier;
  if (inputs.goal === 'lose') {
    activeGoalTier = weightLossTiers[1]; // standard -500
  } else if (inputs.goal === 'gain') {
    activeGoalTier = weightGainTiers[0]; // lean +250
  }

  // Timeline forecast calculation
  let timelineWeeks: number | undefined;
  if (inputs.targetWeightKg && Number(inputs.targetWeightKg) > 0) {
    const weightDiff = Math.abs(weight - Number(inputs.targetWeightKg));
    const weeklyRate = Math.abs(activeGoalTier.weeklyFatChangeKg) || 0.5;
    timelineWeeks = Math.ceil(weightDiff / weeklyRate);
  }

  const allTiers = [maintenanceTier, ...weightLossTiers, ...weightGainTiers];

  return {
    bmr,
    tdee,
    targetCalories: activeGoalTier.calories,
    activeGoalTier,
    bmi,
    bmiCategory,
    idealWeightRange: { min: minIdealWeight, max: maxIdealWeight },
    waterIntakeLiters: waterLiters,
    waterIntakeOz: waterOz,
    formulaUsed: inputs.formula === 'harris' ? 'Revised Harris-Benedict (1984)' : 'Mifflin-St Jeor (1990)',
    weightLossTiers,
    weightGainTiers,
    maintenanceTier: [maintenanceTier],
    allTiers,
    timelineWeeks,
  };
}

export function serializeInputsToQuery(inputs: CalculatorInputs): string {
  const params = new URLSearchParams();
  if (inputs.age) params.set('age', String(inputs.age));
  if (inputs.gender) params.set('sex', inputs.gender);
  if (inputs.heightCm) params.set('height', String(inputs.heightCm));
  if (inputs.weightKg) params.set('weight', String(inputs.weightKg));
  if (inputs.activityLevel) params.set('activity', inputs.activityLevel);
  if (inputs.goal) params.set('goal', inputs.goal);
  if (inputs.targetWeightKg) params.set('target', String(inputs.targetWeightKg));
  return params.toString();
}

export function parseInputsFromQuery(searchStr: string): Partial<CalculatorInputs> {
  const params = new URLSearchParams(searchStr);
  const result: Partial<CalculatorInputs> = {};

  const age = params.get('age');
  if (age && !isNaN(Number(age))) result.age = Number(age);

  const sex = params.get('sex') || params.get('gender');
  if (sex === 'male' || sex === 'female') result.gender = sex;

  const height = params.get('height');
  if (height && !isNaN(Number(height))) result.heightCm = Number(height);

  const weight = params.get('weight');
  if (weight && !isNaN(Number(weight))) result.weightKg = Number(weight);

  const activity = params.get('activity');
  if (activity && ['sedentary', 'light', 'moderate', 'very', 'extra'].includes(activity)) {
    result.activityLevel = activity as ActivityLevel;
  }

  const goal = params.get('goal');
  if (goal && ['lose', 'maintain', 'gain'].includes(goal)) {
    result.goal = goal as PrimaryGoal;
  }

  const target = params.get('target');
  if (target && !isNaN(Number(target))) result.targetWeightKg = Number(target);

  return result;
}
