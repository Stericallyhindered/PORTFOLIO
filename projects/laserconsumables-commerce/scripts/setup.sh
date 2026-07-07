#!/bin/bash

# Linux/Mac Setup Script
echo "Setting up Laser Consumables E-Commerce Platform..."

# Check Node.js
echo ""
echo "Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js version: $NODE_VERSION"
else
    echo "Node.js not found! Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
echo ""
echo "Checking npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "npm version: $NPM_VERSION"
else
    echo "npm not found!"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "Failed to install dependencies!"
    exit 1
fi

# Generate Prisma Client
echo ""
echo "Generating Prisma Client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "Failed to generate Prisma Client!"
    exit 1
fi

# Check for .env file
echo ""
echo "Checking environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your configuration!"
    echo "   - Set DATABASE_URL to your PostgreSQL connection string"
    echo "   - Generate NEXTAUTH_SECRET (see SETUP.md)"
    echo "   - Add your API keys (Stripe, ShipStation, Resend)"
else
    echo ".env file exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run: npm run db:push"
echo "3. Run: npm run db:seed"
echo "4. Run: npm run dev"





