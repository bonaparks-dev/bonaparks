# Bonaparks Vision

Relie les caméras d'un Reolink Home Hub à la maison 3D (`site/maison3d.html?live`). Tout tourne sur l'ordinateur de la
maison ; aucune image ne part en ligne. Prototype local, pas encore un produit.

## Ce qu'il fait

- **Détection** (YOLO 11, GPU) des personnes, animaux et véhicules, une analyse par caméra en parallèle ; les détections
  faibles prolongent une personne déjà suivie sans jamais en créer une (principe ByteTrack).
- **Position sur le plan** : homographie de calage (4 repères au sol), pieds lus sur la posture (YOLO pose), filtre de
  Kalman, extrapolation entre deux images.
- **Posture** debout / assis / allongé ; **lits** : « monte dans son lit », « s'endort », « sort de son lit ».
- **Cahier de bord** (`logbook.py`) : qui est dans quelle pièce, même hors de vue ; fusion des doublons ; logique de
  maison fermée (seule entrée : le portail).
- **Identité** (`identity.py`, `household.py`) : profils enregistrés par l'utilisateur, visage (OpenCV YuNet + SFace,
  photo HD à la demande), vêtements, cheveux, taille → « c'est sûrement X, n % ».
- **Apprentissage continu** (`learning.py`) : limite adulte / enfant par caméra, corrections (« ce n'est rien »,
  « un reflet »), miroirs.
- **Portail** (`gate.py`) : état appris par exemples « fermé » / « ouvert ».
- **Hologramme** : la vidéo projetée sur le sol 3D, personnes effacées (fond appris), pour ne pas les voir en double.

## Lancer

```
python -m venv venv
venv\Scripts\pip install torch torchvision --index-url https://download.pytorch.org/whl/cu128
venv\Scripts\pip install ultralytics opencv-python numpy
copy config.example.json config.json      # puis mettre l'adresse du Hub
# reolink-acces.txt :  utilisateur=...  /  mot_de_passe=...
# models\ : face_detection_yunet_2023mar.onnx et face_recognition_sface_2021dec.onnx (opencv_zoo)
venv\Scripts\python bridge.py
```

Puis ouvrir `site/maison3d.html?live` en local (le mode live ne s'active qu'avec `?live`).

## Vie privée

Les fichiers de la maison (`config.json`, identifiants, profils, visages, photos, cahier de bord, calages) sont exclus du
dépôt par `.gitignore`. Pour une version vendue : la reconnaissance faciale relève du « haut risque » de l'AI Act
(annexe III, à partir de décembre 2027) et doit rester une option désactivée par défaut.
