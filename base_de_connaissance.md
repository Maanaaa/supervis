# Base de Connaissance — Projet Supervision d'Alertes (Astreinte)

> **Problématique d'origine :**  
> *"Un petit hébergeur veut un tableau de bord qui reçoit les alertes de ses serveurs et les montre à l'astreinte. Qui s'en occupe, quand c'est réglé."*

---

## 1. Cadrage du Projet

### 1.1 Objectifs principaux
1. **Centraliser les alertes d'infrastructure** : Visualiser l'état de santé des serveurs et les alertes générées.
2. **Gérer l'astreinte (workflow opérationnel)** :
   - Savoir instantanément quelles alertes sont actives.
   - Permettre à un technicien d'astreinte de s'assigner une alerte (*« Qui s'en occupe »*).
   - Enregistrer la résolution de l'incident avec horodatage (*« Quand c'est réglé »*).
3. **Évolution technique par étapes** :
   - **Étape 1 (Socle minimaliste)** : Node.js (Vanilla / Express léger), stockage temporaire sans SGBD (fichiers JSON ou mémoire persistée).
   - **Étape 2 (Temps réel & Persistance)** : Intégration de MongoDB (NoSQL) et de Socket.IO pour une mise à jour instantanée sans polling client.

---

## 2. Réponses aux questions structurantes

### « Si je reprends le projet dans 6 mois ? C'est ok ? »
**Oui, si les conditions suivantes sont respectées :**
- **Documentation vivante et autonome** : Ce fichier et `AGENT.md` décrivent le *pourquoi* et le *comment*.
- **Commandes reproductibles** : `package.json` contenant des scripts standards (`npm run dev`, `npm start`, `npm test`).
- **Absence de dépendances magiques non documentées** : variables d'environnement centralisées dans un `.env.example`.
- **Historique des choix (ADR - Architecture Decision Records)** : consigner les raisons des choix techniques pour ne pas avoir à réinventer la roue.

### « Qu'est-ce qui est daté ? »
- **Ce qui est figé dans le temps (daté)** :
  - Le journal des décisions (qui a décidé quoi, quel jour).
  - Les versions de Node.js, des packages npm au moment du développement.
  - Le relevé des incidents / alertes (horodatage strict).
- **Ce qui doit rester continuellement à jour** :
  - La documentation de l'API / des modèles de données.
  - Les instructions dans `AGENT.md`.
  - La procédure d'installation et de déploiement.

### « Qu'est-ce que l'IA doit lire à chaque session ? »
- Le fichier `AGENT.md` placé à la racine, qui résume :
  - Le rôle de l'IA (assistant pair-programming, respect des consignes).
  - La stack technique du moment.
  - Les conventions de code et règles Git (branche `dev`, conventions de commit).
  - L'état d'avancement exact et les prochaines tâches.

---

## 3. Analyse de l'approche fonctionnelle & technique

### 3.1 Push vs Pull (Distinction clé)
- **Modèle Pull (Polling / Sonde)** : Le tableau de bord interroge les serveurs à intervalles réguliers (ex: healthcheck HTTP ou ping).
  - *Avantage* : Permet de détecter un serveur complètement éteint ou inaccessible.
- **Modèle Push (Réception d'alertes)** : Les serveurs envoient une alerte au tableau de bord lorsqu'un seuil est dépassé (ex: webhook HTTP POST `/api/alerts` avec CPU > 90%, disque plein, service en panne).
  - *Avantage* : Correspond au libellé exact de la problématique (*« reçoit les alertes de ses serveurs »*).
- **Décision retenue** : Le système combinera un récepteur d'alertes (API Push) et une sonde périodique de disponibilité (Pull) pour les serveurs configurés.

### 3.2 Cycle de vie d'une alerte (Astreinte)
Une alerte passe par trois états :
```
[ NOUVELLE / OPEN ] ──> [ EN COURS / ASSIGNED (nom de l'opérateur) ] ──> [ RÉSOLUE / RESOLVED (date & heure) ]
```

---

## 4. Choix de la Stack Technique

| Composant | Phase 1 (Démarrage) | Phase 2 (Évolution) |
| :--- | :--- | :--- |
| **Backend** | Node.js (Express / HTTP natif) | Node.js + Express |
| **Stockage** | Fichiers JSON locaux (sans BDD) | MongoDB (NoSQL) |
| **Communication Client** | Auto-refresh / Fetch périodique | Socket.io (WebSocket bidirectionnel) |
| **Frontend** | HTML5 / Vanilla CSS / Vanilla JS | Interface réactive soignée avec indicateurs d'état |
| **Gestion de versions** | Git (branche active : `dev`) | Git (workflow PR / main) |

---

## 5. Journal des décisions et historique des échanges

| Date | Décision / Sujet | Justification / Notes |
| :--- | :--- | :--- |
| 2026-10-12 | Création de la branche `dev` | Isoler le développement actif de la branche `main`. |
| 2026-10-12 | Initialisation de la base de connaissance | Formaliser les attentes, documenter le cycle de vie de l'astreinte et définir la stack. |
| 2026-10-12 | Choix de la phase 1 sans BDD | Valider le modèle métier et l'IHM avec persistance simple en fichiers JSON avant d'ajouter MongoDB. |
