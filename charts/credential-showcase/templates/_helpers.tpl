{{/*
Expand the name of the chart.
*/}}
{{- define "credential-showcase.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
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
Create chart name and version as used by the chart label.
*/}}
{{- define "credential-showcase.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "credential-showcase.labels" -}}
helm.sh/chart: {{ include "credential-showcase.chart" . }}
{{ include "credential-showcase.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "credential-showcase.selectorLabels" -}}
app.kubernetes.io/name: {{ include "credential-showcase.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Returns a secret if it already exists in Kubernetes, otherwise creates
it randomly.
*/}}
{{- define "getOrGeneratePass" -}}
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
Define database secret name
*/}}
{{- define "credential-showcase.database.secret.name" -}}
{{- printf "%s-postgresql" .Release.Name -}}
{{- end -}}

{{/*
Get the admin-password key.
*/}}
{{- define "credential-showcase.database.adminPasswordKey" -}}
{{- if .Values.postgresql.auth.secretKeys.adminPasswordKey -}}
{{- printf "%s" (tpl .Values.postgresql.auth.secretKeys.adminPasswordKey $) -}}
{{- else -}}
postgres-password
{{- end -}}
{{- end -}}

{{/*
Get the user-password key.
*/}}
{{- define "credential-showcase.database.userPasswordKey" -}}
{{- if .Values.postgresql.auth.secretKeys.userPasswordKey -}}
{{- printf "%s" (tpl .Values.postgresql.auth.secretKeys.userPasswordKey $) -}}
{{- else -}}
password
{{- end -}}
{{- end -}}

{{/*
Create a default fully qualified rabbitmq name.
*/}}
{{- define "credential-showcase.rabbitmq.secret.name" -}}
{{- printf "%s-rabbitmq" .Release.Name -}}
{{- end -}}

{{/*
Get the rabbitmq password key.
*/}}
{{- define "credential-showcase.rabbitmq.passwordKey" -}}
{{- if .Values.rabbitmq.auth.secretKeys.passwordKey -}}
{{- printf "%s" .Values.rabbitmq.auth.secretKeys.passwordKey -}}
{{- else -}}
rabbitmq-password
{{- end -}}
{{- end -}}

{{/*
Get the rabbitmq erlang cookie key.
*/}}
{{- define "credential-showcase.rabbitmq.erlangCookieKey" -}}
{{- if .Values.rabbitmq.auth.secretKeys.erlangCookieKey -}}
{{- printf "%s" .Values.rabbitmq.auth.secretKeys.erlangCookieKey -}}
{{- else -}}
rabbitmq-erlang-cookie
{{- end -}}
{{- end -}}

{{/*
Define a FIXED auth token secret name that can be shared between frontend and backend
*/}}
{{- define "credential-showcase.authtoken.secret.name" -}}
showcase-authtoken
{{- end -}} 