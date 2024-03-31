<script lang="ts">
import {
  Scene,
  AxesHelper,
  PerspectiveCamera,
  AmbientLight,
  PointLight,
  WebGLRenderer,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  AnimationMixer,
  Object3D,
  Clock
} from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { pipe, F } from '@mobily/ts-belt';
import { degToRad } from 'three/src/math/MathUtils.js';
import { mix } from 'three/examples/jsm/nodes/Nodes.js';
const { tap } = F;

let { canvas }: { canvas: HTMLCanvasElement } = $props();

const scene = new Scene();
const sceneAdd = <T extends Object3D>(obj: T) => {
  scene.add(obj);
  return obj;
};

const axe = pipe(
  new AxesHelper(5),
  sceneAdd
  //
);

const light = pipe(
  new PointLight(0xffffff, 10),
  tap(_ => _.position.set(0.8, 1.4, 1.0)),
  sceneAdd
);

const ambientLight = pipe(new AmbientLight(), sceneAdd);

const camera = pipe(
  new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000),
  tap(_ => _.position.set(0.8, 1.4, 1.0))
);

const renderer = new WebGLRenderer({ canvas });
const controls = pipe(
  new OrbitControls(camera, canvas),
  tap(_ => {
    _.enableDamping = true;
    _.target.set(0, 1, 0);
  })
);

const material = new MeshNormalMaterial();

function render() {
  renderer.render(scene, camera);
}
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

const stats = new Stats();
let mixer = $state<AnimationMixer>();

const clock = new Clock();
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  if (mixer) mixer.update(clock.getDelta());
  render();
  stats.update();
}

$effect(() => {
  window.addEventListener('resize', onWindowResize, false);
  document.body.appendChild(stats.dom);
  onWindowResize();
  animate();

  const fbxLoader = new FBXLoader();
  fbxLoader.loadAsync('models/golf-drive.fbx').then(object => {
    // object.traverse((child) => {
    //   if ((child as Mesh).isMesh) {
    //     // (child as Mesh).material = material;
    //     if ((child as Mesh).material) {
    //       ((child as Mesh).material as MeshBasicMaterial).transparent = false;
    //     }
    //   }
    // });
    object.scale.set(0.01, 0.01, 0.01);

    // mixer = new AnimationMixer(object);

    // const animationAction = mixer.clipAction(object.animations[0]);
    // animationAction.play();
    // animationActions.push(animationAction)
    // animationsFolder.add(animations, 'default')
    // activeAction = animationActions[0]

    scene.add(object);
  });
  // const gltfLoader = new GLTFLoader();
  // gltfLoader.loadAsync('models/golf-club.glb').then(object => {
  //   const mesh = object.scene;
  //   mesh.position.y = 4.65;
  //   mesh.rotateX(degToRad(90));
  //   scene.add(mesh);
  // });
});
</script>
