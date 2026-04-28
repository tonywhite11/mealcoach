import { HealthProfile } from './types';

export const defaultProfile: HealthProfile = {
  name: 'Tony',
  activityLevel: 'light',
  primaryGoal: 'lose_weight',
  mealsPerDay: 3,
  avoidFoods: ['grapefruit', 'grapefruit juice', 'pomelo', 'Seville orange'],
  medications: ['tacrolimus', 'mycophenolate mofetil', 'pravastatin'],
  kidneyTransplant: true,
  sodiumMgLimit: 2000,
  notes: 'Personal meal planning app. Use clinician-approved targets when available.'
};

export const safetyRules = [
  'Avoid grapefruit and grapefruit juice with tacrolimus unless your transplant team explicitly says otherwise.',
  'Use careful food safety because immunosuppression raises risk from undercooked or contaminated food.',
  'Avoid raw/undercooked eggs, meat, poultry, seafood, and unpasteurized dairy unless cleared by your clinician.',
  'This app estimates nutrition and portions. It is not a substitute for your transplant team or a registered dietitian.'
];

export const groceryCategories = [
  'Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Pantry', 'Frozen', 'Spices', 'Condiments', 'Bakery', 'Other'
];
