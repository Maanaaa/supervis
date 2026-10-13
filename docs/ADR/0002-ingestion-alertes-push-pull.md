# ADR-0002 : Ingestion hybride des alertes (Push Webhook + Sonde périodique Pull)

- **Date :** 2026-10-12
- **Statut :** Proposé (en cours d'affinage technique avec l'utilisateur)
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
La problématique stipule : *"Un petit hébergeur veut un tableau de bord qui reçoit les alertes de ses serveurs..."*.
L'utilisateur a initialement proposé : *"toutes les x minutes : ping les serveurs 1 par 1 à la chaîne en attendant le résultat de celui d'avant..."*.
Un simple ping (Pull) ne permet pas de recevoir des alertes applicatives fines (ex. CPU > 95%, disque saturé, service MySQL arrêté). Inversement, un modèle purement Push (attente passive d'alertes) ne permet pas de détecter si une machine s'éteint brutalement ou perd sa connexion réseau.

## Décision proposée
Adopter une architecture d'ingestion hybride :
1. **Canal Push (Endpoint d'ingestion d'alertes) :**
   - Exposition d'une route `POST /api/alerts` permettant à n'importe quel serveur ou script d'agent d'envoyer un incident précis (charge, espace disque, statut de service).
2. **Canal Pull (Sonde périodique de disponibilité) :**
   - Une sonde asynchrone Node.js interroge périodiquement les serveurs enregistrés.
   - Utilisation de vérifications asynchrones en parallèle (`Promise.allSettled`) plutôt que séquentielles bloquantes.
   - En cas d'échec de réponse, une alerte système est générée automatiquement.

## Alternatives envisagées
1. **Pull séquentiel bloquant (Ping 1 par 1) :** Écarté car si plusieurs serveurs subissent un timeout réseau (ex: 10s chacun), la boucle de surveillance est paralysée.
2. **Push exclusif sans sonde :** Écarté car un serveur hors tension ne peut pas envoyer d'alerte indiquant qu'il est éteint (problème du "silent failure").

## Conséquences
- **Positives :**
  - Couverture complète : pannes réseau/extinction ET alertes applicatives internes.
  - Performance préservée grâce à l'asynchronisme de Node.js.
- **Compromis :**
  - Deux sources d'événements à gérer dans le backend (webhook externe vs cron interne).
