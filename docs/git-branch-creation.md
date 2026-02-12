# Git Branch Creation Tutorial

To create the branches and sync your repository, I used the following exact commands in your PowerShell terminal.

## 1. Syncing your master branch with Upstream
I first updated your local master branch to match the original FreeRADIUS repository and pushed those changes to your fork.

```powershell
# Fetch updates from the original FreeRADIUS repo
git fetch upstream
# Switch to your master branch
git checkout master
# Merge the latest changes from the original repo into your master
git merge upstream/master
# Update your GitHub fork (origin) with the new changes
git push origin master
```

## 2. Creating the new tutorial branches
Once master was up-to-date, I created the two new branches from that point.

```powershell
# Create the first branch
git branch tutorials/proxy_failover
# Create the second branch
git branch tutorials/proxy_receive
```

## Issues Encountered & How I Overcame Them

### Terminal Parser Errors:
- **Issue**: My first attempt to check remotes failed with an `InvalidEndOfLine` error in the terminal.
- **Fix**: This sometimes happens with terminal interactions in Windows environments. I simply cleared the command buffer and reran the command as a clean string.

### grep is not recognized:
- **Issue**: I tried to verify your branches using `git branch | grep "proxy"`, but since you are on Windows, `grep` is not a default command.
- **Fix**: I switched to the PowerShell equivalent, `Select-String`. The verification command that actually worked was: `git branch | Select-String "tutorials/proxy_"`

### Directory Paths with Spaces:
- **Issue**: Your project path (`D:\WIFI-AP\Freeradius Documentation Project\New folder\...`) contains several spaces, which can break standard command execution.
- **Fix**: I ensured all commands were executed with the directory path properly quoted to avoid path resolution errors.
