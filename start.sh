#!/bin/bash

# Encode the basic auth credentials
BASIC_AUTH=$(echo -n "${N8N_WEBHOOK_USERNAME}:${N8N_API_KEY}" | base64)

# Run Supergateway with Basic Auth header
npx -y supergateway --stdio "node build/index.js" \
    --port ${PORT:-8000} \
    --healthEndpoint /healthz \
    --cors \
    --logLevel ${DEBUG:-false} \
    --header "Authorization: Basic ${BASIC_AUTH}" 