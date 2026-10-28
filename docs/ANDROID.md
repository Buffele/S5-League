# APK Android

L'application embarque le build Vite complet dans une WebView Android, servi
localement via `WebViewAssetLoader` sur une origine HTTPS. Aucun serveur PC
n'est requis. Les ressources représentent environ 1,18 Go avant compression.

Le mode paysage est demandé par l'application. Le joystick gauche pilote les
huit directions ; glisser dans la zone droite oriente la caméra. Les boutons
proposent attaque primaire/secondaire maintenue, saut/esquive selon la direction,
sprint maintenu, rechargement, compétence équipée, trois emplacements d'arme,
score et menu. Les règles physiques et les fenêtres des armes restent celles du
jeu principal. Les manettes existantes restent utilisables.

Le premier lancement mobile choisit Performance si aucune préférence graphique
n'est enregistrée. Le préchargement facultatif du catalogue complet est évité
sur mobile ; les équipements du loadout sont toujours préparés avant de jouer.

## Construire

Prérequis : Node compatible avec le projet, JDK 17 ou supérieur, SDK Android 35,
Gradle compatible avec Android Gradle Plugin 8.7.2. Configurer `ANDROID_HOME`
et `JAVA_HOME`, ou le SDK dans `android/local.properties` (non versionné).

```powershell
npm run build
gradle -p android :app:assembleDebug --console=plain
```

Résultat : `android/app/build/outputs/apk/debug/app-debug.apk`.
Cette première distribution privée utilise la signature Android de développement
locale : conserver cette clé pour pouvoir installer les mises à jour. Ce n'est
pas une publication Play Store. Aucun secret ni clé n'est inclus dans le dépôt.

La génération Release reste disponible via `:app:assembleRelease`. Le 25 octobre
2026, sa vérification Lint a été bloquée par des téléchargements Maven avec
l'erreur TLS « Tag mismatch ». La variante Debug destinée aux essais a été
générée normalement ; aucun contrôle Lint n'a été désactivé dans la configuration.

Pour tester les contrôles dans un navigateur : ouvrir `/?touch=1`. `?touch=0`
permet de les masquer explicitement.
