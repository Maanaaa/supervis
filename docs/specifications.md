# Spécifications Techniques & Architecture

Ce document décrit l'architecture technique, les schémas de données NoSQL, les contrats d'API, les événements Socket.IO et la structure de l'application Next.js TypeScript.

---

## 1. Architecture Système

![Architecture Système](assets/architecture.svg)

<details>
<summary>📐 Voir le diagramme sous format textuel (Mermaid)</summary>

```mermaid
flowchart TD
    subgraph Sources["Sources d'Alertes & Parc Informatique"]
        Agent["🖥️ Agents / Serveurs Distants<br/>(Pannes internes, CPU, Disque)"]
        Parc["🌐 Serveurs Surveillés<br/>(Disponibilité réseau)"]
    end

    subgraph Backend["Serveur Backend Node.js (server.ts / server.js)"]
        CustomServer["⚙️ Serveur HTTP Custom Node.js"]
        NextCore["▲ Next.js App Router (RSC + API Routes)"]
        Poller["⏱️ Sonde Périodique (Promise.allSettled)"]
        SocketHub["⚡ Hub Événements Socket.IO"]
    end

    subgraph Database["Base NoSQL MongoDB"]
        MServers[("📁 servers")]
        MAlerts[("📁 alerts")]
        MUsers[("📁 users")]
    end

    subgraph Frontend["Dashboard Astreinte Next.js (React)"]
        RSC["🖥️ Server Components (Rendu initial, SSR)"]
        ClientAlerts["🚨 Urgences Actives ('use client' + Socket.IO)"]
        ClientHistory["📜 Onglet Historique & Post-mortem"]
        ServerForm["➕ Formulaire d'ajout serveur"]
    end

    Agent -->|POST /api/alerts (Push)| CustomServer
    CustomServer --> NextCore
    Poller -.->|Healthcheck périodique (Pull)| Parc
    Parc -.->|Réponse / Timeout| Poller

    NextCore --> MAlerts
    Poller --> MServers
    Poller -->|Création alerte si DOWN| MAlerts

    CustomServer --> SocketHub
    SocketHub <==>|WebSockets bidirectionnels| ClientAlerts
```

</details>

---

## 2. Modèles de Données & Types TypeScript (MongoDB / Mongoose)

### 2.1 Types TypeScript

```typescript
// types/server.ts
export interface IServer {
  _id: string;
  name: string;
  host: string;
  port: number;
  healthUrl?: string; // URL spécifique pour le check HTTP
  description?: string;
  status: 'UP' | 'DOWN' | 'UNKNOWN';
  latencyMs?: number;
  lastCheckAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// types/alert.ts
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACK' | 'RESOLVED';

export interface IAlert {
  _id: string;
  serverId?: string; // Référence IServer (optionnelle si alerte orpheline)
  serverName: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  assignedTo?: string; // Nom ou ID de l'opérateur d'astreinte
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolutionComment?: string; // Commentaire non obligatoire de clôture
  transferredFrom?: string[]; // Historique des transferts de ticket
  createdAt: Date;
  updatedAt: Date;
}

// types/user.ts
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ASTREINTE' | 'ADMIN';
  isOnDuty: boolean;
}
```

---

## 3. Workflow Métier de l'Astreinte & Concurrence

### 3.1 Prise en charge à la milliseconde sans popup
- Deux techniciens cliquent en même temps sur *« Prendre en charge »*.
- **Côté backend (MongoDB) :** Opération conditionnelle atomique :
  ```typescript
  const updatedAlert = await Alert.findOneAndUpdate(
    { _id: alertId, status: 'OPEN' }, // Condition stricte : seul le 1er gagne
    { 
      $set: { 
        status: 'ACK', 
        assignedTo: operatorName, 
        acknowledgedAt: new Date() 
      } 
    },
    { new: true }
  );
  ```
- **Côté interface client :** 
  - **Pas de popup ni de boîte modale intrusive.**
  - Dès réception de l'événement Socket.IO `alert:updated`, l'état visuel du ticket change instantanément pour tout le monde : le bouton se désactive et la pastille indique *« Pris par [Nom] »*.
  - Si l'utilisateur qui a cliqué a perdu la course, sa ligne se met simplement à jour avec le nom du collègue sans message bloquant.

### 3.2 Règle d'attribution et de transfert de ticket
- **Verrouillage d'attribution :** Aucun tiers ne peut voler un ticket déjà assigné à un collègue.
- **Délégation / Transfert :** Seul le détenteur actuel (`assignedTo === currentOperator`) a la possibilité de transférer son ticket à un autre membre d'astreinte via un sélecteur *« Passer la main à... »*.

### 3.3 Résolution & Archivage
- Bouton *« Résoudre »* ouvrant un champ texte optionnel pour saisir un commentaire de résolution *(ex: "Cache vidé et Nginx redémarré")*.
- L'alerte passe en `RESOLVED` avec `resolvedAt = new Date()`.
- L'alerte résolue quitte la vue des urgences actives et bascule automatiquement dans l'**Onglet Historique / Post-mortem**.

---

## 4. Gestion du Parc Serveurs

1. **Création exclusivement via le Dashboard :**
   - Formulaire dédié sur l'interface avec validation des champs :
     - Nom du serveur (`srv-prod-paris`)
     - Hôte / IP (`192.168.1.10` ou `mon-serveur.fr`)
     - Port (80, 443, etc.)
     - URL de healthcheck (`/health`)
     - Description
2. **Fiche détaillée du serveur :**
   - État en direct (`UP` / `DOWN`), latence en millisecondes, date du dernier check.
   - **Accès direct à l'historique de tous les tickets associés à cette machine** (requête sur `alerts` où `serverId == server._id`).

---

## 5. Architecture de Code Next.js (TypeScript)

Le code applicatif réside dans `app/` avec l'arborescence conventionnelle suivante :

```
app/
├── server.js                      # Serveur Node.js custom (Next.js + Socket.IO unifiés)
├── package.json                   # Dépendances (next, react, socket.io, mongoose, etc.)
├── tsconfig.json                  # Configuration TypeScript stricte
├── next.config.mjs                # Configuration Next.js
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Layout global (Navbar, Statuts d'astreinte)
│   │   ├── page.tsx               # Vue principale (RSC avec composants clients injectés)
│   │   ├── history/               # Onglet Historique des résolutions
│   │   │   └── page.tsx           # Page d'historique et post-mortem
│   │   ├── servers/               # Vue détaillée et gestion des serveurs
│   │   │   ├── page.tsx           # Grille du parc et formulaire d'ajout
│   │   │   └── [id]/page.tsx      # Fiche serveur + historique des tickets liés
│   │   └── api/                   # API Routes (Route Handlers)
│   │       ├── alerts/
│   │       │   ├── route.ts       # GET (liste) / POST (ingestion push)
│   │       │   └── [id]/route.ts  # PATCH (ack atomique, resolve, transfer)
│   │       └── servers/
│   │           ├── route.ts       # GET / POST (ajout formulaire)
│   │           └── [id]/route.ts  # GET (fiche + historique lié)
│   │
│   ├── components/                # Composants d'interface (Nomenclature PascalCase)
│   │   ├── alerts/
│   │   │   ├── AlertBadge.tsx     # Sévérité & Statut (RSC)
│   │   │   ├── AlertCard.tsx      # Carte d'alerte avec actions temps réel ('use client')
│   │   │   └── AlertList.tsx      # Conteneur des alertes actives ('use client')
│   │   ├── servers/
│   │   │   ├── ServerCard.tsx     # Carte d'état serveur
│   │   │   └── AddServerModal.tsx # Formulaire d'ajout de serveur ('use client')
│   │   ├── layout/
│   │   │   ├── Header.tsx         # Barre de statut et sélecteur d'opérateur
│   │   │   └── Navigation.tsx     # Onglets (Actives / Historique / Serveurs)
│   │   └── ui/                    # Éléments réutilisables (Button, Input, Card)
│   │
│   ├── hooks/                     # Custom Hooks React ('use client')
│   │   ├── useSocket.ts           # Hook de connexion et écoute Socket.IO
│   │   └── useActiveOperator.ts   # Opérateur d'astreinte sélectionné
│   │
│   ├── lib/                       # Utilitaires & singletons backend
│   │   ├── db.ts                  # Connexion singleton Mongoose
│   │   ├── socket.ts              # Instance Socket.IO partagée
│   │   └── poller.ts              # Moteur de sonde périodique (Pull)
│   │
│   ├── models/                    # Schémas et modèles Mongoose
│   │   ├── Alert.ts
│   │   ├── Server.ts
│   │   └── User.ts
│   │
│   └── types/                     # Interfaces TypeScript partagées
│       ├── alert.ts
│       ├── server.ts
│       └── user.ts
```

### 5.2 Règle Server Components (RSC) vs Client Components
- **Server Components (par défaut) :** Utilisés pour la structure des pages, le layout, la récupération initiale des données en base (`db.ts`), le rendu SEO et la rapidité d'affichage.
- **Client Components (`'use client'`) :** Réservés exclusivement là où l'interactivité ou le temps réel est requis :
  - Le hook Socket.IO (`useSocket`).
  - Les boutons d'action d'assignation/clôture (`AlertCard`).
  - Le formulaire dynamique d'ajout de serveur (`AddServerModal`).
