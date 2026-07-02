# CHEAPTOONER - ECU Calibration Editor

A modern, sleek, dark-themed web application for editing vehicle ECU calibration files. Built with React, TypeScript, and Vite.

## Features

- **XDF & BIN File Support**: Load and parse TunerPro XDF definition files and BIN calibration files
- **Advanced 2D Table Editor**: 
  - Multi-cell selection (click-drag, shift-click, ctrl-click)
  - Real-time editing with validation
  - Smoothing algorithms (linear, cubic spline, Gaussian blur)
  - Gradient fills (linear, radial)
  - Value operations (offset, scale, percentage)
  - Copy/paste support
- **3D Visualization**: Interactive 3D surface plots using Plotly.js
- **Raw Hex View**: Toggle between scaled values and raw hex
- **Change Tracking**: Track all modifications with undo/redo support
- **Save Modified BIN**: Export your edited calibration file

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

The built files will be in the `dist` directory, ready for static hosting.

## Usage

1. **Load XDF File**: Click "Choose XDF file" and select your XDF definition file
2. **Load BIN File**: Click "Choose BIN file" and select your calibration binary file
3. **Select Parameter**: Click on a parameter in the left sidebar to view its table
4. **Edit Values**: 
   - Double-click a cell to edit
   - Click and drag to select multiple cells
   - Use Shift+Click to extend selection
   - Use Ctrl/Cmd+Click for non-contiguous selection
5. **View 3D**: Toggle to 3D view to see your table as a 3D surface
6. **Apply & export**: Use **Apply to BIN** on each map you edited (writes that table into memory), then **Export BIN** in the header to download the full calibration file

## Project Structure

```
cheaptooner/
├── src/
│   ├── components/     # React components
│   ├── parsers/        # XDF and BIN file parsers
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── store/          # Zustand state management
├── public/             # Static assets
└── package.json
```

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling (dark theme)
- **Plotly.js** for 3D visualizations
- **Zustand** for state management
- **Math.js** for equation evaluation

## License

MIT

