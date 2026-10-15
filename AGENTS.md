# AGENTS.md — Directives & Point d'Entrée IA

Ce document est le **point d'entrée obligatoire** de chaque session.

---

## ⚡ RÈGLE CARDINALE : ÉCONOMIE DE TOKENS & CONCISION
- **Outputs au minimum absolu :** Pas de politesses superflues, pas de reformulation du prompt, pas de répétition de code déjà dans les diffs.
- **Format télégraphique :** Réponses courtes, listes à puces de 3 points max, liens directs vers les fichiers modifiés.
- **Délégation :** Les procédures détaillées sont déportées dans les **Skills**, et les garde-fous mécaniques sont assurés par les **Hooks**.

---

## 1. Démarrage de Session
Avant toute modification, consulter :
1. [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) : Métier & fil conducteur.
2. [`docs/ADR/README.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/ADR/README.md) : Décisions techniques immuables.
3. [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) : Schémas et endpoints.

---

## 2. Outillage Agentique (.agents/)

### 🛠️ Skills à la demande (`.agents/skills/`)
Consulter le runbook dédié selon l'action :
- **`adr-authoring`** : Création/amendement d'ADR (template strict, MAJ index, zéro test pour doc pure).
- **`ticket-lifecycle`** : Implémentation d'issue (branche `feat/issue-X-...`, tests 100% OK, PR vers `dev`, suivi CI).
- **`commit-crafting`** : Messages courts (≤ 50 car.), puces concrètes, référence ticket (`#X`), output minimal.

### 🪝 Hooks automatiques (`.agents/hooks.json`)
Garde-fous exécutés automatiquement par le runtime :
- **`git-security` (PreToolUse)** : Bloque push direct sur `dev`/`main`, bloque `--force` et `reset --hard`.
- **`auto-format` (PostToolUse)** : Exécute Prettier sur `app/` après chaque écriture.
- **`test-guard` (Stop)** : Bloque l'arrêt si du code applicatif dans `app/` a été modifié et que les tests échouent.

---

## 3. Règles d'Architecture & Sécurité
- **Stack :** Next.js 14 (App Router), MongoDB (Mongoose), Socket.IO (`server.js`).
- **Qualité & Sécurité :** TypeScript strict, aucun `any`, RSC prioritaires. Zéro confiance client : toute assignation ou transfert vérifie impérativement la session signée (`verifySessionToken`). Toute tentative d'usurpation = `403 Forbidden`.
- **Concurrence atomique :** Toujours `findOneAndUpdate({ _id, status: 'OPEN' }, ...)` sans fenêtre temporelle.
- **Branches & PRs atomiques :** Branche de référence `dev`. Toujours développer sur `feat/issue-X-<slug>` et ouvrir une PR vers `dev` (jamais `main`). PRs strictement plafonnées à ≤ 800 lignes (interdiction des PRs fleuves).

---

## 4. Check-list de Clôture
- [ ] Code conforme aux ADRs.
- [ ] Tests validés (si code applicatif touché).
- [ ] Commit conventionnel court (`#X`) et push sur branche de feature.
- [ ] Rapport final ultra-synthétique (≤ 5 lignes).
