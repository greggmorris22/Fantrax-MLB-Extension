# Connecting Local Work Laptop to Personal GitHub Repo

This guide explains how to connect and push this repository to your personal GitHub account without affecting your FedEx work credentials or enterprise security policies.

Instead of changing your global Git login, we will push using a **Personal Access Token (PAT)** specifically scoped for this repository.

## 1. Create the Repo on GitHub (Browser)

1. Go to `github.com` in your browser and log into your **personal account**.
2. Click the `+` icon in the top right and select **New repository**.
3. Name it exactly: `Fantrax_MLB_Extension`
4. Leave it as **Public** (or **Private**).
5. **IMPORTANT:** Do _not_ check the options to add a README, `.gitignore`, or license (we already have those!). Just click **Create repository**.

## 2. Generate a Personal Access Token (PAT)

1. Still on GitHub, go to your **Settings** (click your profile photo).
2. Scroll to the very bottom left and click **Developer settings**.
3. Click **Personal access tokens** -> **Tokens (classic)**.
4. Click **Generate new token (classic)**. Name it something like "Work Laptop Access".
5. For the checkboxes, you only need to check exactly two boxes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
6. Click **Generate token** at the bottom.
7. Treat the long scrambled token like a password and **copy it to your clipboard**. You won't see it again!

## 3. Connect and Push (Terminal)

Once you have your token and the blank repository, go back to your local terminal (VS Code/Cursor) in the `Fantrax_MLB_Extension` folder.

Run this exact command. Make sure you replace `<USERNAME>` with your personal GitHub username, and paste your huge token where it says `<YOUR_LONG_TOKEN>`:

```powershell
git remote add origin https://<USERNAME>:<YOUR_LONG_TOKEN>@github.com/<USERNAME>/Fantrax_MLB_Extension.git
```

_Note: If you get an error saying `remote origin already exists`, you can first remove the old one with `git remote remove origin`._

Then, run this command to push our files up (and set the connection for future pushes):

```powershell
git push -u origin main
```

## 4. Automation Complete

After doing this, the repository will be live on GitHub. The GitHub Actions workflow we created (`.github/workflows/update_player_map.yml`) will automatically run every Tuesday at 12:00 AM UTC (Monday evening in the US) to fetch the latest player database and update the extension for you.
