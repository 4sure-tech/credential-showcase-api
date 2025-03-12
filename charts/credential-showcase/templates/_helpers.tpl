{{/*
Expand the name of the chart.
*/}}
{{- define "credential-showcase.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "credential-showcase.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Returns a secret if it already exists in Kubernetes, otherwise creates
it randomly.
*/}}
{{- define "getOrGeneratePass" }}
{{- $len := (default 16 .Length) | int -}}
{{- $obj := (lookup "v1" "Secret" .Namespace .Name) -}}
{{- if $obj }}
{{- index $obj.data .Key -}}
{{- else -}}
{{- randAlphaNum $len | b64enc -}}
{{- end -}}
{{- end }}

{{/*
Get PostgreSQL password
*/}}
{{- define "postgresql.password" -}}
{{- $secretName := printf "%s-postgresql" (include "credential-showcase.fullname" .) -}}
{{- $password := dict "Name" $secretName "Namespace" .Release.Namespace "Key" "password" "Length" 16 | include "getOrGeneratePass" -}}
{{- $password -}}
{{- end }}

{{/*
Get PostgreSQL admin password
*/}}
{{- define "postgresql.adminPassword" -}}
{{- $secretName := printf "%s-postgresql" (include "credential-showcase.fullname" .) -}}
{{- $password := dict "Name" $secretName "Namespace" .Release.Namespace "Key" "postgres-password" "Length" 16 | include "getOrGeneratePass" -}}
{{- $password -}}
{{- end }}

{{/*
Get RabbitMQ password
*/}}
{{- define "rabbitmq.password" -}}
{{- if .Values.rabbitmq.auth.existingSecret -}}
{{- .Values.rabbitmq.auth.existingSecret -}}
{{- else -}}
{{- $secretName := printf "%s-rabbitmq" (include "credential-showcase.fullname" .) -}}
{{- dict "Name" $secretName "Namespace" .Release.Namespace "Key" "password" "Length" 16 | include "getOrGeneratePass" -}}
{{- end -}}
{{- end }} 