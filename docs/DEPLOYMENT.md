# Deployment

The app is a static SPA — HTML, CSS, JS in a `dist/` folder. Any static host works. The instructions below cover the realistic options ordered by ease.

## Recommended: Vercel

Free tier handles this app easily. Auto-deploys on git push.

### Setup (first time, ~10 minutes)

1. Push the project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/gpu-calc.git
   git push -u origin main
   ```
2. Go to **vercel.com**, sign in with GitHub
3. Dashboard → **Add New** → **Project** → import your repo
4. Vercel auto-detects Vite. All defaults work. Click **Deploy**
5. ~60 seconds later: live at `gpu-calc-<random>.vercel.app`

### Subsequent deploys

Just push to GitHub:
```bash
git add .
git commit -m "update prices"
git push
```

Vercel rebuilds and redeploys in ~30 seconds. Production URL updates atomically (no downtime).

### Custom domain

1. Buy a domain — recommend **Cloudflare Registrar** (cloudflare.com → Domain Registration). Sells at cost, $9-10/year for `.com`.
2. In Vercel: project → **Settings** → **Domains** → add your domain
3. Vercel shows you DNS records to set. Go to Cloudflare → your domain → **DNS** → add the records exactly as shown
4. Wait 5-30 minutes for DNS propagation. HTTPS is set up automatically by Vercel via Let's Encrypt.

### Build settings (default, don't change unless needed)

- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Environment variables

None required. If you add any (e.g., for analytics keys), set them in Vercel → Settings → Environment Variables. Prefix with `VITE_` to expose them to the browser bundle.

## Alternative: Cloudflare Pages

Functionally identical to Vercel for a static SPA. Slightly different developer experience. Free tier is more generous on bandwidth.

1. Push to GitHub (same as above)
2. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Authorize, pick the repo
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Click **Save and Deploy**

You get `gpu-calc.pages.dev`. Custom domain is one click if you bought the domain through Cloudflare.

## Alternative: Netlify

Same flow as Vercel.
1. Push to GitHub
2. netlify.com → Add new site → Import existing project
3. Pick repo, accept defaults (it auto-detects Vite), Deploy

## Alternative: GitHub Pages

Free, integrated with the repo. Slightly more setup because the build artifact lives in a separate branch.

Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  },
  "devDependencies": {
    "gh-pages": "^6.1.1"
  }
}
```

Install: `npm install --save-dev gh-pages`.

Add to `vite.config.js`:
```js
export default defineConfig({
  plugins: [react()],
  base: '/gpu-calc/',  // your repo name
})
```

Deploy:
```bash
npm run deploy
```

Then in GitHub: repo → Settings → Pages → set source to `gh-pages` branch.

URL: `username.github.io/gpu-calc/`.

## Self-hosting on a VPS

Use only if you specifically want to. For a static SPA there's no benefit over Vercel/Cloudflare.

Stack: Ubuntu 24 + Nginx + Certbot.

```bash
# On your VPS
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/gpu-calc

# Locally, build and copy
npm run build
rsync -avz dist/ user@your-vps-ip:/var/www/gpu-calc/

# On VPS, configure Nginx
sudo tee /etc/nginx/sites-available/gpu-calc << 'EOF'
server {
  listen 80;
  server_name gpucalc.example.com;
  root /var/www/gpu-calc;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
EOF
sudo ln -s /etc/nginx/sites-available/gpu-calc /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS via Let's Encrypt
sudo certbot --nginx -d gpucalc.example.com
```

You're now the sysadmin. Set up unattended-upgrades, ufw firewall, server monitoring. Certbot auto-renews via cron.

## Build locally for production

```bash
npm run build
```

Outputs static files to `dist/`. You can serve this directory with any static server:

```bash
npm run preview
# or
npx serve dist
# or
python -m http.server -d dist 8000
```

## SPA routing note

The app uses no router (single page). If you add one later (React Router, TanStack Router), make sure your host handles client-side routing by serving `index.html` for all unknown paths:

- **Vercel / Netlify / Cloudflare Pages**: automatic for SPA frameworks
- **GitHub Pages**: needs a `404.html` workaround or hash routing
- **Nginx**: `try_files $uri $uri/ /index.html;` (shown above)

## Performance / caching

Vite's production build emits hashed filenames (`App-abc123.js`), so aggressive caching is safe. Vercel and Cloudflare Pages set sensible cache headers automatically. For Nginx self-host, add:

```nginx
location ~* \.(js|css|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
```

## Analytics (optional)

If you want to know who's using it:

- **Plausible** — privacy-friendly, $9/month, no cookie banner needed
- **Vercel Analytics** — built-in if you're on Vercel, free tier exists
- **Cloudflare Web Analytics** — free, privacy-friendly
- **GoatCounter** — open source, free for small sites

Don't use Google Analytics unless you really need it; the cookie banner overhead isn't worth it for a tool like this.

## Adding a backend (when needed)

You don't need a backend currently. You will if you want to:
- Scrape live retailer prices (CORS blocks it from the browser)
- Cache HuggingFace API calls (avoid rate limits)
- Add user accounts / saved configurations
- Add payment processing (don't do this client-side regardless)

Easiest paths:
- **Vercel Serverless Functions** — drop a file in `api/` directory, it becomes an endpoint. Free tier: 100GB-hours/month.
- **Cloudflare Workers** — same idea, even faster cold starts. Free tier: 100k requests/day.
- **Supabase** — Postgres + Auth + Storage. Free tier for hobby projects.

For each: the front-end calls your endpoint, the endpoint calls the external API server-side (no CORS issues, can hold API keys), responds to the browser.
