# Bonaparks TV : écran d'accueil pour Android TV

Accueil léger (Java, sans dépendance) : les applis gardées en grandes tuiles, l'heure, et un rendu de maison Bonaparks en
fond. Il s'ouvre au démarrage et au réveil de la TV. Compilation sans Gradle : `aapt2` + `javac` + `d8` + `apksigner`
(build-tools 34, android-28). Le fichier `.apk` et la clé de signature ne sont pas dans le dépôt.
