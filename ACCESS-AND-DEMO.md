# Parks 3D — accès et scénarios

Le site reste déployé sur le projet Netlify `bonaparks1` par la branche `main`.

## Parcours

L’accueil présente quatre scénarios de 60 secondes réelles. Chaque scénario parcourt les trois rendus approuvés : ensemble, RDC et étage. Ils jouent sans inscription dans un iframe public `/demo.html`, distinct des routes protégées du studio, sans modifier les réglages du studio personnel. L’arrivée démarre à l’ouverture, puis revient à l’ensemble en exploration libre. Le visiteur peut mettre en pause, rejouer, déplacer le curseur ou utiliser les petites commandes latérales (éclairage, quatre circuits d’eau, climatisation ON/OFF, portail, contact et phares). Une seule boucle RAF pilote les changements de niveau sans accélérer la chronologie. L’arrivée éclaire chaque pièce après l’entrée des occupants ; le départ éteint la climatisation et les lumières avant la sortie de la voiture. Les personnages et les événements sont des simulations, sans analyse vidéo ni connexion à un équipement.

## Langues

Le sélecteur de l’en-tête propose français, anglais, italien, espagnol, allemand, chinois simplifié et russe. La préférence `parks.language` reste dans le navigateur ; `?lang=fr|en|it|es|de|zh|ru` permet de partager une version. La navigation, les formulaires, les légendes des scénarios, les commandes, l’éditeur et les pages d’information utilisent des catalogues locaux `site/i18n-*.mjs`, sans service de traduction distant. Les noms saisis et les projets enregistrés ne sont pas réécrits. Ajouter toute nouvelle copie aux sept colonnes du catalogue ; les tests vérifient les pages publiques et chaque chapitre des scénarios.

## Accès par nom et e-mail

`parks-access` crée un accès découverte de 30 jours. L’adresse déclarée n’est pas vérifiée : ce parcours ne sert pas à protéger ni à retrouver les données privées d’un utilisateur. Les projets restent exclusivement dans son navigateur. Ne pas transformer cet accès en compte privé sans vérification d’e-mail ou authentification supplémentaire.

Les contacts sont dans le store privé Netlify Blobs `parks-demo-access`, sous `contacts/<uuid>`. Ils sont consultables par le propriétaire dans l’interface Netlify Blobs. Aucun endpoint public ne permet de lister les contacts. Les champs comprennent le nom, l’e-mail, le fournisseur, `emailVerified`, le choix commercial et sa preuve horodatée. Les adresses du parcours e-mail ont `emailVerified: false` : les qualifier et vérifier avant toute campagne. Aucun e-mail n’est envoyé automatiquement.

Le consentement commercial est séparé, facultatif et décoché par défaut. Les durées de conservation sont de 30 jours sans accord et trois ans avec accord. La fonction planifiée `parks-access-cleanup` supprime les contacts et sessions expirés et les compteurs de limitation obsolètes. Les demandes d’exercice des droits arrivent au contact public indiqué sur le site.

Les sessions utilisent un jeton aléatoire, dont seul le hash est stocké côté serveur, et un cookie Secure / HttpOnly / SameSite=Lax. Les POST sont protégés par contrôle d’origine et jeton CSRF. Les routes `/studio` et `/studio.html` passent par `parks-studio`, qui vérifie la session côté serveur. Les rendus architecturaux restent des ressources publiques de présentation.

## Activer Google (configuration requise)

Créer ou utiliser un client OAuth **Application Web** dans le projet Google Cloud du propriétaire. Autoriser l’origine `https://bonaparks.com` et, si utilisée, `https://www.bonaparks.com`. Définir `PARKS_GOOGLE_CLIENT_ID` dans les variables Netlify, portée Functions, puis redéployer. Aucun secret client n’est nécessaire pour Google Identity Services avec ID token.

La fonction vérifie la signature Google, l’audience, l’émetteur, l’expiration, le nonce et l’e-mail vérifié via `jose`. Le nom et l’e-mail viennent du jeton vérifié, jamais du profil envoyé séparément par le navigateur. Le SDK Google n’est chargé qu’après un clic. Sans client configuré, le site indique que Google n’est pas encore disponible ; il ne simule pas une connexion.

## Vérification

`npm test` couvre l’accès, les protections, le consentement, les parcours, les changements d’étage et les équipements. `npm run build` vérifie les références statiques. `npm run preview` sert une version locale avec un store d’accès temporaire en mémoire ; aucune donnée de test n’est envoyée à Netlify.
