// Handled failures remain visible in diagnostics without repeating every frame.
export function createReporter(sink = (...args) => console.info(...args)) {
  const reported = new Set();
  return (code, error) => {
    if (reported.has(code)) return;
    reported.add(code);
    sink(`[Milky Way Observer: ${code}]`, error?.name ?? 'Error', error?.message ?? String(error ?? ''));
  };
}
export const reportFailure = createReporter();

// Context restoration does not guarantee application-owned GPU resources are valid.
// This application deliberately requires navigation/reload instead of reinitializing.
export function watchGraphicsContext(canvas, { stop, status, report = reportFailure }) {
  let lost = false;
  const onLost = event => {
    event.preventDefault();
    if (lost) return;
    lost = true;
    report('webgl-context-lost', new Error('Rendering stopped; reload required'));
    stop();
    status('Konteks grafis terputus. Simulasi dihentikan. Tutup tab berat, periksa akselerasi grafis, lalu pilih Muat Ulang.');
  };
  const onRestored = () => {
    if (!lost) return;
    status('Konteks grafis tersedia kembali, tetapi scene belum dipulihkan. Pilih Muat Ulang untuk memulai instance yang bersih.');
  };
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
  };
}
