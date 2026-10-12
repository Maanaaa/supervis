# ADR-0005 : Communication temps réel via Socket.IO plutôt que polling client

- **Date :** 2026-10-12
- **Statut :** Accepté
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Dans un contexte d'astreinte, les interventions doivent être rapides et coordonnées.
Un rafraîchissement périodique côté client (`setInterval` avec requêtes `fetch`) génère une latence arbitraire (ex: 15 à 30 secondes d'attente pour voir un incident) et un risque de conflit si deux personnes prennent la même alerte au même moment.

## Décision retenue
Utiliser **Socket.IO** pour assurer une communication bidirectionnelle en temps réel entre le serveur Node.js et les dashboards d'astreinte.
- Dès qu'une alerte est créée ou mise à jour, le serveur diffuse l'événement à tous les clients connectés (`io.emit`).
- Les statuts changent instantanément sur les écrans de tous les techniciens en ligne.

## Alternatives envisagées
1. **Polling HTTP périodique (Auto-refresh) :** Trop lent et consommateur de requêtes inutiles quand tout est calme.
2. **Server-Sent Events (SSE) :** Unidirectionnel uniquement (serveur vers client). Socket.IO offre la bidirectionnalité, la gestion robuste des reconnexions et une API événementielle éprouvée.

## Conséquences
- **Positives :**
  - Réactivité immédiate (latence réseau de quelques millisecondes).
  - Synchronisation parfaite de l'équipe d'astreinte.
- **Compromis :**
  - Nécessite la gestion de connexions persistantes WebSockets.
