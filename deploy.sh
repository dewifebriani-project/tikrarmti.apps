#!/bin/bash

# Tikrar MTI Apps - Multi-Platform Deployment Script
# This script deploys the application to multiple platforms

set -e

echo "🚀 Starting Tikrar MTI Apps Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're on the main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    print_error "Not on main branch. Please switch to main branch before deploying."
    exit 1
fi

# 1. DEPLOY TO VERCEL
echo ""
echo "📦 Deploying to Vercel..."
echo "-------------------------"

if command -v vercel &> /dev/null; then
    # Deploy to production
    vercel --prod

    # Get the production URL
    VERCEL_URL=$(vercel ls --scope=dewifebriani-projects | grep tikrarmti.apps | awk '{print $4}' | head -1)
    print_success "Deployed to Vercel: https://tikrarmtiapps-rdtqbgvk2-dewifebriani-projects.vercel.app"
    print_success "Custom Domain: https://markaztikrar.id"
else
    print_error "Vercel CLI not found. Please install it with: npm i -g vercel"
fi

# 2. DEPLOY TO NETLIFY (Optional)
echo ""
echo "📦 Checking Netlify configuration..."
echo "-----------------------------------"

if [ -f "netlify.toml" ]; then
    if command -v netlify &> /dev/null; then
        echo "Netlify configuration found. Deploying to Netlify..."
        netlify deploy --prod --dir=.next
        print_success "Deployed to Netlify"
    else
        print_warning "Netlify configuration found but Netlify CLI not installed"
        print_warning "Install with: npm i -g netlify-cli"
    fi
else
    echo "No Netlify configuration found. Skipping Netlify deployment."
fi

# 3. BUILD DOCKER IMAGE (Optional)
echo ""
echo "📦 Building Docker image..."
echo "---------------------------"

if [ -f "Dockerfile" ]; then
    DOCKER_IMAGE="tikrarmti-apps:latest"
    docker build -t $DOCKER_IMAGE .
    print_success "Docker image built: $DOCKER_IMAGE"

    # Tag for registry
    DOCKER_REGISTRY_IMAGE="registry.digitalocean.com/tikrarmti/tikrarmti-apps:latest"
    docker tag $DOCKER_IMAGE $DOCKER_REGISTRY_IMAGE
    print_success "Docker image tagged for registry: $DOCKER_REGISTRY_IMAGE"
else
    echo "No Dockerfile found. Skipping Docker build."
fi

# 4. PUSH TO GITHUB (already done, but confirm)
echo ""
echo "📦 GitHub Status..."
echo "-------------------"

# Check if remote is up to date
if git diff --quiet origin/main; then
    print_success "GitHub is up to date"
else
    print_warning "Local changes not pushed to GitHub"
    echo "Run: git push origin main"
fi

# 5. DEPLOYMENT SUMMARY
echo ""
echo "📊 Deployment Summary"
echo "======================"
echo ""
echo "🌐 Production URLs:"
echo "   • Vercel: https://tikrarmtiapps-rdtqbgvk2-dewifebriani-projects.vercel.app"
echo "   • Custom Domain: https://markaztikrar.id"
echo ""
echo "📊 Environment Variables Required:"
echo "   • NEXT_PUBLIC_SUPABASE_URL"
echo "   • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   • SUPABASE_SERVICE_ROLE_KEY"
echo "   • NEXT_PUBLIC_APP_URL"
echo "   • GOOGLE_CLIENT_ID"
echo "   • GOOGLE_CLIENT_SECRET"
echo ""
echo "🔍 Monitoring URLs:"
echo "   • Vercel: https://vercel.com/dewifebriani-projects/tikrarmti.apps"
echo "   • GitHub: https://github.com/dewifebriani-project/tikrarmti.apps"

print_success "Deployment completed successfully!"
echo ""
echo "🎉 Tikrar MTI Apps is now live!"
echo "================================="