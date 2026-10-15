# ADR-0007 : Gouvernance de la qualité de code et règles d'agent (.agents/rules/ & AGENTS.md)

- **Date :** 2026-10-12
- **Statut :** Amendé par ADR-0009
- **Décideurs :** Théo, Antigravity

---

## Contexte et Problématique
Pour éviter la dette technique, les régressions et les incohérences d'implémentation lors du travail en pair-programming avec l'assistant IA (Gemini 3.6 sous Antigravity), il est indispensable d'encadrer strictement la qualité du code produit.
Sans règles formellement injectées, les LLMs risquent d'utiliser des types laxistes (`any`), de créer des composants clients inutiles (`'use client'`), ou d'omettre la gestion des erreurs et de la concurrence atomique.
L'utilisateur a souhaité transposer les bonnes pratiques éprouvées (comme `CLAUDE.md` et `.claude/rules/` sous Claude Code) dans l'écosystème Antigravity.

## Décision retenue
Adopter le système natif de personnalisation et de règles d'Antigravity :
1. **Manifeste racine `AGENTS.md` :**
   - Reconnu nativement par le moteur de découverte d'Antigravity.
   - Sert de protocole d'accueil obligatoire à chaque ouverture de session (boussole de navigation vers `docs/contexte.md`, `docs/adr/`, etc.).
2. **Dossier de règles de workspace `.agents/rules/` :**
   - **`code-quality.md` :** Interdiction du type `any`, typage strict TypeScript, priorité absolue aux Server Components (RSC), gestion atomique des verrous MongoDB (`findOneAndUpdate`), gestion systématique des erreurs `try/catch`.
   - **`testing-standards.md` :** Cadrage des jeux d'essai pour les 4 typologies de serveurs et scénarios d'astreinte.
3. **Workflow de pilotage GitHub Kanban :**
   - L'IA pilote ses tickets (`gh issue create`, avancement, clôture).
   - L'humain (Théo) valide, relit et audite les commits/pushs.

## Alternatives envisagées
1. **Consignes répétées manuellement dans le prompt utilisateur :** Écarté car fastidieux, source d'oublis et impossible à pérenniser si un tiers reprend le projet.
2. **Règles machine globales (`~/.gemini/config/`) :** Écarté car ces règles ne seraient pas versionnées dans le dépôt Git et invisibles pour les enseignants/évaluateurs.

## Conséquences
- **Positives :**
  - Application automatique et déterministe des contraintes de qualité à chaque génération de code.
  - Règles versionnées dans Git sur la branche `dev` et partagées avec tous les collaborateurs.
  - Conformité garantie avec les attendus académiques et professionnels.
- **Compromis :**
  - Nécessite d'amender ou enrichir les règles dans `.agents/rules/` si les standards du projet évoluent.
