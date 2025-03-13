# 1. Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 2. Create Traefik configuration
kubectl apply -f traefik/traefik-config.yaml

# 3. Apply cert-manager configuration
kubectl apply -f traefik/cert-manager.yaml

# 4. Install your chart
helm upgrade --install credential-showcase ./charts/credential-showcase

# 5. Verify the setup
kubectl get ingress
kubectl get ingressroute
kubectl get certificates