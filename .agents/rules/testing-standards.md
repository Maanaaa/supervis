# Standards de Données de Test & Démonstration

Ces règles encadrent la gestion des jeux d'essai pour garantir la crédibilité et la reproductibilité des démonstrations.

---

## 1. Jeux de Données Représentatifs (Petit Hébergeur)
- **Typologies de serveurs obligatoires :**
  1. Un serveur Web Frontend (Nginx/Node) généralement disponible (`UP`, latence < 25 ms).
  2. Un serveur de Base de données (PostgreSQL/MySQL) sujet à des alertes de charge (CPU / RAM).
  3. Un serveur de Stockage / Sauvegardes (NFS) sujet à des alertes d'espace disque.
  4. Un serveur / VPS externe inaccessible pour valider le déclenchement immédiat de la sonde en cas de panne (`DOWN`).
- **Opérateurs d'astreinte :**
  - Profils réalistes avec statuts de garde (ex: Théo M., Sarah L., Alexandre D.) pour tester l'assignation et la délégation/transfert de tickets.

---

## 2. Autonomie & Zéro Dépendance Externe
- Les tests et la démonstration doivent pouvoir s'exécuter à 100% en local.
- L'outil de simulation (`POST /api/simulator/trigger` ou panneau d'administration) doit permettre d'injecter des alertes instantanées pour tester la réactivité sans manipulation manuelle de base de données.
