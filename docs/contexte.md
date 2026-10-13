# Contexte & Fil Conducteur du Projet

> **Problématique d'origine :**  
> *"Un petit hébergeur veut un tableau de bord qui reçoit les alertes de ses serveurs et les montre à l'astreinte. Qui s'en occupe, quand c'est réglé."*

---

## 1. Contexte Métier & Enjeux
Un petit hébergeur informatique gère une infrastructure de serveurs pour ses clients (sites web, bases de données, applications, VPS). 
Pour garantir la continuité de service et respecter ses engagements de disponibilité (SLA) :
- Les pannes et anomalies doivent être détectées au plus vite, y compris la nuit et le week-end.
- Une équipe d'astreinte technique assure la permanence en dehors des heures ouvrées.
- Les techniciens ont besoin d'un outil centralisé et temps réel pour coordonner leurs interventions sans friction.

### Objectifs Clés
1. **Centralisation des alertes** : Visualiser l'état des machines et centraliser les alertes d'incidents (charge CPU, saturation disque, crash de service, panne réseau).
2. **Coordination de l'astreinte (*« Qui s'en occupe »*)** :
   - Savoir instantanément qui intervient sur quelle panne.
   - Éviter qu'un incident critique reste sans réponse ou que deux techniciens interviennent en doublon.
3. **Traçabilité et clôture (*« Quand c'est réglé »*)** :
   - Enregistrer l'heure exacte de prise en charge et de résolution.
   - Fournir un historique clair pour le suivi de la qualité de service et le calcul du temps moyen de rétablissement (MTTR).

---

## 2. Questions Fondamentales de Pérennité & Méthode

### « Si je reprends le projet dans 6 mois ? C'est ok ? »
**Oui, grâce aux principes suivants :**
- **Autonomie documentaire :** L'historique complet des choix est formalisé dans les ADRs (`docs/adr/`) et le contexte dans ce document.
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

## 3. Fil Conducteur — Journal Chronologique des Échanges

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

### 2026-10-12 — Étape 4 : Restructuration et fusion Contexte / Fil Conducteur
- **Décision :** Condenser le contexte métier et le fil conducteur de la réflexion dans un document unique et fluide (`docs/contexte.md`).
- **Rôle de AGENT.md :** Boussole d'accueil unique de l'IA qui pointe vers `docs/contexte.md` et `docs/adr/`.

### 2026-10-12 — Étape 5 : Clarification du Push/Pull et simplification via simulateur
- **Échange :** Précision sur les rôles respectifs (Push webhook, Pull sonde, Dashboard Socket.IO passif).
- **Réduction de la charge :** Simulateur intégré pour tester les pannes en 1 clic sans vrais serveurs externes.

### 2026-10-12 — Étape 6 : Adoption de Next.js et concurrence stricte à la milliseconde
- **Stack :** Choix de **Next.js** en **TypeScript** avec App Router — création de l'**ADR-0006 amendant l'ADR-0001**.
- **Serveur unifié :** Fichier `server.js` (serveur HTTP Node.js custom) unifiant Next.js et Socket.IO sur le même port via un singleton `lib/socket.ts`.
- **Concurrence & UI :**
  - Pas de popup bloquante : mise à jour silencieuse et instantanée dans la liste lors d'une prise de ticket.
  - Verrouillage atomique MongoDB (`findOneAndUpdate` conditionnel).
  - Vol de ticket interdit, mais délégation/transfert possible par le titulaire en cours.
  - Actions gérées en **Option A (REST PATCH + Broadcast Socket.IO)**.
- **Workflow de clôture :** Champ de commentaire de résolution non obligatoire, bascule automatique vers un **onglet Historique** dédié.
- **Gestion des serveurs & Sonde :**
  - Ajout via formulaire dashboard uniquement, fiche serveur avec historique complet des tickets liés.
  - **Sonde séquentielle :** cycle toutes les 5 minutes, test pas-à-pas serveur par serveur, alerte critique immédiate dès le premier échec (sans attendre la fin du cycle global).
- **Gestion de projet GitHub & Workflow Collaboratif :**
  - **L'IA** prend en charge la création des tickets (`gh issue create`), leur alimentation, l'avancement technique et leur clôture au fil du développement.
  - **L'utilisateur (Théo)** pilote le Kanban, relit les tickets, audite les commits et valide les pushs pour vérifier la stricte adéquation aux attendus.
  - 6 issues initiales créées et actives :
    - **#1 :** `feat(core): Initialisation Next.js TypeScript & Custom Server Socket.IO`
    - **#2 :** `feat(db): Modèles NoSQL MongoDB (Mongoose) & Connexion Singleton`
    - **#3 :** `feat(poller): Moteur de Sonde Séquentielle (Cycle 5 min)`
    - **#4 :** `feat(api): Route Handlers REST & Verrouillage Atomique Sub-milliseconde`
    - **#5 :** `feat(ui): Dashboard d'Astreinte Temps Réel (React App Router & WebSockets)`
    - **#6 :** `feat(demo): Simulateur de Pannes & Outil de Validation`

### 2026-10-12 — Étape 7 : Gouvernance de la qualité de code & Règles d'agent (ADR-0007)
- **Objectif :** Garantir que le code produit respecte rigoureusement les conventions de qualité sans dépendre de rappels manuels dans les prompts.
- **Mise en œuvre :**
  - Adoption native de `AGENTS.md` et création du dossier `.agents/rules/` (`code-quality.md`, `testing-standards.md`).
  - Formalisation de cette décision d'architecture dans **l'ADR-0007**.

### 2026-10-12 — Étape 8 : Décision de différer l'initialisation du code et de la CI
- **Arbitrage de l'utilisateur :** Report temporaire de l'initialisation du projet applicatif et de la CI.

### 2026-10-12 — Étape 9 : Traitement complet du Ticket #1 (Next.js, Socket.IO, Tests & CI)
- **Validation du plan d'action :** Plan d'action validé pour le traitement méthodique du ticket #1.
- **Réalisation technique :**
  - Initialisation de `app/` avec Next.js 14, React 18, TypeScript strict, Socket.IO et Mongoose.
  - Implémentation du serveur custom `app/server.js` (unification HTTP + Socket.IO sur le port 3000).
  - Création du singleton `app/src/lib/socket.ts` (`getIO()` / `setIO()`).
  - Implémentation de la suite de tests automatisée (Unitaires, Fonctionnels, E2E WebSockets) exécutée avec Jest et ts-jest.
  - Mise en place du workflow CI GitHub Actions (`.github/workflows/ci.yml`).
  - Validation déterministe en local (Typecheck, Lint, Format, Tests, Build : 100% au vert).

### 2026-10-12 — Étape 10 : Traitement complet du Ticket #2 (Modèles MongoDB Mongoose & Connexion Singleton)
- **Réalisation technique :**
  - Singleton de connexion Mongoose (`src/lib/db.ts`) avec cache pour Next.js (`global.mongooseCache`).
  - Schémas et modèles stricts : `Server` (statut, latence, healthUrl), `Alert` (sévérité, statut OPEN/ACK/RESOLVED, assignation, transfert), `User` (annuaire techniciens d'astreinte, garde active).
  - 17 tests unitaires et d'intégration validés avec MongoDB en mémoire.

### 2026-10-12 — Étape 11 : Traitement complet du Ticket #3 (Sonde Séquentielle & Alerting Immédiat)
- **Réalisation technique :**
  - Implémentation du moteur de sonde séquentielle dans `src/lib/poller.ts` avec cycle récurrent de 5 minutes (300 000 ms).
  - Parcours pas-à-pas des serveurs enregistrés avec timeout HTTP strict de 3 000 ms (`AbortController`).
  - Calcul précis de la latence (`latencyMs`), mise à jour atomique de l'état serveur et émission Socket.IO `server:status_change`.
  - Déclenchement d'alerte `CRITICAL` immédiate dès le premier échec (sans attendre la fin du cycle), enregistrement en BDD et notification instantanée `alert:new`.
  - Intégration en tâche de fond dans `server.js` et exposition d'un endpoint `POST /api/poller` pour déclenchement programmatique / simulation.
  - Suite de tests complète (unitaires, intégration, fonctionnels) validant 34 tests au vert.

### 2026-10-12 — Étape 12 : Traitement complet du Ticket #4 (Route Handlers REST & Verrouillage Atomique Sub-milliseconde)
- **Réalisation technique :**
  - Routes d'alertes complètes : `GET /api/alerts` (filtrage actives/historique) et `POST /api/alerts` (ingestion push webhook + diffusion `alert:new`).
  - Actions d'astreinte sur `PATCH /api/alerts/[id]` :
    - Action `ACK` : verrouillage atomique conditionnel (`findOneAndUpdate({ _id, status: 'OPEN' })`), rejet 409 Conflict pour les requêtes concurrentes perdantes sans popup, diffusion `alert:updated`.
    - Action `TRANSFER` : délégation réservée au technicien actuellement titulaire (protection anti-vol de ticket avec traçabilité dans `transferredFrom`).
    - Action `RESOLVE` : clôture avec horodatage `resolvedAt` et persistance du commentaire optionnel.
  - Routes parc serveurs : `GET / POST /api/servers` et `GET /api/servers/[id]` (fiche détaillée et historique complet des tickets liés).
  - Route annuaire opérateurs : `GET / POST /api/users`.
  - Suite de tests complète (51 tests 100% au vert) validant la course critique concurrente avec 10 requêtes simultanées.

### 2026-10-13 — Étape 13 : Traitement complet du Ticket #5 (Dashboard d'Astreinte Temps Réel & WebSockets)
- **Réalisation technique :**
  - Design system sombre orienté supervision nocturne (glassmorphism, variables CSS, micro-animations, typographie claire).
  - Composants d'interface réactifs :
    - `Header` avec statut de connexion Socket.IO en direct et sélecteur d'opérateur d'astreinte persistant (`useOperator`).
    - `Navigation` par onglets (`/`, `/history`, `/servers`).
    - `MetricBanner` avec compteurs dynamiques en temps réel (critiques, avertissements, en cours, parc de serveurs).
    - `AlertCard` & `AlertList` : Prise de ticket en 1 clic sans popup intrusive, délégation réservée au titulaire, clôture avec commentaire optionnel, et écoute des flux Socket.IO (`alert:new`, `alert:updated`, `server:status_change`).
    - `HistoryList` (`/history`) : Traçabilité des incidents résolus, post-mortem et calcul du MTTR moyen.
    - `ServerGrid` & `AddServerForm` (`/servers` et `/servers/[id]`) : Surveillance du parc, ajout sans rechargement et fiches détaillées avec historique lié.
  - Suite de 65 tests automatisés validée et build Next.js 100% au vert.

---

## 4. Points en Cours d'Affinage
- **Données de tests :** Cadrage des jeux d'essai pour les serveurs et les typologies d'alertes à simuler.
- **Partie visuelle du Dashboard :** Remarques et ajustements attendus de l'utilisateur sur la mise en page et les composants IHM.
