'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Apple, Dumbbell, ListChecks, Minus, Plus, RefreshCw, Save, Sparkles, Trash2 } from 'lucide-react';
import type { GroceryItem, HealthProfile, MealPlan, Recipe } from './lib/types';
import { defaultProfile, safetyRules } from './lib/defaults';

type Tab = 'generate' | 'import' | 'library' | 'planner' | 'grocery' | 'profile';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function round(n?: number | null) {
  if (n == null || Number.isNaN(n)) return '—';
  return Math.round(n).toLocaleString();
}

export default function Home() {
  const [tab, setTab] = useState<Tab>('generate');
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [profile, setProfile] = useState<HealthProfile>(defaultProfile);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [grocery, setGrocery] = useState<GroceryItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const [mealName, setMealName] = useState('High protein chicken burrito bowl');
  const [recipePrefs, setRecipePrefs] = useState('Lower sodium, meal prep friendly, no grapefruit, 4 servings');
  const [servings, setServings] = useState(4);
  const [importText, setImportText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');
  const [planDays, setPlanDays] = useState(7);
  const [planGoal, setPlanGoal] = useState('lose_weight');
  const [planPrefs, setPlanPrefs] = useState('High protein, simple meals, budget-conscious, kidney-transplant food safety reminders');

  const [userId, setUserId] = useState('default');
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [showNewUser, setShowNewUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserGoal, setNewUserGoal] = useState('lose_weight');

  async function load(uid?: string) {
    const u = uid !== undefined ? uid : userId;
    const [r, p, prof] = await Promise.all([
      api<Recipe[]>(`/api/recipes?user=${u}`),
      api<MealPlan[]>(`/api/meal-plans?user=${u}`),
      api<HealthProfile>(`/api/profile?user=${u}`)
    ]);
    setRecipes(r);
    setPlans(p);
    setProfile(prof);
    setSelectedRecipeIds(r.map(x => x.id));
  }

  useEffect(() => {
    const stored = localStorage.getItem('mealcoach_user') || 'default';
    setUserId(stored);
    load(stored).catch(err => setMessage(err.message));
    api<Array<{ id: string; name: string }>>('/api/users').then(setUsers).catch(() => {});
  }, []);

  const stats = useMemo(() => {
    const calories = recipes.reduce((sum, r) => sum + (r.nutritionPerServing?.calories || 0), 0);
    const protein = recipes.reduce((sum, r) => sum + (r.nutritionPerServing?.proteinG || 0), 0);
    return { recipes: recipes.length, plans: plans.length, avgCalories: recipes.length ? calories / recipes.length : 0, avgProtein: recipes.length ? protein / recipes.length : 0 };
  }, [recipes, plans]);

  async function saveRecipe(recipe: Partial<Recipe>, source: 'generated' | 'imported' | 'manual') {
    const saved = await api<Recipe>(`/api/recipes?user=${userId}`, { method: 'POST', body: JSON.stringify({ ...recipe, source }) });
    setRecipes(prev => [saved, ...prev]);
    setSelectedRecipeIds(prev => [...prev, saved.id]);
    setMessage(`Saved recipe: ${saved.title}`);
  }

  async function generateRecipe() {
    setBusy(true); setMessage('');
    try {
      const recipe = await api<Recipe>(`/api/ai/recipe?user=${userId}`, { method: 'POST', body: JSON.stringify({ mealName, preferences: recipePrefs, servings }) });
      await saveRecipe(recipe, 'generated');
      setTab('library');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function importRecipe() {
    setBusy(true); setMessage('');
    try {
      const recipe = await api<Recipe>(`/api/ai/import?user=${userId}`, { method: 'POST', body: JSON.stringify({ rawText: importText, imageDataUrl }) });
      await saveRecipe(recipe, 'imported');
      setImportText('');
      setImageDataUrl('');
      setTab('library');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function generatePlan() {
    setBusy(true); setMessage('');
    try {
      const planFromAi = await api<any>(`/api/ai/meal-plan?user=${userId}`, { method: 'POST', body: JSON.stringify({ days: planDays, goal: planGoal, preferences: planPrefs }) });
      const matchedIds = recipes.filter(r => planFromAi.recipeTitles?.some((t: string) => t.toLowerCase() === r.title.toLowerCase())).map(r => r.id);
      const plan = await api<MealPlan>(`/api/meal-plans?user=${userId}`, { method: 'POST', body: JSON.stringify({ ...planFromAi, recipeIds: matchedIds }) });
      setPlans(prev => [plan, ...prev]);
      setMessage(`Saved meal plan: ${plan.title}`);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function buildGrocery() {
    setBusy(true); setMessage('');
    try {
      const items = await api<GroceryItem[]>(`/api/grocery?user=${userId}`, { method: 'POST', body: JSON.stringify({ recipeIds: selectedRecipeIds }) });
      setGrocery(items);
      setMessage(`Built grocery list from ${selectedRecipeIds.length} recipe(s).`);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  async function deleteRecipe(id: string) {
    await api(`/api/recipes?id=${encodeURIComponent(id)}&user=${userId}`, { method: 'DELETE' });
    setRecipes(prev => prev.filter(r => r.id !== id));
    setSelectedRecipeIds(prev => prev.filter(x => x !== id));
  }

  async function saveProfile() {
    setBusy(true); setMessage('');
    try {
      const saved = await api<HealthProfile>(`/api/profile?user=${userId}`, { method: 'PUT', body: JSON.stringify(profile) });
      setProfile(saved);
      setMessage('Health profile saved.');
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed'); }
    finally { setBusy(false); }
  }

  const groupedGroceries = useMemo(() => grocery.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    acc[item.category] ||= []; acc[item.category].push(item); return acc;
  }, {}), [grocery]);

  function switchUser(id: string) {
    setUserId(id);
    localStorage.setItem('mealcoach_user', id);
    load(id).catch(err => setMessage(err.message));
  }

  async function addUser() {
    if (!newUserName.trim()) return;
    const id = newUserName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || `user_${Date.now()}`;
    try {
      await api('/api/users', { method: 'POST', body: JSON.stringify({ id, name: newUserName.trim(), primaryGoal: newUserGoal }) });
      const list = await api<Array<{ id: string; name: string }>>('/api/users');
      setUsers(list);
      setShowNewUser(false);
      setNewUserName('');
      switchUser(id);
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Failed to create user'); }
  }

  return <main className="wrap">
    <section className="hero">
      <div>
        <span className="badge"><Sparkles size={16}/> Personal AI nutrition planner</span>
        <h1>MealCoach AI</h1>
        <p>Generate recipes, import messy recipe text, build weekly meal plans, and combine ingredients into one clean grocery list without duplicate nonsense.</p>
      </div>
      <div className="topActions">
        <div className="userSwitcher">
          <span className="muted small">Viewing:</span>
          <select value={userId} onChange={e => switchUser(e.target.value)} style={{width:'auto'}}>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="secondary" onClick={() => setShowNewUser(v => !v)}><Plus size={14}/> Add user</button>
        </div>
        <button className="secondary" onClick={() => load()}><RefreshCw size={16}/> Refresh</button>
      </div>
    </section>

    <section className="cards">
      <div className="card"><h3><Apple size={18}/> Recipes</h3><p className="muted">{stats.recipes} saved</p></div>
      <div className="card"><h3><Dumbbell size={18}/> Avg protein</h3><p className="muted">{round(stats.avgProtein)}g per saved serving</p></div>
      <div className="card"><h3><ListChecks size={18}/> Meal plans</h3><p className="muted">{stats.plans} saved</p></div>
    </section>

    {showNewUser && <div className="card" style={{marginBottom:0}}>
      <h3>Add a new user</h3>
      <div className="row">
        <div><label>Name</label><input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="e.g. Sarah" autoFocus /></div>
        <div><label>Goal</label><select value={newUserGoal} onChange={e => setNewUserGoal(e.target.value)}><option value="lose_weight">Lose weight</option><option value="build_muscle">Build muscle</option><option value="strength_training">Strength training</option><option value="maintain">Maintain</option><option value="heart_healthy">Heart healthy</option><option value="kidney_transplant_safe">Kidney transplant safe</option></select></div>
      </div>
      <div className="btns">
        <button disabled={!newUserName.trim()} onClick={addUser}><Plus size={14}/> Create &amp; switch</button>
        <button className="secondary" onClick={() => { setShowNewUser(false); setNewUserName(''); }}>Cancel</button>
      </div>
    </div>}

    {message && <div className="card warning"><strong>Status:</strong> {message}</div>}

    <nav className="tabs">
      {(['generate','import','library','planner','grocery','profile'] as Tab[]).map(t => <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.replace('-', ' ')}</button>)}
    </nav>

    {tab === 'generate' && <>
      <RecipeBrowser onSelect={name => setMealName(name)} selected={mealName} />
      <section className="grid" style={{marginTop:18}}>
        <div className="panel">
          <h2>Generate a recipe</h2>
          <label>Meal name</label>
          <input value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Type a name or pick one above…" />
          <div className="row">
            <div><label>Servings</label><div className="stepper"><button type="button" className="stepBtn" onClick={() => setServings(v => Math.max(1, v - 1))}><Minus size={14}/></button><span className="stepVal">{servings}</span><button type="button" className="stepBtn" onClick={() => setServings(v => Math.min(20, v + 1))}><Plus size={14}/></button></div></div>
            <div><label>Primary goal</label><select value={profile.primaryGoal} onChange={e => setProfile({ ...profile, primaryGoal: e.target.value as any })}><option value="lose_weight">Lose weight</option><option value="build_muscle">Build muscle</option><option value="strength_training">Strength training</option><option value="maintain">Maintain</option><option value="heart_healthy">Heart healthy</option><option value="kidney_transplant_safe">Kidney transplant safe</option></select></div>
          </div>
          <label>Preferences, restrictions, budget, style</label>
          <textarea value={recipePrefs} onChange={e => setRecipePrefs(e.target.value)} />
          <div className="btns"><button disabled={busy || !mealName} onClick={generateRecipe}><Plus size={16}/> Generate & save</button></div>
        </div>
        <SafetyPanel />
      </section>
    </>}

    {tab === 'import' && <section className="grid">
      <div className="panel">
        <h2>Import recipe from text or screenshot OCR</h2>
        <p className="muted">Paste recipe text, upload a screenshot/photo, or do both. The AI will extract the recipe and clean it.</p>
        <label>Recipe screenshot or photo</label>
        <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setImageDataUrl(String(reader.result)); reader.readAsDataURL(file); }} />
        {imageDataUrl && <p className="muted small">Image attached for import.</p>}
        <label>Recipe text</label>
        <textarea value={importText} onChange={e => setImportText(e.target.value)} placeholder="Paste copied recipe, OCR text, or notes..." />
        <div className="btns"><button disabled={busy || (!importText.trim() && !imageDataUrl)} onClick={importRecipe}><Save size={16}/> Import & save</button></div>
      </div>
      <SafetyPanel />
    </section>}

    {tab === 'library' && <section className="panel">
      <h2>Recipe library</h2>
      {!recipes.length ? <div className="empty">No recipes yet. Generate or import one first.</div> : <div className="list">{recipes.map(r => <RecipeCard key={r.id} recipe={r} selected={selectedRecipeIds.includes(r.id)} onToggle={() => setSelectedRecipeIds(prev => prev.includes(r.id) ? prev.filter(x => x !== r.id) : [...prev, r.id])} onDelete={() => deleteRecipe(r.id)} />)}</div>}
    </section>}

    {tab === 'planner' && <section className="grid">
      <div className="panel">
        <h2>Create meal plan</h2>
        <div className="row">
          <div><label>Days</label><input type="number" min={1} max={31} value={planDays} onChange={e => setPlanDays(Number(e.target.value))} /></div>
          <div><label>Goal</label><select value={planGoal} onChange={e => setPlanGoal(e.target.value)}><option value="lose_weight">Lose weight</option><option value="build_muscle">Build muscle</option><option value="strength_training">Strength training</option><option value="maintain">Maintain</option><option value="heart_healthy">Heart healthy</option><option value="kidney_transplant_safe">Kidney transplant safe</option></select></div>
        </div>
        <label>Preferences</label><textarea value={planPrefs} onChange={e => setPlanPrefs(e.target.value)} />
        <div className="btns"><button disabled={busy} onClick={generatePlan}><Sparkles size={16}/> Generate & save plan</button></div>
      </div>
      <div className="panel">
        <h2>Saved plans</h2>
        {!plans.length ? <div className="empty">No plans yet.</div> : plans.map(plan => <div className="recipe" key={plan.id}><h3>{plan.title}</h3><p className="muted">{plan.days.length} days • {plan.goal}</p>{plan.days.slice(0, 4).map(day => <div className="planDay" key={day.dateLabel}><strong>{day.dateLabel}</strong><br/><span className="muted">B: {day.breakfast || '—'} | L: {day.lunch || '—'} | D: {day.dinner || '—'}</span></div>)}<div className="chips">{plan.coachNotes?.slice(0,3).map(note => <span className="chip" key={note}>{note}</span>)}</div></div>)}
      </div>
    </section>}

    {tab === 'grocery' && <section className="panel">
      <h2>Smart grocery list</h2>
      <p className="muted">Select recipes in the library, then build a deduped grocery list. Ingredients are normalized where possible.</p>
      <div className="btns"><button disabled={busy || !recipes.length} onClick={buildGrocery}>Build grocery list</button><button className="secondary" onClick={() => setSelectedRecipeIds(recipes.map(r => r.id))}>Select all</button><button className="secondary" onClick={() => setSelectedRecipeIds([])}>Clear</button></div>
      {!grocery.length ? <div className="empty">No grocery list built yet.</div> : Object.entries(groupedGroceries).map(([category, items]) => <div className="groceryGroup" key={category}><h3>{category}</h3>{items.map(item => <div className="item" key={`${item.normalizedName}-${item.unit}`}><div><strong>{item.displayName}</strong><div className="small muted">Used in: {item.recipeTitles.join(', ')}</div></div><div>{Number(item.amount.toFixed(2))} {item.unit}</div></div>)}</div>)}
    </section>}

    {tab === 'profile' && <section className="grid">
      <div className="panel">
        <h2>Health profile</h2>
        <div className="row"><div><label>Name</label><input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></div><div><label>Primary goal</label><select value={profile.primaryGoal} onChange={e => setProfile({ ...profile, primaryGoal: e.target.value as any })}><option value="lose_weight">Lose weight</option><option value="build_muscle">Build muscle</option><option value="strength_training">Strength training</option><option value="maintain">Maintain</option><option value="heart_healthy">Heart healthy</option><option value="kidney_transplant_safe">Kidney transplant safe</option></select></div></div>
        <div className="row"><div><label>Age</label><input type="number" min={1} value={profile.age || ''} onChange={e => setProfile({ ...profile, age: Number(e.target.value) || undefined })} /></div><div><label>Meals per day</label><input type="number" min={1} max={10} value={profile.mealsPerDay} onChange={e => setProfile({ ...profile, mealsPerDay: Number(e.target.value) || 3 })} /></div></div>
        <div className="row"><div><label>Height (inches)</label><input type="number" min={1} value={profile.heightInches || ''} onChange={e => setProfile({ ...profile, heightInches: Number(e.target.value) || undefined })} /></div><div><label>Weight (lbs)</label><input type="number" min={1} value={profile.weightLbs || ''} onChange={e => setProfile({ ...profile, weightLbs: Number(e.target.value) || undefined })} /></div></div>
        <div className="row"><div><label>Target calories</label><input type="number" value={profile.targetCalories || ''} onChange={e => setProfile({ ...profile, targetCalories: Number(e.target.value) || undefined })} /></div><div><label>Protein grams/day</label><input type="number" value={profile.proteinGrams || ''} onChange={e => setProfile({ ...profile, proteinGrams: Number(e.target.value) || undefined })} /></div></div>
        <div className="row"><div><label>Sodium limit mg/day</label><input type="number" value={profile.sodiumMgLimit || ''} onChange={e => setProfile({ ...profile, sodiumMgLimit: Number(e.target.value) || undefined })} /></div><div><label>Activity level</label><select value={profile.activityLevel} onChange={e => setProfile({ ...profile, activityLevel: e.target.value as any })}><option value="sedentary">Sedentary</option><option value="light">Light</option><option value="moderate">Moderate</option><option value="active">Active</option><option value="very_active">Very active</option></select></div></div>
        <label>Medications, comma separated</label><input value={profile.medications.join(', ')} onChange={e => setProfile({ ...profile, medications: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} />
        <label>Avoid foods, comma separated</label><input value={profile.avoidFoods.join(', ')} onChange={e => setProfile({ ...profile, avoidFoods: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} />
        <div className="row" style={{alignItems:'center',gap:12,marginTop:8}}><label style={{marginBottom:0,display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}><input type="checkbox" checked={profile.kidneyTransplant} onChange={e => setProfile({ ...profile, kidneyTransplant: e.target.checked })} /> Kidney transplant patient</label></div>
        <label>Notes</label><textarea value={profile.notes || ''} onChange={e => setProfile({ ...profile, notes: e.target.value })} />
        <div className="btns"><button disabled={busy} onClick={saveProfile}>Save profile</button></div>
      </div>
      <SafetyPanel />
    </section>}

    <div className="footer">MealCoach AI estimates nutrition and portions. Use your transplant team or dietitian for medical targets.</div>
  </main>;
}

type MealDBMeal = { idMeal: string; strMeal: string; strCategory: string; strArea: string; strMealThumb: string };

const MEAL_CATEGORIES = ['All','Beef','Chicken','Seafood','Lamb','Pork','Pasta','Vegetarian','Vegan','Breakfast','Dessert','Side','Starter','Miscellaneous','Goat'];

function RecipeBrowser({ onSelect, selected }: { onSelect: (name: string) => void; selected: string }) {
  const [inputVal, setInputVal] = useState('');
  const [category, setCategory] = useState('All');
  const [results, setResults] = useState<MealDBMeal[]>([]);
  const [loading, setLoading] = useState(true);

  async function doSearch(q: string, cat: string) {
    setLoading(true);
    try {
      let meals: MealDBMeal[] = [];
      if (q.trim()) {
        // name search returns full meal objects
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(q)}`);
        const data = await res.json();
        meals = data.meals || [];
        if (cat !== 'All') meals = meals.filter(m => m.strCategory === cat);
      } else if (cat !== 'All') {
        // category filter returns stubs — fetch full details for thumbnails (already included)
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${encodeURIComponent(cat)}`);
        const data = await res.json();
        // stubs have idMeal, strMeal, strMealThumb but no strCategory/strArea — fill them in
        meals = (data.meals || []).map((m: any) => ({ ...m, strCategory: cat, strArea: '' }));
      } else {
        // default: show all chicken results
        const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=chicken`);
        const data = await res.json();
        meals = data.meals || [];
      }
      setResults(meals);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { doSearch('', 'All'); }, []);

  function handleCategoryChange(cat: string) {
    setCategory(cat);
    setInputVal('');
    doSearch('', cat);
  }

  function handleSearch() {
    doSearch(inputVal, category);
  }

  return <div className="panel">
    <h2>Browse & pick a recipe</h2>
    <p className="muted">Filter by category or search by name. Click any card — the AI creates a version tailored to your health profile.</p>
    <div className="browserControls">
      <div className="pillInput">
        <input
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Search by name…"
        />
        <button onClick={handleSearch} disabled={loading}>Search</button>
      </div>
      <div className="catChips">
        {MEAL_CATEGORIES.map(cat => <button key={cat} type="button" className={`catChip${category === cat ? ' catChipActive' : ''}`} onClick={() => handleCategoryChange(cat)}>{cat}</button>)}
      </div>
    </div>
    {loading && <p className="muted">Loading…</p>}
    {!loading && results.length === 0 && <div className="empty">No results. Try a different search or category.</div>}
    {!loading && results.length > 0 && <div className="thumbGrid">
      {results.map(meal => <button key={meal.idMeal} type="button" className={`thumbCard${selected === meal.strMeal ? ' thumbCardActive' : ''}`} onClick={() => onSelect(meal.strMeal)}>
        <img className="thumbImg" src={`${meal.strMealThumb}/preview`} alt={meal.strMeal} loading="lazy" />
        <div className="thumbInfo"><strong>{meal.strMeal}</strong><span className="muted small">{[meal.strArea, meal.strCategory].filter(Boolean).join(' · ')}</span></div>
      </button>)}
    </div>}
  </div>;
}

function SafetyPanel() {
  return <div className="panel">
    <h2><AlertTriangle size={18}/> Health guardrails</h2>
    <div className="list">{safetyRules.map(rule => <div className="recipe warning" key={rule}>{rule}</div>)}</div>
  </div>;
}

function RecipeCard({ recipe, selected, onToggle, onDelete }: { recipe: Recipe; selected: boolean; onToggle: () => void; onDelete: () => void }) {
  return <div className="recipe">
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <div><h3>{recipe.title}</h3><p className="muted">{recipe.description}</p></div>
      <div className="btns" style={{ marginTop: 0 }}><button className="secondary" onClick={onToggle}>{selected ? 'Selected' : 'Select'}</button><button className="danger" onClick={onDelete}><Trash2 size={15}/></button></div>
    </div>
    <div className="chips">{recipe.tags?.map(tag => <span className="chip" key={tag}>{tag}</span>)}</div>
    <p className="muted">Servings: {recipe.servings} • Calories: {round(recipe.nutritionPerServing?.calories)} • Protein: {round(recipe.nutritionPerServing?.proteinG)}g • Sodium: {round(recipe.nutritionPerServing?.sodiumMg)}mg</p>
    {recipe.safetyFlags?.length > 0 && <div className="chips">{recipe.safetyFlags.map(flag => <span className="chip warning" key={flag}>{flag}</span>)}</div>}
    <details><summary>Ingredients and instructions</summary><ul>{recipe.ingredients.map(i => <li key={i.id || i.name}>{i.amount} {i.unit} {i.name}{i.notes ? ` — ${i.notes}` : ''}</li>)}</ul><ol>{recipe.instructions.map(step => <li key={step}>{step}</li>)}</ol></details>
  </div>;
}
