#!/usr/bin/env node

/**
 * Script autonome de simulation d'incidents et de chaos testing.
 * Usage:
 *   npm run simulate
 *   npm run simulate -- --type cpu
 *   npm run simulate -- --type server_down
 *   npm run simulate -- --type disk
 *   npm run simulate -- --type nginx
 *   npm run simulate -- --type reset
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = `${BASE_URL}/api/simulator/trigger`;

const args = process.argv.slice(2);
let selectedType = 'full';

for (const arg of args) {
  if (arg.startsWith('--type=')) {
    selectedType = arg.split('=')[1];
  } else if (arg.startsWith('--')) {
    selectedType = arg.replace(/^--/, '');
  }
}

async function trigger(type, payload = {}) {
  const startTime = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...payload }),
    });

    const elapsedMs = Date.now() - startTime;
    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error(`❌ Échec [${type}] (${res.status}):`, data.error || data.message);
      return false;
    }

    console.log(`✅ [${type.toUpperCase()}] ${data.message} (latence API: ${elapsedMs}ms)`);
    return true;
  } catch (err) {
    console.error(`❌ Impossible de contacter le serveur sur ${BASE_URL} :`, err.message);
    console.error('👉 Assurez-vous que le serveur tourne via "npm run dev".');
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('========================================================');
  console.log('⚡ SIMULATEUR DE PANNES SUPERVIS — OUTIL DE VALIDATION ⚡');
  console.log(`Cible : ${ENDPOINT}`);
  console.log('========================================================\n');

  if (selectedType !== 'full') {
    await trigger(selectedType);
    return;
  }

  // Scénario de démonstration complet pas-à-pas
  console.log('▶️ Étape 1 : Injection d\'une panne CPU critique (98%)...');
  const step1 = await trigger('cpu');
  if (!step1) process.exit(1);

  console.log('⏱️ Pause de 1.5s pour observer l\'apparition en direct sur le dashboard...');
  await sleep(1500);

  console.log('\n▶️ Étape 2 : Simulation d\'un serveur injoignable (DOWN)...');
  const step2 = await trigger('server_down');
  if (!step2) process.exit(1);

  console.log('\n🎉 Scénario de test terminé avec succès !');
  console.log('👉 Ouvrez votre navigateur sur http://localhost:3000 pour constater la prise en charge.');
  console.log('👉 Pour réinitialiser le dashboard : npm run simulate -- --type reset');
}

run();
