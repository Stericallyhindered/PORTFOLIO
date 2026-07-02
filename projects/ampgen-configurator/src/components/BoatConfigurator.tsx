"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import ConfigPanel from "./ConfigPanel";
import DraggableRect from "./DraggableRect";
import { 
  loadZones, 
  saveZones, 
  exportZonesAsCSS, 
  exportZonesAsJSON,
  AllZones, 
  ZonePosition, 
  CustomZone,
  defaultZones,
  generateZoneId,
  generateZoneColor,
} from "@/lib/zonePositions";

const zoneColors: Record<string, string> = {
  configPanel: "#00ff00",
  boat1: "#ff4d00",
  boat2: "#ff4d00",
  boat3: "#ff4d00",
};

export default function BoatConfigurator() {
  const [activeBoat, setActiveBoat] = useState<1 | 2 | 3>(1);
  const [activeZone, setActiveZone] = useState<string>("trollingMotor");
  const [devMode, setDevMode] = useState(false);
  const [zones, setZones] = useState<AllZones>(defaultZones);
  const [showBoatZones, setShowBoatZones] = useState(true);
  const [editingZone, setEditingZone] = useState<CustomZone | null>(null);
  const [newZoneLabel, setNewZoneLabel] = useState("");

  // Load saved zones on mount
  useEffect(() => {
    const savedZones = loadZones();
    setZones(savedZones);
  }, []);

  // Keyboard shortcut for dev mode (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        e.preventDefault();
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleZonePositionChange = useCallback(
    (zoneId: string, position: ZonePosition) => {
      setZones((prev) => {
        const newZones = { ...prev };
        
        // Handle boat click zones
        if (zoneId.startsWith("boatClickZone-")) {
          const boatNum = zoneId.split("-")[1] as "boat1" | "boat2" | "boat3";
          newZones.boatClickZones = {
            ...newZones.boatClickZones,
            [boatNum]: position,
          };
        }
        // Handle config panel
        else if (zoneId.startsWith("configPanel-")) {
          const boatNum = zoneId.split("-")[1] as "boat1" | "boat2" | "boat3";
          newZones[boatNum] = {
            ...newZones[boatNum],
            configPanel: position,
          };
        }
        // Handle custom zones
        else {
          // Find which boat this zone belongs to
          for (const boatKey of ["boat1", "boat2", "boat3"] as const) {
            const zoneIndex = newZones[boatKey].customZones.findIndex(z => z.id === zoneId);
            if (zoneIndex !== -1) {
              newZones[boatKey] = {
                ...newZones[boatKey],
                customZones: newZones[boatKey].customZones.map((z, i) => 
                  i === zoneIndex ? { ...z, position } : z
                ),
              };
              break;
            }
          }
        }
        
        return newZones;
      });
    },
    []
  );

  const handleAddZone = () => {
    const label = newZoneLabel.trim() || `Zone ${zones[currentBoatKey].customZones.length + 1}`;
    const newZone: CustomZone = {
      id: generateZoneId(),
      label,
      position: { left: 10, top: 30, width: 15, height: 10 },
      content: label.toLowerCase().replace(/\s+/g, ""),
      color: generateZoneColor(),
    };

    setZones((prev) => ({
      ...prev,
      [currentBoatKey]: {
        ...prev[currentBoatKey],
        customZones: [...prev[currentBoatKey].customZones, newZone],
      },
    }));
    setNewZoneLabel("");
  };

  const handleDeleteZone = (zoneId: string) => {
    if (!confirm("Delete this zone?")) return;
    
    setZones((prev) => ({
      ...prev,
      [currentBoatKey]: {
        ...prev[currentBoatKey],
        customZones: prev[currentBoatKey].customZones.filter(z => z.id !== zoneId),
      },
    }));
  };

  const handleEditZone = (zone: CustomZone) => {
    setEditingZone(zone);
  };

  const handleSaveZoneEdit = () => {
    if (!editingZone) return;

    setZones((prev) => ({
      ...prev,
      [currentBoatKey]: {
        ...prev[currentBoatKey],
        customZones: prev[currentBoatKey].customZones.map(z => 
          z.id === editingZone.id ? editingZone : z
        ),
      },
    }));
    setEditingZone(null);
  };

  const handleSaveZones = () => {
    saveZones(zones);
    alert("Zones saved to localStorage!");
  };

  const handleExportCSS = () => {
    const css = exportZonesAsCSS(zones);
    console.log(css);
    navigator.clipboard.writeText(css);
    alert("CSS copied to clipboard! Check console for full output.");
  };

  const handleExportJSON = () => {
    const json = exportZonesAsJSON(zones);
    console.log(json);
    navigator.clipboard.writeText(json);
    alert("JSON copied to clipboard! Check console for full output.");
  };

  const handleResetZones = () => {
    if (confirm("Reset all zones to default positions?")) {
      setZones(defaultZones);
      saveZones(defaultZones);
    }
  };

  const currentBoatKey = `boat${activeBoat}` as "boat1" | "boat2" | "boat3";
  const currentBoatZones = zones[currentBoatKey];

  return (
    <div className="configurator-container">
      {/* Layer 1: Background */}
      <Image
        src="/assets/background.png"
        alt="Background"
        fill
        className="configurator-layer"
        style={{ objectFit: "cover" }}
        priority
      />

      {/* Layer 2: Graphs/Grid panels */}
      <Image
        src="/assets/graphs.png"
        alt="Graph panels"
        fill
        className="configurator-layer"
        style={{ objectFit: "contain" }}
        priority
      />

      {/* Layer 3: Logos */}
      <Image
        src="/assets/logos.png"
        alt="AmpGen and Stealth logos"
        fill
        className="configurator-layer"
        style={{ objectFit: "contain" }}
        priority
      />

      {/* Layer 4: Boat highlight (swapped based on activeBoat) */}
      <Image
        src={`/assets/boat${activeBoat}highlight.png`}
        alt={`Boat ${activeBoat} highlighted`}
        fill
        className="configurator-layer"
        style={{ objectFit: "contain" }}
        priority
      />

      {/* Layer 5: X-ray panel (swapped based on activeBoat) */}
      <Image
        src={`/assets/boat${activeBoat}xray.png`}
        alt={`Boat ${activeBoat} x-ray panel`}
        fill
        className="configurator-layer"
        style={{ objectFit: "contain" }}
        priority
      />

      {/* Dev Mode: Boat selection zones (draggable in dev mode) */}
      {devMode && showBoatZones ? (
        <>
          <DraggableRect
            id="boatClickZone-boat1"
            label="Boat 1 Click"
            initialPosition={zones.boatClickZones.boat1}
            color={zoneColors.boat1}
            onPositionChange={handleZonePositionChange}
            isVisible={true}
            onClick={() => setActiveBoat(1)}
            isActive={activeBoat === 1}
          />
          <DraggableRect
            id="boatClickZone-boat2"
            label="Boat 2 Click"
            initialPosition={zones.boatClickZones.boat2}
            color={zoneColors.boat2}
            onPositionChange={handleZonePositionChange}
            isVisible={true}
            onClick={() => setActiveBoat(2)}
            isActive={activeBoat === 2}
          />
          <DraggableRect
            id="boatClickZone-boat3"
            label="Boat 3 Click"
            initialPosition={zones.boatClickZones.boat3}
            color={zoneColors.boat3}
            onPositionChange={handleZonePositionChange}
            isVisible={true}
            onClick={() => setActiveBoat(3)}
            isActive={activeBoat === 3}
          />
        </>
      ) : (
        /* Normal mode: Invisible boat click zones */
        <div className="click-zones-container">
          <button
            className="boat-click-zone"
            style={{
              left: `${zones.boatClickZones.boat1.left}%`,
              top: `${zones.boatClickZones.boat1.top}%`,
              width: `${zones.boatClickZones.boat1.width}%`,
              height: `${zones.boatClickZones.boat1.height}%`,
            }}
            onClick={() => setActiveBoat(1)}
            aria-label="Select Boat 1"
          />
          <button
            className="boat-click-zone"
            style={{
              left: `${zones.boatClickZones.boat2.left}%`,
              top: `${zones.boatClickZones.boat2.top}%`,
              width: `${zones.boatClickZones.boat2.width}%`,
              height: `${zones.boatClickZones.boat2.height}%`,
            }}
            onClick={() => setActiveBoat(2)}
            aria-label="Select Boat 2"
          />
          <button
            className="boat-click-zone"
            style={{
              left: `${zones.boatClickZones.boat3.left}%`,
              top: `${zones.boatClickZones.boat3.top}%`,
              width: `${zones.boatClickZones.boat3.width}%`,
              height: `${zones.boatClickZones.boat3.height}%`,
            }}
            onClick={() => setActiveBoat(3)}
            aria-label="Select Boat 3"
          />
        </div>
      )}

      {/* Dev Mode: Config Panel zone (draggable) */}
      {devMode ? (
        <DraggableRect
          id={`configPanel-${currentBoatKey}`}
          label={`Config Panel (Boat ${activeBoat})`}
          initialPosition={currentBoatZones.configPanel}
          color={zoneColors.configPanel}
          onPositionChange={handleZonePositionChange}
          isVisible={true}
        />
      ) : null}

      {/* Config Panel Content - positioned using saved zones */}
      <div
        className="config-panel-container"
        style={{
          left: `${currentBoatZones.configPanel.left}%`,
          top: `${currentBoatZones.configPanel.top}%`,
          width: `${currentBoatZones.configPanel.width}%`,
          height: `${currentBoatZones.configPanel.height}%`,
        }}
      >
        <ConfigPanel activeBoat={activeBoat} activeZone={activeZone} />
      </div>

      {/* Custom clickable zones for current boat */}
      {currentBoatZones.customZones.map((zone) => (
        <DraggableRect
          key={zone.id}
          id={zone.id}
          label={zone.label}
          initialPosition={zone.position}
          color={zone.color}
          onPositionChange={handleZonePositionChange}
          isVisible={devMode && !showBoatZones}
          onClick={() => {
            setActiveZone(zone.content);
            if (devMode) handleEditZone(zone);
          }}
          isActive={activeZone === zone.content}
        />
      ))}

      {/* Non-dev mode: Invisible click zones for custom zones */}
      {!devMode && currentBoatZones.customZones.map((zone) => (
        <button
          key={`click-${zone.id}`}
          className="boat-click-zone section-zone"
          style={{
            left: `${zone.position.left}%`,
            top: `${zone.position.top}%`,
            width: `${zone.position.width}%`,
            height: `${zone.position.height}%`,
          }}
          onClick={() => setActiveZone(zone.content)}
          aria-label={zone.label}
        />
      ))}

      {/* Dev Mode Controls */}
      {devMode && (
        <div className="dev-controls">
          <div className="dev-header">
            <span className="dev-badge">DEV MODE</span>
            <button className="dev-close-btn" onClick={() => setDevMode(false)}>✕</button>
          </div>
          <div className="dev-info">
            Active: Boat {activeBoat} | Zone: {activeZone}
          </div>
          
          <div className="dev-section">
            <div className="dev-section-title">View Mode</div>
            <div className="dev-buttons">
              <button 
                className={showBoatZones ? "active" : ""}
                onClick={() => setShowBoatZones(true)}
              >
                Boat Zones
              </button>
              <button 
                className={!showBoatZones ? "active" : ""}
                onClick={() => setShowBoatZones(false)}
              >
                Section Zones
              </button>
            </div>
          </div>

          {!showBoatZones && (
            <div className="dev-section">
              <div className="dev-section-title">Add New Zone (Boat {activeBoat})</div>
              <div className="dev-add-zone">
                <input
                  type="text"
                  placeholder="Zone label..."
                  value={newZoneLabel}
                  onChange={(e) => setNewZoneLabel(e.target.value)}
                  className="dev-input"
                />
                <button onClick={handleAddZone}>+ Add</button>
              </div>
            </div>
          )}

          {editingZone && (
            <div className="dev-section">
              <div className="dev-section-title">Edit Zone</div>
              <div className="dev-edit-zone">
                <input
                  type="text"
                  placeholder="Label"
                  value={editingZone.label}
                  onChange={(e) => setEditingZone({ ...editingZone, label: e.target.value })}
                  className="dev-input"
                />
                <input
                  type="text"
                  placeholder="Content ID"
                  value={editingZone.content}
                  onChange={(e) => setEditingZone({ ...editingZone, content: e.target.value })}
                  className="dev-input"
                />
                <div className="dev-buttons">
                  <button onClick={handleSaveZoneEdit}>Save</button>
                  <button onClick={() => handleDeleteZone(editingZone.id)} className="danger">Delete</button>
                  <button onClick={() => setEditingZone(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="dev-section">
            <div className="dev-section-title">Actions</div>
            <div className="dev-buttons">
              <button onClick={handleSaveZones}>Save All</button>
              <button onClick={handleExportJSON}>Export JSON</button>
              <button onClick={handleExportCSS}>Export CSS</button>
              <button onClick={handleResetZones} className="danger">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Dev Mode Toggle Button - Always Visible */}
      <button 
        className={`dev-toggle-btn ${devMode ? "active" : ""}`}
        onClick={() => setDevMode(!devMode)}
      >
        {devMode ? "EXIT DEV" : "DEV MODE"}
      </button>
    </div>
  );
}
