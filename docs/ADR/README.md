# Architecture Decision Records (ADR)

Ce répertoire consigne l'ensemble des décisions d'architecture et de conception prises pour le projet de supervision d'alertes.

---

## Règle Fondamentale de Gestion des ADRs

> **Principe d'immuabilité :**  
> Une fiche ADR acceptée est **figée dans le temps**. On ne modifie jamais son contenu historique pour changer une décision.  
> **Quand on veut itérer ou faire évoluer une décision, on amende avec un nouvel ADR.**  
> - Le nouvel ADR mentionne : `Amende ADR-XXXX` ou `Remplace ADR-XXXX`.  
> - L'ancien ADR voit son statut mis à jour vers `Amendé par ADR-YYYY` ou `Remplacé par ADR-YYYY`.

---

## Index des Décisions

| Référence | Titre | Statut | Date |
| :--- | :--- | :--- | :--- |
| [ADR-0001](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0001-stack-technique-unifiee.md) | Choix de la stack technique unifiée (Node.js + MongoDB + Socket.IO) | Accepté | 2026-10-12 |
| [ADR-0002](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0002-ingestion-alertes-push-pull.md) | Ingestion hybride des alertes : Push (Webhook) + Pull (Sonde périodique) | Proposé (en cours d'affinage) | 2026-10-12 |
| [ADR-0003](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0003-cycle-de-vie-astreinte.md) | Cycle de vie des alertes d'astreinte (`OPEN` ➔ `ACK` ➔ `RESOLVED`) | Proposé (en cours d'affinage) | 2026-10-12 |
| [ADR-0004](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0004-gestion-operateurs-astreinte.md) | Identification des membres d'astreinte : Annuaire d'opérateurs | Proposé (en cours d'affinage) | 2026-10-12 |
| [ADR-0005](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/docs/adr/0005-communication-temps-reel-socketio.md) | Diffusion temps réel via Socket.IO plutôt que polling client | Accepté | 2026-10-12 |
