from __future__ import annotations

import ctypes
import datetime as dt
import os
import queue
import shutil
import threading
import traceback
from dataclasses import dataclass
from pathlib import Path
from tkinter import filedialog, messagebox, ttk
import tkinter as tk


if os.name != "nt":
    raise SystemExit("This app is intended for Windows.")


DRIVE_TYPES = {
    0: "Unknown",
    1: "No Root",
    2: "Removable",
    3: "Fixed",
    4: "Network",
    5: "CD/DVD",
    6: "RAM Disk",
}

STATUS_SAFE = "SAFE"
STATUS_REVIEW = "REVIEW"
STATUS_BLOCKED = "BLOCKED"

FILE_ATTRIBUTE_HIDDEN = 0x2
FILE_ATTRIBUTE_SYSTEM = 0x4
FILE_ATTRIBUTE_REPARSE_POINT = 0x400

PALETTE = {
    "bg": "#162c16",
    "panel": "#2b472b",
    "panel_alt": "#486a48",
    "text": "#d2e6b3",
    "accent": "#95b466",
    "accent_dark": "#66824a",
    "danger": "#d08b6c",
    "muted": "#9db88d",
    "field": "#203920",
}

UI_FONT = ("Consolas", 9)
UI_FONT_BOLD = ("Consolas", 9, "bold")


def format_bytes(size: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.1f} {unit}"
        value /= 1024
    return f"{size} B"


def normalize_path(path: str | Path) -> str:
    return os.path.normcase(os.path.normpath(str(path)))


def path_is_under(path: str | Path, root: str | Path) -> bool:
    try:
        return os.path.commonpath([normalize_path(path), normalize_path(root)]) == normalize_path(root)
    except ValueError:
        return False


def get_file_attributes(path: str | Path) -> int:
    attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
    if attrs == 0xFFFFFFFF:
        return 0
    return int(attrs)


def is_admin() -> bool:
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


@dataclass(slots=True)
class DriveInfo:
    root: str
    label: str
    drive_type: str
    total_bytes: int
    free_bytes: int
    is_system: bool

    @property
    def display_name(self) -> str:
        prefix = "[SYS] " if self.is_system else ""
        return f"{prefix}{self.root} {self.label} ({self.drive_type}, {format_bytes(self.free_bytes)} free)"


@dataclass(slots=True)
class FileCandidate:
    source_root: str
    path: str
    size_bytes: int
    age_days: int
    timestamp_basis: str
    status: str
    reason: str

    @property
    def name(self) -> str:
        return Path(self.path).name


class DriveScanner:
    def __init__(self) -> None:
        self.system_drive = os.environ.get("SystemDrive", "C:").upper()

    def list_drives(self) -> list[DriveInfo]:
        drives: list[DriveInfo] = []
        bitmask = ctypes.windll.kernel32.GetLogicalDrives()
        for index in range(26):
            if not (bitmask & (1 << index)):
                continue
            letter = chr(65 + index)
            root = f"{letter}:\\"
            drive_type_id = ctypes.windll.kernel32.GetDriveTypeW(root)
            drive_type = DRIVE_TYPES.get(drive_type_id, "Unknown")
            label = self._get_volume_label(root)
            total, free = self._get_space(root)
            drives.append(
                DriveInfo(
                    root=root,
                    label=label or "Unlabeled",
                    drive_type=drive_type,
                    total_bytes=total,
                    free_bytes=free,
                    is_system=letter + ":" == self.system_drive,
                )
            )
        drives.sort(key=lambda item: (not item.is_system, item.root))
        return drives

    def _get_volume_label(self, root: str) -> str:
        name_buffer = ctypes.create_unicode_buffer(261)
        serial_number = ctypes.c_ulong()
        max_component_len = ctypes.c_ulong()
        file_system_flags = ctypes.c_ulong()
        fs_name_buffer = ctypes.create_unicode_buffer(261)
        success = ctypes.windll.kernel32.GetVolumeInformationW(
            ctypes.c_wchar_p(root),
            name_buffer,
            len(name_buffer),
            ctypes.byref(serial_number),
            ctypes.byref(max_component_len),
            ctypes.byref(file_system_flags),
            fs_name_buffer,
            len(fs_name_buffer),
        )
        return name_buffer.value if success else ""

    def _get_space(self, root: str) -> tuple[int, int]:
        free_bytes = ctypes.c_ulonglong()
        total_bytes = ctypes.c_ulonglong()
        total_free_bytes = ctypes.c_ulonglong()
        success = ctypes.windll.kernel32.GetDiskFreeSpaceExW(
            ctypes.c_wchar_p(root),
            ctypes.byref(free_bytes),
            ctypes.byref(total_bytes),
            ctypes.byref(total_free_bytes),
        )
        if not success:
            return 0, 0
        return int(total_bytes.value), int(free_bytes.value)


class SafetyPolicy:
    def __init__(self) -> None:
        self.system_drive = os.environ.get("SystemDrive", "C:").upper()
        self.user_home = Path.home()
        self.safe_user_roots = [
            self.user_home / "Desktop",
            self.user_home / "Documents",
            self.user_home / "Downloads",
            self.user_home / "Pictures",
            self.user_home / "Music",
            self.user_home / "Videos",
        ]
        protected = [
            os.environ.get("SystemRoot"),
            os.environ.get("ProgramFiles"),
            os.environ.get("ProgramFiles(x86)"),
            os.environ.get("ProgramData"),
            str(self.user_home / "AppData"),
        ]
        self.protected_roots = [item for item in protected if item]
        self.blocked_dir_names = {
            "windows",
            "program files",
            "program files (x86)",
            "programdata",
            "appdata",
            "$recycle.bin",
            "system volume information",
            ".git",
            "node_modules",
            "__pycache__",
            ".venv",
            "venv",
        }
        self.blocked_extensions = {
            ".acm",
            ".ani",
            ".appref-ms",
            ".bat",
            ".cab",
            ".cmd",
            ".com",
            ".cpl",
            ".diagcab",
            ".dll",
            ".drv",
            ".exe",
            ".gadget",
            ".inf",
            ".iso",
            ".job",
            ".lnk",
            ".msc",
            ".msi",
            ".msix",
            ".msp",
            ".mst",
            ".ocx",
            ".pif",
            ".ps1",
            ".reg",
            ".scr",
            ".sys",
            ".url",
            ".vbs",
        }

    def should_skip_directory(self, directory: str) -> bool:
        name = Path(directory).name.lower()
        if name in self.blocked_dir_names:
            return True
        if any(path_is_under(directory, root) for root in self.protected_roots):
            return True
        attrs = get_file_attributes(directory)
        return bool(attrs & (FILE_ATTRIBUTE_REPARSE_POINT | FILE_ATTRIBUTE_SYSTEM | FILE_ATTRIBUTE_HIDDEN))

    def evaluate(self, file_path: str) -> tuple[str, str]:
        path = Path(file_path)
        extension = path.suffix.lower()
        attrs = get_file_attributes(path)

        if attrs & FILE_ATTRIBUTE_REPARSE_POINT:
            return STATUS_BLOCKED, "Reparse point / link"
        if attrs & FILE_ATTRIBUTE_SYSTEM:
            return STATUS_BLOCKED, "Windows system attribute"
        if attrs & FILE_ATTRIBUTE_HIDDEN:
            return STATUS_BLOCKED, "Hidden file"
        if any(path_is_under(path, root) for root in self.protected_roots):
            return STATUS_BLOCKED, "Protected Windows/program path"
        if any(part.lower() in self.blocked_dir_names for part in path.parts):
            return STATUS_BLOCKED, "Protected app/build folder"
        if extension in self.blocked_extensions:
            return STATUS_BLOCKED, f"Blocked file type {extension or '[none]'}"
        if any(path_is_under(path, root) for root in self.safe_user_roots):
            return STATUS_SAFE, "User content folder"
        if str(path.drive).upper() == self.system_drive:
            return STATUS_REVIEW, "On system drive but outside safe folders"
        return STATUS_REVIEW, "Non-system location, review before move"


class StorageEngine:
    def __init__(self, policy: SafetyPolicy) -> None:
        self.policy = policy

    def scan(
        self,
        source_roots: list[str],
        older_than_days: int,
        timestamp_basis: str,
        min_size_mb: int,
        progress_callback=None,
        stop_event: threading.Event | None = None,
    ) -> list[FileCandidate]:
        threshold = dt.datetime.now() - dt.timedelta(days=max(0, older_than_days))
        min_size_bytes = max(0, min_size_mb) * 1024 * 1024
        results: list[FileCandidate] = []
        inspected = 0
        timestamp_label = "Last Accessed" if timestamp_basis == "accessed" else "Last Modified"

        for source_root in source_roots:
            if stop_event and stop_event.is_set():
                break
            for root, dirs, files in os.walk(source_root, topdown=True):
                if stop_event and stop_event.is_set():
                    break

                filtered_dirs = []
                for directory in dirs:
                    full_dir = os.path.join(root, directory)
                    if not self.policy.should_skip_directory(full_dir):
                        filtered_dirs.append(directory)
                dirs[:] = filtered_dirs

                for file_name in files:
                    if stop_event and stop_event.is_set():
                        break
                    full_path = os.path.join(root, file_name)
                    try:
                        stats = os.stat(full_path, follow_symlinks=False)
                    except (PermissionError, FileNotFoundError, OSError):
                        continue

                    inspected += 1
                    if progress_callback and inspected % 250 == 0:
                        progress_callback(("progress", f"Scanned {inspected} files..."))

                    if stats.st_size < min_size_bytes:
                        continue

                    timestamp = stats.st_atime if timestamp_basis == "accessed" else stats.st_mtime
                    when = dt.datetime.fromtimestamp(timestamp)
                    if when > threshold:
                        continue

                    status, reason = self.policy.evaluate(full_path)
                    age_days = max(0, (dt.datetime.now() - when).days)
                    results.append(
                        FileCandidate(
                            source_root=source_root,
                            path=full_path,
                            size_bytes=int(stats.st_size),
                            age_days=age_days,
                            timestamp_basis=timestamp_label,
                            status=status,
                            reason=reason,
                        )
                    )

        status_rank = {STATUS_SAFE: 0, STATUS_REVIEW: 1, STATUS_BLOCKED: 2}
        results.sort(key=lambda item: (status_rank.get(item.status, 99), -item.age_days, -item.size_bytes))
        return results

    def move_candidates(
        self,
        candidates: list[FileCandidate],
        destination_root: str,
        log_callback=None,
    ) -> tuple[int, int]:
        moved = 0
        skipped = 0
        destination_root_path = Path(destination_root)
        destination_root_path.mkdir(parents=True, exist_ok=True)

        for candidate in candidates:
            if candidate.status == STATUS_BLOCKED:
                skipped += 1
                if log_callback:
                    log_callback(f"SKIP blocked: {candidate.path}")
                continue

            source_path = Path(candidate.path)
            if not source_path.exists():
                skipped += 1
                if log_callback:
                    log_callback(f"SKIP missing: {candidate.path}")
                continue

            try:
                destination_path = self._build_destination_path(candidate, destination_root_path)
                if normalize_path(source_path) == normalize_path(destination_path):
                    skipped += 1
                    if log_callback:
                        log_callback(f"SKIP same path: {candidate.path}")
                    continue
                destination_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(source_path), str(destination_path))
                moved += 1
                if log_callback:
                    log_callback(f"MOVED {source_path} -> {destination_path}")
            except Exception as exc:
                skipped += 1
                if log_callback:
                    log_callback(f"ERROR moving {candidate.path}: {exc}")

        return moved, skipped

    def _build_destination_path(self, candidate: FileCandidate, destination_root: Path) -> Path:
        source_root = Path(candidate.source_root)
        source_path = Path(candidate.path)
        try:
            relative_path = source_path.relative_to(source_root)
        except ValueError:
            relative_path = Path(source_path.name)

        drive_tag = (source_root.drive or source_path.drive or "drive").replace(":", "")
        source_name = source_root.name or "root"
        raw_destination = destination_root / f"{drive_tag}_drive" / source_name / relative_path
        return self._unique_destination(raw_destination)

    def _unique_destination(self, path: Path) -> Path:
        if not path.exists():
            return path

        stem = path.stem
        suffix = path.suffix
        counter = 1
        while True:
            candidate = path.with_name(f"{stem}__moved_{counter}{suffix}")
            if not candidate.exists():
                return candidate
            counter += 1


class StorageRelocatorApp:
    def __init__(self, root: tk.Tk) -> None:
        self.root = root
        self.root.title("STR8TUNE STORAGE RELOCATOR")
        self.root.geometry("1380x840")
        self.root.minsize(1100, 700)
        self.root.configure(bg=PALETTE["bg"])

        self.drive_scanner = DriveScanner()
        self.policy = SafetyPolicy()
        self.engine = StorageEngine(self.policy)

        self.drives: list[DriveInfo] = []
        self.current_results: list[FileCandidate] = []
        self.item_lookup: dict[str, FileCandidate] = {}
        self.event_queue: queue.Queue[tuple[str, object]] = queue.Queue()
        self.scan_thread: threading.Thread | None = None
        self.auto_thread: threading.Thread | None = None
        self.auto_stop = threading.Event()

        self.source_drive_var = tk.StringVar()
        self.destination_drive_var = tk.StringVar()
        self.destination_folder_var = tk.StringVar()
        self.days_var = tk.IntVar(value=90)
        self.min_size_mb_var = tk.IntVar(value=25)
        self.timestamp_basis_var = tk.StringVar(value="modified")
        self.user_folders_only_var = tk.BooleanVar(value=True)
        self.auto_safe_only_var = tk.BooleanVar(value=True)
        self.interval_minutes_var = tk.IntVar(value=60)
        self.summary_var = tk.StringVar(value="No scan yet.")
        self.status_var = tk.StringVar(value="IDLE")
        self.admin_var = tk.StringVar(value="YES" if is_admin() else "NO")

        self._configure_style()
        self._build_ui()
        self._refresh_drives()
        self._pump_events()
        self.root.protocol("WM_DELETE_WINDOW", self._on_close)

    @staticmethod
    def _current_scan_settings(days: int, basis: str, min_size_mb: int) -> dict[str, int | str]:
        return {
            "older_than_days": days,
            "timestamp_basis": basis,
            "min_size_mb": min_size_mb,
        }

    def _configure_style(self) -> None:
        style = ttk.Style()
        style.theme_use("clam")
        style.configure(
            ".",
            background=PALETTE["bg"],
            foreground=PALETTE["text"],
            fieldbackground=PALETTE["field"],
            font=UI_FONT,
            bordercolor=PALETTE["accent_dark"],
            lightcolor=PALETTE["panel_alt"],
            darkcolor=PALETTE["panel"],
        )
        style.configure("TFrame", background=PALETTE["bg"])
        style.configure("Panel.TLabelframe", background=PALETTE["panel"], foreground=PALETTE["text"], borderwidth=2)
        style.configure("Panel.TLabelframe.Label", background=PALETTE["panel"], foreground=PALETTE["text"], font=UI_FONT_BOLD)
        style.configure("TLabel", background=PALETTE["bg"], foreground=PALETTE["text"], font=UI_FONT)
        style.configure("Panel.TLabel", background=PALETTE["panel"], foreground=PALETTE["text"], font=UI_FONT)
        style.configure("Header.TLabel", background=PALETTE["bg"], foreground=PALETTE["accent"], font=("Consolas", 12, "bold"))
        style.configure("Stat.TLabel", background=PALETTE["panel"], foreground=PALETTE["accent"], font=UI_FONT_BOLD)
        style.configure("TButton", background=PALETTE["accent"], foreground=PALETTE["bg"], font=UI_FONT_BOLD, borderwidth=1, padding=4)
        style.map("TButton", background=[("active", PALETTE["accent_dark"])], foreground=[("active", PALETTE["text"])])
        style.configure("TCheckbutton", background=PALETTE["panel"], foreground=PALETTE["text"], font=UI_FONT)
        style.configure("TRadiobutton", background=PALETTE["panel"], foreground=PALETTE["text"], font=UI_FONT)
        style.configure("TEntry", fieldbackground=PALETTE["field"], foreground=PALETTE["text"], insertcolor=PALETTE["text"])
        style.configure("TCombobox", fieldbackground=PALETTE["field"], foreground=PALETTE["text"], arrowsize=14)
        style.configure("Treeview", background=PALETTE["field"], foreground=PALETTE["text"], fieldbackground=PALETTE["field"], bordercolor=PALETTE["accent_dark"], rowheight=22)
        style.configure("Treeview.Heading", background=PALETTE["panel_alt"], foreground=PALETTE["bg"], font=UI_FONT_BOLD)
        style.map("Treeview", background=[("selected", PALETTE["accent_dark"])], foreground=[("selected", PALETTE["text"])])

    def _build_ui(self) -> None:
        outer = tk.Frame(self.root, bg=PALETTE["bg"], padx=10, pady=10)
        outer.pack(fill="both", expand=True)

        header = ttk.Label(
            outer,
            text="STR8TUNE STORAGE RELOCATOR  //  GAMEBOY MODE",
            style="Header.TLabel",
        )
        header.pack(anchor="w", pady=(0, 8))

        top = tk.Frame(outer, bg=PALETTE["bg"])
        top.pack(fill="x")
        top.columnconfigure(0, weight=2)
        top.columnconfigure(1, weight=1)

        left_panel = ttk.LabelFrame(top, text="DRIVES", style="Panel.TLabelframe", padding=8)
        left_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        right_panel = ttk.LabelFrame(top, text="SCAN CONTROL", style="Panel.TLabelframe", padding=8)
        right_panel.grid(row=0, column=1, sticky="nsew")

        self.drive_tree = ttk.Treeview(
            left_panel,
            columns=("label", "type", "free", "total", "system"),
            show="headings",
            height=6,
        )
        for column, title, width in [
            ("label", "LABEL", 180),
            ("type", "TYPE", 90),
            ("free", "FREE", 120),
            ("total", "TOTAL", 120),
            ("system", "SYSTEM", 70),
        ]:
            self.drive_tree.heading(column, text=title)
            self.drive_tree.column(column, width=width, anchor="w")
        self.drive_tree.pack(fill="x", expand=False)

        drive_controls = tk.Frame(left_panel, bg=PALETTE["panel"])
        drive_controls.pack(fill="x", pady=(8, 0))
        drive_controls.columnconfigure(1, weight=1)

        ttk.Label(drive_controls, text="SOURCE DRIVE", style="Panel.TLabel").grid(row=0, column=0, sticky="w", pady=2)
        self.source_combo = ttk.Combobox(drive_controls, textvariable=self.source_drive_var, state="readonly")
        self.source_combo.grid(row=0, column=1, sticky="ew", pady=2, padx=(8, 0))

        ttk.Label(drive_controls, text="DEST DRIVE", style="Panel.TLabel").grid(row=1, column=0, sticky="w", pady=2)
        self.destination_combo = ttk.Combobox(drive_controls, textvariable=self.destination_drive_var, state="readonly")
        self.destination_combo.grid(row=1, column=1, sticky="ew", pady=2, padx=(8, 0))
        self.destination_combo.bind("<<ComboboxSelected>>", self._on_destination_drive_changed)

        ttk.Label(drive_controls, text="ADMIN", style="Panel.TLabel").grid(row=2, column=0, sticky="w", pady=2)
        ttk.Label(drive_controls, textvariable=self.admin_var, style="Stat.TLabel").grid(row=2, column=1, sticky="w", pady=2, padx=(8, 0))

        ttk.Button(drive_controls, text="REFRESH DRIVES", command=self._refresh_drives).grid(row=3, column=0, columnspan=2, sticky="ew", pady=(8, 0))

        right_panel.columnconfigure(1, weight=1)
        ttk.Label(right_panel, text="OLDER THAN (DAYS)", style="Panel.TLabel").grid(row=0, column=0, sticky="w", pady=2)
        ttk.Entry(right_panel, textvariable=self.days_var, width=10).grid(row=0, column=1, sticky="ew", padx=(8, 0), pady=2)

        ttk.Label(right_panel, text="MIN SIZE MB", style="Panel.TLabel").grid(row=1, column=0, sticky="w", pady=2)
        ttk.Entry(right_panel, textvariable=self.min_size_mb_var, width=10).grid(row=1, column=1, sticky="ew", padx=(8, 0), pady=2)

        ttk.Label(right_panel, text="AGE BASIS", style="Panel.TLabel").grid(row=2, column=0, sticky="w", pady=2)
        basis_row = tk.Frame(right_panel, bg=PALETTE["panel"])
        basis_row.grid(row=2, column=1, sticky="w", padx=(8, 0), pady=2)
        ttk.Radiobutton(basis_row, text="MODIFIED", variable=self.timestamp_basis_var, value="modified").pack(side="left")
        ttk.Radiobutton(basis_row, text="ACCESSED", variable=self.timestamp_basis_var, value="accessed").pack(side="left", padx=(8, 0))

        ttk.Checkbutton(right_panel, text="SCAN USER FOLDERS ONLY ON SYSTEM DRIVE", variable=self.user_folders_only_var).grid(row=3, column=0, columnspan=2, sticky="w", pady=(8, 2))
        ttk.Checkbutton(right_panel, text="AUTO MODE MOVES SAFE FILES ONLY", variable=self.auto_safe_only_var).grid(row=4, column=0, columnspan=2, sticky="w", pady=2)

        ttk.Label(right_panel, text="AUTO CYCLE MINUTES", style="Panel.TLabel").grid(row=5, column=0, sticky="w", pady=2)
        ttk.Entry(right_panel, textvariable=self.interval_minutes_var, width=10).grid(row=5, column=1, sticky="ew", padx=(8, 0), pady=2)

        destination_panel = ttk.LabelFrame(outer, text="DESTINATION", style="Panel.TLabelframe", padding=8)
        destination_panel.pack(fill="x", pady=(8, 8))
        destination_panel.columnconfigure(1, weight=1)

        ttk.Label(destination_panel, text="TARGET FOLDER", style="Panel.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Entry(destination_panel, textvariable=self.destination_folder_var).grid(row=0, column=1, sticky="ew", padx=(8, 8))
        ttk.Button(destination_panel, text="BROWSE", command=self._browse_destination).grid(row=0, column=2, sticky="ew")

        control_bar = tk.Frame(outer, bg=PALETTE["bg"])
        control_bar.pack(fill="x", pady=(0, 8))
        for text, command in [
            ("SCAN NOW", self._start_scan),
            ("MOVE SELECTED", self._move_selected),
            ("MOVE ALL SAFE", self._move_all_safe),
            ("START AUTO", self._start_auto_mode),
            ("STOP AUTO", self._stop_auto_mode),
        ]:
            ttk.Button(control_bar, text=text, command=command).pack(side="left", padx=(0, 8))

        summary_panel = ttk.LabelFrame(outer, text="SCAN SUMMARY", style="Panel.TLabelframe", padding=8)
        summary_panel.pack(fill="x", pady=(0, 8))
        ttk.Label(summary_panel, textvariable=self.summary_var, style="Panel.TLabel").pack(anchor="w")
        ttk.Label(summary_panel, textvariable=self.status_var, style="Stat.TLabel").pack(anchor="w", pady=(6, 0))

        results_panel = ttk.LabelFrame(outer, text="RESULTS", style="Panel.TLabelframe", padding=8)
        results_panel.pack(fill="both", expand=True)
        results_panel.columnconfigure(0, weight=1)
        results_panel.rowconfigure(0, weight=1)

        self.results_tree = ttk.Treeview(
            results_panel,
            columns=("status", "age", "size", "basis", "reason", "path"),
            show="headings",
            selectmode="extended",
        )
        for column, title, width in [
            ("status", "STATUS", 90),
            ("age", "AGE(D)", 80),
            ("size", "SIZE", 90),
            ("basis", "BASIS", 110),
            ("reason", "RULE", 190),
            ("path", "PATH", 700),
        ]:
            self.results_tree.heading(column, text=title)
            self.results_tree.column(column, width=width, anchor="w")
        self.results_tree.grid(row=0, column=0, sticky="nsew")

        scroll_y = ttk.Scrollbar(results_panel, orient="vertical", command=self.results_tree.yview)
        scroll_y.grid(row=0, column=1, sticky="ns")
        self.results_tree.configure(yscrollcommand=scroll_y.set)

        log_panel = ttk.LabelFrame(outer, text="LOG", style="Panel.TLabelframe", padding=8)
        log_panel.pack(fill="both", expand=False, pady=(8, 0))
        self.log_box = tk.Text(
            log_panel,
            height=10,
            bg=PALETTE["field"],
            fg=PALETTE["text"],
            insertbackground=PALETTE["text"],
            relief="flat",
            font=UI_FONT,
            wrap="word",
        )
        self.log_box.pack(fill="both", expand=True)
        self.log_box.configure(state="disabled")
        self._log("Ready. This build avoids Windows/program files and only auto-moves conservative safe matches.")

    def _refresh_drives(self) -> None:
        self.drives = self.drive_scanner.list_drives()
        self.drive_tree.delete(*self.drive_tree.get_children())

        combo_values = []
        for drive in self.drives:
            combo_values.append(drive.root)
            self.drive_tree.insert(
                "",
                "end",
                values=(
                    f"{drive.root} {drive.label}",
                    drive.drive_type,
                    format_bytes(drive.free_bytes),
                    format_bytes(drive.total_bytes),
                    "YES" if drive.is_system else "NO",
                ),
            )

        self.source_combo["values"] = combo_values
        self.destination_combo["values"] = combo_values

        system_drive = next((drive.root for drive in self.drives if drive.is_system), "")
        non_system_fixed = next((drive.root for drive in self.drives if not drive.is_system and drive.drive_type in {"Fixed", "Removable"}), "")

        if system_drive:
            self.source_drive_var.set(system_drive)
        elif combo_values:
            self.source_drive_var.set(combo_values[0])

        if non_system_fixed:
            self.destination_drive_var.set(non_system_fixed)
        elif combo_values:
            self.destination_drive_var.set(combo_values[0])

        if not self.destination_folder_var.get():
            self._sync_destination_folder_from_drive(force=True)

        self._log("Drives refreshed.")

    def _default_destination_for_current_drive(self) -> str:
        drive_root = self.destination_drive_var.get()
        return str(Path(drive_root) / "Str8TuneMoved") if drive_root else ""

    def _sync_destination_folder_from_drive(self, force: bool = False) -> None:
        default_target = self._default_destination_for_current_drive()
        if not default_target:
            return
        current_value = self.destination_folder_var.get().strip()
        if force or not current_value or current_value.endswith("\\Str8TuneMoved"):
            self.destination_folder_var.set(default_target)

    def _on_destination_drive_changed(self, _event=None) -> None:
        self._sync_destination_folder_from_drive()

    def _browse_destination(self) -> None:
        selected = filedialog.askdirectory(
            title="Select destination folder",
            initialdir=self.destination_folder_var.get() or self.destination_drive_var.get() or os.getcwd(),
        )
        if selected:
            self.destination_folder_var.set(selected)

    def _start_scan(self) -> None:
        if self.scan_thread and self.scan_thread.is_alive():
            messagebox.showinfo("Scan running", "A scan is already in progress.")
            return

        source_roots = self._resolve_source_roots()
        destination_root = self._resolve_destination_root()
        if not source_roots:
            messagebox.showerror("No source", "Choose a source drive first.")
            return
        if not destination_root:
            messagebox.showerror("No destination", "Choose a destination folder first.")
            return
        if any(path_is_under(destination_root, source_root) for source_root in source_roots):
            messagebox.showerror("Bad destination", "Destination folder cannot live inside a scanned source folder.")
            return

        self.status_var.set("SCANNING...")
        self.summary_var.set("Working...")
        self._log(f"Scan started on {', '.join(source_roots)}")
        if self.timestamp_basis_var.get() == "accessed":
            self._log("Note: Windows last-access timestamps are not always reliable on every system.")
        scan_settings = self._current_scan_settings(
            self.days_var.get(),
            self.timestamp_basis_var.get(),
            self.min_size_mb_var.get(),
        )

        self.scan_thread = threading.Thread(
            target=self._scan_worker,
            args=(source_roots, scan_settings),
            daemon=True,
        )
        self.scan_thread.start()

    def _scan_worker(self, source_roots: list[str], scan_settings: dict[str, int | str]) -> None:
        try:
            results = self.engine.scan(
                source_roots=source_roots,
                older_than_days=int(scan_settings["older_than_days"]),
                timestamp_basis=str(scan_settings["timestamp_basis"]),
                min_size_mb=int(scan_settings["min_size_mb"]),
                progress_callback=self.event_queue.put,
            )
            self.event_queue.put(("scan_complete", results))
        except Exception:
            self.event_queue.put(("error", traceback.format_exc()))

    def _move_selected(self) -> None:
        selected_items = self.results_tree.selection()
        if not selected_items:
            messagebox.showinfo("No selection", "Select one or more files in the results list.")
            return

        candidates = [self.item_lookup[item] for item in selected_items if item in self.item_lookup]
        self._start_move_thread(candidates, "selected files")

    def _move_all_safe(self) -> None:
        safe_candidates = [candidate for candidate in self.current_results if candidate.status == STATUS_SAFE]
        if not safe_candidates:
            messagebox.showinfo("Nothing safe", "No SAFE files are loaded in the current scan.")
            return
        self._start_move_thread(safe_candidates, "all SAFE files")

    def _start_move_thread(self, candidates: list[FileCandidate], label: str) -> None:
        destination_root = self._resolve_destination_root()
        if not destination_root:
            messagebox.showerror("No destination", "Choose a destination folder first.")
            return

        self.status_var.set(f"MOVING {len(candidates)} FILES...")
        self._log(f"Move started for {label} -> {destination_root}")
        threading.Thread(
            target=self._move_worker,
            args=(candidates, destination_root),
            daemon=True,
        ).start()

    def _move_worker(self, candidates: list[FileCandidate], destination_root: str) -> None:
        def logger(message: str) -> None:
            self.event_queue.put(("log", message))

        moved, skipped = self.engine.move_candidates(candidates, destination_root, log_callback=logger)
        self.event_queue.put(("move_complete", (moved, skipped)))

    def _start_auto_mode(self) -> None:
        if self.auto_thread and self.auto_thread.is_alive():
            messagebox.showinfo("Auto mode", "Background auto mode is already running.")
            return

        source_roots = self._resolve_source_roots()
        destination_root = self._resolve_destination_root()
        if not source_roots or not destination_root:
            messagebox.showerror("Missing config", "Choose a source and destination first.")
            return
        auto_settings = self._current_scan_settings(
            self.days_var.get(),
            self.timestamp_basis_var.get(),
            self.min_size_mb_var.get(),
        )
        interval_minutes = self.interval_minutes_var.get()
        safe_only = self.auto_safe_only_var.get()

        self.auto_stop.clear()
        self.auto_thread = threading.Thread(
            target=self._auto_worker,
            args=(source_roots, destination_root, auto_settings, interval_minutes, safe_only),
            daemon=True,
        )
        self.auto_thread.start()
        self.status_var.set("AUTO MODE ACTIVE")
        self._log("Background auto mode started.")

    def _stop_auto_mode(self) -> None:
        self.auto_stop.set()
        self.status_var.set("AUTO MODE STOPPING...")
        self._log("Background auto mode stop requested.")

    def _auto_worker(
        self,
        source_roots: list[str],
        destination_root: str,
        auto_settings: dict[str, int | str],
        interval_minutes: int,
        safe_only: bool,
    ) -> None:
        while not self.auto_stop.is_set():
            try:
                self.event_queue.put(("log", "AUTO cycle: scanning..."))
                results = self.engine.scan(
                    source_roots=source_roots,
                    older_than_days=int(auto_settings["older_than_days"]),
                    timestamp_basis=str(auto_settings["timestamp_basis"]),
                    min_size_mb=int(auto_settings["min_size_mb"]),
                    stop_event=self.auto_stop,
                )
                if self.auto_stop.is_set():
                    break

                if safe_only:
                    move_targets = [item for item in results if item.status == STATUS_SAFE]
                else:
                    move_targets = [item for item in results if item.status != STATUS_BLOCKED]

                moved, skipped = self.engine.move_candidates(
                    move_targets,
                    destination_root,
                    log_callback=lambda message: self.event_queue.put(("log", message)),
                )
                self.event_queue.put(("log", f"AUTO cycle complete. moved={moved} skipped={skipped}"))
            except Exception:
                self.event_queue.put(("error", traceback.format_exc()))

            wait_seconds = max(1, interval_minutes) * 60
            for _ in range(wait_seconds):
                if self.auto_stop.wait(1):
                    break

        self.event_queue.put(("auto_stopped", None))

    def _resolve_source_roots(self) -> list[str]:
        selected_drive = self.source_drive_var.get()
        if not selected_drive:
            return []

        normalized_drive = normalize_path(selected_drive)
        if self.user_folders_only_var.get() and normalized_drive.startswith(normalize_path(self.drive_scanner.system_drive)):
            folders = [str(path) for path in self.policy.safe_user_roots if path.exists() and normalize_path(path).startswith(normalized_drive)]
            return folders or [selected_drive]
        return [selected_drive]

    def _resolve_destination_root(self) -> str:
        explicit = self.destination_folder_var.get().strip()
        if explicit:
            return explicit
        drive_root = self.destination_drive_var.get().strip()
        if drive_root:
            return str(Path(drive_root) / "Str8TuneMoved")
        return ""

    def _set_results(self, results: list[FileCandidate]) -> None:
        self.current_results = results
        self.item_lookup.clear()
        self.results_tree.delete(*self.results_tree.get_children())

        safe_count = 0
        review_count = 0
        blocked_count = 0
        total_size = 0

        for candidate in results:
            total_size += candidate.size_bytes
            if candidate.status == STATUS_SAFE:
                safe_count += 1
            elif candidate.status == STATUS_REVIEW:
                review_count += 1
            else:
                blocked_count += 1

            item_id = self.results_tree.insert(
                "",
                "end",
                values=(
                    candidate.status,
                    candidate.age_days,
                    format_bytes(candidate.size_bytes),
                    candidate.timestamp_basis,
                    candidate.reason,
                    candidate.path,
                ),
            )
            self.item_lookup[item_id] = candidate

        self.summary_var.set(
            f"{len(results)} files  |  SAFE {safe_count}  |  REVIEW {review_count}  |  BLOCKED {blocked_count}  |  SIZE {format_bytes(total_size)}"
        )
        self.status_var.set("SCAN COMPLETE")
        self._log(f"Scan complete. {len(results)} matching files found.")

    def _pump_events(self) -> None:
        try:
            while True:
                event_type, payload = self.event_queue.get_nowait()
                if event_type == "log":
                    self._log(str(payload))
                elif event_type == "progress":
                    self.status_var.set(str(payload))
                elif event_type == "scan_complete":
                    self._set_results(payload)  # type: ignore[arg-type]
                elif event_type == "move_complete":
                    moved, skipped = payload  # type: ignore[misc]
                    self.status_var.set(f"MOVE COMPLETE  moved={moved} skipped={skipped}")
                    self._log(f"Move complete. moved={moved} skipped={skipped}")
                    self._start_scan()
                elif event_type == "auto_stopped":
                    self.status_var.set("AUTO MODE STOPPED")
                    self._log("Background auto mode stopped.")
                elif event_type == "error":
                    self.status_var.set("ERROR")
                    self._log(str(payload))
        except queue.Empty:
            pass
        finally:
            self.root.after(200, self._pump_events)

    def _log(self, message: str) -> None:
        timestamp = dt.datetime.now().strftime("%H:%M:%S")
        self.log_box.configure(state="normal")
        self.log_box.insert("end", f"[{timestamp}] {message}\n")
        self.log_box.see("end")
        self.log_box.configure(state="disabled")

    def _on_close(self) -> None:
        self.auto_stop.set()
        self.root.destroy()


def main() -> None:
    root = tk.Tk()
    StorageRelocatorApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
