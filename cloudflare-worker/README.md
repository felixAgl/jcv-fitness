# MercadoPago Cloudflare Worker

Este worker permite crear preferencias de MercadoPago desde un sitio estático (GitHub Pages).

## Deploy

### 1. Instalar Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login en Cloudflare

```bash
wrangler login
```

### 3. Deploy del Worker

```bash
cd cloudflare-worker
wrangler deploy
```

### 4. Configurar el Access Token

```bash
wrangler secret put MP_ACCESS_TOKEN
# Pegar: TEST-8031681338641690-012319-40cf5cf2921cab67fa4695cf4d4ef5ac-319229185
```

### 5. Obtener la URL del Worker

Despues del deploy, Wrangler te dara una URL tipo:
```
https://mercadopago-jcv.<tu-cuenta>.workers.dev
```

### 6. Configurar en el proyecto

Actualizar `.env.local`:
```
NEXT_PUBLIC_MP_WORKER_URL=https://mercadopago-jcv.<tu-cuenta>.workers.dev
```

## Testing

```bash
curl -X POST https://mercadopago-jcv.<tu-cuenta>.workers.dev \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "items": [{
      "id": "PLAN_PRO",
      "title": "JCV Fitness - Plan Pro",
      "quantity": 1,
      "currencyId": "COP",
      "unitPrice": 89900
    }]
  }'
```

## Produccion

Para produccion, cambiar el `MP_ACCESS_TOKEN` por las credenciales de produccion:
```bash
wrangler secret put MP_ACCESS_TOKEN
# Pegar el token de PRODUCCION
```

## CORS

El worker solo acepta requests desde:
- `https://felixagl.github.io`
- `http://localhost:3000`
- `http://localhost:5173`

Para agregar mas origenes, editar `ALLOWED_ORIGINS` en `mercadopago-worker.js`.
