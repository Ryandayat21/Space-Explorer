import { createServer } from 'vite';
import { spawn } from 'node:child_process';

// Own Vite in this process; avoid orphaned npm/cmd server wrappers on Windows.
const server = await createServer({ server: { host: '127.0.0.1', port: 5183, strictPort: false } });
try {
  await server.listen();
  const url = `http://127.0.0.1:${server.httpServer.address().port}`;
  process.exitCode = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)], {
      stdio: 'inherit', env: { ...process.env, PLAYWRIGHT_BASE_URL: url },
    });
    child.on('error', reject); child.on('exit', code => resolve(code ?? 1));
  });
} finally { await server.close(); }
