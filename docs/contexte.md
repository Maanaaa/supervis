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

---

## 4. Points en Cours d'Affinage
- **Partie visuelle du Dashboard :** Remarques et ajustements attendus de l'utilisateur sur la mise en page et les composants IHM.
- **Définitions techniques :** Affinage des détails d'implémentation avant le lancement du code.
