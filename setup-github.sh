# Quick GitHub Setup Script

echo "🚀 Setting up GitHub repositories for Ambiora..."
echo ""

# Get user information
read -p "Enter your GitHub username: " GITHUB_USERNAME
read -p "Enter your name for git config: " GIT_NAME
read -p "Enter your email for git config: " GIT_EMAIL

# Configure git
echo "⚙️  Configuring git..."
git config --global user.name "$GIT_NAME"
git config --global user.email "$GIT_EMAIL"

# Base directory
BASE_DIR="/Volumes/HP USB321FD/AMBIORA new upd"
PARENT_DIR="/Volumes/HP USB321FD"

echo ""
echo "📁 Creating frontend repository..."
cd "$PARENT_DIR"
mkdir -p ambiora-frontend
cd ambiora-frontend

# Copy frontend files
cp -r "$BASE_DIR/src" .
cp "$BASE_DIR/index.html" .
cp "$BASE_DIR/package.json" .
cp "$BASE_DIR/vite.config.js" .

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
.env.local
.DS_Store
*.log
EOF

# Create README
cat > README.md << 'EOF'
# Ambiora Frontend

Frontend for Ambiora Tech Fest 2026 event management system.

## Setup

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
EOF

# Initialize git
git init
git add .
git commit -m "Initial commit: Ambiora frontend"
git branch -M main
git remote add origin "https://github.com/$GITHUB_USERNAME/ambiora-frontend.git"

echo "✅ Frontend repository ready!"
echo "   Push with: cd '$PARENT_DIR/ambiora-frontend' && git push -u origin main"
echo ""

echo "📁 Creating backend repository..."
cd "$PARENT_DIR"
mkdir -p ambiora-backend
cd ambiora-backend

# Copy backend files
cp "$BASE_DIR/server.js" .
cp "$BASE_DIR/package.json" .
cp -r "$BASE_DIR/models" .

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
*.log
test-mongodb.js
MONGODB_TROUBLESHOOTING.md
EOF

# Create .env.example
cat > .env.example << 'EOF'
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=production
PORT=3001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EOF

# Create README
cat > README.md << 'EOF'
# Ambiora Backend

Backend API for Ambiora Tech Fest 2026.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your credentials

4. Start server:
   ```bash
   npm run server
   ```

## API Endpoints

- `POST /api/auth/signup` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/user` - Get current user
- `POST /api/registrations` - Save registration
- `GET /api/registrations` - Get registrations
EOF

# Initialize git
git init
git add .
git commit -m "Initial commit: Ambiora backend API"
git branch -M main
git remote add origin "https://github.com/$GITHUB_USERNAME/ambiora-backend.git"

echo "✅ Backend repository ready!"
echo "   Push with: cd '$PARENT_DIR/ambiora-backend' && git push -u origin main"
echo ""
echo "🎉 All done! Next steps:"
echo ""
echo "1. Create repositories on GitHub:"
echo "   - https://github.com/new (name: ambiora-frontend)"
echo "   - https://github.com/new (name: ambiora-backend)"
echo ""
echo "2. Push frontend:"
echo "   cd '$PARENT_DIR/ambiora-frontend'"
echo "   git push -u origin main"
echo ""
echo "3. Push backend:"
echo "   cd '$PARENT_DIR/ambiora-backend'"
echo "   git push -u origin main"
echo ""
