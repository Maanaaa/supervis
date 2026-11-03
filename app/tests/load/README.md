# Tests de Charge avec Artillery

Ce dossier contient les scénarios de test de charge (Load Testing & Stress Testing) pour l'application **supervis-app**, permettant d'éprouver la résistance des routes HTTP Next.js et de l'accès MongoDB sous forte concurrence.

## Scénarios disponibles

- `artillery.yml` : Scénario complet avec 3 phases (Échauffement, Montée en charge progressive, Charge soutenue). Sollicite la lecture/écriture MongoDB et l'authentification.
- `artillery-smoke.yml` : Test ultra-rapide (2 secondes, 1 req/s) pour s'assurer que le banc de test répond sans erreur.

## Prérequis

L'application doit être lancée localement (avec MongoDB accessible) :
```bash
npm run dev
# ou
npm run start
```

## Commandes d'exécution

```bash
# Exécution du test de charge standard
npm run test:load

# Exécution du smoke test rapide
npm run test:load:smoke

# Génération d'un rapport HTML détaillé
npm run test:load:report
```

## Personnalisation de l'URL cible

Vous pouvez surcharger l'URL cible via la variable d'environnement `TARGET_URL` :
```bash
TARGET_URL=http://staging.supervis.local:3000 npm run test:load
```
