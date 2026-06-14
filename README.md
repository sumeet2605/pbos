# CBOS Platform

A multi-tenant, project-centric, metadata-driven platform for professional services operations.

## Tech Stack

### Backend
- **Python 3.12** + **FastAPI** — async API framework
- **SQLAlchemy 2.x** (async) + **Alembic** — ORM and migrations
- **PostgreSQL 16** — primary database
- **Redis 7** — caching, session store, and Celery broker
- **Pydantic v2** — data validation and settings
- **Celery** — async task execution

### Frontend
- **React 18** + **TypeScript** — UI framework
- **Vite 5** — build tool
- **Ant Design 5** — component library
- **TanStack Query v5** — data fetching and caching
- **React Router v6** — client-side routing

### Infrastructure
- **Docker** + **Docker Compose** — containerized development and deployment

---

## Getting Started

### Prerequisites

- Docker Desktop (or Docker + Docker Compose)
- Make

### Quick Start

```bash
# 1. Clone the repository
git clone <repo-url> && cd pbos

# 2. Create your .env file
make setup

# 3. Start all services
make up-build

# 4. Apply database migrations
make migrate

# 5. Access the application
#    Frontend: http://localhost:5173
#    Backend API: http://localhost:8000/api/v1/docs
```

---

## Project Structure

```
pbos/
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/v1/             # API route definitions
│   │   ├── core/               # Config, DB, Redis, logging, middleware
│   │   ├── shared/             # Shared models, repositories, exceptions
│   │   ├── identity/           # Users, authentication, JWT
│   │   ├── organizations/      # Organizations and branches
│   │   ├── rbac/               # Roles, permissions, authorization
│   │   ├── audit/              # Audit event logging
│   │   ├── events/             # Domain event publishing
│   │   └── configuration/      # Configuration engine primitives
│   ├── alembic/                # Database migrations
│   ├── tests/                  # Tests (unit, integration, authorization)
│   ├── Dockerfile
│   └── pyproject.toml
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── app/                # App bootstrap and providers
│   │   ├── pages/              # Page components
│   │   ├── modules/            # Feature modules
│   │   ├── components/         # Shared UI components
│   │   ├── api/                # API client layer
│   │   ├── hooks/              # Custom React hooks
│   │   ├── routes/             # Router configuration
│   │   └── types/              # TypeScript type definitions
│   ├── Dockerfile
│   └── package.json
│
├── docs/                       # Architecture and design documents
├── docker-compose.yml          # Multi-service orchestration
├── .env.example                # Environment variable template
├── Makefile                    # Developer workflow commands
└── README.md
```

---

## Development

### Available Commands

```bash
make help              # Show all available commands

# Docker
make up                # Start services
make down              # Stop services
make logs              # Tail all logs
make ps                # Show running services

# Database
make migrate           # Apply pending migrations
make migrate-down      # Rollback last migration
make migrate-create MSG="add users table"  # Create new migration

# Testing
make test              # Run all tests
make test-backend-cov  # Run backend tests with coverage

# Linting & Formatting
make lint              # Lint all code
make format            # Format all code
```

### Backend Development

```bash
# Install dependencies locally (for IDE support)
cd backend
pip install -e ".[dev]"

# Run locally (without Docker)
uvicorn app.main:app --reload

# Lint and format
ruff check app tests
black app tests
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev          # Start dev server at http://localhost:5173
npm run lint         # ESLint
npm run format       # Prettier
npm run type-check   # TypeScript check
```

---

## API Documentation

When the backend is running, OpenAPI documentation is available at:

- **Swagger UI**: http://localhost:8000/api/v1/docs
- **ReDoc**: http://localhost:8000/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

---

## Architecture

See the [`docs/`](./docs/) directory for detailed architecture documentation:

- [Domain Model](./docs/04_DOMAIN_MODEL.md)
- [Entity Model](./docs/05_ENTITY_MODEL.md)
- [Configuration Engine](./docs/07_CONFIGURATION_ENGINE.md)
- [Workflow Engine](./docs/08_WORKFLOW_ENGINE.md)
- [System Architecture](./docs/11_SYSTEM_ARCHITECTURE.md)
- [API Standards](./docs/12_API_STANDARDS.md)
- [RBAC Architecture](./docs/13_RBAC_ARCHITECTURE.md)
- [Sprint 01 Foundation Plan](./docs/14_SPRINT_01_FOUNDATION.md)

---

## Environment Variables

Copy `.env.example` to `.env` and update values before running locally:

```bash
cp .env.example .env
```

> **Never commit `.env` to source control.**

Key variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `******localhost:5432/cbos` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | JWT signing key (change in production!) | `change_me_...` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `30` |

---

## License

See [LICENSE](./LICENSE).
