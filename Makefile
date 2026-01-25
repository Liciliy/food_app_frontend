# Food Tracker Frontend - Makefile
# Simplifies common development commands

.PHONY: help install dev build preview clean lint format

# Default target - show help
help:
	@echo "Food Tracker Frontend - Available Commands:"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Start development server"
	@echo "  make build      - Build for production"
	@echo "  make preview    - Preview production build"
	@echo "  make clean      - Remove node_modules and build files"
	@echo "  make lint       - Run linter (if configured)"
	@echo ""

# Install dependencies
install:
	npm install

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Preview production build locally
preview:
	npm run preview

# Clean build artifacts and dependencies
clean:
	rm -rf node_modules
	rm -rf dist
	rm -rf .vite

# Run linter (TypeScript check)
lint:
	npx tsc --noEmit

# Reinstall dependencies (clean + install)
reinstall: clean install
