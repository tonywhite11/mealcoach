# MealCoach AI

A personal AI meal planning app that generates recipes, imports messy recipe text, saves recipes, creates goal-based meal plans, and builds deduped grocery lists.

This version is built for local personal use. It stores data in `data/mealcoach.json` so you do not need a database to get started.

## Features

- AI recipe generator
- Recipe importer from pasted text or OCR output
- Recipe library
- Goal-based meal planner
- Smart grocery list aggregation
- Health profile with kidney-transplant/tacrolimus guardrail defaults
- Local JSON storage
- Clean responsive UI

## Tech stack

- Next.js
- React
- TypeScript
- AI SDK + OpenAI provider
- Local file-backed storage
- CSS, no heavy UI framework required

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4o-mini
USDA_FDC_API_KEY=your-usda-key-here
```

`USDA_FDC_API_KEY` is included for future richer nutrition lookup. The current version uses AI-estimated nutrition.

## Important health note

MealCoach AI estimates calories, macros, sodium, and portion guidance. It is not a medical device and is not a replacement for your transplant team, doctor, or registered dietitian.

The default profile includes guardrails for kidney transplant food safety and tacrolimus grapefruit avoidance. Keep those rules unless your clinician tells you otherwise.

## Current limitations

- Screenshot/image import is currently handled by OCR text paste. Direct image upload is the next upgrade.
- URL import is not active yet. Paste copied recipe text for now.
- Nutrition values are AI estimates. USDA FoodData Central integration is scaffolded by env variable but not fully implemented.
- Local JSON storage is good for a personal app. For a hosted app, switch to Supabase/Postgres.

## Next upgrades

1. Direct image upload and OCR extraction
2. URL recipe scraping
3. USDA FoodData Central nutrition matching
4. Pantry inventory
5. Barcode scanning
6. Store price comparison
7. Meal photo logging
8. PDF/print grocery list export
9. User authentication if hosted for other people
