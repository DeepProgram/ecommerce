#!/bin/bash

show_help() {
  cat << EOF
Frontend Development Helper

Usage: ./frontend.sh [command]

Commands:
  install         Install dependencies
  dev             Start development server
  build           Build for production
  start           Start production server
  lint            Run linter
  clean           Clean build artifacts
  docker          Start with Docker
  docker-logs     Show Docker logs
  test-auth       Open browser for auth testing

Examples:
  ./frontend.sh dev
  ./frontend.sh docker
EOF
}

case "$1" in
  install)
    cd frontend && npm install
    ;;
  dev)
    cd frontend && npm run dev
    ;;
  build)
    cd frontend && npm run build
    ;;
  start)
    cd frontend && npm start
    ;;
  lint)
    cd frontend && npm run lint
    ;;
  clean)
    cd frontend && rm -rf .next node_modules
    ;;
  docker)
    docker compose up frontend
    ;;
  docker-logs)
    docker compose logs -f frontend
    ;;
  test-auth)
    echo "Opening browser for authentication testing..."
    echo ""
    echo "Register: http://localhost:3000/register"
    echo "Login:    http://localhost:3000/login"
    echo "Home:     http://localhost:3000"
    ;;
  *)
    show_help
    ;;
esac
