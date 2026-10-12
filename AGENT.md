# AGENT.md — Directives de Session pour l'Agent IA

Ce fichier doit être lu par l'IA au début de chaque session de travail sur ce projet.

---

## 1. Contexte du Projet
- **Projet** : Tableau de bord de supervision d'alertes pour un petit hébergeur (SAE S5).
- **Objectif** : Recevoir/sonder les alertes serveurs, permettre à l'astreinte de s'assigner les incidents et marquer leur résolution avec horodatage.
- **Branche de travail** : **`dev`** (Ne jamais pousser directement sur `main` sans validation).

---

## 2. Rôles et Responsabilités de l'IA
1. **Tenue à jour de la Base de Connaissance** :
   - Mettre à jour [base_de_connaissance.md](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/base_de_connaissance.md) à chaque décision importante, changement de direction, difficulté rencontrée ou incompréhension signalée par l'utilisateur.
2. **Gestion Git rigoureuse** :
   - Travailler exclusivement sur la branche `dev`.
   - Effectuer des commits atomiques avec des messages clairs (format conventionnel recommandé : `feat: ...`, `fix: ...`, `docs: ...`).
   - Pousser (`git push`) sur le dépôt distant.
3. **Approche par étapes (Phasing)** :
   - **Phase actuelle (Phase 1)** : Node.js, stockage simple sans BDD (fichiers JSON ou mémoire persistée), rafraîchissement régulier.
   - **Phase future (Phase 2)** : MongoDB (NoSQL) et Socket.io pour le temps réel.

---

## 3. Conventions Techniques
- **Langage / Environnement** : Node.js (JavaScript ES Modules ou CommonJS selon configuration du projet).
- **Frontend** : HTML5 sémantique, CSS Vanilla soigné (thème sombre/monitoring moderne, lisibilité optimale pour l'astreinte), JavaScript Vanilla.
- **Architecture** : Séparation claire entre la logique métier (gestion des serveurs/alertes), l'API/serveur HTTP, et l'interface utilisateur.

---

## 4. Check-list de fin d'itération
- [ ] Le code fonctionne et a été testé.
- [ ] Les décisions prises sont consignées dans `base_de_connaissance.md`.
- [ ] Les modifications sont commitées sur `dev` et pushées sur le remote.
