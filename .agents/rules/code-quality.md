# Règles de Qualité de Code — Projet Supervision

Ces règles sont automatiquement chargées par Antigravity pour garantir l'excellence et la propreté du code produit.

---

## 1. Standards TypeScript & Typage Stricte
- **Interdiction absolue du type `any`** : Tous les modèles, props de composants, arguments de fonctions et valeurs de retour doivent être explicitement typés.
- **Interfaces partagées** : Centraliser les définitions d'interfaces dans `src/types/` (`alert.ts`, `server.ts`, `user.ts`).
- **Validation des données** : Toujours vérifier la validité des payloads entrants (champs requis, types attendus) avant insertion ou mise à jour.

---

## 2. Architecture Next.js & React App Router
- **Server Components par défaut (RSC)** : Ne jamais ajouter `'use client'` sauf nécessité absolue (usage de hooks React comme `useState`, `useEffect`, ou consommation de WebSockets Socket.IO).
- **Structure modulaire** :
  - `components/` : composants découpés par domaine (`alerts/`, `servers/`, `layout/`, `ui/`).
  - `hooks/` : logique réactive réutilisable (`useSocket.ts`).
  - `lib/` : code utilitaire serveur pur et singletons (`db.ts`, `socket.ts`, `poller.ts`).
  - `models/` : schémas Mongoose typés.
- **Composants d'Erreur & Boundaries obligatoires (Anti-boucle infinie)** :
  - Tout projet Next.js App Router **DOIT impérativement inclure dès l'initialisation** :
    1. `src/app/error.tsx` : Error Boundary de segment racine (`'use client'` obligatoire, avec `{ error, reset }` et bouton de réessai).
    2. `src/app/global-error.tsx` : Error Boundary global englobant `<html>` et `<body>` en cas de défaillance du Root Layout.
    3. `src/app/not-found.tsx` : Gestion propre des erreurs 404.
    4. `src/app/loading.tsx` : Skeleton / loader global assurant un feedback visuel instantané (<16ms) lors des transitions de pages sous React Suspense, empêchant la sensation de clic inactif.
  - **Interdiction formelle d'omettre ces composants** : leur absence force Next.js à injecter `<pre>missing required error components, refreshing...</pre>` avec un script de rechargement en boucle infinie qui paralyse le navigateur en cas d'erreur ou d'incident réseau/BDD.
- **Sécurisation des Hooks Clients** :
  - `usePathname()` retourne `string | null` : toujours tester la vérité de la variable avant tout appel de méthode (`pathname ? pathname.startsWith(...) : false`) pour éviter tout crash d'hydratation React.
- **Serveur Custom Next.js & Résolution d'Assets (`server.js`)** :
  - Toujours analyser l'URL avec `parse(req.url, true)` et appeler `handle(req, res, parsedUrl)`. Ne jamais passer `handle(req, res)` brut sous peine de casser la distribution des fichiers statiques et CSS avec query string (`?v=...`), ce qui produit un rendu HTML brut sans aucun style (404 CSS).
  - En mode développement (`dev`), purger automatiquement tout résidu de build de production dans `.next` (`BUILD_ID`) pour éviter les conflits de manifestes webpack et garantir la compilation CSS à chaud.
  - **Résilience permanente des Bundles CSS (Zéro 404 CSS)** : Dans `server.js`, implémenter un fallback interceptant `/_next/static/css/app/` pour servir le bundle CSS existant dans `.next/static/css/` si `layout.css` n'est pas encore compilé ou a été remplacé par un build de production. Le script `build` (`package.json`) doit synchroniser automatiquement les assets vers `.next/static/css/app/layout.css`. Les pages critiques (ex: `/login`) doivent intégrer des styles défensifs de secours en dur.

---

## 3. Robustesse & Concurrence en Base de Données
- **Timeouts de connexion stricts** :
  - Toujours spécifier `serverSelectionTimeoutMS: 3000` (ou inférieur) sur `mongoose.connect()`. Ne jamais laisser le timeout par défaut (30s) bloquer les rendus SSR ou les requêtes API en cas d'indisponibilité de la base.
- **Verrouillage atomique conditionnel** :
  - Toute prise de ticket d'astreinte doit s'effectuer via une requête atomique conditionnelle (`findOneAndUpdate({ _id, status: 'OPEN' }, ...)`).
  - En cas de collision, renvoyer un statut HTTP 409 Conflict sans altérer les données existantes.
- **Gestion des erreurs & Résilience** :
  - Toutes les opérations asynchrones (BDD, réseau, API) doivent être encapsulées dans des blocs `try / catch`.
  - Pas de crash non géré de l'application Node.js en cas d'échec d'une sonde ou d'un webhook malformé.

---

## 4. Esthétique & Expérience Utilisateur (UI/UX)
- Interface de type **tableau de bord de monitoring d'infrastructure moderne** (thème sombre, lisibilité maximale de nuit, badges de statut nets, animations subtiles non intrusives).
- **Zéro pop-up bloquante** pour les prises de ticket : feedback visuel instantané et discret dans la liste.
