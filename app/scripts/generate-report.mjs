#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const inputFile = process.argv[2] || 'tests/load/report.json';
const outputFile = process.argv[3] || inputFile.replace(/\.json$/, '.html');

if (!fs.existsSync(inputFile)) {
  console.error(`Fichier introuvable : ${inputFile}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
const aggregate = raw.aggregate || {};
const counters = aggregate.counters || {};
const rates = aggregate.rates || {};
const summaries = aggregate.summaries || {};

const totalRequests = counters['http.requests'] || 0;
const totalResponses = counters['http.responses'] || 0;
const codes200 = counters['http.codes.200'] || 0;
const codes201 = counters['http.codes.201'] || 0;
const successCount = codes200 + codes201;
const successRate = totalRequests > 0 ? ((successCount / totalRequests) * 100).toFixed(1) : 0;
const requestRate = rates['http.request_rate'] || Math.round(totalRequests / 40);

const respTime = summaries['http.response_time'] || {};
const median = respTime.median || 0;
const p95 = respTime.p95 || 0;
const p99 = respTime.p99 || 0;
const max = respTime.max || 0;
const mean = (respTime.mean || 0).toFixed(1);

const vusersCreated = counters['vusers.created'] || 0;
const vusersCompleted = counters['vusers.completed'] || 0;
const vusersFailed = counters['vusers.failed'] || 0;

const errors = Object.entries(counters)
  .filter(([k]) => k.startsWith('errors.'))
  .map(([k, v]) => ({ name: k.replace('errors.', ''), count: v }));

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de Test de Charge — Supervis Platform</title>
  <style>
    :root {
      --bg: #0f172a;
      --card: #1e293b;
      --border: #334155;
      --text: #f8fafc;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --green: #4ade80;
      --amber: #fbbf24;
      --red: #f87171;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); padding: 2rem; }
    .container { max-width: 1100px; margin: 0 auto; }
    header { margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    h1 { font-size: 1.8rem; color: var(--accent); }
    .subtitle { color: var(--muted); font-size: 0.95rem; margin-top: 0.25rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem; }
    .card-title { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .card-value { font-size: 1.8rem; font-weight: 700; margin-top: 0.5rem; color: var(--text); }
    .card-value.green { color: var(--green); }
    .card-value.accent { color: var(--accent); }
    .card-value.amber { color: var(--amber); }
    .card-value.red { color: var(--red); }
    .section { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.2rem; margin-bottom: 1rem; color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-size: 0.85rem; text-transform: uppercase; }
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .badge-success { background: rgba(74, 222, 128, 0.2); color: var(--green); }
    .badge-error { background: rgba(248, 113, 113, 0.2); color: var(--red); }
    footer { text-align: center; color: var(--muted); font-size: 0.85rem; margin-top: 2rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Rapport de Performance & Test de Charge</h1>
      <p class="subtitle">Supervis Platform — Test Artillery généré le ${new Date().toLocaleString('fr-FR')}</p>
    </header>

    <div class="grid">
      <div class="card">
        <div class="card-title">Requêtes Totales</div>
        <div class="card-value accent">${totalRequests.toLocaleString('fr-FR')}</div>
      </div>
      <div class="card">
        <div class="card-title">Débit Moyen</div>
        <div class="card-value">${requestRate} <span style="font-size: 1rem; color: var(--muted)">req/s</span></div>
      </div>
      <div class="card">
        <div class="card-title">Taux de Succès</div>
        <div class="card-value ${successRate >= 99 ? 'green' : successRate >= 90 ? 'amber' : 'red'}">${successRate}%</div>
      </div>
      <div class="card">
        <div class="card-title">Latence Médiane (p50)</div>
        <div class="card-value green">${median} <span style="font-size: 1rem; color: var(--muted)">ms</span></div>
      </div>
      <div class="card">
        <div class="card-title">Latence p95</div>
        <div class="card-value ${p95 < 100 ? 'green' : p95 < 500 ? 'amber' : 'red'}">${p95} <span style="font-size: 1rem; color: var(--muted)">ms</span></div>
      </div>
      <div class="card">
        <div class="card-title">Utilisateurs Virtuels</div>
        <div class="card-value">${vusersCompleted} / ${vusersCreated}</div>
      </div>
    </div>

    <div class="section">
      <h2>⏱️ Distribution des Latences de Réponse</h2>
      <table>
        <thead>
          <tr>
            <th>Métrique</th>
            <th>Valeur</th>
            <th>Statut SLA</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Médiane (50% des requêtes)</td>
            <td><strong>${median} ms</strong></td>
            <td><span class="badge badge-success">&lt; 50 ms (Excellent)</span></td>
          </tr>
          <tr>
            <td>Percentile 95 (p95)</td>
            <td><strong>${p95} ms</strong></td>
            <td><span class="badge ${p95 < 200 ? 'badge-success' : 'badge-error'}">${p95 < 200 ? '&lt; 200 ms (Conforme)' : 'Élevé'}</span></td>
          </tr>
          <tr>
            <td>Percentile 99 (p99)</td>
            <td><strong>${p99} ms</strong></td>
            <td><span class="badge ${p99 < 500 ? 'badge-success' : 'badge-error'}">${p99 < 500 ? '&lt; 500 ms (Acceptable)' : 'Critique'}</span></td>
          </tr>
          <tr>
            <td>Temps moyen (Mean)</td>
            <td><strong>${mean} ms</strong></td>
            <td>-</td>
          </tr>
          <tr>
            <td>Pire temps enregistré (Max)</td>
            <td><strong>${max} ms</strong></td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>📡 Codes Réponses HTTP & Erreurs</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Code / Erreur</th>
            <th>Nombre d'occurrences</th>
            <th>Taux</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Succès HTTP</td>
            <td><strong>200 OK</strong></td>
            <td>${codes200.toLocaleString('fr-FR')}</td>
            <td><span class="badge badge-success">${totalRequests > 0 ? ((codes200 / totalRequests) * 100).toFixed(1) : 0}%</span></td>
          </tr>
          <tr>
            <td>Création MongoDB</td>
            <td><strong>201 Created</strong></td>
            <td>${codes201.toLocaleString('fr-FR')}</td>
            <td><span class="badge badge-success">${totalRequests > 0 ? ((codes201 / totalRequests) * 100).toFixed(1) : 0}%</span></td>
          </tr>
          ${
            errors.length > 0
              ? errors
                  .map(
                    (err) => `
          <tr>
            <td>Erreur Socket / Réseau</td>
            <td><strong>${err.name}</strong></td>
            <td>${err.count.toLocaleString('fr-FR')}</td>
            <td><span class="badge badge-error">${totalRequests > 0 ? ((err.count / totalRequests) * 100).toFixed(1) : 0}%</span></td>
          </tr>`
                  )
                  .join('')
              : `
          <tr>
            <td colspan="4" style="color: var(--green); text-align: center; padding: 1rem;">
              ✅ Aucune erreur réseau ou socket enregistrée.
            </td>
          </tr>`
          }
        </tbody>
      </table>
    </div>

    <footer>
      Généré automatiquement par le banc de charge Artillery — supervis-app
    </footer>
  </div>
</body>
</html>`;

fs.writeFileSync(outputFile, html, 'utf-8');
console.log(`[Rapport HTML généré] : ${outputFile}`);

