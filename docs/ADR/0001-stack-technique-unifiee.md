# ADR-0001 : Choix de la stack technique unifiée (Node.js + MongoDB + Socket.IO)

- **Date :** 2026-10-12
- **Statut :** Amendé par [ADR-0006](0006-adoption-nextjs.md)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Le projet demande de réaliser un tableau de bord de supervision d'alertes pour un petit hébergeur en Node.js, puis avec NoSQL (MongoDB) et Socket.IO.
Initialement, une approche par phases distinctes (V1 sans BDD avec auto-refresh, puis V2 avec MongoDB et Socket.IO) avait été envisagée par l'IA en raison d'une mauvaise interprétation de l'expression "plus tard".
L'utilisateur a précisé que "plus tard" signifiait chronologiquement après la phase de cadrage. L'objectif est de préparer l'ensemble des spécifications pour pouvoir implémenter la stack complète d'un seul bloc ("one-shot").

## Décision retenue
Nous adoptons directement la stack complète unifiée :
- **Backend :** Node.js avec Express pour le serveur d'API REST et le service des assets.
- **Base de données :** MongoDB (NoSQL) avec ODM Mongoose pour la persistance des données (serveurs, alertes, opérateurs).
- **Temps Réel :** Socket.IO (WebSockets) pour diffuser instantanément les changements d'état vers les clients connectés.
- **Frontend :** HTML5 / CSS moderne Vanilla / JavaScript Vanilla connecté au client Socket.IO.
- **Organisation :** Séparation stricte à la racine entre la documentation (`docs/`) et le code applicatif (`app/`).

## Alternatives envisagées
1. **MVP intermédiaire sans base de données (fichiers JSON) :** Écarté car cela obligerait à écrire du code temporaire qui serait immédiatement réécrit lors de l'intégration de MongoDB.
2. **Framework frontend lourd (React / Vue) :** Écarté pour préserver la légèreté, l'autonomie et respecter les principes du web vanilla sans surcouche de build complexe inutile.

## Conséquences
- **Positives :**
  - Architecture cible propre dès le premier commit de code.
  - Pas de code "jetable" à maintenir.
  - Démonstration temps réel native dès la première version opérationnelle.
- **Compromis :**
  - Nécessite une instance MongoDB accessible (locale via Docker ou service cloud Mongo Atlas).
