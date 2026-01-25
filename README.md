# 🍽️ Food Tracker Frontend

A modern, mobile-first web application for tracking meals using voice recordings. Powered by AI for automatic food analysis and nutritional information extraction.

## ✨ Features

- **Voice-Based Meal Logging** - Record what you ate and let AI analyze the nutritional content
- **Smart Time Detection** - Say "I had pizza for dinner yesterday" and the app understands when you ate
- **Comprehensive Statistics** - Daily, weekly, and monthly breakdowns with charts
- **Real-Time Dashboard** - Track calories, macros, and meal patterns at a glance
- **Multi-Language Support** - Speak in any language, get standardized English food names

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Forms | React Hook Form + Zod |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see [frontend_development_guide.md](frontend_development_guide.md))

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd food_app_front
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_DEBUG=true
```

### 3. Start Development Server

```bash
npm run dev
# or
make dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── charts/         # Data visualization components
│   ├── common/         # Shared components (Button, Input, etc.)
│   ├── meals/          # Meal-related components
│   └── stats/          # Statistics components
├── hooks/              # Custom React hooks
├── pages/              # Page components (routes)
├── services/           # API service layer
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start development server |
| `make build` | Build for production |
| `make preview` | Preview production build |
| `make lint` | Run TypeScript type checking |
| `make clean` | Remove node_modules and build files |
| `make install` | Install dependencies |

## 📖 Documentation

- **[Frontend Development Guide](frontend_development_guide.md)** - Complete API reference and implementation details
- **[Time Detection Guide](frontend_time_detection_guide.md)** - How meal time extraction works
- **[Strategic Goals](STRATEGIC_GOALS.md)** - Long-term feature roadmap
- **[TODO List](TODO.md)** - Current development status and planned features
- **[API Specification](openapi.yaml)** - OpenAPI 3.0 spec for the backend

## 🔐 Authentication Flow

1. **Register** → User receives verification email
2. **Verify Email** → Click link in email to activate account
3. **Login** → Receive Knox token for API access
4. **Use App** → Token automatically included in all requests

## 🎤 Voice Recording Flow

1. User presses record button
2. Audio captured via Web Audio API
3. Recording auto-submits when stopped
4. Backend transcribes audio (Whisper)
5. AI analyzes food content (GPT-4)
6. Meal saved with nutritional data

## 🧪 Development Notes

### Debug Logging

Set `VITE_DEBUG=true` in `.env` to enable console logging for API calls and state changes.

### API Configuration

The API base URL is configured in `src/services/api.ts`. For production, update `.env`:

```env
VITE_API_BASE_URL=https://api.yourfoodtracker.com/api
```

## 📄 License

Private project - All rights reserved
