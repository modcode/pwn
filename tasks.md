# Tasks

## Before Publishing

- [ ] Lock down `/api/upload` and `/api/locations/clear` — these endpoints are currently unprotected. Add authentication (e.g. a secret token header or HTTP basic auth) so only you can call them.
