#!/bin/bash

# Deploy frontend to GitHub Pages
# This script copies files from backend/public/ to gh-pages branch
# Usage: ./deploy-to-gh-pages.sh

set -e

echo "🚀 Deploying to GitHub Pages branch..."

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if backend/public exists
if [ ! -d backend/public ]; then
    echo "❌ Error: backend/public directory not found"
    exit 1
fi

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Current branch: $CURRENT_BRANCH"

# Save absolute path to source before any navigation
SOURCE_PATH="$(pwd)/backend/public"
REPO_DIR=$(pwd)
echo "📝 Source path: $SOURCE_PATH"

# Copy files to temporary directory
echo "📋 Copying files to temporary directory..."
pushd .. > /dev/null
rm -rf pages-temp
cp -r "$SOURCE_PATH" pages-temp
popd > /dev/null

# Check if gh-pages branch exists
if ! git rev-parse --verify gh-pages > /dev/null 2>&1; then
    echo "📝 Creating gh-pages branch..."
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages branch"
    git checkout $CURRENT_BRANCH
fi
echo "✅ gh-pages branch exists"

# Use git worktree to avoid switching branches
echo "🔄 Creating worktree for gh-pages..."
pushd .. > /dev/null
rm -rf pages-worktree
git worktree add pages-worktree gh-pages
popd > /dev/null

# Copy files into the worktree
echo "📋 Copying files into gh-pages worktree..."
cp -r ../pages-temp/* ../pages-worktree/

# Stage changes in worktree
echo "📦 Staging changes in gh-pages..."
pushd ../pages-worktree > /dev/null
git add -A

# Check if there are changes to commit
if ! git diff --cached --quiet; then
    # Create .gitignore
    echo "📝 Setting up .gitignore..."
    cat > .gitignore << EOF
node_modules/
.env
.env.local
*.log
.DS_Store
deploy-to-gh-pages.sh
deploy-to-gh-pages.bat
quilt-deploy-*/
EOF
    
    git add -A
    
    echo "💾 Committing changes..."
    git commit -m "Deploy: Update GitHub Pages from backend/public"
    
    echo "🚀 Pushing to origin gh-pages..."
    git push origin gh-pages
    echo "✅ Successfully deployed to GitHub Pages!"
else
    echo "ℹ️  No changes to commit"
fi

popd > /dev/null

# Clean up
echo "🧹 Cleaning up..."
cd "$REPO_DIR"
pushd .. > /dev/null
git worktree remove pages-worktree
rm -rf pages-temp
popd > /dev/null

echo ""
echo "🎉 Deployment complete!"
echo ""

