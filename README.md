# Portfolio — Spider-Verse Edition

Portfolio personnel inspiré de Spider-Man: Across the Spider-Verse.

## Stack
- HTML / CSS vanilla
- Tailwind CSS (browser CDN)
- Three.js v0.160 (via importmap ESM)
- Animate.css, Font Awesome
- Google Fonts : Bangers, Bungee, Inter

## Lancer en local
Ouvrir `index.html` directement, ou servir le dossier :
```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

## Ajouter le personnage 3D (Mixamo)
1. Modéliser / récupérer le portrait 3D.
2. Upload sur https://www.mixamo.com → auto-rig.
3. Choisir une animation → Download **FBX for Unity (.fbx)** avec skin.
4. (Recommandé) Convertir FBX → GLB :
   - Blender : Import FBX → Export glTF 2.0 (.glb)
   - ou CLI : `npx @gltf-transform/cli fbx2glb input.fbx output.glb`
5. Placer dans `assets/models/portrait.glb`.
6. Dans `script.js`, décommenter `modelPath: 'assets/models/portrait.glb'`.

## Déploiement GitHub Pages
```bash
git remote add origin git@github.com:<user>/<repo>.git
git push -u origin main
# puis activer Pages sur la branche main dans les settings du repo
```
