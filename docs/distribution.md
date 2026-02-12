# Gitty Distribution & Updates Guide

This guide explains how to manage releases, push patches, and how users receive updates.

## 1. Initial Setup
- Ensure you have a GitHub repository named `Gitty` (or update `package.json` -> `build.publish.repo`).
- Update `YourGitHubUsername` in `package.json` -> `build.publish.owner`.
- Add a `GITHUB_TOKEN` secret to your GitHub repository settings (Settings > Secrets > Actions).

## 2. Pushing a New Version (Patching)
When you want to release a new version (e.g., v1.0.1):

1. **Update Version**: Open the root `package.json` and change the version.
   ```json
   "version": "1.0.1"
   ```
2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "fix: bug appearing in diff viewer"
   ```
3. **Push Tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
4. **Auto-Build**: GitHub Actions will automatically start building the Windows installer.
5. **Publish**: Once the build finishes, it will appear as a "Draft Release" in your GitHub Repo. Click **Edit** and then **Publish Release**.

## 3. Update Notifications
- **Silent Check**: Every time a user opens Gitty, it silently checks the GitHub repo for a more recent version.
- **Downloading**: If found, it downloads the update in the background.
- **UI Prompt**: A box will appear in the bottom-right corner:
  - "New update available. Downloading..."
  - "Update ready to install! [Restart Now]"
- **Installation**: When they click "Restart Now", the app closes, applies the patch, and reopens the new version immediately.

## 4. Developing Locally
To run the desktop app in development mode:
```bash
npm run dev
```
This will start the React dev server, the Node.js backend, and the Electron window simultaneously.

## 5. How to Make Changes and Update the App
If you want to add a new feature or fix a bug and see it in your desktop app:

### Step 1: Make your changes
Edit the React code in `client/src` or the Node.js code in `server/src`.

### Step 2: Test in Dev Mode
Run `npm run dev` to see your changes instantly in the Electron window.

### Step 3: Verify and Build
Once you are happy with the changes, follow the **Pushing a New Version** steps above (Bump version -> Tag -> Push). GitHub will handle the creation of the new `.exe`.

### Step 4: Automatic Update
The next time you open your installed Gitty app, it will see the new version, download it, and prompt you to restart. **You don't need to manually install the new version; it pulls itself in automatically.**

## 6. Integrating into your Workflow
- **Desktop Shortcut**: After installing, Gitty will be in your Start Menu.
- **Local Git Repos**: Gitty is designed to work with repositories on your local machine. Simply open the app, click "Open Repository", and point it to any folder containing a `.git` directory.
