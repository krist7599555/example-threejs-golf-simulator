<script lang="ts">
import {
  Scene,
  PerspectiveCamera,
  AmbientLight,
  WebGLRenderer,
  Mesh,
  AnimationMixer,
  Object3D,
  Clock
} from 'three';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { pipe, F } from '@mobily/ts-belt';
import { untrack } from 'svelte';
import GUI from 'lil-gui';
import { PUBLIC_GITHUB_URL } from '$env/static/public';
import { createMeshBoy } from './mesh-boy';
import { createMeshSky } from './mesh-sky';
import { createMeshGround } from './mesh-ground';

// PROPS

let { canvas }: { canvas: HTMLCanvasElement } = $props();

// HELPER FUNCTION

const { tap } = F;

const isMesh = <T,>(obj: T): obj is T & Mesh => {
  return (obj as any).isMesh;
};

const addTo =
  <T extends Object3D>(parent: T) =>
  <C extends Object3D>(obj: C): C => {
    parent.add(obj);
    return obj;
  };

// VARIABLE

let animationMixer: AnimationMixer | undefined = undefined;
let debugParam = $state({ fps: false, axes: true, git: true });

const gui = new GUI();

tap(gui.addFolder('Debug'), _ => {
  _.add(debugParam, 'fps').name('fps');
  _.add(debugParam, 'axes').name('axes');
  _.add(debugParam, 'git').name('git');
});

const clock = new Clock();
const stats = new Stats();
const scene = new Scene();
const ambientLight = pipe(new AmbientLight(0xffffff, 3), addTo(scene));
const renderer = pipe(
  new WebGLRenderer({ canvas, antialias: true }),
  tap(_ => {
    _.setClearColor(0xffffff);
    _.autoClear = false;
  })
);
const camera = pipe(
  new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 3000),
  tap(_ => {
    _.position.set(0.6, 2.4, 4);
    _.lookAt(5, 0, 0);
  })
);
const viewHelper = new ViewHelper(camera, canvas);
const controls = pipe(
  new OrbitControls(camera, canvas),
  tap(_ => {
    _.target.set(0, 1, 0);
    _.enableDamping = true;
  })
);

// REACTIVE

$effect(() => {
  stats.dom.style.display = debugParam.fps ? 'block' : 'none';
});

// EVENT_HANDLE

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

// loop self call recursive
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();
  animationMixer?.update(delta);
  render();
  stats.update();
}

// ON_MOUNT

$effect(() => {
  window.addEventListener('resize', onWindowResize, false);
  document.body.appendChild(stats.dom);
  onWindowResize();
  animate();

  createMeshBoy().then(({ mesh, animation }) => {
    animationMixer = animation.mixer;
    scene.add(mesh.boy);

    tap(gui.addFolder('Boy'), _ => {
      _.add(mesh.boy.position, 'x').name('x');
      _.add(mesh.boy.position, 'y').name('y');
      _.add(mesh.boy.position, 'z').name('z');
      _.add(mesh.boy.rotation, 'y', -Math.PI, Math.PI).name('rotation');
    });
    tap(gui.addFolder('Club'), _ => {
      _.add(mesh.club.scale, 'x')
        .name('scale')
        .step(1)
        .onChange((s: number) => mesh.club.scale.setScalar(s));
      _.add(mesh.club.position, 'x');
      _.add(mesh.club.position, 'y');
      _.add(mesh.club.position, 'z');
    });
  });

  createMeshSky().then(sky => {
    scene.add(sky.mesh.sky);
    tap(gui.addFolder('Sky'), _ => {
      _.add(sky.mesh.sky.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
      _.add(sky.mesh.sky.position, 'y').name('y');
      _.add(sky, 'theme', sky.list_themes);
    });
  });

  createMeshGround().then(({ mesh }) => {
    scene.add(mesh.ground);
    tap(gui.addFolder('GolfField'), _ => {
      _.add(mesh.ground.scale, 'x', 0.5, 3, 0.1)
        .name('scale')
        .onChange((s: number) => mesh.ground.scale.setScalar(s));
      _.add(mesh.ground.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
      _.add(mesh.ground.position, 'x').name('x');
      _.add(mesh.ground.position, 'y').name('y').step(0.1);
      _.add(mesh.ground.position, 'z').name('z');
    });
  });
});
</script>

{#if debugParam.git}
  <a style="position: fixed; left: 2rem; bottom: 2rem" href={PUBLIC_GITHUB_URL}>
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24">
      <path
        fill="#FFF"
        d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"
      ></path>
    </svg>
  </a>
{/if}
