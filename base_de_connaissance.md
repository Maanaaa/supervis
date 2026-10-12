# Base de Connaissance — Projet Supervision d'Alertes (Astreinte)

> **Problématique d'origine :**  
> *"Un petit hébergeur veut un tableau de bord qui reçoit les alertes de ses serveurs et les montre à l'astreinte. Qui s'en occupe, quand c'est réglé."*

---

## 1. Cadrage du Projet & Objectifs

### 1.1 Contexte Métier
Un petit hébergeur gère un parc de serveurs (machines physiques, VPS, conteneurs). Pour garantir ses SLA (*Service Level Agreements*) et réagir promptement en dehors des heures ouvrées, une équipe d'astreinte a besoin d'une interface unique pour :
1. **Être avertie en temps réel** dès qu'un incident critique survient (panne serveur, charge anormale, espace disque saturé).
2. **Coordonner la prise en charge (*« Qui s'en occupe »*)** : assigner immédiatement l'incident à un membre de l'astreinte pour éviter les interventions redondantes ou les pannes oubliées.
3. **Tracer la résolution (*« Quand c'est réglé »*)** : acter la fin de l'incident avec horodatage pour calculer les temps de rétablissement (MTTR - *Mean Time To Recovery*).

### 1.2 Stratégie de Réalisation
- **Phase de cadrage amont** : Définir avec précision la base de connaissances, les schémas NoSQL, les flux Socket.IO et les API pour permettre une implémentation directe et fluide ("one-shot").
- **Stack unifiée complète** :
  - **Backend** : Node.js + Express.
  - **Temps réel** : Socket.IO (WebSockets).
  - **Persistance** : MongoDB (NoSQL) avec schémas Mongoose.
  - **Frontend** : Dashboard Web Vanilla (HTML5 / CSS moderne supervision / JS) connecté en direct à Socket.IO.
  - **Composant utilitaire** : Simulateur d'alertes et de sondes pour tester le système de bout en bout sans infrastructure externe complexe.

---

## 2. Réponses aux Questions de Pérennité

### « Si je reprends le projet dans 6 mois ? C'est ok ? »
**Oui**, car le projet repose sur un socle auto-documenté :
- **Clé en main** : Un fichier `docker-compose.yml` (optionnel ou recommandé pour MongoDB local) ou une variable d'environnement `MONGODB_URI` claire dans un `.env.example`.
- **Scripts clairs** : `npm install` suivi de `npm run dev` lance le serveur et le dashboard sans configuration obscure.
- **Base de connaissances vivante** : Ce document explicite tous les choix et conventions de nommage.

### « Qu'est-ce qui est daté ? »
- **Daté (Historique immuable)** :
  - Le journal des décisions et arbitrage (Section 7).
  - Les incidents et alertes horodatés (`createdAt`, `acknowledgedAt`, `resolvedAt`).
  - Les versions initiales des dépendances (`Node LTS`, `socket.io v4`, `mongoose v8`).
- **Vivant (À maintenir à jour)** :
  - La documentation des endpoints et des événements WebSocket.
  - Le fichier de cadrage agent [AGENT.md](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENT.md).

### « Qu'est-ce que l'IA doit lire à chaque session ? »
- Le fichier [AGENT.md](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENT.md) à la racine : résumé du projet, conventions Git sur la branche `dev`, rôles et conventions techniques.

---

## 3. Architecture Fonctionnelle & Flux de Données

```
 ┌────────────────┐          POST /api/alerts (Push)
 │ Serveurs /     ├─────────────────────────────────────────┐
 │ Scripts d'agent│                                         │
 └────────────────┘                                         ▼
                                                   ┌─────────────────┐
 ┌────────────────┐         Healthcheck (Pull)     │ Serveur Node.js │ <──> [ MongoDB ]
 │ Serveurs       │ < - - - - - - - - - - - - - -  │   + Express     │      (Collections:
 │ Surveillés     │                                │   + Socket.io   │       servers, alerts)
 └────────────────┘                                └────────┬────────┘
                                                            │
                                         Socket.io (Events) │ (alert:new, alert:ack, alert:resolve)
                                                            ▼
                                                   ┌─────────────────┐
                                                   │ Dashboard Web   │
                                                   │ Astreinte       │
                                                   └─────────────────┘
```

### 3.1 Deux modes d'ingestion d'alertes
1. **Mode Push (Webhook d'alerte)** :
   - Un serveur distant ou un agent de monitoring envoie un `POST /api/alerts`.
   - Ex: `{ "serverName": "web-prod-01", "severity": "CRITICAL", "message": "Disque plein à 99%" }`.
2. **Mode Pull (Sonde de disponibilité périodique)** :
   - Un cron / intervalle Node.js vérifie les serveurs configurés en parallèle (`Promise.allSettled`).
   - Si un serveur ne répond pas après $N$ tentatives, une alerte est automatiquement créée.

### 3.2 Cycle de vie d'une alerte
1. **`OPEN` (Nouvelle)** : Rouge vif / signal d'urgence. Non prise en charge.
2. **`ACK` (En cours)** : Orange. Attribuée à un membre de l'astreinte (`assignedTo: "Théo"`).
3. **`RESOLVED` (Résolue)** : Verte / Archivée. Clôturée avec horodatage (`resolvedAt`).

---

## 4. Modèle de Données NoSQL (MongoDB)

### Collection `servers`
```json
{
  "_id": "ObjectId",
  "name": "srv-web-paris-01",
  "host": "192.168.1.10",
  "port": 80,
  "description": "Serveur Web Frontend Principal",
  "status": "UP", // "UP" | "DOWN" | "WARNING"
  "lastCheckAt": "2026-10-12T09:40:00Z",
  "createdAt": "2026-10-12T09:00:00Z"
}
```

### Collection `alerts`
```json
{
  "_id": "ObjectId",
  "serverId": "ObjectId (ref: servers, optionnel si alerte externe)",
  "serverName": "srv-web-paris-01",
  "title": "Service Web Inaccessible",
  "message": "Erreur HTTP 500 sur le healthcheck depuis 3 minutes",
  "severity": "CRITICAL", // "INFO" | "WARNING" | "CRITICAL"
  "status": "OPEN",       // "OPEN" | "ACK" | "RESOLVED"
  "assignedTo": null,     // string : "Nom ou pseudo du technicien"
  "acknowledgedAt": null, // Date de prise en charge
  "resolvedAt": null,     // Date de résolution
  "createdAt": "2026-10-12T09:42:00Z",
  "updatedAt": "2026-10-12T09:42:00Z"
}
```

---

## 5. Contrats d'API & Événements Socket.IO

### 5.1 Endpoints REST
- `GET /api/servers` : Liste tous les serveurs surveillés.
- `POST /api/servers` : Enregistrer un nouveau serveur à surveiller.
- `GET /api/alerts` : Récupérer les alertes (filtrables par statut `status=OPEN,ACK`).
- `POST /api/alerts` : Déclarer une nouvelle alerte (Push externe ou sonde).
- `PATCH /api/alerts/:id/ack` : Prise en charge par l'astreinte (`{ "assignedTo": "Nom" }`).
- `PATCH /api/alerts/:id/resolve` : Clôture de l'alerte.
- `POST /api/simulator/trigger` : Déclencher une panne fictive pour démo.

### 5.2 Événements Socket.IO (Temps Réel)
| Événement | Sens | Description |
| :--- | :--- | :--- |
| `alert:new` | Serveur ➔ Clients | Diffusion instantanée d'une nouvelle alerte. |
| `alert:updated` | Serveur ➔ Clients | Diffusion du changement d'état (ACK ou RESOLVED). |
| `server:status_change`| Serveur ➔ Clients | Mise à jour du statut d'un serveur (UP/DOWN). |
| `servers:init` | Serveur ➔ Client | Envoi de l'état initial à la connexion d'un client. |

---

## 6. Spécifications de l'Interface Utilisateur (Dashboard Astreinte)
- **Bannière d'alerte globale** : Nombre d'incidents non résolus (`OPEN` / `ACK`).
- **Section "Urgences Actives"** :
  - Cartes d'alertes avec code couleur selon sévérité.
  - Champ de saisie / sélecteur d'opérateur + bouton **« Prendre en charge »**.
  - Horodatage dynamique (*« Il y a X minutes »*).
  - Bouton **« Marquer comme réglé »**.
- **Section "Parc Serveurs"** :
  - Grille des machines avec statut en direct (pastille verte `UP`, rouge `DOWN`).
  - Bouton pour ajouter un serveur.
- **Section "Historique des résolutions"** :
  - Tableau chronologique des incidents résolus, technicien responsable, durée de résolution.
- **Barre d'outils / Démonstration** :
  - Bouton **« Simuler une alerte »** pour tester la réactivité sans manipulation manuelle de BDD.

---

## 7. Journal des Décisions, Incompréhensions et Ajustements

| Date | Événement / Sujet | Détail & Résolution |
| :--- | :--- | :--- |
| 2026-10-12 | Création branche `dev` | Branche de travail dédiée créée et pushée sur `origin/dev`. |
| 2026-10-12 | Initialisation base de connaissance | Formalisation du cadre initial et création de `AGENT.md`. |
| 2026-10-12 | **Clarification & Incompréhension : "Plus tard"** | L'IA avait interprété "plus tard" comme une V1 sans MongoDB/Socket.io puis une V2. L'utilisateur a clarifié : "plus tard" signifiait après le cadrage. **Décision : Stack complète unifiée (Node.js + MongoDB + Socket.io) développée en un seul bloc après validation du cadrage.** |
| 2026-10-12 | Validation de la stack complète | Node.js, Express, Socket.IO, MongoDB (Mongoose), Frontend Vanilla (CSS monitoring moderne). |
| 2026-10-12 | Conception des modèles et flux | Modélisation des collections `servers` et `alerts`, cycle `OPEN` -> `ACK` -> `RESOLVED`, et contrats d'API/Socket. |
