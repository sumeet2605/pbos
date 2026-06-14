.PHONY: help setup up down logs shell-backend shell-frontend migrate migrate-down lint format test clean

DOCKER_COMPOSE = docker compose
BACKEND_SERVICE = backend
FRONTEND_SERVICE = frontend

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-25s\033[0m %s\n", $$1, $$2}'

# ─── Environment ───────────────────────────────────────────────────────────────

setup: ## Copy .env.example to .env if not present
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example – update secrets before use.")

# ─── Docker ────────────────────────────────────────────────────────────────────

up: setup ## Start all services
	$(DOCKER_COMPOSE) up -d

up-build: setup ## Build images and start all services
	$(DOCKER_COMPOSE) up -d --build

down: ## Stop all services
	$(DOCKER_COMPOSE) down

down-volumes: ## Stop all services and remove volumes (DESTRUCTIVE)
	$(DOCKER_COMPOSE) down -v

logs: ## Tail logs from all services
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## Tail backend logs
	$(DOCKER_COMPOSE) logs -f $(BACKEND_SERVICE)

logs-frontend: ## Tail frontend logs
	$(DOCKER_COMPOSE) logs -f $(FRONTEND_SERVICE)

restart: ## Restart all services
	$(DOCKER_COMPOSE) restart

ps: ## Show running services
	$(DOCKER_COMPOSE) ps

# ─── Database ──────────────────────────────────────────────────────────────────

migrate: ## Apply database migrations
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) alembic upgrade head

migrate-down: ## Rollback last migration
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) alembic downgrade -1

migrate-create: ## Create a new migration (usage: make migrate-create MSG="my migration")
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) alembic revision --autogenerate -m "$(MSG)"

migrate-history: ## Show migration history
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) alembic history --verbose

# ─── Shells ────────────────────────────────────────────────────────────────────

shell-backend: ## Open a shell in the backend container
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) /bin/bash

shell-frontend: ## Open a shell in the frontend container
	$(DOCKER_COMPOSE) exec $(FRONTEND_SERVICE) /bin/sh

shell-db: ## Open psql in the database container
	$(DOCKER_COMPOSE) exec postgres psql -U cbos cbos

# ─── Linting & Formatting ──────────────────────────────────────────────────────

lint: lint-backend lint-frontend ## Lint all code

lint-backend: ## Lint backend code with Ruff
	cd backend && ruff check app tests

lint-frontend: ## Lint frontend code with ESLint
	cd frontend && npm run lint

format: format-backend format-frontend ## Format all code

format-backend: ## Format backend code with Black and Ruff
	cd backend && black app tests && ruff check --fix app tests

format-frontend: ## Format frontend code with Prettier
	cd frontend && npm run format

format-check: ## Check formatting without writing
	cd backend && black --check app tests && ruff check app tests
	cd frontend && npm run format:check

# ─── Testing ───────────────────────────────────────────────────────────────────

test: test-backend ## Run all tests

test-backend: ## Run backend tests
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) pytest

test-backend-unit: ## Run backend unit tests only
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) pytest tests/unit

test-backend-integration: ## Run backend integration tests only
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) pytest tests/integration

test-backend-cov: ## Run backend tests with coverage report
	$(DOCKER_COMPOSE) exec $(BACKEND_SERVICE) pytest --cov=app --cov-report=html

test-frontend: ## Run frontend tests
	cd frontend && npm run test

# ─── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove Python cache files
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type f -name "*.pyc" -delete
	find backend -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
