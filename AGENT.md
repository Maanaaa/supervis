# AGENT.md — Directives de Session pour l'Agent IA

Ce fichier doit être lu par l'IA au début de chaque session de travail sur ce projet.

---

## 1. Contexte du Projet
- **Projet** : Tableau de bord de supervision d'alertes pour un petit hébergeur (SAE S5 Développement & IA).
- **Objectif** : Recevoir/sonder les alertes serveurs, permettre à l'astreinte de s'assigner les incidents (*« Qui s'en occupe »*) et marquer leur résolution avec horodatage (*« Quand c'est réglé »*).
- **Branche de travail** : **`dev`** (Ne jamais pousser directement sur `main` sans validation).
- **Stratégie de développement** : Conception et cadrage exhaustifs en amont pour permettre une implémentation fluide et directe de la stack complète.

---

## 2. Rôles et Responsabilités de l'IA
1. **Tenue à jour de la Base de Connaissance** :
   - Mettre à jour [base_de_connaissance.md](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/base_de_connaissance.md) à chaque décision importante, changement de direction, difficulté rencontrée ou incompréhension signalée par l'utilisateur.
2. **Gestion Git rigoureuse** :
   - Travailler exclusivement sur la branche `dev`.
   - Effectuer des commits atomiques avec des messages clairs (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
   - Pousser (`git push`) sur le dépôt distant.
3. **Stack Technique Unifiée** :
   - **Backend** : Node.js + Express.
   - **Base de données** : MongoDB (NoSQL) avec ODM Mongoose (ou driver natif).
   - **Temps Réel** : Socket.IO pour la diffusion instantanée et la synchronisation multi-astreinte.
   - **Frontend** : HTML5 sémantique, CSS moderne (thème sombre supervision / glassmorphism / design soigné), JavaScript Vanilla pour l'interaction client Socket.IO.
   - **Outils de test** : Simulateur de pannes/alertes intégré pour démonstration autonome.

---

## 3. Check-list de fin de session
- [ ] Le code fonctionne et a été testé localement.
- [ ] Les décisions et évolutions sont consignées dans `base_de_connaissance.md`.
- [ ] Les modifications sont commitées sur `dev` et pushées sur GitHub.
