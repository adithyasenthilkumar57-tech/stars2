# ClearWay AI · Quantum-Enhanced Traffic Intelligence

Full-stack real-time urban traffic optimization and monitoring platform.

## Features

- **Real-Time Traffic Dashboard**: Live WebSocket feed tracking vehicle flows, congestion percentages, and wait times across multi-junction urban networks.
- **Adaptive Signal Optimization**: Dynamic signal phase timing calculations to prevent downstream gridlock and bottleneck propagation.
- **Emergency Vehicle Preemption**: Automated green-wave corridor clearance with human-in-the-loop dispatch approval.
- **Acoustic Siren Detection**: Simulated emergency siren recognition triggering immediate local lane clearance.
- **Pollution & Fuel Metrics**: Environmental impact modeling estimating CO₂ emissions prevented and fuel savings.
- **Interactive Simulation Engine**: Configurable congestion scenarios, heavy traffic injections, and before/after comparisons.
- **Built-in AIRA Traffic Copilot**: Contextual AI assistant responding to natural language queries based on live telemetry.

## Quick Start

### 1. Install Dependencies
```bash
cd clearway-ai
pnpm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

### 3. Run Development Server
From the root repository or inside `clearway-ai`:
```bash
npm run dev
```
Or double-click `start.bat` on Windows.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS, Radix UI, Lucide Icons, Recharts, Framer Motion
- **Backend**: Node.js, Express, tRPC, WebSocket (`ws`)
- **Simulation**: In-memory discrete-event traffic modeling engine
