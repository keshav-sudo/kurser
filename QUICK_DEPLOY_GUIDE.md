# Quick Deployment Guide - Zero Config Setup

## 🚀 Deploy Any Framework - No Configuration Needed!

Your Kurser platform now supports **automatic framework detection** and deployment. Just push your code!

## Supported Frameworks

### React Frameworks
- ✅ **Next.js** (with or without static export)
- ✅ **Create React App**
- ✅ **Vite + React**

### Vue Frameworks
- ✅ **Vue CLI**
- ✅ **Nuxt.js**
- ✅ **Vite + Vue**

### Other Frameworks
- ✅ **Angular**
- ✅ **Svelte/SvelteKit**
- ✅ **Gatsby**
- ✅ **Any Vite project**

## How to Deploy

### Option 1: Via UI (Easiest)
1. Go to **Repositories** page
2. Find your repo
3. Click **"🚀 Deploy"** button
4. Wait 1-2 minutes
5. Click **"🚀 View Deployment"** link when ready

### Option 2: Automatic (Webhooks)
Once deployed once:
1. Push to your GitHub repo
2. Webhook triggers automatically
3. New deployment happens automatically
4. Check deployment link on Repositories page

## Framework-Specific Tips

### Next.js
**For Static Export (Recommended):**
```javascript
// next.config.js
module.exports = {
  output: 'export',
  images: {
    unoptimized: true  // Required for static export
  }
}
```
This generates static files in `out/` directory.

**For Server-Side Rendering:**
Default Next.js setup works but requires server (not supported yet).
Use static export for now.

### Tailwind CSS
Works automatically with any framework! Just ensure:
```json
// package.json
{
  "scripts": {
    "build": "vite build"  // or your build command
  },
  "devDependencies": {
    "tailwindcss": "^3.x.x"
  }
}
```

### Vite Projects
Zero config needed! Works out of the box:
```json
// package.json
{
  "scripts": {
    "build": "vite build"
  }
}
```

### Create React App
```json
// package.json
{
  "scripts": {
    "build": "react-scripts build"
  }
}
```

## Build Output Directories

The system automatically finds your build output:

| Framework | Auto-Detected Output |
|-----------|---------------------|
| Next.js (export) | `out/` |
| Next.js (default) | `.next/` |
| Vite | `dist/` |
| CRA | `build/` |
| Angular | `dist/` |
| Nuxt | `.output/public/` |
| Gatsby | `public/` |
| Svelte | `public/build/` |

**No configuration needed!** The system tries all common directories.

## Package Managers

Auto-detected based on lock files:
- `package-lock.json` → npm
- `yarn.lock` → Yarn
- `pnpm-lock.yaml` → PNPM

## Troubleshooting

### Build Fails
1. **Check build works locally:**
   ```bash
   npm install
   npm run build
   ```
2. **Check build script exists:**
   ```bash
   # In package.json
   "scripts": {
     "build": "your-build-command"
   }
   ```

### Build Succeeds but No Output
The system now searches automatically for:
- dist
- build
- out
- .next
- public

If still not found, check your framework's documentation for the correct output directory.

### Next.js Deployment Issues
Make sure you have static export enabled:
```javascript
// next.config.js or next.config.mjs
module.exports = {
  output: 'export'
}
```

### Tailwind Not Applying Styles
Ensure Tailwind is in devDependencies and build script runs it:
```json
{
  "devDependencies": {
    "tailwindcss": "^3.x.x",
    "postcss": "^8.x.x",
    "autoprefixer": "^10.x.x"
  },
  "scripts": {
    "build": "vite build"
  }
}
```

## Example Projects

### Next.js + Tailwind
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```
✅ **Auto-detected:** Next.js with Tailwind
✅ **Output:** `out/` (if configured with `output: 'export'`)

### Vite + React + Tailwind
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.4.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```
✅ **Auto-detected:** Vite + React with Tailwind
✅ **Output:** `dist/`

## Deployment URL

After successful deployment, your site is available at:
```
https://{deploymentId}.preview.kurser.app
```

The link appears on the repository card in the UI!

## Next Steps

1. ✅ Deploy your first project
2. ✅ Check the deployment link
3. ✅ Set up custom domain (coming soon)
4. ✅ Configure environment variables (coming soon)
5. ✅ Set up preview deployments for PRs (coming soon)

## Support

If you encounter issues:
1. Check the build logs in the UI
2. Verify your build works locally
3. Ensure package.json has correct build script
4. Check framework-specific requirements above

Happy deploying! 🚀
