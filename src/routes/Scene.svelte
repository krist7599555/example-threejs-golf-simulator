<script lang="ts">
import {
  Scene,
  PerspectiveCamera,
  AmbientLight,
  WebGLRenderer,
  Mesh,
  MeshBasicMaterial,
  AnimationMixer,
  Object3D,
  Clock,
  TextureLoader,
  BackSide,
  BoxGeometry,
  Group,
  Bone,
  LoadingManager,
  Euler
} from 'three';
import { ViewHelper } from 'three/addons/helpers/ViewHelper.js';
import { DRACOLoader, OrbitControls } from 'three/examples/jsm/Addons.js';
import dracoDecoderWasmUrl from 'three/examples/jsm/libs/draco/draco_decoder.wasm?url';
import dracoWasmWrapperJsUrl from 'three/examples/jsm/libs/draco/draco_wasm_wrapper.js?url';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

import { pipe, F } from '@mobily/ts-belt';
import { degToRad } from 'three/src/math/MathUtils.js';
import { untrack } from 'svelte';
import GUI from 'lil-gui';
import { PUBLIC_GITHUB_URL } from '$env/static/public';

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
const _debugGui = tap(gui.addFolder('Debug'), _ => {
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

  const loadingManager = tap(new LoadingManager(), _ => {
    _.resolveURL = url => {
      if (url === 'draco_wasm_wrapper.js') return dracoWasmWrapperJsUrl;
      if (url === 'draco_decoder.wasm') return dracoDecoderWasmUrl;
      return url;
    };
  });
  const fbxLoader = new FBXLoader(loadingManager);
  const gltfLoader = new GLTFLoader(loadingManager).setDRACOLoader(new DRACOLoader(loadingManager));
  const textureLoader = new TextureLoader(loadingManager);

  Promise.all([
    fbxLoader.loadAsync('/models/mixamo-ty-golf_drive.fbx'),
    gltfLoader.loadAsync('/models/sketchfab-golf_club_iron-optimize.glb')
  ]).then(([boy, { scene: club }]) => {
    boy = pipe(
      boy,
      addTo(scene),
      tap(_ => {
        _.scale.set(0.01, 0.01, 0.01);
        _.castShadow = true;
        _.receiveShadow = true;
        _.rotateY(degToRad(180));
        _.position.x = -0.5;
      })
    );
    const boyHandLeft = boy.getObjectByName('mixamorigLeftHand')! as Bone;
    const clubWrapper = pipe(
      new Group(),
      addTo(boyHandLeft),
      tap(_ => {
        _.scale.setScalar(130);
        _.setRotationFromEuler(new Euler(degToRad(180), degToRad(180), degToRad(40), 'YZX'));
        _.position.setY(10);
      })
    );

    club = pipe(
      club,
      addTo(clubWrapper),
      tap(_ => {
        _.position.set(0.3, 0.05, 0);
        _.rotateZ(degToRad(6));
      })
    );

    // Swing Animatio
    animationMixer = new AnimationMixer(boy);
    const swingAnimation = animationMixer.clipAction(boy.animations[0]).setDuration(10);
    swingAnimation.play();

    // GUI
    const _boyGui = tap(gui.addFolder('Boy'), _ => {
      _.add(boy.position, 'x').name('x');
      _.add(boy.position, 'y').name('y');
      _.add(boy.position, 'z').name('z');
      _.add(boy.rotation, 'y', -Math.PI, Math.PI).name('rotation');
    });
    const _clubGui = tap(gui.addFolder('Club'), _ => {
      _.add(clubWrapper.scale, 'x')
        .name('scale')
        .step(1)
        .onChange((s: number) => clubWrapper.scale.setScalar(s));
      _.add(clubWrapper.position, 'x');
      _.add(clubWrapper.position, 'y');
      _.add(clubWrapper.position, 'z');
    });
  });

  const skyMesh = pipe(
    new Mesh(new BoxGeometry(1500, 1500, 1500), [] as MeshBasicMaterial[]),
    addTo(scene),
    tap(_ => {
      _.rotateY(2.9);
      _.position.y = 38;
    })
  );

  const _skyGui = tap(gui.addFolder('Sky'), _ => {
    // prettier-ignore
    const ALL_SKY_THEMES = ['rainbow', 'arch3', 'cave3', 'dark', 'hot', 'rainbow', 'sh', 'skyast', 'skyhsky', 'skype', 'sp2', 'sp3', 'tron']
    _.add(skyMesh.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
    _.add(skyMesh.position, 'y').name('y');
    _.add(skyMesh, 'theme', ALL_SKY_THEMES)
      .onChange(async (theme: string) => {
        skyMesh.material = await Promise.all(
          ['ft', 'bk', 'up', 'dn', 'rt', 'lf'].map(async side => {
            const url = `models/opengameart-skybox_elyvisions/${theme}_${side}.png`;
            const texture = await textureLoader.loadAsync(url);
            return new MeshBasicMaterial({ map: texture, side: BackSide });
          })
        );
      })
      .setValue(ALL_SKY_THEMES[0]);
  });

  gltfLoader.loadAsync('/models/sketchfab-golfplatz-optimize.glb').then(({ scene: golfField }) => {
    golfField = pipe(
      golfField,
      addTo(scene),
      tap(_ => {
        _.rotation.y = -0.6;
        _.rotation.x = 0.05;
        _.position.set(40, 78.65, 120);
        _.scale.setScalar(2);
      })
    );
    const _golfFieldGui = tap(gui.addFolder('GolfField'), _ => {
      _.add(golfField.scale, 'x', 0.5, 3, 0.1)
        .name('scale')
        .onChange((s: number) => golfField.scale.setScalar(s));
      _.add(golfField.rotation, 'y', -Math.PI, Math.PI, 0.1).name('rotate');
      _.add(golfField.position, 'x').name('x');
      _.add(golfField.position, 'y').name('y').step(0.1);
      _.add(golfField.position, 'z').name('z');
    });
    return golfField;
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
