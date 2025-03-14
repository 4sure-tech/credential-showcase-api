I'll create a comprehensive documentation file in proper markdown format:

```markdown:traefik/documentation.md
# Traefik Configuration Guide

This guide explains how to set up Traefik as an ingress controller on a Kubernetes cluster (specifically K3s), configure TLS with cert-manager, and deploy applications with proper routing.

## Prerequisites

- A Kubernetes cluster (K3s in this case)
- `kubectl` installed and configured
- `helm` installed (for application deployment)
- Domain names pointing to your server's IP address

## 1. K3s Installation and Configuration

K3s comes with Traefik v1 by default, but we want to use Traefik v2.

### Disable the default Traefik installation

1. Edit the K3s configuration file:

```bash
sudo nano /etc/systemd/system/k3s.service
```

2. Add the `--disable=traefik` flag to the ExecStart line:

```
ExecStart=/usr/local/bin/k3s server --disable=traefik
```

3. Restart K3s:

```bash
sudo systemctl daemon-reload
sudo systemctl restart k3s
```

### Configure K3s to use Traefik v2

1. Create a custom K3s configuration file:

```bash
sudo cp traefik/k3s-config.yaml /var/lib/rancher/k3s/server/manifests/
```

The `k3s-config.yaml` file contains:

```yaml
# This file is placed in /var/lib/rancher/k3s/server/manifests/
# to configure K3s to use Traefik v2
apiVersion: helm.cattle.io/v1
kind: HelmChart
metadata:
  name: traefik
  namespace: kube-system
spec:
  chart: traefik
  repo: https://helm.traefik.io/traefik
  targetNamespace: kube-system
  valuesContent: |-
    additionalArguments:
      - "--log.level=DEBUG"
      - "--api.dashboard=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--providers.kubernetescrd"
      - "--providers.kubernetesingress"
    ports:
      web:
        redirectTo: websecure
    ingressRoute:
      dashboard:
        enabled: true
```

This configuration:

- Installs Traefik v2 in the kube-system namespace
- Enables the Traefik dashboard
- Configures HTTP (port 80) and HTTPS (port 443) endpoints
- Redirects HTTP traffic to HTTPS
- Enables Kubernetes CRD and Ingress providers

## 2. Install cert-manager

cert-manager is used to automatically provision and manage TLS certificates.

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

This installs cert-manager with its custom resource definitions (CRDs).

## 3. Configure cert-manager

### Create a ClusterIssuer

The ClusterIssuer tells cert-manager how to request certificates. We're using Let's Encrypt's production server.

```bash
kubectl apply -f traefik/cluster-issuer.yaml
```

The `cluster-issuer.yaml` file contains:

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    email: your-email@northernblock.io  # Replace with your actual email
    server: https://acme-v02.api.letsencrypt.org/directory
    privateKeySecretRef:
      name: letsencrypt-prod-account-key
    solvers:
    - http01:
        ingress:
          class: traefik
```

This configuration:

- Creates a ClusterIssuer named `letsencrypt-prod`
- Uses Let's Encrypt's production ACME server
- Configures the HTTP-01 challenge method with Traefik

### Create a Certificate

The Certificate resource requests a certificate for your domains.

```bash
kubectl apply -f traefik/certificate.yaml
```

The `certificate.yaml` file contains:

```yaml
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: showcase-tls
spec:
  secretName: showcase-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - bcshowcase-api.dev.nborbit.ca
    - bcshowcase-traction.dev.nborbit.ca
```

This configuration:

- Requests a certificate for the specified domains
- Stores the certificate in a Secret named `showcase-tls`
- Uses the `letsencrypt-prod` ClusterIssuer

## 4. Configure Traefik Routes

Create IngressRoutes to direct traffic to your services.

```bash
kubectl apply -f traefik/traefik-config.yaml
```

The `traefik-config.yaml` file contains:

```yaml
# Middleware for common configurations
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: redirect-https
  namespace: kube-system
spec:
  redirectScheme:
    scheme: https
    permanent: true
---
# TLS Options
apiVersion: traefik.containo.us/v1alpha1
kind: TLSOption
metadata:
  name: default
  namespace: kube-system
spec:
  minVersion: VersionTLS12
---
# IngressRoute for api-server
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: api-server-route
  namespace: kube-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`bcshowcase-api.dev.nborbit.ca`)
      kind: Rule
      services:
        - name: credential-showcase-credential-showcase-api-server
          port: 3000
      middlewares:
        - name: redirect-https
          namespace: kube-system
  tls:
    secretName: showcase-tls
---
# IngressRoute for traction-adapter
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: traction-adapter-route
  namespace: kube-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`bcshowcase-traction.dev.nborbit.ca`)
      kind: Rule
      services:
        - name: credential-showcase-credential-showcase-traction-adapter
          port: 3757
      middlewares:
        - name: redirect-https
          namespace: kube-system
  tls:
    secretName: showcase-tls
```

This configuration:

- Creates a middleware to redirect HTTP to HTTPS
- Sets minimum TLS version to 1.2
- Creates IngressRoutes for the API server and Traction adapter
- Uses the TLS certificate from the `showcase-tls` Secret

## 5. Deploy Your Application

Deploy your application using Helm:

```bash
helm upgrade --install credential-showcase \
  -f ./charts/credential-showcase/values.yaml \
  --set api_server.image.tag=3aed748764b34a1df8a3daeb723f9b47a201ce97 \
  --set traction_adapter.image.tag=0ea06afcb41f2c64d65ec01af1149ed0a13f6e3d \
  ./charts/credential-showcase --wait
```

### Handling OpenShift Routes

If you're deploying to OpenShift, the chart includes a `route.yaml` template that creates OpenShift Routes:

```yaml
{{- if .Values.api_server.enabled }}
{{- if .Values.api_server.openshift.route.enabled }}
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: {{ .Release.Name }}-{{ .Values.api_server.name }}
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
spec:
  host: pr-{{ .Release.Name }}-{{ .Values.api_server.name }}-dev.apps.silver.devops.gov.bc.ca
  path: {{ .Values.api_server.openshift.route.path }}
  port:
    targetPort: {{ .Values.api_server.openshift.route.targetPort }}
  tls:
    {{- toYaml .Values.api_server.openshift.route.tls | nindent 4 }}
  to:
    kind: Service
    name: {{ .Release.Name }}-{{ .Values.api_server.name }}
  wildcardPolicy: {{ .Values.api_server.openshift.route.wildcardPolicy }}
{{- end }}
---
{{- end }}
{{- if .Values.traction_adapter.enabled }}
{{- if .Values.traction_adapter.openshift.route.enabled }}
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: {{ .Release.Name }}-{{ .Values.traction_adapter.name }}
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
spec:
  host: pr-{{ .Release.Name }}-{{ .Values.traction_adapter.name }}-dev.apps.silver.devops.gov.bc.ca
  path: {{ .Values.traction_adapter.openshift.route.path }}
  port:
    targetPort: {{ .Values.traction_adapter.openshift.route.targetPort }}
  tls:
    {{- toYaml .Values.traction_adapter.openshift.route.tls | nindent 4 }}
  to:
    kind: Service
    name: {{ .Release.Name }}-{{ .Values.traction_adapter.name }}
  wildcardPolicy: {{ .Values.traction_adapter.openshift.route.wildcardPolicy }}
{{- end }}
{{- end }} 
```

This is only used when deploying to OpenShift and is disabled by default.

## 6. Verify the Setup

### Check if Traefik is running

```bash
kubectl get pods -n kube-system -l app.kubernetes.io/name=traefik
```

### Check if cert-manager is running

```bash
kubectl get pods -n cert-manager
```

### Check if the certificate was issued

```bash
kubectl get certificates
kubectl get certificaterequests
kubectl get challenges
kubectl get orders
```

### Check if the IngressRoutes are configured

```bash
kubectl get ingressroute -n kube-system
```

### Check if the services are running

```bash
kubectl get services
```

### Test the endpoints

```bash
curl -k https://bcshowcase-api.dev.nborbit.ca/health
curl -k https://bcshowcase-traction.dev.nborbit.ca/health
```

## 7. Secret Management

The application uses secrets for database and message queue credentials. These are managed using Helm templates:

### Helper Functions

The `_helpers.tpl` file contains functions to check if secrets exist and generate them if needed:

```yaml
{{/*
Returns a secret if it already exists in Kubernetes, otherwise creates
it randomly.
*/}}
{{- define "getOrGeneratePass" }}
{{- $len := (default 16 .Length) | int -}}
{{- $obj := (lookup "v1" .Kind .Namespace .Name).data -}}
{{- if $obj }}
{{- index $obj .Key -}}
{{- else if (eq (lower .Kind) "secret") -}}
{{- randAlphaNum $len | b64enc -}}
{{- else -}}
{{- randAlphaNum $len -}}
{{- end -}}
{{- end }}

{{/*
PostgreSQL password
*/}}
{{- define "postgresql.password" -}}
{{- $secretName := printf "%s-postgresql" .Release.Name -}}
{{- $secretKey := "password" -}}
{{- $secret := (lookup "v1" "Secret" .Release.Namespace $secretName) -}}
{{- if $secret -}}
    {{/* Secret exists, use existing password */}}
    {{- index $secret.data $secretKey -}}
{{- else -}}
    {{/* Secret doesn't exist, generate new password */}}
    {{- randAlphaNum 16 | b64enc -}}
{{- end -}}
{{- end -}}
```

### Secret Templates

The `postgresql-secret.yaml` and `rabbitmq-secret.yaml` files create secrets only if they don't already exist:

```yaml
{{- $postgresqlSecretName := include "credential-showcase.database.secret.name" . -}}
{{- $postgresqlSecret := (lookup "v1" "Secret" .Release.Namespace $postgresqlSecretName) -}}
{{- if not $postgresqlSecret }}
apiVersion: v1
kind: Secret
metadata:
  name: {{ include "credential-showcase.database.secret.name" . }}
  namespace: {{ .Values.global.namespaceOverride | default .Release.Namespace }}
  annotations:
    "helm.sh/resource-policy": keep
  labels:
    app.kubernetes.io/managed-by: {{ .Release.Service }}
    app.kubernetes.io/instance: {{ .Release.Name }}
    helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
type: Opaque
data:
  {{ include "credential-showcase.database.adminPasswordKey" . }}: {{ include "getOrGeneratePass" (dict "Namespace" .Release.Namespace "Kind" "Secret" "Name" (include "credential-showcase.database.secret.name" .) "Key" (include "credential-showcase.database.adminPasswordKey" .) "Length" 16) }}
  {{ include "credential-showcase.database.userPasswordKey" . }}: {{ include "getOrGeneratePass" (dict "Namespace" .Release.Namespace "Kind" "Secret" "Name" (include "credential-showcase.database.secret.name" .) "Key" (include "credential-showcase.database.userPasswordKey" .) "Length" 16) }}
  username: {{ .Values.postgresql.auth.username | default "postgres" | b64enc }}
{{- end }}
```

The `"helm.sh/resource-policy": keep` annotation ensures that secrets are not deleted when the Helm release is uninstalled.

## Troubleshooting

### Check Traefik logs

```bash
kubectl logs -n kube-system -l app.kubernetes.io/name=traefik
```

### Check cert-manager logs

```bash
kubectl logs -n cert-manager -l app=cert-manager
```

### Check application logs

```bash
kubectl logs -l app=credential-showcase-api-server
kubectl logs -l app=credential-showcase-traction-adapter
```

### Check certificate status

```bash
kubectl describe certificate showcase-tls
```

### Check IngressRoute status

```bash
kubectl describe ingressroute -n kube-system api-server-route
kubectl describe ingressroute -n kube-system traction-adapter-route
```

### Secret Management Issues

If you encounter issues with secrets:

1. Check if secrets exist:

```bash
kubectl get secrets | grep credential-showcase
```

2. If secrets exist but Helm fails, you may need to delete them:

```bash
kubectl delete secret credential-showcase-postgresql
kubectl delete secret credential-showcase-rabbitmq
```

3. If Helm shows "failed" status but everything is working:

```bash
helm history credential-showcase
helm rollback credential-showcase 1  # Rollback to a working revision
```

## Common Issues and Solutions

1. **Certificate not being issued**

   - Check that your domains are pointing to the correct IP address
   - Ensure the HTTP-01 challenge can reach your server on port 80
   - Check cert-manager logs for errors
2. **Services not accessible**

   - Verify that the service names in the IngressRoutes match your actual services
   - Check that the ports are correct
   - Ensure your services are running and healthy
3. **TLS errors**

   - Check that the certificate has been issued successfully
   - Verify that the secretName in the IngressRoutes matches the certificate's secretName
   - Check Traefik logs for TLS-related errors
4. **Redirect loops**

   - Check your middleware configuration
   - Ensure you're not applying multiple redirects
5. **Secret management issues**

   - If secrets already exist but Helm tries to create them, use the `existingSecret` parameter in values.yaml
   - If secrets are being deleted unexpectedly, ensure they have the `"helm.sh/resource-policy": keep` annotation

## References

- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [cert-manager Documentation](https://cert-manager.io/docs/)
- [K3s Documentation](https://docs.k3s.io/)
- [Helm Documentation](https://helm.sh/docs/)
