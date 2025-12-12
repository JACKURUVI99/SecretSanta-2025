echo "🎅 Starting Secret Santa Local Server..."
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi
echo "🏗️  Building project..."
pnpm tsc --noEmit || true 
pnpm build || echo "⚠️  Build had errors but attempting to run dev server..."
echo "🚀 Server is live! Open the URL below:"
pnpm dev --host
