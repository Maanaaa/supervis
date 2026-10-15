---
name: web-security
description: >-
  Directives et patrons universels de sécurité web pour tout projet : anti-BOLA/IDOR, RBAC en profondeur,
  protection des endpoints de chaos/debug, WebSockets authentifiés, prévention SSRF, rate limiting et secrets.
---

# Skill de Sécurité Web Universel — Runbook & Garde-Fous

Ce skill formalise les **8 piliers incontournables de sécurité applicative** à respecter systématiquement lors de la conception, du développement ou de la revue de code sur n'importe quel projet web (Node.js, Next.js, Express, Fastify, Python, Go, etc.).

---

## 1. Zéro Confiance Client & Anti-BOLA / IDOR (Broken Object Level Authorization)
- **Règle d'or :** Ne JAMAIS faire confiance aux champs d'identité envoyés dans le corps JSON ou les paramètres de requête (`body.userId`, `body.operator`, `body.authorId`, `body.role`).
- **Pattern obligatoire :**
  1. L'identité de l'utilisateur exécutant l'action est **exclusivement extraite du jeton de session vérifié côté serveur** (cookie HttpOnly signé ou header `Authorization: Bearer`).
  2. Si le payload client prétend agir au nom d'un autre utilisateur (`body.userId !== session.userId`), rejeter immédiatement la requête avec un code HTTP **`403 Forbidden`** (*tentative d'usurpation d'identité*).
  3. L'écriture en base doit obligatoirement forcer l'auteur avec l'identité de session certifiée.

---

## 2. Défense en Profondeur & Contrôle d'Accès Granulaire (RBAC)
- **Règle d'or :** Ne jamais se reposer uniquement sur un middleware ou un proxy d'entrée. Le middleware atteste de l'authentification (l'utilisateur existe), mais le contrôleur/route handler doit valider l'autorisation spécifique (l'utilisateur a le droit d'effectuer CETTE action).
- **Pattern obligatoire :**
  - Toute action destructive (`DELETE`), de modification de privilèges, ou d'administration doit explicitement vérifier le rôle au niveau du handler :
    ```typescript
    const user = await getAuthenticatedUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Accès réservé aux administrateurs.' }, { status: 403 });
    }
    ```

---

## 3. Cloisonnement des Endpoints de Débogage, Simulation & Chaos Testing
- **Règle d'or :** Aucun endpoint permettant d'injecter des anomalies, de simuler des pannes, de purger la base ou de contourner les règles ne doit être accessible publiquement sans authentification.
- **Pattern obligatoire :**
  - En production (`NODE_ENV === 'production'`) : désactivation complète (renvoi 404) ou restriction absolue aux utilisateurs authentifiés avec privilège `ADMIN`.
  - Ne jamais inscrire ces routes dans les listes blanches publiques des middlewares (`isPublicRoute`).

---

## 4. Sécurisation des Canaux Temps Réel (WebSockets / Socket.IO / SSE)
- **Règle d'or :** Ne jamais laisser une connexion WebSocket ouverte à tout venant (`cors: { origin: '*' }` sans authentification).
- **Pattern obligatoire :**
  - **Handshake authentifié :** Intercepter la connexion WebSocket (`io.use(...)`) pour valider le cookie ou jeton de session avant d'accepter le client.
  - **CORS restrictif :** Restreindre les origines autorisées aux domaines applicatifs légitimes.
  - **Canaux privés :** Ne diffuser les données sensibles (alertes internes, logs d'infrastructure, adresses IP) qu'aux sockets ayant validé leurs droits d'accès.

---

## 5. Prévention SSRF (Server-Side Request Forgery)
- **Règle d'or :** Dès qu'un service effectue des requêtes HTTP sortantes vers des adresses cibles configurables par les utilisateurs (pollers, sondes de supervision, webhooks, import d'URL), la cible doit être filtrée défensivement.
- **Pattern obligatoire :**
  - Bloquer impérativement :
    - `127.0.0.1` / `localhost` / `::1` (boucle locale).
    - Les plages d'adresses privées RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
    - L'adresse de métadonnées des fournisseurs Cloud (`169.254.169.254` pour AWS/GCP/Azure).
  - N'autoriser que les ports standards explicites et imposer un timeout réseau court (≤ 3000 ms).

---

## 6. Protection Anti-Bruteforce & Rate Limiting
- **Règle d'or :** Tout point d'entrée exposé à l'authentification (`/api/auth/login`, réinitialisation de mot de passe) ou aux requêtes lourdes doit limiter la cadence des appels.
- **Pattern obligatoire :**
  - Limiteur de débit (in-memory token bucket ou Redis rate-limiter) par adresse IP et par identifiant de compte cible.
  - Renvoyer un code HTTP `429 Too Many Requests` avec l'en-tête `Retry-After` en cas de dépassement.

---

## 7. Gestion Stricte des Secrets & Fallbacks d'Environnement
- **Règle d'or :** En environnement de production, l'application ne doit JAMAIS utiliser de clés cryptographiques ou de secrets par défaut codés en dur dans le dépôt.
- **Pattern obligatoire :**
  ```typescript
  if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.includes('default'))) {
    throw new Error('[FATAL SECURITY ERROR] SESSION_SECRET non configuré ou vulnérable en production.');
  }
  ```
- Tous les cookies de session doivent porter les attributs : `HttpOnly`, `Secure` (en production), `SameSite=Lax` (ou `Strict`).

---

## 8. Idempotence & Résilience des Tâches de Fond
- **Règle d'or :** Tout worker, poller ou tâche récurrente (cron) doit être idempotent pour empêcher toute inondation (spamming d'alertes ou de courriels).
- **Pattern obligatoire :**
  - Vérifier systématiquement l'état antérieur en base (`status: { $in: ['OPEN', 'ACK'] }`) avant de générer un nouvel artefact pour un incident persistant.
