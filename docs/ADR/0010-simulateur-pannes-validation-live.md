# ADR-0010 : Simulateur de pannes et outil de validation pour démonstration (Issue #6)

- **Date :** 2026-10-15
- **Statut :** Accepté
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Pour la démonstration lors de la soutenance et la validation des flux d'astreinte, déclencher manuellement de réelles pannes d'infrastructure externe ou attendre le cycle périodique de 5 minutes de la sonde est inadapté. L'application nécessite un moyen autonome, déterministe et instantané (< 100 ms) d'injecter des alertes et d'altérer l'état des serveurs sans infrastructure tierce lourde.

## Décision retenue
Intégrer un sous-système de simulation de pannes et de chaos testing comprenant :
1. **Endpoint REST dédié `POST /api/simulator/trigger` :**
   - Traitement des actions typées : pannes CPU, saturation disque, coupure Nginx, bascule d'état serveur (`server_down`, `server_up`), alertes libres (`custom`), et réinitialisation globale (`reset`).
   - Diffusion immédiate sur Socket.IO via `alert:new`, `alert:updated` et `server:status_change`.
   - Exemption d'authentification dans le middleware pour permettre les scripts CLI.
2. **Panneau Démo interactif (`SimulationPanel.tsx`) :**
   - Intégré directement au tableau de bord d'astreinte.
   - Boutons à déclenchement 1-clic avec retour visuel et compteur de latence d'émission.
3. **Script autonome CLI (`scripts/simulate.mjs`) :**
   - Accessible via `npm run simulate` pour dérouler un scénario complet automatisé en local.

## Alternatives envisagées
1. **Mock statique côté client :** Rejeté car les événements doivent traverser la base MongoDB et le hub Socket.IO pour valider la chaîne de communication temps réel bout en bout.
2. **Arrêt réel de conteneurs Docker :** Rejeté car trop lourd et dépendant de l'environnement d'exécution local.

## Conséquences
- **Positives :**
  - Validation instantanée du critère de réactivité (< 100 ms) en conditions réelles.
  - Démonstration locale 100% autonome et reproductible pour la soutenance.
  - Outil de remise à zéro (`reset`) pour nettoyer les données de test en un clic.
- **Compromis :**
  - Nécessite de protéger la route en production si l'application est exposée publiquement.
