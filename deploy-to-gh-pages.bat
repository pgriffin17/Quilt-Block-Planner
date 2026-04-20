@echo off
REM Deploy frontend to GitHub Pages
REM This script copies files from backend/public/ to gh-pages branch
REM Usage: deploy-to-gh-pages.bat

setlocal enabledelayedexpansion

echo.
echo 🚀 Deploying to GitHub Pages branch...
echo.

REM Check if git is available
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Error: Git is not installed or not in PATH
    exit /b 1
)

REM Check if backend/public exists
if not exist backend\public (
    echo ❌ Error: backend\public directory not found
    exit /b 1
)

REM Get current branch
for /f "tokens=*" %%i in ('git rev-parse --abbrev-ref HEAD') do set CURRENT_BRANCH=%%i
echo 📌 Current branch: !CURRENT_BRANCH!

REM Save absolute path to source before any navigation
set SOURCE_PATH=%cd%\backend\public
set REPO_DIR=%cd%
echo 📝 Source path: !SOURCE_PATH!

REM Copy files to temporary directory
echo 📋 Copying files to temporary directory...
pushd ..
if exist pages-temp rmdir /s /q pages-temp
xcopy /E /I /Y "!SOURCE_PATH!\*" "pages-temp\"
popd

REM Check if gh-pages branch exists
git rev-parse --verify gh-pages >nul 2>&1
if errorlevel 1 (
    echo 📝 Creating gh-pages branch...
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages branch"
    git checkout !CURRENT_BRANCH!
)
echo ✅ gh-pages branch exists

REM Use git worktree to avoid switching branches
echo 🔄 Creating worktree for gh-pages...
pushd ..
if exist pages-worktree rmdir /s /q pages-worktree
git worktree add pages-worktree gh-pages
popd

REM Copy files into the worktree
echo 📋 Copying files into gh-pages worktree...
xcopy /E /I /Y "..\pages-temp\*" "..\pages-worktree\"

REM Stage changes in worktree
echo 📦 Staging changes in gh-pages...
pushd ..\pages-worktree
git add -A

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    REM Create .gitignore
    echo 📝 Setting up .gitignore...
    (
        echo node_modules/
        echo .env
        echo .env.local
        echo *.log
        echo .DS_Store
        echo deploy-to-gh-pages.sh
        echo deploy-to-gh-pages.bat
        echo quilt-deploy-*/
    ) > .gitignore
    
    git add -A
    
    echo 💾 Committing changes...
    git commit -m "Deploy: Update GitHub Pages from backend/public"
    
    echo 🚀 Pushing to origin gh-pages...
    git push origin gh-pages
    echo ✅ Successfully deployed to GitHub Pages!
) else (
    echo ℹ️  No changes to commit
)

popd

REM Clean up
echo 🧹 Cleaning up...
cd /d "%REPO_DIR%"
pushd ..
git worktree remove pages-worktree
if exist pages-temp rmdir /s /q pages-temp
popd

echo.
echo 🎉 Deployment complete!
echo.
pause
