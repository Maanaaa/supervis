# AGENT.md — Directives de Session pour l'Agent IA

Ce fichier doit être lu par l'IA au début de chaque session de travail sur ce projet.

---

## 1. Contexte du Projet
- **Projet** : Tableau de bord de supervision d'alertes pour un petit hébergeur (SAE S5 Développement & IA).
- **Objectif** : Recevoir/sonder les alertes serveurs, permettre à l'astreinte de s'assigner les incidents (*« Qui s'en occupe »*) et marquer leur résolution avec horodatage (*« Quand c'est réglé »*).
- **Branche de travail** : **`dev`** (Ne jamais pousser directement sur `main` sans validation).
- **Organisation des dossiers** :
  - `docs/` : Documentation, base de connaissance et fiches ADR (`docs/adr/`).
  - `app/` : Code source applicatif (backend, modèles Mongo, frontend, simulateur).
- **Stratégie de développement** : Cadrage exhaustif en amont pour permettre une implémentation fluide et directe de la stack complète ("one-shot").

---

## 2. Rôles et Responsabilités de l'IA
1. **Tenue à jour de la documentation** :
   - Mettre à jour [`docs/base_de_connaissance.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/base_de_connaissance.md) et les fiches [`docs/adr/`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) à chaque décision importante, changement de direction, difficulté rencontrée ou incompréhension signalée.
2. **Gestion Git rigoureuse** :
   - Travailler exclusivement sur la branche `dev`.
   - Effectuer des commits atomiques avec des messages clairs (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
   - Pousser (`git push`) sur le dépôt distant.
3. **Stack Technique Unifiée** :
   - **Backend** : Node.js + Express (dans `app/`).
   - **Base de données** : MongoDB (NoSQL) avec ODM Mongoose.
   - **Temps Réel** : Socket.IO pour la diffusion instantanée et la synchronisation multi-astreinte.
   - **Frontend** : HTML5 sémantique, CSS moderne (thème sombre supervision / monitoring), JavaScript Vanilla.
   - **Outils de test** : Simulateur de pannes/alertes intégré pour démonstration autonome.

---

## 3. Check-list de fin de session
- [ ] Le code fonctionne et a été testé localement.
- [ ] Les décisions et évolutions sont consignées dans `docs/base_de_connaissance.md` et `docs/adr/`.
- [ ] Les modifications sont commitées sur `dev` et pushées sur GitHub.
