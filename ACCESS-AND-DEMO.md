# Parks 3D — accès et scénarios

Le site reste déployé sur le projet Netlify `bonaparks1` par la branche `main`.

## Parcours

L’accueil présente quatre scénarios de 54 à 60 secondes. Chaque scénario parcourt les trois rendus approuvés : ensemble, RDC et étage. Après inscription, ils jouent dans un iframe du studio, sans modifier les réglages du studio personnel. Le visiteur peut mettre en pause, rejouer et déplacer le curseur. Les personnages et les événements sont des simulations, sans analyse vidéo ni connexion à un équipement.

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
