<script lang="ts">
import {
  Scene,
  AxesHelper,
  PerspectiveCamera,
  AmbientLight,
  WebGLRenderer,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  AnimationMixer,
  Object3D,
  Clock,
  TextureLoader,
  Vector3,
  BackSide,
  BoxGeometry,
  Box3,
  Group,
  EventDispatcher,
  SkeletonHelper,
  SphereGeometry,
  SkinnedMesh,
  Bone,
  DirectionalLight
} from 'three';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { pipe, F } from '@mobily/ts-belt';
import { degToRad } from 'three/src/math/MathUtils.js';
import { mix } from 'three/examples/jsm/nodes/Nodes.js';
import { untrack } from 'svelte';
import GUI from 'lil-gui';
import type { AnymatchFn } from 'vite';

console.log('Scene');

const { tap } = F;
let { canvas }: { canvas: HTMLCanvasElement } = $props();

const gui = new GUI();
const debugGui = gui.addFolder('Debug');
const debugParam = $state({
  fps: true,
  axes: true
});
debugGui.add(debugParam, 'fps').name('fps');
debugGui.add(debugParam, 'axes').name('axes');

const isMesh = <T,>(obj: T): obj is T & Mesh => {
  return (obj as any).isMesh;
};
const scene = new Scene();
const sceneAdd = <T extends Object3D>(obj: T) => {
  scene.add(obj);
  return obj;
};

const directionalLight = new DirectionalLight(0xff0000, 0);

sceneAdd(directionalLight);
// const light = pipe(
//   new PointLight(0xffffff, 10),
//   tap(_ => _.position.set(0.8, 1.4, 1.0)),
//   sceneAdd
// );

// sceneAdd(new AxesHelper(5));

const ambientLight = pipe(new AmbientLight(0xffffff, 3), sceneAdd);

const camera = pipe(
  new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000),
  tap(_ => {
    _.position.set(0.6, 2.4, 4);
    _.lookAt(5, 0, 0);
  })
);
const viewHelper = new ViewHelper(camera, canvas);

const renderer = new WebGLRenderer({ canvas, antialias: true });
renderer.setClearColor(0xffffff);
renderer.autoClear = false;
const controls = pipe(
  new OrbitControls(camera, canvas),
  tap(_ => {
    _.enableDamping = true;
    _.target.set(0, 1, 0);
  })
);

const material = new MeshNormalMaterial();

function render() {
  renderer.clear();
  renderer.render(scene, camera);
  untrack(() => {
    if (debugParam.axes) {
      viewHelper.render(renderer);
    }
  });
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

const stats = new Stats();
let mixer: AnimationMixer;

const clock = new Clock();
const eventDispatcher = new EventDispatcher<{ render: { delta: number } }>();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  eventDispatcher.dispatchEvent({ type: 'render', delta });
  controls.update();
  if (mixer) mixer.update(delta);
  render();
  stats.update();
}

$effect(() => {
  stats.dom.style.display = debugParam.fps ? 'block' : 'none';
});
console.log('INIT');
$effect(() => {
  console.log('EFFECT');
  window.addEventListener('resize', onWindowResize, false);
  document.body.appendChild(stats.dom);
  onWindowResize();
  animate();

  const fbxLoader = new FBXLoader();
  const gltfLoader = new GLTFLoader();
  const textureLoader = new TextureLoader();

  fbxLoader.loadAsync('models/ty-full.fbx').then(async boy => {
    boy.castShadow = true;
    boy.receiveShadow = true;
    boy.rotateY(degToRad(180));
    boy.traverse(child => {
      if (isMesh(child)) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    boy.position.x = -0.5;
    const boyGui = gui.addFolder('Boy');
    boyGui.add(boy.position, 'x').name('x');
    boyGui.add(boy.position, 'y').name('y');
    boyGui.add(boy.position, 'z').name('z');
    boyGui.add(boy.rotation, 'y', -Math.PI, Math.PI).name('rotation');

    boy.scale.set(0.01, 0.01, 0.01);

    mixer = new AnimationMixer(boy);
    const anim1 = mixer.clipAction(boy.animations[0]);
    anim1.play();
    anim1.setDuration(10);
    scene.add(boy);
    // scene.add(new SkeletonHelper(boy));

    return gltfLoader.loadAsync('models/golf-club-iron.glb').then(gltf => {
      const club = gltf.scene;

      // club.add(new Mesh(new SphereGeometry(1, 10, 10), material));

      const clubGui = gui.addFolder('Club');

      const handLeft = boy.getObjectByName('mixamorigLeftHand')! as Bone;
      const handRight = boy.getObjectByName('mixamorigRightHand')! as Bone;

      // handLeft.add(club);
      club.position.set(0.3, 0.05, 0);
      club.rotateZ(degToRad(6));
      // club.rotateZ(degToRad(6));
      const club2 = new Group();
      club2.add(club);
      club2.scale.setScalar(130);
      club2.rotateY(degToRad(180));
      club2.rotateZ(degToRad(40));
      club2.rotateX(degToRad(180));
      club2.position.y = 10;
      clubGui
        .add(club2.scale, 'x')
        .name('scale')
        .step(1)
        .onChange((s: number) => {
          club2.scale.setScalar(s);
        });
      clubGui.add(club2.position, 'x');
      clubGui.add(club2.position, 'y');
      clubGui.add(club2.position, 'z');
      handLeft.add(club2);
      console.log({ handLeft, handRight });

      // club.position.set(0, 0, 0);
      return gltf;
    });
  });

  const skyGui = gui.addFolder('Sky');
  const skyMesh = new Mesh(new BoxGeometry(1500, 1500, 1500), [] as MeshBasicMaterial[]);
  scene.add(skyMesh);
  skyGui
    .add({ theme: 'hot' }, 'theme', [
      'arch3',
      'cave3',
      'dark',
      'hot',
      'rainbow',
      'sh',
      'skyast',
      'skyhsky',
      'skype',
      'sp2',
      'sp3',
      'tron'
    ])
    .onChange((theme: string) => {
      console.log({ theme });
      Promise.all(
        // ['px', 'nx', 'py', 'ny', 'pz', 'nz']
        ['ft', 'bk', 'up', 'dn', 'rt', 'lf']
          .map(side => `models/skybox-elyvisions/${theme}_${side}.png`)
          .map(url => textureLoader.loadAsync(url))
      )

        .then(textures =>
          textures.map(texture => new MeshBasicMaterial({ map: texture, side: BackSide }))
        )
        .then(materials => {
          skyMesh.material = materials;
          skyMesh.rotateY(2.9);
          skyMesh.position.y = 38;
          skyGui.add(skyMesh.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
          skyGui.add(skyMesh.position, 'y').name('y');
        });
    })
    .setValue('rainbow');

  gltfLoader.loadAsync('/models/world-golfplatz-big.glb').then(world => {
    const golfField = world.scene;
    golfField.rotation.y = -0.6;
    golfField.rotation.x = 0.05;
    golfField.position.set(40, 78.65, 120);
    golfField.scale.setScalar(2);
    golfField.traverse(child => {
      if (isMesh(child)) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(golfField);

    const golfFieldGui = gui.addFolder('GolfField');
    golfFieldGui
      .add(golfField.scale, 'x', 0.5, 3, 0.1)
      .name('scale')
      .onChange((s: number) => golfField.scale.setScalar(s));
    golfFieldGui.add(golfField.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
    golfFieldGui.add(golfField.position, 'x').name('x');
    golfFieldGui.add(golfField.position, 'y').name('y').step(0.1);
    golfFieldGui.add(golfField.position, 'z').name('z');
    return world;
  });
});
</script>
