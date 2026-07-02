// Zone position interface
export interface ZonePosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Custom zone with label and content
export interface CustomZone {
  id: string;
  label: string;
  position: ZonePosition;
  content: string; // Custom text/HTML content for this zone
  color: string;
}

export interface BoatZones {
  configPanel: ZonePosition;
  customZones: CustomZone[];
}

export interface AllZones {
  boat1: BoatZones;
  boat2: BoatZones;
  boat3: BoatZones;
  boatClickZones: {
    boat1: ZonePosition;
    boat2: ZonePosition;
    boat3: ZonePosition;
  };
}

// Generate random color for new zones
export function generateZoneColor(): string {
  const colors = [
    "#ffff00", "#ff6600", "#00ffff", "#ff00ff", 
    "#0066ff", "#ff0066", "#00ff66", "#6600ff"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate unique ID
export function generateZoneId(): string {
  return `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Default positions
export const defaultZones: AllZones = {
  boatClickZones: {
    boat1: { left: 5, top: 12, width: 22, height: 78 },
    boat2: { left: 39, top: 12, width: 22, height: 78 },
    boat3: { left: 72, top: 12, width: 22, height: 78 },
  },
  boat1: {
    configPanel: { left: 30.2, top: 24, width: 19.8, height: 35 },
    customZones: [
      {
        id: "boat1-trollingMotor",
        label: "Trolling Motor",
        position: { left: 7, top: 14, width: 18, height: 12 },
        content: "trollingMotor",
        color: "#ffff00",
      },
      {
        id: "boat1-livescope",
        label: "Livescope",
        position: { left: 7, top: 26, width: 18, height: 10 },
        content: "livescope",
        color: "#ff6600",
      },
    ],
  },
  boat2: {
    configPanel: { left: 61.5, top: 24, width: 19.8, height: 35 },
    customZones: [
      {
        id: "boat2-trollingMotor",
        label: "Trolling Motor",
        position: { left: 41, top: 14, width: 18, height: 12 },
        content: "trollingMotor",
        color: "#ffff00",
      },
      {
        id: "boat2-livescope",
        label: "Livescope",
        position: { left: 41, top: 26, width: 18, height: 10 },
        content: "livescope",
        color: "#ff6600",
      },
    ],
  },
  boat3: {
    configPanel: { left: 46.2, top: 25, width: 19.8, height: 34 },
    customZones: [
      {
        id: "boat3-trollingMotor",
        label: "Trolling Motor",
        position: { left: 74, top: 14, width: 18, height: 12 },
        content: "trollingMotor",
        color: "#ffff00",
      },
      {
        id: "boat3-livescope",
        label: "Livescope",
        position: { left: 74, top: 26, width: 18, height: 10 },
        content: "livescope",
        color: "#ff6600",
      },
    ],
  },
};

const STORAGE_KEY = "ampgen-zone-positions";

export function loadZones(): AllZones {
  if (typeof window === "undefined") return defaultZones;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure customZones array exists for each boat
      if (!parsed.boat1.customZones) parsed.boat1.customZones = [];
      if (!parsed.boat2.customZones) parsed.boat2.customZones = [];
      if (!parsed.boat3.customZones) parsed.boat3.customZones = [];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load zones:", e);
  }
  return defaultZones;
}

export function saveZones(zones: AllZones): void {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
    console.log("Zones saved!", zones);
  } catch (e) {
    console.error("Failed to save zones:", e);
  }
}

export function exportZonesAsJSON(zones: AllZones): string {
  return JSON.stringify(zones, null, 2);
}

export function exportZonesAsCSS(zones: AllZones): string {
  return `/* Auto-generated zone positions */
.config-panel-boat-1 {
  left: ${zones.boat1.configPanel.left}%;
  top: ${zones.boat1.configPanel.top}%;
  width: ${zones.boat1.configPanel.width}%;
  height: ${zones.boat1.configPanel.height}%;
}

.config-panel-boat-2 {
  left: ${zones.boat2.configPanel.left}%;
  top: ${zones.boat2.configPanel.top}%;
  width: ${zones.boat2.configPanel.width}%;
  height: ${zones.boat2.configPanel.height}%;
}

.config-panel-boat-3 {
  left: ${zones.boat3.configPanel.left}%;
  top: ${zones.boat3.configPanel.top}%;
  width: ${zones.boat3.configPanel.width}%;
  height: ${zones.boat3.configPanel.height}%;
}`;
}
