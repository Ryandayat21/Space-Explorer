// One import attempt per page. Reload is the recovery path for failed/stale chunks.
// A timed-out import may finish in the browser cache, but cannot create a scene.
export function lazyModule(importModule, timeoutMs = 15000) {
  let request;
  return () => request ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Module loading timed out; reload required')), timeoutMs);
    Promise.resolve().then(importModule).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}
