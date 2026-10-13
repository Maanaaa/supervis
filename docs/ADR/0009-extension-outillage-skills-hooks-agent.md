# ADR-0009 : Extension de l'outillage agentique avec Skills et Hooks (Amende ADR-0007)

- **Date :** 2026-10-13
- **Statut :** Accepté
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
L'ADR-0007 a introduit les règles (`.agents/rules/`) et le manifeste `AGENTS.md`. Cependant, concentrer toutes les directives procédurales et vérifications dans ces fichiers alourdit le prompt système initial (consommation permanente de tokens) et repose sur la seule bonne volonté probabiliste du LLM pour respecter les garde-fous (ex: ne pas faire de push direct sur `dev`, ne pas rendre la main avec des tests cassés).

## Décision retenue
Compléter les règles passives par les mécanismes natifs d'Antigravity :
1. **Introduction des Skills (`.agents/skills/`) à la demande :**
   - `adr-authoring` : Formalisation des ADR sans tests.
   - `ticket-lifecycle` : Traitement de ticket (branche, validation locale, PR, CI).
   - `commit-crafting` : Nommage court, messages concrets, sortie minimale de tokens.
2. **Introduction des Lifecycle Hooks (`.agents/hooks.json`) déterministes :**
   - `PreToolUse` (`git-security`) : Blocage des commandes Git risquées (`push origin dev/main`, `reset --hard`).
   - `PostToolUse` (`auto-format`) : Auto-formatage Prettier silencieux après écriture de code.
   - `Stop` (`test-guard`) : Blocage de la sortie si des tests Jest échouent sur du code applicatif modifié.
3. **Allègement d'AGENTS.md & Directive stricte d'économie de tokens :**
   - Consigne explicite imposant des outputs minimaux à l'IA pour réduire la facture de tokens de sortie.

## Alternatives envisagées
1. **Conserver toutes les instructions dans AGENTS.md :** Rejeté car coûteux en tokens à chaque tour de conversation et sans garantie d'exécution déterministe.
2. **Utiliser des hooks Git côté développeur (Husky) uniquement :** Rejeté car les hooks Antigravity permettent d'intercepter les actions de l'agent directement dans son cycle de décision (ex: interdire le stop ou bloquer l'outil en amont).

## Conséquences
- **Positives :**
  - Réduction de la taille du prompt initial permanent.
  - Sécurité mécanique garantie par des scripts shell plutôt que des consignes textuelles.
  - Procédures opérationnelles isolées et chargées uniquement en cas de besoin (*progressive disclosure*).
- **Compromis :**
  - Nécessite de maintenir les scripts de hooks dans `.agents/scripts/`.
