import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execSync } from 'child_process'
import url from 'url'

function gitPlugin() {
  return {
    name: 'vite-plugin-git-api',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;

        if (pathname === '/api/git/log') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const rawLog = execSync('git log --pretty=format:"%H|%an|%ad|%s" --date=short -n 30', { encoding: 'utf8' });
            const commits = rawLog.split('\n').filter(Boolean).map(line => {
              const [hash, author, date, message] = line.split('|');
              let files: string[] = [];
              try {
                const filesRaw = execSync(`git show --name-only --pretty="" ${hash}`, { encoding: 'utf8' });
                files = filesRaw.split('\n').filter(Boolean).map(f => f.trim());
              } catch (e) {}
              return { hash, author, date, message, files };
            });
            res.end(JSON.stringify({ success: true, commits }));
          } catch (error) {
            res.end(JSON.stringify({ success: false, error: String(error), fallback: true }));
          }
          return;
        }

        if (pathname === '/api/git/status') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const rawStatus = execSync('git status --porcelain', { encoding: 'utf8' });
            const files = rawStatus.split('\n').filter(Boolean).map(line => {
              const status = line.substring(0, 2).trim();
              const path = line.substring(3).trim();
              return { status, path };
            });
            res.end(JSON.stringify({ success: true, files }));
          } catch (error) {
            res.end(JSON.stringify({ success: false, error: String(error) }));
          }
          return;
        }

        if (pathname === '/api/git/diff') {
          res.setHeader('Content-Type', 'application/json');
          const hash = parsedUrl.query.hash;
          try {
            let diff = '';
            if (hash) {
              diff = execSync(`git show ${hash}`, { encoding: 'utf8' });
            } else {
              diff = execSync('git diff', { encoding: 'utf8' });
            }
            res.end(JSON.stringify({ success: true, diff }));
          } catch (error) {
            res.end(JSON.stringify({ success: false, error: String(error) }));
          }
          return;
        }

        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), gitPlugin()],
})

