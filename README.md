<div align="center">

<img src="https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Shield.png" alt="Shield" width="80" />

# API Rate Limiter

**Production-grade sliding window rate limiter — the same algorithm used by Stripe and Cloudflare.**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

</div>

---

## What is this?

A middleware-based API rate limiter using the **sliding window algorithm** backed by Redis sorted sets. Plugs into any Express app and limits requests per IP or API key — returning proper 429 responses with retry headers when limits are exceeded.

---

## Features

- 🪟 **Sliding window algorithm** — no burst exploits at window boundaries
- 🔑 **Per-IP and per-API-key** limiting via `X-Api-Key` header
- 📊 **Rate limit headers** — `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- ⚡ **Redis sorted sets** — O(log N) operations, handles high throughput
- 🔌 **Express middleware** — drop into any route with one line
- 🔍 **Status endpoint** — check request count for any identifier

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Server | Node.js, Express |
| Rate Limit Store | Redis (sorted sets) |
| Algorithm | Sliding Window |

---

## Architecture

The sliding window algorithm stores each request as a timestamped entry in a Redis sorted set, one set per client identifier.

```
Incoming Request
      │
      ▼
Remove entries older than window
      │
      ▼
Count remaining entries
      │
   ┌──┴──┐
   │     │
  Over  Under
  limit  limit
   │     │
  429   Add entry
        + next()
```

On every request:
1. Delete all entries outside the current time window
2. Count remaining entries
3. If count >= limit → return 429 with `Retry-After` header
4. Otherwise → add current timestamp to the set and allow through

---

## API Reference

| Method | Endpoint | Rate Limited | Description |
|---|---|---|---|
| GET | `/health` | No | Health check |
| GET | `/api/data` | Yes | Protected endpoint |
| POST | `/api/action` | Yes | Protected endpoint |
| GET | `/status/:id` | No | Check request count for identifier |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Redis instance ([Redis Cloud free tier](https://redis.io/try-free) works)

### Setup

```bash
git clone https://github.com/L4L4a/api-rate-limiter.git
cd api-rate-limiter
npm install
```

Create a `.env` file:
```env
PORT=3001
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT
RATE_LIMIT_MAX=10
RATE_LIMIT_WINDOW_MS=60000
```

```bash
npm run dev
```

### Test it

```bash
# hit the limit
for i in {1..12}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/data; done

# check headers
curl -v http://localhost:3001/api/data 2>&1 | grep -E "HTTP|X-Rate|Retry"
```

---

<div align="center">

Built by [Elvis Kenneth](https://github.com/L4L4a)

</div>