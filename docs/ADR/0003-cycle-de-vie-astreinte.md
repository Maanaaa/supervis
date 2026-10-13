# ADR-0003 : Cycle de vie des alertes d'astreinte (`OPEN` ➔ `ACK` ➔ `RESOLVED`)

- **Date :** 2026-10-12
- **Statut :** Proposé (en cours d'affinage technique avec l'utilisateur)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Le cœur de la demande métier est formulé ainsi : *"Qui s'en occupe, quand c'est réglé."*
Un simple moniteur affichant des voyants vert/rouge ne répond pas à cette exigence. Il est indispensable de suivre l'état de prise en charge d'un incident par les membres de l'astreinte et d'en conserver l'historique temporel.

## Décision proposée
Modéliser le cycle de vie d'une alerte sous forme d'une machine à états finis à trois étapes :
1. **`OPEN` (Nouvelle alerte) :**
   - L'incident est survenu.
   - Aucun opérateur n'est encore intervenu.
   - Affichage prioritaire / alerte sonore / clignotement.
2. **`ACK` (Prise en charge / En cours) :**
   - Un membre de l'astreinte a cliqué pour s'assigner l'alerte.
   - Enregistrement de l'opérateur (`assignedTo`) et de l'horodatage (`acknowledgedAt`).
   - L'alerte passe en orange sur tous les postes connectés pour éviter une intervention redondante.
3. **`RESOLVED` (Résolue / Clôturée) :**
   - L'opérateur valide la résolution de l'incident.
   - Enregistrement de l'horodatage de fin (`resolvedAt`).
   - Permet de mesurer la durée de traitement (MTTR). L'alerte est archivée dans l'historique.

## Alternatives envisagées
1. **Suppression immédiate dès résolution :** Écartée car elle empêche toute traçabilité et ne permet pas de savoir "quand c'est réglé".
2. **Workflow complexe type Jira (5+ états) :** Écarté car surdimensionné pour une équipe d'astreinte d'un petit hébergeur nécessitant de la réactivité.

## Conséquences
- **Positives :**
  - Répond directement à la consigne métier.
  - Horodatage strict et calcul automatique des durées d'intervention.
- **Compromis :**
  - L'IHM doit proposer des actions ergonomiques (1 clic pour assigner, 1 clic pour résoudre).
