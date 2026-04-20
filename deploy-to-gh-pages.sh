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
echo "📝 Source path: $SOURCE_PATH"

# Create temp directory in parent using pushd
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
else
    echo "✅ gh-pages branch exists"
fi

# Switch to gh-pages
echo "🔄 Switching to gh-pages branch..."
git checkout gh-pages

# Copy files from temp directory to gh-pages working directory
echo "📋 Copying files from temp directory to gh-pages..."
cp -r ../pages-temp/* .

# Clean up temp directory
echo "🧹 Cleaning up temporary directory..."
pushd .. > /dev/null
rm -rf pages-temp
popd > /dev/null

# Create .gitignore with exclusions for deployment files
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

# Stage and commit
echo "📦 Staging changes..."
git add -A

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo "ℹ️  No changes to commit"
else
    echo "💾 Committing changes..."
    git commit -m "Deploy: Update GitHub Pages from backend/public"
    
    echo "🚀 Pushing to origin gh-pages..."
    git push origin gh-pages
    echo "✅ Successfully deployed to GitHub Pages!"
fi

# Return to original branch
echo "🔄 Returning to $CURRENT_BRANCH branch..."
git checkout $CURRENT_BRANCH

echo ""
echo "🎉 Deployment complete!"
echo ""

