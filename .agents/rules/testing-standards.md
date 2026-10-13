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

---

## 3. Commandes Officielles de Tests & Pipeline CI/CD

Toute modification doit être validée par les commandes de test et de validation de déploiement (CI/CD) suivantes depuis le répertoire `app/` :

### 🧪 Tests Unitaires
Pour exécuter exclusivement les tests unitaires (modèles, utilitaires, singletons) :
```bash
npm test -- tests/unit
```

### 🔬 Tests Complets (Unitaires, Fonctionnels, E2E & Intégration)
Pour exécuter l'ensemble de la suite de tests automatisés :
```bash
npm test
```

### 🚀 Pipeline Local CI/CD (Validation avant Push / Déploiement)
Commande consolidée stricte à exécuter impérativement avant toute ouverture de Pull Request :
```bash
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

### 📡 Suivi CI/CD Distant (GitHub Actions)
Pour vérifier et attendre le passage au vert de la CI/CD sur la PR :
```bash
gh pr checks <numero_pr>
```

---

## 4. Obligation Absolue : Retourner les Tests au Statut OK (100% PASS)

- **Condition sine qua non :** Il est **strictement obligatoire** d'exécuter les tests et de **retourner explicitement dans la réponse à l'utilisateur le statut OK** de la suite de tests (nombre de suites passées, nombre de tests validés, 0 échec).
- **Format attendu dans le rapport final :**
  > **Statut des Tests : OK ✅**
  > - Suites de tests : `X / X passed (100%)`
  > - Total tests : `Y / Y passed (100%)`
  > - Commande exécutée : `npm test` (ou `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`)
- **Interdiction formelle :** Aucune tâche ou ticket ne peut être considéré comme terminé ou soumis à validation sans avoir produit et affiché ce résultat validé en **OK**.
