# Vercel Deployment Guide

## Issue
Models are not loading on Vercel deployment with `ERR_NETWORK_CHANGED` error.

## What Has Been Fixed

1. **Added `vercel.json`**: A minimal configuration file that enables CORS headers for all resources, which should help with cross-origin loading issues.

## Deployment Steps

1. **Merge this PR**: Make sure this branch is merged to your main/master branch.

2. **Redeploy on Vercel**: 
   - Go to your Vercel dashboard
   - Find your project
   - Click "Redeploy" to trigger a new deployment with the updated `vercel.json`

3. **Clear Cache**: After redeployment:
   - Clear your browser cache
   - Try accessing the site in an incognito/private window
   - Use Shift+Ctrl+R (Windows/Linux) or Shift+Cmd+R (Mac) for a hard refresh

## Verifying the Fix

After redeployment, open your browser's Developer Tools (F12) and check:

1. **Network Tab**: Look for the `.glb` files under `/models/`
   - They should show 200 status codes (not 404 or failed)
   - Should show the correct file sizes (32MB, 26MB, 3.1MB)

2. **Console Tab**: Look for loading messages
   - Should see "✅ Loaded model: /models/..." messages
   - Should NOT see "❌ Error loading model:" errors

## If Models Still Don't Load

### Option 1: Check Vercel Build Logs
1. Go to Vercel dashboard → Your project → Deployments
2. Click on the latest deployment
3. Check the build logs to ensure files are being included
4. Look for any warnings about file sizes or deployment limits

### Option 2: Verify File Serving
Test if files are accessible by visiting directly:
- `https://your-project.vercel.app/models/green_ogre__3d_fantasy_monster.glb`
- `https://your-project.vercel.app/models/mechbot_no_sorry_rig_rigged_bone_fbx.glb`
- `https://your-project.vercel.app/models/robotic_t-rex_roaring_animation.glb`

If these URLs return 404 or don't download, the files aren't being deployed.

### Option 3: Large File Solutions

Your model files are quite large (32MB, 26MB, 3.1MB). If Vercel continues having issues, consider:

#### A. Use External CDN (Recommended for large files)
1. **Upload to Vercel Blob Storage**:
   ```bash
   npm install @vercel/blob
   ```
   Then use Vercel's blob storage for the models.

2. **Use AWS S3, Cloudflare R2, or similar**:
   - Upload models to an S3 bucket
   - Make them publicly accessible
   - Update URLs in `src/scene.js`:
     ```javascript
     const modelConfigs = [
       {
         url: "https://your-cdn.com/models/mechbot_no_sorry_rig_rigged_bone_fbx.glb",
         // ... rest of config
       },
       // ...
     ];
     ```

#### B. Compress Models
Use tools like `gltf-pipeline` to compress the models:
```bash
npm install -g gltf-pipeline
gltf-pipeline -i public/models/green_ogre__3d_fantasy_monster.glb -o public/models/green_ogre__3d_fantasy_monster.glb -d
```

This can reduce file sizes by 70-90%.

#### C. Use Git LFS (for very large files)
If models are > 50MB:
```bash
git lfs install
git lfs track "*.glb"
git add .gitattributes
git add public/models/*.glb
git commit -m "Track models with Git LFS"
```

**Note**: Vercel needs to have Git LFS enabled for your repository.

## Current Model Sizes
- `green_ogre__3d_fantasy_monster.glb`: 32MB
- `mechbot_no_sorry_rig_rigged_bone_fbx.glb`: 26MB
- `robotic_t-rex_roaring_animation.glb`: 3.1MB
- **Total**: ~61MB

## Technical Details

### What Changed
- Added `vercel.json` with CORS headers to allow proper resource loading
- Verified that models are correctly copied from `public/` to `dist/` during build
- Confirmed models are tracked in git and will be included in deployments

### Build Process
1. Vite builds the project: `npm run build`
2. Output goes to `dist/` directory
3. Files from `public/` are copied to `dist/` root
4. Models end up in `dist/models/`
5. Vercel deploys everything in `dist/`

### How Models Are Loaded
- Code references models as `/models/*.glb` (absolute paths)
- These resolve to the root of your deployment
- THREE.js GLTFLoader fetches them asynchronously
- Large files may take 2-5 seconds to download on slower connections

## Support
If issues persist after following these steps, check:
- Vercel community forums
- Vercel support (if on paid plan)
- Or provide more details about the specific error messages you're seeing
