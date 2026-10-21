import { reportFailure } from './failures.js';
﻿// A bounded wait for an OPTIONAL asset. It does not retry or create another loader.
export async function waitForOptionalAsset(request, timeoutMs = 4000) {
  let timer;
  try {
    return await Promise.race([
      Promise.resolve(request).then(ok => ok ? 'loaded' : 'fallback', error => { reportFailure('optional-asset', error); return 'fallback'; }),
      new Promise(resolve => { timer = setTimeout(() => resolve('deferred'), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
}
export const loadingStages = {
  initializing: 'Inisialisasi', assets: 'Memuat aset', scene: 'Menyiapkan scene', ready: 'Siap', error: 'Tidak dapat melanjutkan'
};
