# Architecture de l'Outillage Agentique (Antigravity)

Ce document décrit l'écosystème mis en place dans le dossier `.agents/` pour encadrer, automatiser et sécuriser les interactions avec l'IA.

---

## 1. Vue d'Ensemble des 3 Piliers

L'infrastructure agentique repose sur 3 mécanismes complémentaires :

```
                  ┌──────────────────────────────────────────────┐
                  │                 RUNTIME IA                   │
                  └──────┬────────────────────┬───────────┬──────┘
                         │                    │           │
           1. Ingestion permanente    2. À la demande     │ 3. Interception
                         ▼                    ▼           ▼
                  ┌──────────────┐     ┌──────────────┐   ┌──────────────┐
                  │    RULES     │     │    SKILLS    │   │    HOOKS     │
                  │   (Passif)   │     │   (Actif)    │   │ (Mécanique)  │
                  └──────────────┘     └──────────────┘   └──────────────┘
```

1. **Rules (`.agents/rules/` & `AGENTS.md`)** :
   - Contraintes passives permanentes (typage strict TypeScript, Server Components prioritaires, concurrence atomique MongoDB).
2. **Skills (`.agents/skills/`)** :
   - Runbooks opérationnels activés uniquement quand la tâche le nécessite (principe de *progressive disclosure* pour économiser les tokens).
3. **Hooks (`.agents/hooks.json` & `.agents/scripts/`)** :
   - Garde-fous programmatiques déterministes exécutés par le moteur Antigravity avant/après les outils ou lors de la terminaison.

---

## 2. Les Skills Disponibles (`.agents/skills/`)

### `adr-authoring`
- **Emplacement :** `.agents/skills/adr-authoring/SKILL.md`
- **Objectif :** Rédiger ou amender une Architecture Decision Record.
- **Règles clés :**
  - Respect de l'immuabilité (on amende, on ne réécrit pas).
  - Numérotation séquentielle et template standard.
  - Mise à jour du tableau index dans `docs/ADR/README.md`.
  - Création du ticket GitHub associé.
  - **Interdiction formelle de lancer ou d'afficher des tests** pour de la documentation pure.

### `ticket-lifecycle`
- **Emplacement :** `.agents/skills/ticket-lifecycle/SKILL.md`
- **Objectif :** Traiter un ticket GitHub de bout en bout.
- **Règles clés :**
  - Branche dédiée `feat/issue-X-<slug>` depuis `dev`.
  - Validation locale complète obligatoire (`typecheck`, `lint`, `format:check`, `test`, `build`).
  - Ouverture de Pull Request vers `dev` et surveillance des checks GitHub Actions.

### `commit-crafting`
- **Emplacement :** `.agents/skills/commit-crafting/SKILL.md`
- **Objectif :** Structurer les commits Git de manière compacte et signifiante.
- **Règles clés :**
  - Format : `<type>(<scope>): <action courte>` (≤ 50 caractères).
  - Corps en 1 à 3 puces concrètes avec référence au ticket (`Closes #X`).
  - Économie drastique de tokens de sortie dans les rapports d'agent.

---

## 3. Les Hooks Déployés (`.agents/hooks.json`)

Les hooks s'exécutent de façon synchrone en invoquant les scripts de `.agents/scripts/` :

| Nom | Événement | Outil ciblé | Script | Action |
| :--- | :--- | :--- | :--- | :--- |
| `git-security` | `PreToolUse` | `run_command` | `./scripts/git-guard.sh` | Bloque les pushs directs sur `main`/`dev`, les pushs forcés et les `reset --hard`. |
| `auto-format` | `PostToolUse` | `write_to_file\|replace_file_content` | `./scripts/auto-format.sh` | Formate automatiquement le code de `app/` avec Prettier. |
| `test-guard` | `Stop` | Terminaison agent | `./scripts/test-guard.sh` | Empêche l'agent de terminer si du code applicatif sous `app/` a été modifié et que les tests Jest échouent. |

---

## 4. Politique d'Économie de Tokens

Pour optimiser le coût et la réactivité des sessions d'IA :
- **Allègement d'AGENTS.md :** Les longs détails procéduraux ont été déportés dans les skills.
- **Progressive disclosure :** L'agent ne charge que les runbooks dont il a besoin.
- **Outputs minimaux :** L'agent communique de façon directe (≤ 5 lignes pour les bilans d'étape, pas de paraphrase, ni d'écho de code visible dans les diffs).
