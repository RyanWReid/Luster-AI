.PHONY: lint format typecheck test all

# Use venv python if available
PYTHON := $(shell [ -f venv/bin/python ] && echo "venv/bin/python" || echo "python3")
VENV_BIN := $(shell [ -d venv/bin ] && echo "venv/bin/" || echo "")

# Run all checks
all: lint typecheck test

# Linting
lint:
	@echo "Running flake8..."
	$(VENV_BIN)flake8 *.py --max-line-length 88 --ignore=E402,F401,F541
	@echo "Running isort check..."
	$(VENV_BIN)isort --check-only *.py || true

# Lint strict (all errors)
lint-strict:
	@echo "Running flake8 (strict)..."
	$(VENV_BIN)flake8 *.py --max-line-length 88

# Format code
format:
	@echo "Running black..."
	$(VENV_BIN)black *.py
	@echo "Running isort..."
	$(VENV_BIN)isort *.py

# Type checking
typecheck:
	@echo "Running mypy..."
	$(VENV_BIN)mypy *.py --ignore-missing-imports || true

# Run tests
test:
	$(VENV_BIN)pytest tests/ -v

# Run tests with coverage
test-cov:
	$(VENV_BIN)pytest tests/ -v --cov=. --cov-report=term-missing

# Quick check (fast feedback)
check: lint typecheck
