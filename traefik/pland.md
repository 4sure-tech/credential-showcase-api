# Troubleshooting Plan

## K3s and Traefik Setup

- [X]  Verify K3s installation and configuration
- [X]  Restore Traefik in K3s
- [X]  Configure Traefik properly
- [X]  Verify Traefik is running

## Certificate Management

- [X]  Verify cert-manager installation
- [X]  Configure ClusterIssuer correctly (updated with valid email)
- [X]  Update Certificate resource with correct domains
- [X]  Verify TLS certificate generation

## Application Deployment

- [ ]  Fix RabbitMQ authentication issues
  - [ ]  Update RabbitMQ readiness probe
  - [ ]  Fix guest user credentials
- [ ]  Fix PostgreSQL connection issues
  - [ ]  Update service name in application configuration
- [ ]  Verify service connectivity
- [ ]  Configure IngressRoutes to point to correct services
- [ ]  Test application endpoints

## Final Verification

- [ ]  Verify all components are running
- [ ]  Test external access with domains
- [ ]  Document working configuration
