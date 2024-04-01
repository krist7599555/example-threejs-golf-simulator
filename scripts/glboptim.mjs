import { NodeIO } from '@gltf-transform/core';
import { simplify, weld } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

const glbPath = path.resolve('static/models/world-golfplatz-big-cp.glb');
const io = new NodeIO();
const document = await io.read(glbPath);
// const document2 = document.clone();

// simplify a lot
await document.transform(
  //   prune(),
  //   dedup(),
  //   draco(),
  weld({ tolerance: 0.1 }),
  simplify({ simplifier: MeshoptSimplifier, ratio: 1, error: 1 })
);

// simplify a little
// await document2.transform(
//   weld({ tolerance: 0.0001 }),
//   simplify({ simplifier: MeshoptSimplifier, ratio: 0.01, error: 0.0001 })
// );

const glb = await io.writeBinary(document);
await fs.writeFile(glbPath, glb);
