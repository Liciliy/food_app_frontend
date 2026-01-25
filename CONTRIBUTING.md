# Contributing to Food Tracker Frontend

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Architecture](#project-architecture)

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running locally (see [frontend_development_guide.md](frontend_development_guide.md))

### Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd food_app_front

# Install dependencies
make install
# or: npm install

# Copy environment configuration
cp .env.example .env

# Start development server
make dev
# or: npm run dev
```

### Running Checks

```bash
# Type checking
make lint

# Build for production
make build
```

## 📝 Code Style

### General Guidelines

- Use **TypeScript** for all new files
- Follow the existing code patterns and structure
- Keep components small and focused
- Use meaningful variable and function names

### Documentation

Every file should have a header comment explaining its purpose:

```typescript
/**
 * ComponentName
 * Brief description of what this component/module does
 */
```

Document all interfaces with JSDoc:

```typescript
/**
 * Props for the MyComponent
 */
interface MyComponentProps {
  /** Description of the prop */
  propName: string;
}
```

Document exported functions:

```typescript
/**
 * Brief description of what the function does
 * @param paramName - Description of the parameter
 * @returns Description of return value
 */
export function myFunction(paramName: string): ReturnType {
  // ...
}
```

### File Organization

- **Components**: One component per file, named after the component
- **Hooks**: Prefix with `use` (e.g., `useVoiceRecorder.ts`)
- **Services**: Suffix with `Service` (e.g., `mealService.ts`)
- **Stores**: Suffix with `Store` (e.g., `authStore.ts`)
- **Types**: Group related types in `types/index.ts`

### Component Structure

```tsx
/**
 * Component description
 */

// 1. Imports (external first, then internal)
import { useState } from 'react';
import { Button } from '../common/Button';

// 2. Types/Interfaces
interface Props {
  // ...
}

// 3. Helper functions (if small, otherwise separate file)
function formatValue(value: number): string {
  return value.toFixed(2);
}

// 4. Component
export function MyComponent({ prop }: Props) {
  // Hooks first
  const [state, setState] = useState();
  
  // Event handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

## 💬 Commit Guidelines

Use conventional commit messages:

```
type(scope): description

[optional body]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```
feat(voice): add auto-submit after recording ends
fix(auth): handle unverified email error message
docs(readme): add project setup instructions
refactor(api): use environment variable for base URL
```

## 🔄 Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes** following the code style guidelines

3. **Test your changes**:
   - Run `make lint` to check for type errors
   - Run `make build` to ensure production build works
   - Test manually in the browser

4. **Commit your changes** with a descriptive message

5. **Push and create PR**:
   ```bash
   git push origin feat/my-feature
   ```

6. **Fill out PR template** with:
   - Description of changes
   - Related issue (if any)
   - Screenshots (for UI changes)

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── components/       # React components
│   ├── auth/        # Authentication (login, register)
│   ├── charts/      # Data visualization
│   ├── common/      # Shared UI components
│   ├── meals/       # Meal tracking features
│   └── stats/       # Statistics displays
├── hooks/           # Custom React hooks
├── pages/           # Route page components
├── services/        # API communication layer
├── stores/          # Zustand state management
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### State Management

- **Zustand** for global state (`stores/`)
- **React Hook Form** for form state
- **Local state** for component-specific UI state

### API Layer

- All API calls go through `services/api.ts`
- Service classes in `services/` encapsulate endpoints
- Types match backend API responses

### Styling

- **Tailwind CSS** for styling
- Use `cn()` utility for conditional classes
- Follow mobile-first approach

## ❓ Questions?

Check the documentation files:
- [frontend_development_guide.md](frontend_development_guide.md)
- [TODO.md](TODO.md)
- [STRATEGIC_GOALS.md](STRATEGIC_GOALS.md)
