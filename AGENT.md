# AGENT.md — Directives de Session pour l'Agent IA

Ce fichier doit être lu par l'IA au début de chaque session de travail sur ce projet.

---

## 1. Contexte du Projet
- **Projet** : Tableau de bord de supervision d'alertes pour un petit hébergeur (SAE S5 Développement & IA).
- **Objectif** : Recevoir/sonder les alertes serveurs, permettre à l'astreinte de s'assigner les incidents (*« Qui s'en occupe »*) et marquer leur résolution avec horodatage (*« Quand c'est réglé »*).
- **Branche de travail** : **`dev`** (Ne jamais pousser directement sur `main` sans validation).
- **Organisation des dossiers** :
  - `docs/` : Espace documentaire compartimenté :
    - [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) : Contexte métier et académique.
    - [`docs/fil_conducteur.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/fil_conducteur.md) : Journal chronologique des échanges et trajectoire de réflexion.
    - [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) : Architecture technique, schémas NoSQL, API et IHM.
    - [`docs/adr/`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) : Fiches d'Architecture Decision Records (ADR-0001 à 0005).
  - `app/` : Code source applicatif (backend Express, modèles Mongoose, client Socket.IO, IHM).

---

## 2. Rôles et Responsabilités de l'IA
1. **Règle Fondamentale des ADRs** :
   - **Quand on veut itérer sur une décision, on ne modifie pas l'historique d'une ADR existante : on amende avec une nouvelle ADR** (ex: `Amende ADR-0002`). L'ancienne ADR voit son statut passer à `Amendé par ADR-XXXX`.
2. **Tenue à jour de la documentation** :
   - Tracer les échanges, questions et incompréhensions dans [`docs/fil_conducteur.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/fil_conducteur.md).
   - Ajuster les spécifications vivantes dans [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md).
3. **Gestion Git rigoureuse** :
   - Travailler exclusivement sur la branche `dev`.
   - Effectuer des commits atomiques avec des messages clairs (`feat: ...`, `fix: ...`, `docs: ...`, `refactor: ...`).
   - Pousser (`git push`) sur le dépôt distant.
4. **Stack Technique Unifiée** :
   - **Backend** : Node.js + Express (dans `app/`).
   - **Base de données** : MongoDB (NoSQL) avec ODM Mongoose.
   - **Temps Réel** : Socket.IO pour la diffusion instantanée.
   - **Frontend** : HTML5 / CSS moderne / JS Vanilla.

---

## 3. Check-list de fin de session
- [ ] Le code fonctionne et a été testé localement.
- [ ] Les évolutions sont tracées dans `docs/fil_conducteur.md` et les nouvelles décisions formalisées en nouveaux ADRs si applicable.
- [ ] Les modifications sont commitées sur `dev` et pushées sur GitHub.
