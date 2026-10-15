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

---

## 5. Sécurité, Autorisation & Contrôle d'Accès Backend (Zéro Confiance Client)
- **Zéro confiance dans les payloads clients :** Ne JAMAIS faire confiance aux champs d'identité envoyés dans le corps JSON des requêtes (`operator`, `currentOperator`, `userId`).
- **Validation serveur stricte par session signée :** Toute action sensible modifiant l'état d'un incident (`ACK`, `TRANSFER`, `RESOLVE`) doit impérativement dériver et valider l'identité de l'opérateur depuis le cookie de session HttpOnly signé (`supervis_session` via `verifySessionToken`).
- **Anti-usurpation (BOLA / Impersonation) :** Si un utilisateur authentifié transmet un payload prétendant agir sous le nom d'un autre opérateur, l'API DOIT rejeter la requête avec un code HTTP `403 Forbidden`.
- **Intégrité côté client :** L'identité affichée dans l'interface utilisateur provient obligatoirement du profil de session actif (`/api/auth/me`) et ne doit en aucun cas pouvoir être falsifiée via `localStorage` ou la console du navigateur.
- **Skill de Sécurité Web Universel :** Appliquer impérativement les règles du skill [`web-security`](file:///Users/theo/Documents/IUT/Developpement/S5/SAE5.DWeb-DI.3_Developpement-et-IA/.agents/skills/web-security/SKILL.md) sur l'ensemble des endpoints et flux de données (RBAC en profondeur, protection des routes de debug/chaos, WebSockets authentifiés, anti-SSRF, rate limiting, secrets).

---

## 6. Architecture CSS & Proscription de l'Inline Styling Massif
- **Proscription de l'inline style sprawl :** Ne JAMAIS injecter des blocs de 15 à 30 propriétés CSS via `style={{ ... }}` dans le JSX pour compenser la flemme d'éditer `globals.css` ou les modules CSS.
  - L'usage de `style={{}}` est **strictement réservé aux valeurs dynamiques pures calculées au runtime** (ex: `style={{ width: `${pct}%`, backgroundColor: dynamicColor }}`).
  - Toute structure de mise en page (flexbox, grid, marges, typographies, cards) doit être déclarée dans `src/app/globals.css` sous forme de classes sémantiques ou utilitaires réutilisables.
- **Cohérence des Variables CSS :** Toujours réutiliser les tokens du design system (`var(--bg-card)`, `var(--text-primary)`, `var(--radius-md)`, `var(--accent-primary)`).

---

## 7. RBAC & Défense en Profondeur (Defense-in-Depth)
- **Ne jamais se reposer uniquement sur `middleware.ts` :** Le middleware valide la présence d'une session (authentification), mais les Route Handlers doivent valider les autorisations spécifiques (RBAC).
- **Contrôle de Rôle Granulaire :** Toute opération destructive ou d'administration (`DELETE /api/servers/[id]`, modification de privilèges) doit impérativement extraire l'utilisateur et vérifier son rôle :
  ```typescript
  const user = await getAuthenticatedUser(request);
  if (user && user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs.' }, { status: 403 });
  }
  ```
- **Gestion Stricte des Secrets d'Environnement :** En production (`NODE_ENV === 'production'`), aucune variable critique (`SESSION_SECRET`, tokens d'API) ne doit utiliser de fallback en clair dans le code sans déclencher un avertissement critique ou une exception bloquante.

---

## 8. Contrat d'Enveloppe API REST Uniforme
- Toutes les routes API sous `/api/` doivent respecter une convention de réponse uniforme et prévisible :
  - **Succès (200, 201) :**
    ```json
    { "success": true, ...données }
    ```
  - **Erreur (400, 401, 403, 404, 409, 500) :**
    ```json
    { "success": false, "error": "Message explicatif en français clair." }
    ```
- Interdiction de renvoyer tantôt `{ error: ... }`, tantôt `{ message: ... }`, tantôt du texte brut.

---

## 9. DRY & Zéro Duplication de Logique Métier
- Toute logique métier partagée (hachage de mot de passe, schémas de validation, utilitaires de formatage) doit résider dans un unique emplacement source sous `src/lib/`.
- `server.js` (CommonJS) et l'App Router (ESM) doivent importer ou partager la même source de vérité plutôt que de copier/coller des fonctions identiques.

