@echo off
setlocal
echo ==========================================
echo FANTRAX PLAYER DATABASE SYNC & PUBLISH
echo ==========================================

:: 1. Update the local player map from the master database
echo [1/3] Syncing local data from master database...
py scripts\update_db.py
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to update local data. Make sure the master CSV file exists.
    pause
    exit /b %ERRORLEVEL%
)

:: 2. Stage changes in Git
echo [2/3] Staging changes for GitHub...
git add data\player_map.csv
git commit -m "Update player database: %DATE% %TIME%"

:: 3. Push to GitHub Cloud
echo [3/3] Pushing updates to GitHub Cloud...
echo This will make the data live for all extension users.
git push origin main
if %ERRORLEVEL% neq 0 (
    echo.
    echo ALERT: GitHub push failed. 
    echo This usually means you haven't set up your GitHub repository yet,
    echo or you need to login.
    echo.
    echo To fix this, run: git remote add origin [YOUR_GITHUB_REPO_URL]
) else (
    echo.
    echo SUCCESS! Your extension is now using the latest player data.
)

echo ==========================================
pause
