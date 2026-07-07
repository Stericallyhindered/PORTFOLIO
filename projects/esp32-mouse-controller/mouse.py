#!/usr/bin/env python3
"""
ESP32-S3 Mouse Controller GUI
Configurable mouse drag controller with real-time settings
"""

import sys
import serial
import serial.tools.list_ports
import time
from PyQt5.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QSlider, QSpinBox, QPushButton, 
                             QComboBox, QTextEdit, QGroupBox, QGridLayout, QStatusBar,
                             QMessageBox, QCheckBox)
from PyQt5.QtCore import QTimer, QThread, pyqtSignal, Qt
from PyQt5.QtGui import QFont, QPalette, QColor

class SerialWorker(QThread):
    """Worker thread for handling serial communication"""
    data_received = pyqtSignal(str)
    connection_status = pyqtSignal(bool)
    
    def __init__(self):
        super().__init__()
        self.serial_conn = None
        self.running = False
        
    def connect_serial(self, port, baudrate=115200):
        """Connect to ESP32 serial port"""
        try:
            self.serial_conn = serial.Serial(port, baudrate, timeout=1)
            time.sleep(2)  # Wait for ESP32 to initialize
            self.running = True
            self.connection_status.emit(True)
            return True
        except Exception as e:
            self.connection_status.emit(False)
            return False
    
    def disconnect(self):
        """Disconnect from serial"""
        self.running = False
        if self.serial_conn and self.serial_conn.is_open:
            self.serial_conn.close()
        self.connection_status.emit(False)
    
    def send_command(self, command):
        """Send command to ESP32"""
        if self.serial_conn and self.serial_conn.is_open:
            try:
                self.serial_conn.write(f"{command}\n".encode())
                return True
            except Exception as e:
                return False
        return False
    
    def run(self):
        """Main thread loop for reading serial data"""
        while self.running:
            if self.serial_conn and self.serial_conn.is_open:
                try:
                    if self.serial_conn.in_waiting > 0:
                        data = self.serial_conn.readline().decode().strip()
                        if data:
                            self.data_received.emit(data)
                except Exception as e:
                    pass
            time.sleep(0.01)

class MouseControllerGUI(QMainWindow):
    def __init__(self):
        super().__init__()
        self.serial_worker = SerialWorker()
        self.serial_worker.data_received.connect(self.on_serial_data)
        self.serial_worker.connection_status.connect(self.on_connection_status)
        self.is_connected = False
        self.is_dragging = False
        
        self.init_ui()
        self.setup_serial_worker()
        
    def init_ui(self):
        """Initialize the user interface"""
        self.setWindowTitle("ESP32-S3 Mouse Controller")
        self.setGeometry(100, 100, 500, 600)
        
        # Set dark theme
        self.setStyleSheet("""
            QMainWindow {
                background-color: #2b2b2b;
                color: #ffffff;
            }
            QGroupBox {
                font-weight: bold;
                border: 2px solid #555555;
                border-radius: 5px;
                margin-top: 1ex;
                padding-top: 10px;
            }
            QGroupBox::title {
                subcontrol-origin: margin;
                left: 10px;
                padding: 0 5px 0 5px;
            }
            QPushButton {
                background-color: #404040;
                border: 1px solid #555555;
                border-radius: 3px;
                padding: 5px;
                min-width: 80px;
            }
            QPushButton:hover {
                background-color: #505050;
            }
            QPushButton:pressed {
                background-color: #606060;
            }
            QPushButton:disabled {
                background-color: #333333;
                color: #666666;
            }
            QSlider::groove:horizontal {
                border: 1px solid #555555;
                height: 8px;
                background: #404040;
                border-radius: 4px;
            }
            QSlider::handle:horizontal {
                background: #0078d4;
                border: 1px solid #555555;
                width: 18px;
                margin: -5px 0;
                border-radius: 9px;
            }
            QSpinBox {
                background-color: #404040;
                border: 1px solid #555555;
                border-radius: 3px;
                padding: 2px;
            }
            QComboBox {
                background-color: #404040;
                border: 1px solid #555555;
                border-radius: 3px;
                padding: 2px;
            }
            QTextEdit {
                background-color: #1e1e1e;
                border: 1px solid #555555;
                border-radius: 3px;
                color: #ffffff;
            }
        """)
        
        # Central widget
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)
        
        # Connection group
        conn_group = QGroupBox("Connection")
        conn_layout = QGridLayout(conn_group)
        
        conn_layout.addWidget(QLabel("Port:"), 0, 0)
        self.port_combo = QComboBox()
        self.port_combo.setMinimumWidth(200)
        conn_layout.addWidget(self.port_combo, 0, 1)
        
        self.refresh_btn = QPushButton("Refresh")
        self.refresh_btn.clicked.connect(self.refresh_ports)
        conn_layout.addWidget(self.refresh_btn, 0, 2)
        
        self.connect_btn = QPushButton("Connect")
        self.connect_btn.clicked.connect(self.toggle_connection)
        conn_layout.addWidget(self.connect_btn, 0, 3)
        
        layout.addWidget(conn_group)
        
        # Settings group
        settings_group = QGroupBox("Mouse Settings")
        settings_layout = QGridLayout(settings_group)
        
        # Speed control
        settings_layout.addWidget(QLabel("Speed (pixels/move):"), 0, 0)
        self.speed_slider = QSlider(Qt.Horizontal)
        self.speed_slider.setRange(1, 127)
        self.speed_slider.setValue(2)
        self.speed_slider.valueChanged.connect(self.on_speed_changed)
        settings_layout.addWidget(self.speed_slider, 0, 1)
        
        self.speed_spin = QSpinBox()
        self.speed_spin.setRange(1, 127)
        self.speed_spin.setValue(2)
        self.speed_spin.valueChanged.connect(self.on_speed_spin_changed)
        settings_layout.addWidget(self.speed_spin, 0, 2)
        
        # Delay control
        settings_layout.addWidget(QLabel("Delay (ms):"), 1, 0)
        self.delay_slider = QSlider(Qt.Horizontal)
        self.delay_slider.setRange(1, 1000)
        self.delay_slider.setValue(10)
        self.delay_slider.valueChanged.connect(self.on_delay_changed)
        settings_layout.addWidget(self.delay_slider, 1, 1)
        
        self.delay_spin = QSpinBox()
        self.delay_spin.setRange(1, 1000)
        self.delay_spin.setValue(10)
        self.delay_spin.valueChanged.connect(self.on_delay_spin_changed)
        settings_layout.addWidget(self.delay_spin, 1, 2)
        
        layout.addWidget(settings_group)
        
        # Control group
        control_group = QGroupBox("Control")
        control_layout = QHBoxLayout(control_group)
        
        self.start_btn = QPushButton("START DRAG")
        self.start_btn.setStyleSheet("QPushButton { background-color: #d13438; font-weight: bold; }")
        self.start_btn.clicked.connect(self.start_drag)
        self.start_btn.setEnabled(False)
        control_layout.addWidget(self.start_btn)
        
        self.stop_btn = QPushButton("STOP DRAG")
        self.stop_btn.setStyleSheet("QPushButton { background-color: #107c10; font-weight: bold; }")
        self.stop_btn.clicked.connect(self.stop_drag)
        self.stop_btn.setEnabled(False)
        control_layout.addWidget(self.stop_btn)
        
        layout.addWidget(control_group)
        
        # Status group
        status_group = QGroupBox("Status & Log")
        status_layout = QVBoxLayout(status_group)
        
        self.log_text = QTextEdit()
        self.log_text.setMaximumHeight(150)
        self.log_text.setReadOnly(True)
        status_layout.addWidget(self.log_text)
        
        layout.addWidget(status_group)
        
        # Status bar
        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("Disconnected")
        
        # Initial setup
        self.refresh_ports()
        
    def setup_serial_worker(self):
        """Setup the serial worker thread"""
        self.serial_worker.start()
        
    def refresh_ports(self):
        """Refresh available serial ports"""
        self.port_combo.clear()
        ports = serial.tools.list_ports.comports()
        for port in ports:
            self.port_combo.addItem(f"{port.device} - {port.description}")
        self.log_message("Available ports refreshed")
        
    def toggle_connection(self):
        """Toggle serial connection"""
        if not self.is_connected:
            port = self.port_combo.currentText().split(' - ')[0]
            if port:
                if self.serial_worker.connect_serial(port):
                    self.log_message(f"Connected to {port}")
                else:
                    self.log_message(f"Failed to connect to {port}")
                    QMessageBox.warning(self, "Connection Error", f"Failed to connect to {port}")
            else:
                QMessageBox.warning(self, "No Port", "Please select a serial port")
        else:
            self.serial_worker.disconnect()
            self.log_message("Disconnected")
            
    def on_connection_status(self, connected):
        """Handle connection status changes"""
        self.is_connected = connected
        self.connect_btn.setText("Disconnect" if connected else "Connect")
        self.connect_btn.setStyleSheet("""
            QPushButton { background-color: #d13438; } 
            QPushButton:hover { background-color: #e74c3c; }
        """ if connected else "")
        self.start_btn.setEnabled(connected)
        self.stop_btn.setEnabled(connected and self.is_dragging)
        self.status_bar.showMessage("Connected" if connected else "Disconnected")
        
    def on_speed_changed(self, value):
        """Handle speed slider change"""
        self.speed_spin.setValue(value)
        if self.is_connected:
            self.serial_worker.send_command(f"SPEED {value}")
            
    def on_speed_spin_changed(self, value):
        """Handle speed spinbox change"""
        self.speed_slider.setValue(value)
        if self.is_connected:
            self.serial_worker.send_command(f"SPEED {value}")
            
    def on_delay_changed(self, value):
        """Handle delay slider change"""
        self.delay_spin.setValue(value)
        if self.is_connected:
            self.serial_worker.send_command(f"DELAY {value}")
            
    def on_delay_spin_changed(self, value):
        """Handle delay spinbox change"""
        self.delay_slider.setValue(value)
        if self.is_connected:
            self.serial_worker.send_command(f"DELAY {value}")
            
    def start_drag(self):
        """Start mouse dragging"""
        if self.is_connected:
            self.serial_worker.send_command("START")
            self.is_dragging = True
            self.start_btn.setEnabled(False)
            self.stop_btn.setEnabled(True)
            self.log_message("Drag started")
            
    def stop_drag(self):
        """Stop mouse dragging"""
        if self.is_connected:
            self.serial_worker.send_command("STOP")
            self.is_dragging = False
            self.start_btn.setEnabled(True)
            self.stop_btn.setEnabled(False)
            self.log_message("Drag stopped")
            
    def on_serial_data(self, data):
        """Handle incoming serial data"""
        self.log_message(f"ESP32: {data}")
        
    def log_message(self, message):
        """Add message to log"""
        timestamp = time.strftime("%H:%M:%S")
        self.log_text.append(f"[{timestamp}] {message}")
        
    def closeEvent(self, event):
        """Handle application close"""
        if self.is_connected:
            self.serial_worker.disconnect()
        self.serial_worker.quit()
        self.serial_worker.wait()
        event.accept()

def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')  # Use Fusion style for better dark theme support
    
    window = MouseControllerGUI()
    window.show()
    
    sys.exit(app.exec_())

if __name__ == '__main__':
    main()
