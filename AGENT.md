# AGENT.md — Boussole & Directives de Session pour l'IA

Ce document est le **point d'entrée obligatoire** que l'agent IA doit lire au début de chaque session. Il structure la base de connaissances du projet et guide l'IA dans la compréhension des choix, des contraintes et de l'historique.

---

## 1. Protocole de Démarrage de Session (Obligatoire)
Avant toute proposition ou modification de code, l'IA doit consulter :
1. [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) : Pour s'imprégner du métier (petit hébergeur, astreinte, SLA) et ne jamais dévier du besoin réel.
2. [`docs/adr/`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) : Pour comprendre **pourquoi** un choix technique a été fait, quelles alternatives ont été **explicitement rejetées** et ce qu'il est **interdit de refaire**.
3. [`docs/fil_conducteur.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/fil_conducteur.md) : Pour connaître la chronologie de la réflexion, les incompréhensions déjà levées et les points en cours d'affinage.
4. [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) : Pour vérifier l'état actuel des schémas de données, de l'API et des flux temps réel.

---

## 2. Règles Fondamentales & Ce qu'il NE FAUT PAS faire

### ⚠️ Règle d'or des ADRs (Immuabilité)
- **Ne JAMAIS réécrire ou modifier une décision dans une ADR déjà acceptée.**
- Si une décision évolue ou change : **créer une nouvelle ADR** qui amende l'ancienne (`ADR-XXXX : Amende ADR-YYYY`). Mettre à jour le statut de l'ancienne vers `Amendé par ADR-XXXX`.

### ⚠️ Gestion Git & Environnement
- **Branche active :** Travailler **exclusivement sur `dev`**. Ne jamais pousser directement sur `main`.
- **Commits & Push :** Effectuer des commits conventionnels clairs et pusher systématiquement sur `origin/dev` à la fin de chaque étape.
- **Séparation des répertoires :** 
  - Tout ce qui concerne la documentation et la réflexion va dans `docs/`.
  - Tout ce qui concerne le code applicatif va dans `app/`.

### ⚠️ Architecture & Code
- Ne pas introduire de code "jetable" (la stack complète Node.js + MongoDB + Socket.IO sera développée en direct).
- Ne pas rajouter de complexité inutile non décidée dans les ADRs (ex: pas d'authentification par mot de passe lourde sans validation, pas de frameworks frontend encombrants).

---

## 3. Cartographie Documentaire

| Document | Rôle pour l'IA |
| :--- | :--- |
| [`docs/contexte.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/contexte.md) | Comprendre le problème client et les enjeux de l'astreinte. |
| [`docs/adr/README.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/README.md) | Comprendre les arbitrages techniques fermes et les pièges évités. |
| [`docs/fil_conducteur.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/fil_conducteur.md) | Comprendre comment la réflexion a mûri avec l'utilisateur. |
| [`docs/specifications.md`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/specifications.md) | Modèles Mongo, routes REST, Socket.io et IHM. |
| `app/` | Répertoire de l'application à implémenter. |

---

## 4. Check-list de Fin de Session
- [ ] Le code fonctionne et respecte les ADRs en vigueur.
- [ ] Les nouveaux arbitrages sont rédigés sous forme de nouveaux ADRs (sans modifier les anciens).
- [ ] Le journal `docs/fil_conducteur.md` est enrichi des derniers échanges.
- [ ] Tout est commité et pushé sur la branche `dev`.
