import type { LayoutLoad } from './$types';

export const load = (async () => {
  return {};
}) satisfies LayoutLoad;

export const prerender = true;
export const csr = true;
export const ssr = true;
