"use client";

import { useState } from "react";

type ZoneType = "trollingMotor" | "livescope" | "console" | "stereo" | "livewells" | "rearCompartment";

interface ConfigPanelProps {
  activeBoat: 1 | 2 | 3;
  activeZone: ZoneType;
}

// Placeholder product data
const trollingMotorBrands = ["Select Brand", "Minn Kota", "MotorGuide", "Garmin Force", "Lowrance Ghost"];
const trollingMotorModels: Record<string, string[]> = {
  "Select Brand": ["Select Model"],
  "Minn Kota": ["Ultrex Quest 90", "Ultrex Quest 112", "Terrova 112"],
  "MotorGuide": ["Tour Pro 109", "Xi5 105"],
  "Garmin Force": ["Force Kraken 60", "Force Kraken 75"],
  "Lowrance Ghost": ["Ghost 47", "Ghost 52"],
};

const graphBrands = ["Select Brand", "Garmin", "Lowrance", "Humminbird"];
const graphSizes = ["Select Size", '7"', '9"', '10"', '12"', '16"'];

const liveSonarOptions = [
  { id: "livescope", name: "Garmin LiveScope Plus", ampDraw: 4.2 },
  { id: "activetarget", name: "Lowrance ActiveTarget 2", ampDraw: 3.8 },
  { id: "megalive", name: "Humminbird MEGA Live", ampDraw: 3.5 },
  { id: "mega360", name: "Humminbird MEGA 360", ampDraw: 4.0 },
];

const stereoOptions = [
  { id: "none", name: "No Stereo", ampDraw: 0 },
  { id: "basic", name: "Basic Marine Stereo", ampDraw: 5 },
  { id: "premium", name: "Premium System", ampDraw: 15 },
];

const livewellOptions = [
  { id: "chiller", name: "Livewell Chiller", ampDraw: 8 },
  { id: "treatment", name: "Water Treatment", ampDraw: 2 },
  { id: "pump", name: "Recirculation Pump", ampDraw: 3 },
];

const anchorOptions = [
  { id: "none", name: "No Anchor", ampDraw: 0 },
  { id: "powerpole", name: "Power Pole", ampDraw: 15 },
  { id: "raptor", name: "Minn Kota Raptor", ampDraw: 20 },
];

export default function ConfigPanel({ activeBoat, activeZone }: ConfigPanelProps) {
  // Trolling motor state
  const [motorBrand, setMotorBrand] = useState("Select Brand");
  const [motorModel, setMotorModel] = useState("Select Model");
  const [powerSetting, setPowerSetting] = useState(5);
  const [voltage, setVoltage] = useState("12V");
  
  // Graph state
  const [graphBrand, setGraphBrand] = useState("Select Brand");
  const [graphSize, setGraphSize] = useState("Select Size");
  const [graphCount, setGraphCount] = useState(1);
  
  // Live sonar state
  const [selectedSonar, setSelectedSonar] = useState<string[]>([]);

  // Stereo state
  const [stereo, setStereo] = useState("none");

  // Livewell state
  const [selectedLivewell, setSelectedLivewell] = useState<string[]>([]);

  // Anchor state
  const [anchor, setAnchor] = useState("none");

  const handleSonarToggle = (sonarId: string) => {
    setSelectedSonar((prev) =>
      prev.includes(sonarId)
        ? prev.filter((id) => id !== sonarId)
        : [...prev, sonarId]
    );
  };

  const handleLivewellToggle = (itemId: string) => {
    setSelectedLivewell((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderZoneContent = () => {
    switch (activeZone) {
      case "trollingMotor":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Brand:</label>
              <select
                className="config-select"
                value={motorBrand}
                onChange={(e) => {
                  setMotorBrand(e.target.value);
                  setMotorModel("Select Model");
                }}
              >
                {trollingMotorBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">Model:</label>
              <select
                className="config-select"
                value={motorModel}
                onChange={(e) => setMotorModel(e.target.value)}
                disabled={motorBrand === "Select Brand"}
              >
                {(trollingMotorModels[motorBrand] || ["Select Model"]).map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">Power Setting: {powerSetting}</label>
              <input
                type="range"
                className="config-slider"
                min={0}
                max={10}
                value={powerSetting}
                onChange={(e) => setPowerSetting(Number(e.target.value))}
              />
              <div className="slider-labels">
                <span>0</span>
                <span>10</span>
              </div>
            </div>

            <div className="config-field">
              <label className="config-label">Voltage:</label>
              <div className="config-button-group">
                {["12V", "24V", "36V"].map((v) => (
                  <button
                    key={v}
                    className={`config-voltage-btn ${voltage === v ? "active" : ""}`}
                    onClick={() => setVoltage(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "livescope":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Number of Graphs:</label>
              <div className="config-button-group">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    className={`config-count-btn ${graphCount === num ? "active" : ""}`}
                    onClick={() => setGraphCount(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-field">
              <label className="config-label">Graph Brand:</label>
              <select
                className="config-select"
                value={graphBrand}
                onChange={(e) => setGraphBrand(e.target.value)}
              >
                {graphBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">Graph Size:</label>
              <select
                className="config-select"
                value={graphSize}
                onChange={(e) => setGraphSize(e.target.value)}
              >
                {graphSizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">Live Sonar:</label>
              <div className="config-checkbox-group">
                {liveSonarOptions.map((sonar) => (
                  <label key={sonar.id} className="config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedSonar.includes(sonar.id)}
                      onChange={() => handleSonarToggle(sonar.id)}
                      className="config-checkbox"
                    />
                    <span>{sonar.name}</span>
                    <span className="amp-draw">{sonar.ampDraw}A</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "console":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Console Graphs:</label>
              <div className="config-button-group">
                {[1, 2].map((num) => (
                  <button
                    key={num}
                    className={`config-count-btn ${graphCount === num ? "active" : ""}`}
                    onClick={() => setGraphCount(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="config-field">
              <label className="config-label">Graph Brand:</label>
              <select
                className="config-select"
                value={graphBrand}
                onChange={(e) => setGraphBrand(e.target.value)}
              >
                {graphBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="config-field">
              <label className="config-label">Graph Size:</label>
              <select
                className="config-select"
                value={graphSize}
                onChange={(e) => setGraphSize(e.target.value)}
              >
                {graphSizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case "stereo":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Stereo System:</label>
              <div className="config-checkbox-group">
                {stereoOptions.map((option) => (
                  <label key={option.id} className="config-checkbox-label">
                    <input
                      type="radio"
                      name="stereo"
                      checked={stereo === option.id}
                      onChange={() => setStereo(option.id)}
                      className="config-checkbox"
                    />
                    <span>{option.name}</span>
                    <span className="amp-draw">{option.ampDraw}A</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "livewells":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Livewell Accessories:</label>
              <div className="config-checkbox-group">
                {livewellOptions.map((item) => (
                  <label key={item.id} className="config-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedLivewell.includes(item.id)}
                      onChange={() => handleLivewellToggle(item.id)}
                      className="config-checkbox"
                    />
                    <span>{item.name}</span>
                    <span className="amp-draw">{item.ampDraw}A</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "rearCompartment":
        return (
          <div className="config-section">
            <div className="config-field">
              <label className="config-label">Shallow Water Anchor:</label>
              <div className="config-checkbox-group">
                {anchorOptions.map((option) => (
                  <label key={option.id} className="config-checkbox-label">
                    <input
                      type="radio"
                      name="anchor"
                      checked={anchor === option.id}
                      onChange={() => setAnchor(option.id)}
                      className="config-checkbox"
                    />
                    <span>{option.name}</span>
                    <span className="amp-draw">{option.ampDraw}A</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const zoneLabels: Record<ZoneType, string> = {
    trollingMotor: "Trolling Motor",
    livescope: "Graphs & Sonar",
    console: "Console",
    stereo: "Stereo",
    livewells: "Livewells",
    rearCompartment: "Anchors",
  };

  return (
    <div className="config-panel-content">
      {/* Scrollable content area */}
      <div className="config-scroll-area">
        {renderZoneContent()}
      </div>
    </div>
  );
}
