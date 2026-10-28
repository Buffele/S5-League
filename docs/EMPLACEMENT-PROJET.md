# Emplacement du projet

30 septembre 2026.

Le dossier de travail est désormais **C:\Users\newpc\Desktop\S5 league**.
Ce chemin concerne uniquement le PC d'origine. Sur un autre ordinateur,
le dossier du clone Git est la racine active, quel que soit son emplacement.
Il contient le dépôt Git du jeu, le code, les ressources, les dépendances,
les tests et la documentation d’import.

Les anciennes captures, audits et sauvegardes du chat sont conservés dans
`work/reprise-local/`. Ces archives locales ne sont pas des ressources runtime
et restent exclues de Git ; les fichiers actifs du jeu gardent leurs règles
de suivi précédentes. Les preuves du déplacement sont dans
`work/project-relocation/`.

Les anciens chemins de documentation, de captures et de sauvegardes sont des
jonctions de compatibilité vers ce dossier. Ils ne dupliquent pas les données.
Toujours travailler et lancer le serveur depuis le dossier du Bureau.

Dans Codex, ouvrir **C:\Users\newpc\Desktop\S5 league** comme dossier de projet
pour les prochaines tâches. Le chat existant conserve son ancien dossier
enregistré ; son fichier AGENTS indique le nouveau chemin de travail.

## Lancement

Depuis le dossier du projet :

```powershell
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

Le jeu reste accessible à http://127.0.0.1:5174/.
L’installation S5Runtime externe reste sur le Bureau ; ses archives ne sont pas
nécessaires pour jouer et n’ont pas été déplacées.
