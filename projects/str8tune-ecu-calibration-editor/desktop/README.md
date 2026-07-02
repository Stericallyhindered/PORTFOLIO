# STR8TUNE Storage Relocator

Small Windows Python GUI for scanning old files on the system drive and moving safer user-content files to another drive.

## Theme

- Game Boy style green palette
- Small fixed-width font
- Straight-to-the-point layout

## What it does

- Detects the Windows/system drive
- Lists all visible Windows drive letters
- Scans for files older than `X` days
- Lets you choose `last modified` or `last accessed` as the age basis
- Lets you choose a destination folder on another drive
- Sorts matches into:
  - `SAFE`: conservative user-content files in Desktop/Documents/Downloads/Pictures/Music/Videos
  - `REVIEW`: not obviously dangerous, but not trusted enough for blind auto-move
  - `BLOCKED`: Windows/program/build/system/executable paths and file types
- Supports:
  - manual move of selected results
  - move-all-safe
  - background auto mode

## Safety model

This build is intentionally conservative. It will refuse or block things like:

- `C:\Windows`
- `Program Files`
- `ProgramData`
- `AppData`
- `.exe`, `.dll`, `.sys`, `.msi`, shortcuts, scripts, and similar risky file types
- hidden/system/reparse-point files
- common app/build folders like `.git`, `node_modules`, `venv`

It does **not** claim to perfectly know whether every file is safe to move. The goal is to help with user files and avoid obvious system/app corruption risks.

## Run

1. Install Python 3 for Windows with Tkinter included.
2. Open a terminal in this `desktop` folder.
3. Run:

```powershell
py app.py
```

## Notes

- `Last accessed` timestamps can be unreliable on some Windows setups.
- The app does not self-elevate. If you want broader filesystem access, launch it from an elevated terminal.
- Destination defaults to `X:\Str8TuneMoved` unless you choose a different folder.
