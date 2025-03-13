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



helm upgrade --install credential-showcase -f ./charts/credential-showcase/values.yaml --set api_server.image.tag=3aed748764b34a1df8a3daeb723f9b47a201ce97  --set traction_adapter.image.tag=0ea06afcb41f2c64d65ec01af1149ed0a13f6e3d  ./charts/credential-showcase --wait