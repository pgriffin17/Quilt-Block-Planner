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

# Save current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📌 Current branch: $CURRENT_BRANCH"

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

# Remove old files (keep .git and .gitignore)
echo "🗑️  Clearing old files..."
find . -maxdepth 1 -type f ! -name .gitignore | xargs rm -f
find . -maxdepth 1 -type d ! -name .git ! -name . | xargs rm -rf

# Copy new files from backend/public
echo "📋 Copying files from backend/public/..."
cp -r $CURRENT_BRANCH/backend/public/* .

# Create .gitignore for gh-pages if it doesn't exist
if [ ! -f .gitignore ]; then
    cat > .gitignore << EOF
node_modules/
.env
.env.local
*.log
.DS_Store
EOF
fi

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
echo "📍 Your site will be available at: https://$(git config --get remote.origin.url | sed 's/.*:\(.*\)\.git/\1/' | sed 's/\///')/Quilt-Block-Planner"
