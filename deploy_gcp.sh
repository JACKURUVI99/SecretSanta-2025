echo " Deploying Secret Santa (Split Architecture) to Google Cloud Run..."

# --- 1. CONFIGURATION ---
REGION="asia-south1"
BACKEND_SERVICE="secret-santa-backend"
FRONTEND_SERVICE="secret-santa-frontend"

# Check gcloud
gcloud --version &> /dev/null
if [ $? -ne 0 ]; then
    echo " Error: 'gcloud' command not found."
    exit 1
fi

echo " Checking authentication..."
gcloud auth print-identity-token &> /dev/null
if [ $? -ne 0 ]; then
    echo "Not logged in. Running 'gcloud auth login'..."
    gcloud auth login
fi

# --- 2. DEPLOY BACKEND ---
echo "------------------------------------------------"
echo " Deploying BACKEND Service ($BACKEND_SERVICE)..."
echo "------------------------------------------------"
cd backend

echo "   > Deploying to Cloud Run..."
gcloud run deploy $BACKEND_SERVICE \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 3000 \
    --env-vars-file .env

if [ $? -ne 0 ]; then
    echo "Backend Deployment Failed!"
    exit 1
fi

# Get Backend URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')
echo "Backend Deployed Successfully at: $BACKEND_URL"

# --- 3. DEPLOY FRONTEND ---
echo "------------------------------------------------"
echo "Deploying FRONTEND Service ($FRONTEND_SERVICE)..."
echo "------------------------------------------------"
cd ../frontend

# Create a temporary production .env for the build
echo "   > Configuring Frontend environment..."
# We need to inject the REAL backend URL into the frontend build
    # We inject an EMPTY URL to force the frontend to use relative paths (e.g. /api/...)
    # This ensures requests go to Nginx first, which then proxies them to $BACKEND_URL.
    # This solves CORS issues and NetworkErrors.
    if [ -f .env ]; then
        grep -v "VITE_API_BASE_URL" .env > .env.prod.tmp
        echo "VITE_API_BASE_URL=" >> .env.prod.tmp
    else
        echo "VITE_API_BASE_URL=" > .env.prod.tmp
    fi

# Rename just for the deploy command (gcloud build uses local files)
mv .env .env.bak
mv .env.prod.tmp .env

echo "   > Deploying to Cloud Run (Builds Dockerfile)..."
# Note: frontend Dockerfile builds the app, so we don't need 'npm run build' locally strictly speaking,
# but passing the ARG is tricky with source deploy. 
# We'll rely on the .env file we just crafted being copied into the container context 
# OR use build-args if your Dockerfile supports it. 
# Current Dockerfile copies .env if it exists? No, it usually ignores it.
# Wait, Vite embeds env vars at BUILD time.
# gcloud run deploy --source . uploads the directory. The Dockerfile RUN npm run build will run.
# It will use the .env in the directory.

# Deploy Frontend (US-Central1 for Domain Mapping Support)
gcloud run deploy $FRONTEND_SERVICE \
    --source . \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars VITE_API_BASE_URL=$BACKEND_URL

DEPLOY_STATUS=$?

# Restore .env
mv .env.bak .env

if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "Frontend Deployment Failed!"
    cd ..
    exit 1
fi

cd ..
echo "------------------------------------------------"
echo "DEPLOYMENT COMPLETE!"
echo "------------------------------------------------"
echo "Backend:  $BACKEND_URL"
echo "Frontend: $(gcloud run services describe $FRONTEND_SERVICE --platform managed --region $REGION --format 'value(status.url)')"
echo "------------------------------------------------"

