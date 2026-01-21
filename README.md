# 🔀 Gitty

A powerful web-based Git history editor that allows you to modify any previous commit without creating new commits. Similar to GitKraken, but focused on history editing.

## ✨ Features

- 📊 **Visual Commit Graph** - See your entire Git history at a glance
- ✏️ **Edit Any Commit** - Modify files in any historical commit
- 🔄 **Automatic Rebase** - Replay future commits on top of your changes
- 📝 **Side-by-Side Diff** - Compare before and after with syntax highlighting
- ⚠️ **Conflict Resolution** - Handle merge conflicts with an intuitive UI
- ⬆️ **Force Push** - Sync your rewritten history with remotes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Git 2.0+

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/gitty.git
cd gitty

# Install dependencies
npm install

# Start development servers
npm run dev
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

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
