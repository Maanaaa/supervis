# ADR-0006 : Adoption du framework fullstack Next.js (Amende ADR-0001)

- **Date :** 2026-10-12
- **Statut :** Accepté
- **Amende :** [ADR-0001 : Choix de la stack technique unifiée](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0001-stack-technique-unifiee.md)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
L'ADR-0001 prévoyait initialement un backend Express pur avec un frontend en HTML/CSS/JS Vanilla.
L'utilisateur a demandé d'évoluer vers **Next.js** pour la réalisation de l'application.
Cette évolution permet de bénéficier de l'écosystème React, du rendu hybride (SSR / Client Components), des composants d'interface riches, tout en conservant Node.js et MongoDB.

## Décision retenue
Nous adoptons **Next.js** comme framework principal au sein du répertoire `app/` :
1. **Frontend :** React avec Next.js (App Router), composants réactifs en temps réel (Client Components) pour la grille des alertes et les statuts serveurs.
2. **Backend & API :** Next.js API Routes / Route Handlers pour les endpoints REST (`/api/alerts`, `/api/servers`, etc.).
3. **Temps Réel Socket.IO :** Serveur Node.js personnalisé (`server.js`) ou serveur Socket.IO intégré permettant à Next.js et Socket.IO de cohabiter de manière transparente sur le même processus/port.
4. **Base de données :** MongoDB via ODM Mongoose connecté dans les handlers API et Socket.IO.

## Alternatives envisagées
1. **Frontend Vanilla + Express (ADR-0001) :** Remplacé pour permettre une meilleure modularité de l'interface et tirer parti des composants réactifs de React.
2. **Vite + React séparé d'Express :** Écarté car nécessite de gérer deux projets/dépôts ou configurations distinctes, alors que Next.js offre une expérience fullstack unifiée.

## Conséquences
- **Positives :**
  - Interface utilisateur moderne, réactive et dynamique avec React.
  - Expérience développeur moderne (Hot Reloading, TypeScript possible si souhaité, structure claire).
  - Gestion unifiée du frontend et du backend dans le même dossier `app/`.
- **Compromis :**
  - Nécessite une configuration propre pour l'instance Socket.IO (qui nécessite un serveur HTTP persistant, au-delà du modèle serverless pur de Next.js).
