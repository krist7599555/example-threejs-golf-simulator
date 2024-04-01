import { F } from '@mobily/ts-belt';
import { fbxLoader, gltfLoader } from './loader';
import { degToRad } from 'three/src/math/MathUtils.js';
import type { Bone } from 'three';
import { AnimationMixer, Euler, Group } from 'three';

const { tap } = F;

export async function createMeshBoy() {
  const [boy, { scene: club }] = await Promise.all([
    fbxLoader.loadAsync('/models/mixamo-ty-golf_drive.fbx'),
    gltfLoader.loadAsync('/models/sketchfab-golf_club_iron-optimize.glb')
  ]);

  tap(boy, _ => {
    _.scale.set(0.01, 0.01, 0.01);
    _.rotateY(degToRad(180));
    _.position.x = -0.5;
  });

  const boyHandLeft = boy.getObjectByName('mixamorigLeftHand')! as Bone;
  const clubWrapper = tap(new Group(), _ => {
    _.scale.setScalar(130);
    _.setRotationFromEuler(new Euler(degToRad(180), degToRad(180), degToRad(40), 'YZX'));
    _.position.setY(10);
  });

  tap(club, _ => {
    _.position.set(0.3, 0.05, 0);
    _.rotateZ(degToRad(6));
  });

  boyHandLeft.add(clubWrapper.add(club));

  const animationMixer = new AnimationMixer(boy);
  const swingAnimation = animationMixer.clipAction(boy.animations[0]).setDuration(10);

  return {
    mesh: { boy, club: clubWrapper },
    animation: {
      mixer: animationMixer,
      swing: swingAnimation
    }
  };
}
