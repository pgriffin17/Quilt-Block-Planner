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
echo 📌 Current branch: %CURRENT_BRANCH%

REM Check if gh-pages branch exists
git rev-parse --verify gh-pages >nul 2>&1
if errorlevel 1 (
    echo 📝 Creating gh-pages branch...
    git checkout --orphan gh-pages
    git rm -rf .
    git commit --allow-empty -m "Initial gh-pages branch"
) else (
    echo ✅ gh-pages branch exists
)

REM Switch to gh-pages
echo 🔄 Switching to gh-pages branch...
git checkout gh-pages

REM Copy files from backend/public (xcopy preserves existing files)
echo 📋 Copying files from backend/public/...
xcopy /E /I /Y "%CURRENT_BRANCH%\backend\public\*" "."

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

REM Stage and commit
echo 📦 Staging changes...
git add -A

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo 💾 Committing changes...
    git commit -m "Deploy: Update GitHub Pages from backend/public"
    
    echo 🚀 Pushing to origin gh-pages...
    git push origin gh-pages
    echo ✅ Successfully deployed to GitHub Pages!
) else (
    echo ℹ️  No changes to commit
)

REM Return to original branch
echo 🔄 Returning to %CURRENT_BRANCH% branch...
git checkout %CURRENT_BRANCH%

echo.
echo 🎉 Deployment complete!
echo.
pause
