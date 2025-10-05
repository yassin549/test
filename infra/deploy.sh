#!/bin/bash

# Aviator Deployment Script
# This script handles deployment of the Aviator application

set -e  # Exit on error

echo "🚀 Starting Aviator Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create a .env file with required environment variables"
    exit 1
fi

# Load environment variables
source .env

# Validate required environment variables
required_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "DJANGO_SECRET_KEY"
    "NOWPAYMENTS_API_KEY"
    "NOWPAYMENTS_WEBHOOK_SECRET"
)

echo "🔍 Checking environment variables..."
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Missing required variable: $var${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All required environment variables present${NC}"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build images
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

# Run database migrations
echo "📊 Running database migrations..."
docker-compose run --rm backend python manage.py migrate

# Create superuser if needed (interactive)
echo "👤 Creating superuser (if needed)..."
docker-compose run --rm backend python manage.py createsuperuser --noinput || true

# Collect static files
echo "📦 Collecting static files..."
docker-compose run --rm backend python manage.py collectstatic --noinput

# Start services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Health check
echo "🏥 Running health checks..."
if curl -f http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}❌ Backend health check failed${NC}"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}❌ Frontend health check failed${NC}"
    exit 1
fi

# Show running containers
echo ""
echo "📋 Running containers:"
docker-compose ps

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000/api"
echo "   Admin Panel: http://localhost:8000/admin"
echo ""
echo "📝 Next steps:"
echo "   1. Visit http://localhost:3000 to see the landing page"
echo "   2. Create an admin user if you haven't already"
echo "   3. Configure NowPayments webhook URL in their dashboard"
echo "   4. Test the demo mode"
echo ""
