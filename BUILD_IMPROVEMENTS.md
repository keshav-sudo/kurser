# Build System Improvements - Smart Framework Detection

## Problem Solved
Previously, the build system would fail with "Could not find build output directory" because it was looking for a fixed output directory. This was especially problematic for:
- **Next.js** projects (default `.next` vs static export `out`)
- **Different frameworks** using different output directories
- **Custom build configurations**

## Solution: Smart Auto-Detection

### 1. Framework Detection
The build service now automatically detects the framework being used:
- ✅ **Next.js** - Special handling for static export
- ✅ **Vite** - Modern build tool
- ✅ **Create React App** - Classic React setup
- ✅ **Angular** - Angular CLI
- ✅ **Vue** - Vue CLI
- ✅ **Svelte** - Svelte Kit
- ✅ **Nuxt** - Vue framework
- ✅ **Gatsby** - Static site generator

### 2. Package Manager Detection
Automatically detects and uses the correct package manager:
- `yarn.lock` → Uses Yarn
- `pnpm-lock.yaml` → Uses PNPM
- Default → Uses NPM

### 3. Framework-Specific Configurations

```javascript
Framework         | Build Command    | Output Directory
------------------|------------------|------------------
Next.js (default) | npm run build    | .next
Next.js (export)  | npm run build    | out
Vite              | npm run build    | dist
Create React App  | npm run build    | build
Angular           | npm run build    | dist
Vue               | npm run build    | dist
Svelte            | npm run build    | public/build
Nuxt              | npm run build    | .output/public
Gatsby            | npm run build    | public
```

### 4. Smart Build Output Detection

The system now searches multiple locations for the build output:
1. User-specified directory (if provided)
2. `dist`
3. `build`
4. `out`
5. `.next`
6. `public`
7. `.output/public`
8. `dist/public`

**Returns the first directory that:**
- ✅ Exists
- ✅ Contains files (not empty)

### 5. Next.js Special Handling

For Next.js projects, the system checks `next.config.js` or `next.config.mjs` for:
```javascript
// Static export configuration
module.exports = {
  output: 'export'  // Uses 'out' directory
}
```

If not configured for export, it uses `.next` directory.

## Benefits

### 🚀 Zero Configuration
- Works out of the box for most frameworks
- No manual configuration needed
- Automatic framework detection

### 🎯 Smart Fallbacks
- Tries multiple directories if first one not found
- Helpful error messages showing available directories
- Suggests fixes when build fails

### 📦 Package Manager Support
- Detects and uses the correct package manager
- Respects lock files
- Uses appropriate commands (npm/yarn/pnpm)

### 🔍 Better Error Messages
When build output is not found, shows:
```
❌ Could not find build output directory. Searched for: dist
Available directories: src, public, node_modules, components
Tip: Check your build configuration and ensure the build output directory is correct.
```

## How It Works

### Step 1: Detection Phase
```typescript
// Auto-detect framework
const framework = await buildService.detectFramework();
// → Returns: 'next', 'vite', 'create-react-app', etc.

// Get framework-specific config
const config = await buildService.autoDetectBuildConfig();
// → Returns: { buildCommand, installCommand, outputDir }
```

### Step 2: Build Phase
```typescript
// Install dependencies (with devDependencies!)
await execAsync(installCommand, {
  env: {
    NODE_ENV: undefined,  // Critical: Don't skip devDependencies
    NPM_CONFIG_PRODUCTION: 'false'
  }
});

// Build the project
await execAsync(buildCommand, {
  env: {
    NODE_ENV: 'production'  // Now we can use production
  }
});
```

### Step 3: Output Detection Phase
```typescript
// Smart search for build output
const buildDir = await buildService.findBuildOutput();
// → Searches multiple locations
// → Returns first directory that exists and has files
```

## Examples

### Example 1: Next.js with Static Export
```javascript
// next.config.js
module.exports = {
  output: 'export'
}
```
**Detected:** Framework=next, OutputDir=out

### Example 2: Vite React App
```json
// package.json has "vite" dependency
```
**Detected:** Framework=vite, OutputDir=dist

### Example 3: Custom Tailwind Build
Even if framework isn't recognized, it searches common directories:
- Tries: dist → build → out → public
- Uses first one that exists

## Configuration Override

You can still manually specify configuration if needed:
```typescript
const buildService = new BuildService(
  repoPath,
  'npm run build',      // Custom build command
  'npm install',        // Custom install command
  'custom-dist'         // Custom output directory
);
```

## Environment Variables

The build process uses:
- `NODE_ENV=undefined` during install (to get devDependencies)
- `NPM_CONFIG_PRODUCTION=false` during install
- `NODE_ENV=production` during build
- `PATH` includes `node_modules/.bin` for local binaries

## Testing

### Tested Frameworks
- ✅ Next.js (with and without static export)
- ✅ Vite + React
- ✅ Create React App
- ✅ Vite + Vue
- ✅ Angular
- ✅ Tailwind CSS projects

### Common Issues Fixed
1. ❌ "Could not find build output directory"
   - ✅ Now tries multiple directories
   
2. ❌ "vite: command not found"
   - ✅ Now includes devDependencies during install
   
3. ❌ Next.js builds but directory wrong
   - ✅ Now checks for static export configuration
   
4. ❌ Custom build directory not detected
   - ✅ Now searches common locations automatically

## Future Enhancements

Potential additions:
- [ ] Support for Remix
- [ ] Support for Astro
- [ ] Support for Eleventy
- [ ] Support for Hugo
- [ ] Custom `kurser.config.js` for overrides
- [ ] Build caching
- [ ] Incremental builds

## Technical Details

### Files Modified
- `worker/src/services/buildService.ts` - Core build logic
- Added framework detection methods
- Added smart output directory search
- Enhanced error messages

### Key Changes
1. `detectFramework()` - Identifies framework from package.json
2. `detectNextJsConfig()` - Checks Next.js configuration
3. `autoDetectBuildConfig()` - Returns framework-specific config
4. `findBuildOutput()` - Smart search for build directory

### Dependencies
No new dependencies added! Uses existing:
- Node.js `fs/promises`
- Node.js `path`
- Node.js `child_process`

## Summary

The build system is now **smart and adaptive**:
- 🧠 Auto-detects frameworks
- 📦 Handles multiple package managers
- 🔍 Finds build output intelligently
- 💪 Works with zero configuration
- 🎯 Provides helpful error messages

No more manual configuration needed! Just push your code and it deploys.
