/* =========================================================
   Spider-Verse Portfolio — Three.js scene
   - Une scene 3D par section (Accueil + Skills)
   - GLTFLoader + AnimationMixer prêts pour Mixamo
   - Tant que assets/models/portrait.glb n'existe pas, on
     affiche un placeholder (icosaèdre toon shader) avec
     rim-lighting magenta + cyan typique Spider-Verse.
   ========================================================= */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader }  from 'three/addons/loaders/FBXLoader.js';

const COLOR_PINK = new THREE.Color('#FF1B6B');
const COLOR_CYAN = new THREE.Color('#00F0FF');
const COLOR_YELLOW = new THREE.Color('#FFEB3B');

/** Crée une scène 3D dans un container, avec un mesh placeholder
 *  qui peut être remplacé par un .glb / .fbx Mixamo.
 *
 *  @param {string} containerId  ID du div container
 *  @param {object} opts         { modelPath?, animationPath?, scale? }
 */
function buildScene(containerId, opts = {}) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    const scene = new THREE.Scene();

    // === Camera ===
    const w = container.clientWidth || 600;
    const h = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 1.2, 4.5);

    // === Renderer ===
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // === Lights (Spider-Verse rim lighting) ===
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));

    const hemi = new THREE.HemisphereLight(0xb377ff, 0x1a0033, 0.6);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    // Rim pink (gauche)
    const rimPink = new THREE.PointLight(COLOR_PINK, 6, 12, 2);
    rimPink.position.set(-2.5, 1.5, -1);
    scene.add(rimPink);

    // Rim cyan (droite)
    const rimCyan = new THREE.PointLight(COLOR_CYAN, 6, 12, 2);
    rimCyan.position.set(2.5, 1, -1);
    scene.add(rimCyan);

    // === Placeholder mesh (toon) ===
    // Remplacé automatiquement quand le modèle Mixamo est chargé.
    const gradientMap = (() => {
        const colors = new Uint8Array([60, 120, 200, 255]);
        const tex = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
        tex.needsUpdate = true;
        tex.magFilter = THREE.NearestFilter;
        return tex;
    })();

    const placeholderGeo = new THREE.IcosahedronGeometry(1.1, 0);
    const placeholderMat = new THREE.MeshToonMaterial({
        color: 0x8B00FF,
        gradientMap
    });
    const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
    placeholder.position.y = 1.0;
    scene.add(placeholder);

    // Edges (cell-shading look)
    const edgeGeo = new THREE.EdgesGeometry(placeholderGeo);
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x0a0014, linewidth: 2 });
    const edges = new THREE.LineSegments(edgeGeo, edgeMat);
    placeholder.add(edges);

    // Sol (disque subtle)
    const floor = new THREE.Mesh(
        new THREE.CircleGeometry(2.2, 48),
        new THREE.MeshBasicMaterial({ color: 0x0a0014, transparent: true, opacity: 0.3 })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // === Animation mixer pour Mixamo (init quand modèle chargé) ===
    let mixer = null;
    let loadedModel = null;

    // === Charger un modèle Mixamo si fourni ===
    if (opts.modelPath) {
        loadCharacter(opts.modelPath, opts.animationPath, opts.scale || 1.0)
            .then(({ model, anims }) => {
                scene.remove(placeholder);
                placeholder.geometry.dispose();
                placeholder.material.dispose();
                model.position.y = 0;
                scene.add(model);
                loadedModel = model;
                if (anims.length) {
                    mixer = new THREE.AnimationMixer(model);
                    mixer.clipAction(anims[0]).play();
                }
            })
            .catch(err => console.warn(`Impossible de charger ${opts.modelPath} :`, err));
    }

    // === Resize ===
    const resize = () => {
        const nw = container.clientWidth;
        const nh = container.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', resize);

    // === Souris : léger parallax ===
    let mouseX = 0, mouseY = 0;
    container.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    // === Visibility gate : on ne rend que si le container est visible ===
    let isVisible = false;
    const visibilityObserver = new IntersectionObserver(
        (entries) => entries.forEach(e => { isVisible = e.isIntersecting; }),
        { threshold: 0.01 }
    );
    visibilityObserver.observe(container);

    // Pause aussi quand l'onglet n'a pas le focus
    let tabActive = !document.hidden;
    document.addEventListener('visibilitychange', () => { tabActive = !document.hidden; });

    // === Loop ===
    const clock = new THREE.Clock();
    const animate = () => {
        requestAnimationFrame(animate);

        if (!isVisible || !tabActive) {
            clock.getDelta(); // évite un dt énorme au retour
            return;
        }

        const dt = clock.getDelta();

        if (mixer) mixer.update(dt);

        if (!loadedModel) {
            placeholder.rotation.y += dt * 0.6;
            placeholder.rotation.x += dt * 0.2;
        } else {
            loadedModel.rotation.y += dt * 0.15;
        }

        // Parallax doux sur la caméra
        camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
        camera.position.y += (1.2 + mouseY * -0.3 - camera.position.y) * 0.05;
        camera.lookAt(0, 1, 0);

        renderer.render(scene, camera);
    };
    animate();

    return { scene, camera, renderer };
}

/** Charge un .glb (préféré) ou .fbx Mixamo */
async function loadCharacter(modelPath, animationPath, scale = 1.0) {
    const ext = modelPath.split('.').pop().toLowerCase();

    let model, anims = [];

    if (ext === 'glb' || ext === 'gltf') {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(modelPath);
        model = gltf.scene;
        anims = gltf.animations || [];
    } else if (ext === 'fbx') {
        const loader = new FBXLoader();
        model = await loader.loadAsync(modelPath);
        anims = model.animations || [];
        // FBX Mixamo : souvent à l'échelle x100
        scale = scale * 0.01;
    }

    model.scale.setScalar(scale);

    // Si une animation séparée est fournie (Mixamo exporte parfois rig + anim séparés)
    if (animationPath) {
        try {
            const ext2 = animationPath.split('.').pop().toLowerCase();
            if (ext2 === 'fbx') {
                const fbxLoader = new FBXLoader();
                const animFbx = await fbxLoader.loadAsync(animationPath);
                if (animFbx.animations?.length) anims = animFbx.animations;
            } else if (ext2 === 'glb') {
                const gltfLoader = new GLTFLoader();
                const animGltf = await gltfLoader.loadAsync(animationPath);
                if (animGltf.animations?.length) anims = animGltf.animations;
            }
        } catch (e) { console.warn('Anim non chargée :', e); }
    }

    return { model, anims };
}

// =========================================================
// Init : 2 scènes (home + skills)
// Quand tu déposes ton portrait Mixamo :
//   - convertis-le en .glb si possible (sinon .fbx fonctionne)
//   - place-le dans assets/models/portrait.glb
//   - décommente les options ci-dessous
// =========================================================
// (les scènes 3D placeholders ont été retirées — portfolio passé en pur 2D)

// =========================================================
// Section reveal (IntersectionObserver)
// =========================================================
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible');
    });
}, { threshold: 0.15 });

document.querySelectorAll('.section-anim').forEach(s => sectionObserver.observe(s));
