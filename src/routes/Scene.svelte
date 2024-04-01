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
let debugParam = $state({ fps: true, axes: true });

const gui = new GUI();
const _debugGui = tap(gui.addFolder('Debug'), _ => {
  _.add(debugParam, 'fps').name('fps');
  _.add(debugParam, 'axes').name('axes');
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
