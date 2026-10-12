# AGENT.md — Boussole & Directives de Session pour l'IA

Ce document est le **point d'entrée obligatoire** que l'agent IA doit lire au début de chaque session. Il guide l'IA dans la compréhension des choix, des contraintes et de l'historique du projet.

---

## 1. Protocole de Démarrage de Session (Obligatoire)
Avant toute proposition ou modification de code, l'IA doit consulter :
1. [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) : Pour s'imprégner du métier (petit hébergeur, astreinte, SLA) et du **fil conducteur** de la réflexion.
2. [`docs/adr/`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) : Pour comprendre **pourquoi** un choix technique a été fait, quelles alternatives ont été **explicitement rejetées** et ce qu'il est **interdit de refaire**.
3. [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) : Pour vérifier l'état actuel des schémas NoSQL, des endpoints et des événements Socket.IO.

---

## 2. Règles Fondamentales & Workflow de Travail

### 📋 Gestion de Projet & Kanban GitHub
- **L'IA est responsable du pilotage des tickets :**
  - Elle crée ses propres tickets GitHub (`gh issue create`) avec descriptions détaillées et critères d'acceptation.
  - Elle alimente, documente l'avancement et clôture les tickets au fur et à mesure de l'implémentation (`gh issue close #X`).
- **Rôle de l'humain (Théo) :**
  - Supervise le Kanban GitHub, relit les tickets, audite les commits et pushs pour vérifier l'alignement avec les attendus.

### ⚠️ Règle d'or des ADRs (Immuabilité)
- **Ne JAMAIS réécrire ou modifier une décision dans une ADR déjà acceptée.**
- Si une décision évolue ou change : **créer une nouvelle ADR** qui amende l'ancienne (`ADR-XXXX : Amende ADR-YYYY`). Mettre à jour le statut de l'ancienne vers `Amendé par ADR-XXXX`.

### ⚠️ Gestion Git & Environnement
- **Branche active :** Travailler **exclusivement sur `dev`**. Ne jamais pousser directement sur `main`.
- **Commits & Push :** Effectuer des commits conventionnels clairs et pusher systématiquement sur `origin/dev` à la fin de chaque étape.
- **Séparation des répertoires :** 
  - Tout ce qui concerne la documentation et la réflexion va dans `docs/`.
  - Tout ce qui concerne le code applicatif va dans `app/`.

### ⚠️ Architecture & Code
- **Stack :** Next.js 14+ (App Router en TypeScript dans `app/`), MongoDB (Mongoose), Socket.IO (via serveur custom `server.js`).
- **Composants :** Favoriser les Server Components (RSC) pour le rendu initial et le layout ; réserver `'use client'` aux hooks Socket.IO et aux formulaires interactifs.
- **Organisation :** Structure modulaire stricte dans `app/src/` (`components/`, `hooks/`, `lib/`, `models/`, `types/`).
- **Concurrence atomique :** Utiliser exclusivement des requêtes conditionnelles MongoDB (`findOneAndUpdate({ _id, status: 'OPEN' }, ...)`) pour la prise de ticket à la milliseconde sans popup.

---

## 3. Cartographie Documentaire

| Document | Rôle pour l'IA |
| :--- | :--- |
| [`.agents/rules/`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/rules/code-quality.md) | Règles d'excellence du code (TypeScript strict, concurrence, tests). |
| [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) | Comprendre le problème client, les enjeux d'astreinte et le fil conducteur. |
| [`docs/adr/README.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) | Comprendre les arbitrages techniques fermes et les pièges évités. |
| [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) | Modèles Mongo, routes REST, Socket.io et IHM. |
| `app/` | Répertoire de l'application à implémenter. |

---

## 4. Check-list de Fin de Session
- [ ] Le code fonctionne et respecte les ADRs en vigueur.
- [ ] Les nouveaux arbitrages sont rédigés sous forme de nouveaux ADRs (sans modifier les anciens).
- [ ] Le journal dans `docs/contexte.md` est enrichi si de nouveaux arbitrages ont eu lieu.
- [ ] Tout est commité et pushé sur la branche `dev`.
