@echo off
title EveAI Web Deployer 🚀
color 05
echo ===================================================
echo           EveAI Web Deployer 🚀
echo ===================================================
echo.
echo This script will help you publish your static period 
echo tracker website online so everyone can see it.
echo.
echo Choose a platform to publish your project:
echo [1] Vercel (Fastest CLI deployment - Recommended)
echo [2] Netlify (Fast production deploy)
echo [3] GitHub Pages (Excellent for showing code + portfolio)
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting Vercel Deploy...
    echo (If this is your first time, it will open a browser to log in/create a free Vercel account)
    echo.
    npx -y vercel --name eveai
)
if "%choice%"=="2" (
    echo.
    echo Starting Netlify Deploy...
    echo (If this is your first time, it will open a browser to log in/create a free Netlify account)
    echo.
    npx -y netlify deploy --dir=. --prod
)
if "%choice%"=="3" (
    echo.
    echo To deploy on GitHub Pages:
    echo 1. Create a repository on github.com
    echo 2. Open terminal in this folder and run:
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit"
    echo    git branch -M main
    echo    git remote add origin YOUR_GITHUB_REPO_URL
    echo    git push -u origin main
    echo 3. In GitHub repo Settings -^> Pages, select main branch and save.
    echo.
)
if "%choice%"=="4" (
    exit
)
pause
