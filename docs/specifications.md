# Spécifications Techniques & Architecture

Ce document décrit l'architecture technique, les schémas de données NoSQL, les contrats d'API et les spécifications de l'interface utilisateur.

---

## 1. Architecture Système

```
 ┌────────────────┐          POST /api/alerts (Push)
 │ Serveurs /     ├─────────────────────────────────────────┐
 │ Scripts d'agent│                                         │
 └────────────────┘                                         ▼
                                                   ┌─────────────────┐
 ┌────────────────┐         Healthcheck (Pull)     │ Serveur Node.js │ <──> [ MongoDB ]
 │ Serveurs       │ < - - - - - - - - - - - - - -  │   + Express     │      (Collections:
 │ Surveillés     │                                │   + Socket.io   │       servers, alerts,
 └────────────────┘                                └────────┬────────┘       users)
                                                            │
                                         Socket.io (Events) │ (alert:new, alert:updated)
                                                            ▼
                                                   ┌─────────────────┐
                                                   │ Dashboard Web   │
                                                   │ Astreinte       │
                                                   └─────────────────┘
```

---

## 2. Modèle de Données NoSQL (MongoDB / Mongoose)

### 2.1 Collection `servers`
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

### 2.2 Collection `alerts`
```json
{
  "_id": "ObjectId",
  "serverId": "ObjectId (optionnel, ref: servers)",
  "serverName": "srv-web-paris-01",
  "title": "Service Web Inaccessible",
  "message": "Erreur HTTP 500 sur le healthcheck depuis 3 minutes",
  "severity": "CRITICAL", // "INFO" | "WARNING" | "CRITICAL"
  "status": "OPEN",       // "OPEN" | "ACK" | "RESOLVED"
  "assignedTo": null,     // string ou ref User : "Nom du technicien"
  "acknowledgedAt": null, // Horodatage prise en charge
  "resolvedAt": null,     // Horodatage résolution
  "createdAt": "2026-10-12T09:42:00Z",
  "updatedAt": "2026-10-12T09:42:00Z"
}
```

### 2.3 Collection `users` (Opérateurs d'astreinte)
```json
{
  "_id": "ObjectId",
  "name": "Théo M.",
  "role": "Technicien Astreinte",
  "email": "theo@hebergeur.fr",
  "phone": "+33 6 12 34 56 78",
  "isOnDuty": true
}
```

---

## 3. Contrats d'API & Événements Socket.IO

### 3.1 Endpoints REST
- `GET /api/servers` : Liste tous les serveurs surveillés.
- `POST /api/servers` : Enregistrer un nouveau serveur à surveiller.
- `GET /api/alerts` : Récupérer les alertes (filtrage par statut `status=OPEN,ACK`).
- `POST /api/alerts` : Ingestion d'une alerte (Push externe ou sonde).
- `PATCH /api/alerts/:id/ack` : Prise en charge par l'astreinte (`{ "assignedTo": "Nom" }`).
- `PATCH /api/alerts/:id/resolve` : Clôture de l'alerte.
- `GET /api/users` : Liste des techniciens d'astreinte.
- `POST /api/simulator/trigger` : Déclencher une panne fictive pour démo.

### 3.2 Événements Socket.IO
- `alert:new` (Serveur ➔ Clients) : Diffusion instantanée d'une nouvelle alerte.
- `alert:updated` (Serveur ➔ Clients) : Diffusion du changement d'état (ACK ou RESOLVED).
- `server:status_change` (Serveur ➔ Clients) : Mise à jour du statut d'une machine.

---

## 4. Spécifications IHM (Dashboard d'Astreinte)
*(En cours d'affinage avec l'utilisateur)*
- Vue d'ensemble des alertes actives (`OPEN` et `ACK`).
- Actions de prise en charge et clôture en 1 clic.
- Grille d'état du parc serveurs.
- Historique chronologique des résolutions.
