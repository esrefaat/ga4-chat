# Kubernetes Deployment Files

This directory contains Kubernetes manifests for deploying the GA4 Chat application.

## Files

- `ga4-chat-deployment-monolithic.yaml` - Single container deployment (recommended)
- `ga4-chat-deployment-sidecar.yaml` - Sidecar container deployment (alternative)
- `ga4-chat-service.yaml` - Kubernetes Service
- `ga4-chat-ingress.yaml` - Ingress configuration for ga4chat.jovrnalism.com
- `ga4-credentials-secret.yaml.template` - Template for creating credentials secret
- `DEPLOYMENT_OPTIONS.md` - Detailed comparison of deployment options

## Quick Start (Monolithic - Recommended)

1. **Create namespace:**
```bash
kubectl create namespace experimental
```

2. **Create credentials secret:**
```bash
kubectl create secret generic ga4-credentials \
  --from-file=credentials.json=/path/to/GA4-Connector-Project-bf12a7df0a87.json \
  --from-literal=google-project-id=bf12a7df0a87 \
  --namespace=experimental
```

3. **Build and push Docker image:**
```bash
docker build --platform linux/amd64 -f Dockerfile.monolithic -t your-registry/ga4-chat:v1 .
docker push your-registry/ga4-chat:v1
```

4. **Update image name in deployment:**
Edit `ga4-chat-deployment-monolithic.yaml` and replace `your-registry/ga4-chat:v1` with your actual registry.

5. **Deploy:**
```bash
kubectl apply -f k8s/ga4-chat-deployment-monolithic.yaml
kubectl apply -f k8s/ga4-chat-service.yaml
kubectl apply -f k8s/ga4-chat-ingress.yaml
```

6. **Verify:**
```bash
kubectl get pods -n experimental
kubectl get svc -n experimental
kubectl get ingress -n experimental
```

## Configuration

- **Namespace:** `experimental`
- **Replicas:** 2 pods
- **Ingress Domain:** `ga4chat.jovrnalism.com`
- **Port:** 3000 (internal) → 80 (service) → 443 (ingress)

## Troubleshooting

```bash
# Check pod logs
kubectl logs -n experimental deployment/ga4-chat-deployment

# Check pod status
kubectl describe pod -n experimental <pod-name>

# Check events
kubectl get events -n experimental --sort-by='.metadata.creationTimestamp'

# Port forward for local testing
kubectl port-forward -n experimental service/ga4-chat-service 3000:80
```

