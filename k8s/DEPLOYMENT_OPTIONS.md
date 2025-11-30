# GA4 MCP Deployment Options

This document outlines two deployment strategies for the GA4 MCP server in Kubernetes.

## Option 1: Monolithic Deployment

**Architecture:** Single container with both Next.js app and MCP server

**Files:**
- `Dockerfile.monolithic` - Builds Next.js + Python + MCP server
- `k8s/ga4-chat-deployment-monolithic.yaml` - Single container deployment

**Pros:**
- ✅ Simpler deployment (one container)
- ✅ Lower latency (no inter-container communication)
- ✅ Easier to manage (one pod)
- ✅ Fewer moving parts

**Cons:**
- ❌ Larger Docker image (~500MB+)
- ❌ Mixing Node.js and Python dependencies
- ❌ Can't scale MCP server independently
- ❌ Slower builds

**Build Commands:**
```bash
# Build monolithic image
docker build --platform linux/amd64 -f Dockerfile.monolithic -t your-registry/ga4-chat:v1 .

# Push to registry
docker push your-registry/ga4-chat:v1
```

**Deployment:**
```bash
kubectl apply -f k8s/ga4-chat-deployment-monolithic.yaml
kubectl apply -f k8s/ga4-chat-service.yaml
kubectl apply -f k8s/ga4-chat-ingress.yaml
```

## Option 2: Sidecar Deployment

**Architecture:** Two containers per pod - Next.js app + MCP server sidecar

**Files:**
- `Dockerfile.nextjs` - Next.js only
- `Dockerfile.mcp-server` - MCP server only
- `k8s/ga4-chat-deployment-sidecar.yaml` - Sidecar deployment

**Pros:**
- ✅ Separation of concerns
- ✅ Independent scaling (can scale MCP separately)
- ✅ Smaller individual images
- ✅ Reusable MCP container
- ✅ Easier to update MCP independently

**Cons:**
- ❌ More complex deployment (2 containers)
- ❌ Requires shared volume for credentials
- ❌ Slightly more resource usage
- ❌ More complex debugging

**Build Commands:**
```bash
# Build Next.js image
docker build --platform linux/amd64 -f Dockerfile.nextjs -t your-registry/ga4-chat:v1 .

# Build MCP server image
docker build --platform linux/amd64 -f Dockerfile.mcp-server -t your-registry/ga4-mcp-server:v1 .

# Push both images
docker push your-registry/ga4-chat:v1
docker push your-registry/ga4-mcp-server:v1
```

**Deployment:**
```bash
kubectl apply -f k8s/ga4-chat-deployment-sidecar.yaml
kubectl apply -f k8s/ga4-chat-service.yaml
kubectl apply -f k8s/ga4-chat-ingress.yaml
```

## Code Changes Required

### For Option 1 (Monolithic):
Update `src/app/api/ga4/mcp-bridge.ts` to use environment variables:

```typescript
const transport = new StdioClientTransport({
  command: 'pipx',
  args: ['run', 'analytics-mcp'],
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/app/credentials/ga4-credentials.json',
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || '',
  },
});
```

### For Option 2 (Sidecar):
Update `src/app/api/ga4/mcp-bridge.ts` to connect to sidecar:

```typescript
// Option A: Use stdio transport to sidecar (requires shared process namespace)
const transport = new StdioClientTransport({
  command: 'kubectl',
  args: ['exec', '-i', 'mcp-server', '--', 'pipx', 'run', 'analytics-mcp'],
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS || '/shared/credentials/ga4-credentials.json',
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID || '',
  },
});

// Option B: Use HTTP transport (requires MCP server to expose HTTP endpoint)
// This would require modifying the MCP server to support HTTP transport
```

**Note:** Option 2 requires either:
1. Shared process namespace (complex)
2. HTTP transport for MCP (needs MCP server modification)
3. Or keep using stdio but run MCP server as init container/separate service

## Recommended Approach

**For your use case (2 pods, experimental namespace):**

I recommend **Option 1 (Monolithic)** because:
- Simpler to implement and debug
- No need to modify MCP server code
- Works with existing stdio transport
- Easier credential management
- Sufficient for 2 pods

**Option 2** would be better if:
- You need to scale MCP server independently
- You have multiple apps using the same MCP server
- You want to reuse the MCP container across services

## Setup Steps

1. **Create Kubernetes Secret:**
```bash
kubectl create secret generic ga4-credentials \
  --from-file=credentials.json=/path/to/GA4-Connector-Project-bf12a7df0a87.json \
  --from-literal=google-project-id=bf12a7df0a87 \
  --namespace=experimental
```

2. **Build and push Docker images** (choose option above)

3. **Update image names** in deployment YAML files

4. **Deploy:**
```bash
kubectl apply -f k8s/
```

5. **Verify:**
```bash
kubectl get pods -n experimental
kubectl logs -n experimental deployment/ga4-chat-deployment
```

