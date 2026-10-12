# Application Supervision d'Alertes (`app/`)

Application fullstack de supervision d'alertes et d'astreinte développée avec Next.js 14, React 18, TypeScript strict, Socket.IO et MongoDB.

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances
```bash
npm install
```

### 2. Lancement du serveur de développement (Next.js + Socket.IO unifiés)
```bash
npm run dev
```
L'application démarre sur : [http://localhost:3000](http://localhost:3000)

---

## 🧪 Exécution des Tests

La suite de tests automatisée couvre les tests unitaires, fonctionnels et E2E (connexion temps réel WebSockets) :

```bash
npm test
```

### Détail des tests inclus :
* **Unitaire (`tests/unit/socket-singleton.test.ts`)** : Contrôle du singleton Socket.IO et de la levée d'exception sécurisée.
* **Fonctionnel (`tests/functional/api-health.test.ts`)** : Vérification du endpoint `/api/health` (statut HTTP 200, métriques d'uptime).
* **End-to-End WebSocket (`tests/e2e/socket-connection.test.ts`)** : Connexion réelle d'un client `socket.io-client`, émission de l'événement `alert:new` par le serveur et réception validée côté client.

---

## 🔍 Outils de Qualité de Code & Intégration Continue (CI)

Les contrôles automatisés exécutés sur GitHub Actions (`.github/workflows/ci.yml`) peuvent être lancés en local :

* **Vérification TypeScript stricte :**
  ```bash
  npm run typecheck
  ```
* **Analyse ESLint des règles et anti-patterns :**
  ```bash
  npm run lint
  ```
* **Vérification du formatage Prettier :**
  ```bash
  npm run format:check
  ```
* **Formatage automatique :**
  ```bash
  npm run format
  ```
* **Compilation et build de production :**
  ```bash
  npm run build
  ```
