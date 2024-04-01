import { F } from '@mobily/ts-belt';
import { gltfLoader } from './loader';
const { tap } = F;

export async function createMeshGround() {
  const { scene: mesh } = await gltfLoader.loadAsync('/models/sketchfab-golfplatz-optimize.glb');
  tap(mesh, _ => {
    _.rotation.y = -0.6;
    _.rotation.x = 0.05;
    _.position.set(40, 78.65, 120);
    _.scale.setScalar(2);
  });
  return {
    mesh: { ground: mesh }
  };
}
