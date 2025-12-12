PROJECT_ID="secretsanta-480803"
SERVICE_NAME="secret-santa-app"
REGION="asia-south1"
IMAGE_NAME="asia-south1-docker.pkg.dev/$PROJECT_ID/secret-santa/$SERVICE_NAME"
echo "🚀 Starting Simplified Deployment to Google Cloud Run..."
echo "---------------------------------------------"
echo "Project ID: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo "---------------------------------------------"
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    exit 1
fi
echo "📋 Loading environment variables from .env..."
export $(cat .env | grep -v '^#' | xargs)
REQUIRED_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "VITE_DAUTH_CLIENT_ID" "VITE_DAUTH_CLIENT_SECRET" "VITE_DAUTH_REDIRECT_URI")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set in .env file"
        exit 1
    fi
done
echo "✅ All required environment variables are set"
echo ""
echo "📦 Step 1: Building application locally..."
pnpm install
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ Local build failed!"
    exit 1
fi
echo "✅ Local build successful!"
echo ""
echo "📝 Step 2: Using secure Node.js Dockerfile..."
echo "🐳 Step 3: Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME:latest .
if [ $? -ne 0 ]; then
    echo "❌ Docker build/push failed!"
    exit 1
fi
echo "✅ Image pushed to GCR!"
echo "🚀 Step 4: Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars VITE_DAUTH_CLIENT_SECRET="$VITE_DAUTH_CLIENT_SECRET" \
    --max-instances 10 \
    --memory 512Mi \
    --cpu 1
if [ $? -ne 0 ]; then
    echo "❌ Deployment failed!"
    exit 1
fi
echo "---------------------------------------------"
echo "✨ Deployment Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Note the Service URL printed above"
echo "2. Update VITE_DAUTH_REDIRECT_URI in your .env to: https://YOUR-SERVICE-URL/auth/callback"
echo "3. Register this redirect URI in Delta Auth dashboard"
echo "4. Run this script again to redeploy with the updated URI"
echo ""
