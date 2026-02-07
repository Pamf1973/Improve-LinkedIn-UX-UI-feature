const BASE = '/api';

export async function fetchJobs({ query = '', categories = [], skills = [], filters = {} }) {
  const res = await fetch(`${BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, categories, skills, filters }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${BASE}/categories`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function fetchJobTypes() {
  const res = await fetch(`${BASE}/job-types`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
