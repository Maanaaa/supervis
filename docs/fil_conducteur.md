# Fil Conducteur — Journal de Bord & Trajectoire de Réflexion

Ce document retrace la démarche de conception, l'historique des prises de décision, les questions méthodologiques soulevées et les incompréhensions levées lors des échanges entre l'humain et l'IA.

---

## 1. Questions Fondamentales de Pérennité

### « Si je reprends le projet dans 6 mois ? C'est ok ? »
**Oui, grâce aux principes suivants :**
- **Autonomie documentaire :** L'historique complet des choix est formalisé dans les ADRs (`docs/adr/`) et le contexte dans `docs/contexte.md`.
- **Zéro dépendance magique :** Le code dans `app/` contient des commandes de démarrage standards (`npm install`, `npm run dev`) et des variables d'environnement explicites.
- **Séparation claire :** La documentation (`docs/`) ne pollue pas le code applicatif (`app/`), et inversement.

### « Qu'est-ce qui est daté ? »
- **Ce qui est daté (Immuable dans le temps) :**
  - Ce journal de bord : il capture l'évolution de la réflexion à une date précise.
  - Les fiches ADR : une fois actées, elles ne sont jamais modifiées. Si une décision change, on rédige un nouvel ADR qui amende le précédent.
  - Les versions logicielles et les logs d'incidents horodatés.
- **Ce qui est vivant (À maintenir à jour au fil des évolutions) :**
  - Les spécifications techniques (`docs/specifications.md`).
  - Le fichier de directives IA (`AGENT.md`).
  - Le `README.md` d'installation.

### « Qu'est-ce que l'IA doit lire à chaque session ? »
- Le fichier [AGENT.md](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/AGENT.md) à la racine : résumé du projet, conventions Git sur la branche `dev`, règle d'amendement des ADRs et conventions d'équipe.

---

## 2. Chronologie des Échanges et Prises de Décision

### 2026-10-12 — Étape 1 : Cadrage initial & Initialisation Git
- **Action :** Création de la branche de travail dédiée `dev` et premier push sur `origin/dev`.
- **Proposition initiale de l'utilisateur :**
  - Ping périodique des serveurs un par un à la chaîne.
  - Stockage sans BDD au début.
  - Auto-refresh sur le dashboard.
- **Analyse critique partagée :**
  - Mise en évidence de l'importance du workflow d'astreinte (*« Qui s'en occupe, quand c'est réglé »*).
  - Distinction entre sonde Pull (disponibilité) et Push (alertes applicatives).
  - Préférence pour l'asynchronisme en Node.js plutôt qu'un ping séquentiel bloquant.

### 2026-10-12 — Étape 2 : Clarification majeure sur la démarche (Incompréhension levée)
- **Point de divergence :** L'utilisateur avait mentionné *"puis plus tard avec du NoSQL et socket io"*. L'IA avait envisagé deux versions successives de code (V1 jetable sans BDD/socket, puis V2).
- **Clarification de l'utilisateur :** L'expression *"plus tard"* signifiait **après le cadrage et la réflexion**, c'est-à-dire au moment d'écrire le code.
- **Décision validée :** Préparer un cadrage tellement précis que le développement de la stack unifiée complète (Node.js + MongoDB + Socket.IO) pourra être mené de manière fluide et directe ("one-shot").

### 2026-10-12 — Étape 3 : Règle méthodologique des ADRs
- **Demande de l'utilisateur :** Structurer les décisions d'architecture sous forme d'ADR (Architecture Decision Records).
- **Règle stricte actée :** **Quand on veut itérer sur une décision, on ne modifie pas l'ADR existant, on amende avec un nouvel ADR.**

### 2026-10-12 — Étape 4 : Restructuration documentaire et compartimentage
- **Demande de l'utilisateur :** Séparer le contexte, le fil conducteur, et isoler le code applicatif du répertoire `docs/`.
- **Organisation retenue :**
  - `docs/contexte.md` : Problématique métier et académique.
  - `docs/fil_conducteur.md` : Journal de bord, pérennité, historique des échanges.
  - `docs/specifications.md` : Spécifications techniques (schémas, endpoints, UI).
  - `docs/adr/` : Fiches de décision immuables.
  - `app/` : Répertoire applicatif dédié.

### 2026-10-12 — Étape 5 : AGENT.md comme boussole et point d'ancrage unique de l'IA
- **Réflexion de l'utilisateur :** Plutôt que de garder un document abstrait nommé "base de connaissance", c'est `AGENT.md` qui devient le point d'entrée unique et obligatoire.
- **Principe établi :** À chaque session, l'IA lit `AGENT.md`. Grâce à ce manifeste, elle sait exactement :
  - Où est le contexte (`docs/contexte.md`).
  - Quels sont les choix tranchés et ce qu'il ne faut PAS faire (`docs/adr/`).
  - Quelle est la trajectoire de pensée (`docs/fil_conducteur.md`).
  - Comment implémenter sans régresser.

---

## 3. Points en Cours d'Affinage
- **Partie visuelle du Dashboard :** L'utilisateur a émis des réserves sur les premières ébauches visuelles/IHM. Attente de ses retours pour cadrer la maquette.
- **Définitions techniques :** Ajustements à apporter sur la modélisation des serveurs/alertes selon les attentes spécifiques de l'utilisateur.
