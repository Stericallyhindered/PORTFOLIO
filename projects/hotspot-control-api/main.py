"""PdaNet USB to Wi-Fi hotspot GUI."""



from __future__ import annotations



import threading

import tkinter as tk

from tkinter import messagebox, ttk



from hotspot_api import (

    PDANET_BOOTSTRAP_STEPS,

    configure_hotspot,

    get_status,

    open_mobile_hotspot_settings,

    open_network_connections,

    start_hotspot,

    stop_hotspot,

)





class HotspotApp(tk.Tk):

    REFRESH_MS = 3000



    def __init__(self) -> None:

        super().__init__()

        self.title("PdaNet WiFi Hotspot")

        self.geometry("480x580")

        self.resizable(False, False)



        self._busy = False

        self._show_password = tk.BooleanVar(value=False)



        self._build_ui()

        self.after(100, self.refresh_status)



    def _build_ui(self) -> None:

        container = ttk.Frame(self, padding=16)

        container.pack(fill="both", expand=True)



        title = ttk.Label(container, text="Share PdaNet USB over Wi-Fi", font=("Segoe UI", 16, "bold"))

        title.pack(anchor="w")



        subtitle = ttk.Label(

            container,

            text="Uses PdaNet's built-in WiFi Share to broadcast your USB connection.",

            wraplength=440,

        )

        subtitle.pack(anchor="w", pady=(4, 10))



        self.upstream_var = tk.StringVar(value="Internet source: checking...")

        ttk.Label(container, textvariable=self.upstream_var, foreground="#444444").pack(anchor="w")



        self.status_var = tk.StringVar(value="Checking hotspot status...")

        self.status_label = ttk.Label(container, textvariable=self.status_var, font=("Segoe UI", 11, "bold"))

        self.status_label.pack(anchor="w", pady=(6, 0))



        self.clients_var = tk.StringVar(value="")

        ttk.Label(container, textvariable=self.clients_var).pack(anchor="w", pady=(4, 10))



        self.toggle_button = ttk.Button(container, text="Start Hotspot", command=self.toggle_hotspot)

        self.toggle_button.pack(fill="x", pady=(0, 8))



        actions = ttk.Frame(container)

        actions.pack(fill="x", pady=(0, 10))

        ttk.Button(actions, text="Open Hotspot Settings", command=open_mobile_hotspot_settings).pack(

            side="left", expand=True, fill="x", padx=(0, 4)

        )

        ttk.Button(actions, text="Network Connections", command=open_network_connections).pack(

            side="left", expand=True, fill="x", padx=(4, 0)

        )



        setup = ttk.LabelFrame(container, text="How this works with USB-only PdaNet", padding=10)

        setup.pack(fill="x", pady=(0, 10))



        for index, step in enumerate(PDANET_BOOTSTRAP_STEPS, start=1):

            ttk.Label(setup, text=f"{index}. {step}", wraplength=420).pack(anchor="w", pady=1)



        settings = ttk.LabelFrame(container, text="Wi-Fi network name and password", padding=12)

        settings.pack(fill="x")



        ttk.Label(settings, text="Network name (SSID)").grid(row=0, column=0, sticky="w")

        self.ssid_entry = ttk.Entry(settings, width=36)

        self.ssid_entry.grid(row=1, column=0, columnspan=2, sticky="ew", pady=(2, 8))



        ttk.Label(settings, text="Password (8+ characters)").grid(row=2, column=0, sticky="w")

        self.password_entry = ttk.Entry(settings, width=36, show="*")

        self.password_entry.grid(row=3, column=0, sticky="ew", pady=(2, 8))



        show_pw = ttk.Checkbutton(

            settings,

            text="Show password",

            variable=self._show_password,

            command=self._toggle_password_visibility,

        )

        show_pw.grid(row=3, column=1, padx=(8, 0))



        self.save_button = ttk.Button(settings, text="Save settings", command=self.save_settings)

        self.save_button.grid(row=4, column=0, columnspan=2, sticky="ew", pady=(4, 0))



        settings.columnconfigure(0, weight=1)



        self.message_var = tk.StringVar(value="")

        self.message_label = ttk.Label(container, textvariable=self.message_var, foreground="#555555", wraplength=440)

        self.message_label.pack(anchor="w", pady=(10, 0))



    def _toggle_password_visibility(self) -> None:

        self.password_entry.configure(show="" if self._show_password.get() else "*")



    def _set_busy(self, busy: bool) -> None:

        self._busy = busy

        state = "disabled" if busy else "normal"

        self.toggle_button.configure(state=state)

        self.save_button.configure(state=state)



    def _set_message(self, text: str, is_error: bool = False) -> None:

        self.message_var.set(text)

        self.message_label.configure(foreground="#b00020" if is_error else "#555555")



    def _apply_status(self, status) -> None:

        if not status.success:

            self.status_var.set("Status unavailable")

            self.clients_var.set("")

            self.toggle_button.configure(text="Start Hotspot")

            self._set_message(status.error or "Could not read hotspot status.", is_error=True)

            return



        if status.upstream:

            self.upstream_var.set(f"Internet source: {status.upstream}")

        else:

            self.upstream_var.set("Internet source: unknown")



        self.status_var.set(status.status_text)

        self.clients_var.set("")



        if status.is_on:

            self.toggle_button.configure(text="Stop Hotspot")

        else:

            self.toggle_button.configure(text="Start Hotspot")



        if not self.ssid_entry.get().strip() and status.ssid:

            self.ssid_entry.delete(0, tk.END)

            self.ssid_entry.insert(0, status.ssid)



        if not self.password_entry.get().strip() and status.passphrase:

            self.password_entry.delete(0, tk.END)

            self.password_entry.insert(0, status.passphrase)



        operation_message = status.operation_message

        if operation_message:

            self._set_message(operation_message, is_error=not status.is_on)

        elif status.needs_bootstrap and not status.is_on:

            self._set_message(

                "USB-only mode: if Activate fails in PdaNet WiFi Share, use the one-time unlock steps above.",

                is_error=True,

            )

        else:

            self._set_message("")



    def _run_async(self, action_name: str, worker) -> None:

        if self._busy:

            return



        self._set_busy(True)

        self._set_message(f"{action_name}...")



        def task() -> None:

            try:

                result = worker()

            except Exception as exc:  # noqa: BLE001

                result = None

                error = str(exc)

                self.after(0, lambda: self._set_message(error, is_error=True))

            else:

                self.after(0, lambda: self._apply_status(result))

            finally:

                self.after(0, lambda: self._set_busy(False))

                self.after(self.REFRESH_MS, self.refresh_status)



        threading.Thread(target=task, daemon=True).start()



    def refresh_status(self) -> None:

        if self._busy:

            self.after(self.REFRESH_MS, self.refresh_status)

            return



        def task() -> None:

            try:

                result = get_status()

            except Exception as exc:  # noqa: BLE001

                self.after(0, lambda: self._set_message(str(exc), is_error=True))

            else:

                self.after(0, lambda: self._apply_status(result))

            finally:

                self.after(self.REFRESH_MS, self.refresh_status)



        threading.Thread(target=task, daemon=True).start()



    def toggle_hotspot(self) -> None:

        current = get_status()

        if not current.success:

            messagebox.showerror("Hotspot", current.error or "Could not read hotspot status.")

            return



        if current.is_on:

            self._run_async("Stopping hotspot", stop_hotspot)

            return



        if not current.pdanet_connected:

            messagebox.showwarning(

                "PdaNet",

                "PdaNet USB is not connected.\n\nPlug in your phone and connect PdaNet first.",

            )

            return



        self._run_async("Opening PdaNet WiFi Share", start_hotspot)



    def save_settings(self) -> None:

        ssid = self.ssid_entry.get().strip()

        passphrase = self.password_entry.get()



        if not ssid:

            messagebox.showwarning("Hotspot", "Enter a network name (SSID).")

            return

        if len(passphrase) < 8:

            messagebox.showwarning("Hotspot", "Password must be at least 8 characters.")

            return



        self._run_async("Saving settings", lambda: configure_hotspot(ssid, passphrase))





def main() -> None:

    app = HotspotApp()

    app.mainloop()





if __name__ == "__main__":

    main()


