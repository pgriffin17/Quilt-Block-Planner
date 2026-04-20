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
set TEMP_DIR=%REPO_DIR%\..\pages-temp
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
xcopy /E /I /Y "!SOURCE_PATH!\*" "%TEMP_DIR%\"

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

REM Use git worktree to avoid switching branches (must run from repo)
echo 🔄 Creating worktree for gh-pages...
set WORKTREE_DIR=%REPO_DIR%\..\pages-worktree
if exist "%WORKTREE_DIR%" rmdir /s /q "%WORKTREE_DIR%"
git worktree add "%WORKTREE_DIR%" gh-pages

REM Copy files into the worktree
echo 📋 Copying files into gh-pages worktree...
xcopy /E /I /Y "%TEMP_DIR%\*" "%WORKTREE_DIR%\"

REM Stage changes in worktree
echo 📦 Staging changes in gh-pages...
pushd "%WORKTREE_DIR%"
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
git worktree remove "%WORKTREE_DIR%"
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"

echo.
echo 🎉 Deployment complete!
echo.
pause
