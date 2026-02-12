# 🔀 Gitty

A powerful web-based Git history editor that allows you to modify any previous commit without creating new commits. Similar to GitKraken, but focused on history editing.

## ✨ Features

- 📊 **Visual Commit Graph** - See your entire Git history at a glance
- ✏️ **Edit Any Commit** - Modify files in any historical commit
- 🔄 **Automatic Rebase** - Replay future commits on top of your changes
- 📝 **Side-by-Side Diff** - Compare before and after with syntax highlighting
- ⚠️- **Conflict Resolution**: Built-in 3-way merge tool for rebases.
- ⬆️ **Force Push** - Sync your rewritten history with remotes

## 📖 Documentation
Detailed technical documentation can be found in the [**/docs**](file:///d:/Projects/Gitty/docs/README.md) folder:
- [Architecture](file:///d:/Projects/Gitty/docs/architecture.md)
- [Workflow Logic](file:///d:/Projects/Gitty/docs/workflow.md)
- [API Reference](file:///d:/Projects/Gitty/docs/api_reference.md)

## 💻 Desktop App

Gitty is now available as a standalone desktop application for Windows!

### 📥 Download & Install
1. Go to the [Releases](https://github.com/YourGitHubUsername/Gitty/releases) page.
2. Download the latest `Gitty Setup x.x.x.exe`.
3. Run the installer.
   - You can choose your installation folder.
   - Desktop and Start Menu shortcuts will be created automatically.

### ✨ Desktop Features
- **Auto-Updates**: The app checks for new versions on startup and updates automatically.
- **System Integration**: Native file system access for better performance.
- **Debug Logs**: Easily access logs via the Settings menu for troubleshooting.

## 🚀 Development

### Prerequisites
- Node.js 18+ 
- npm 9+
- Git 2.0+

### Local Web Development
```bash
npm install
npm run dev
```

### Desktop App Development
```bash
# Run in development mode (Webpack/Electron with Hot Reload)
npm run dev

# Build for production (Windows .exe)
npm run dist
```
The installer will be generated in `dist-electron/`.

## 🏗️ Architecture

```
gitty/
├── client/          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── package.json
├── server/          # Express backend (TypeScript)
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── package.json     # Root workspace config
```

## 📖 How It Works

Gitty uses the **"Checkout, Amend, and Replay"** methodology:

### Phase 1: The Surgery
1. Checkout the target commit (detached HEAD)
2. Make your file changes
3. Amend the commit with `--no-edit`

### Phase 2: The Time Warp
4. Use `git rebase --onto` to replay all subsequent commits on top of your fix

### Phase 3: The Sync
5. Force push to update the remote

## ⚠️ Warning

This application rewrites Git history. Always:
- ✅ Communicate with your team before force pushing
- ✅ Create a backup branch before making changes
- ✅ Never rewrite history on shared branches without coordination

## 📄 License

MIT
