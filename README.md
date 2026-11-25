# CRP API

A small authenticated API that retrieves market pairs by running the original
curl command inside the existing Docker container named `utopia`.

## Endpoint

- `GET /health` — health check, no API key required.
- `GET /market/pairs` — requires the `X-API-Key` header.

## Requirements

- Docker Engine on the VPS.
- Existing Docker container named `utopia`.
- `curl` available inside `utopia`.
- The original command must work inside `utopia`:

```bash
docker exec utopia curl --socks5-hostname 127.0.0.1:1984 http://crp:8182/market/pairs
```

## Configure and run

Generate a key:

```bash
openssl rand -hex 32
```

Put the generated value in `.env`, replacing `REPLACE_WITH_YOUR_SECRET_API_KEY`.

Build:

```bash
docker build -t crp-api .
```

Run:

```bash
docker run -d \
  --name crp-api \
  --restart unless-stopped \
  -p 1980:8080 \
  --env-file .env \
  -v /var/run/docker.sock:/var/run/docker.sock \
  crp-api
```

Check logs and health:

```bash
docker logs -f crp-api
curl http://127.0.0.1:1980/health
```

Call the protected endpoint:

```bash
curl -H "X-API-Key: YOUR_SECRET_API_KEY" \
  http://127.0.0.1:1980/market/pairs
```

Open TCP port 8080 in the VPS/provider firewall if it must be reachable from
the Internet.

## Security

Mounting `/var/run/docker.sock` gives this container broad control over the
Docker daemon and is effectively root-level access to the host. Use only
trusted code, keep the API key secret, and restrict network access where
possible. Plain HTTP does not encrypt the API key; use HTTPS through a reverse
proxy for public Internet use.
