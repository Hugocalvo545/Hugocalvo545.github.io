# API de hugocalvo.dev (`servidor/`)

Funciones serverless de Vercel para la zona de servicios de la web estática:

| Ruta | Qué hace |
|---|---|
| `POST /api/stripe-webhook` | Verifica la firma de Stripe y, cuando entra un pago de un Payment Link, avisa por ntfy y por correo (a Hugo y al cliente). |
| `POST /api/solicitud` | Formulario "Solicitar alta". Valida, comprueba Turnstile, limita por IP, avisa y envía al cliente un resumen automático. |
| `POST /api/briefing` | Briefing por pasos. Mismo flujo que la solicitud. |

- Sin dependencias: Node 22 con `fetch` y `crypto` nativos.
- La firma de Stripe se verifica a mano (HMAC-SHA256 con tolerancia de 5 minutos).
- El aviso de ntfy lleva solo el tipo (pago o solicitud), el servicio y la empresa. Nunca lleva datos de pago.
- Ningún secreto vive en el repo: todos van en variables de entorno de Vercel.

## Variables de entorno (Vercel > Project > Settings > Environment Variables, entorno Production)

| Variable | Valor | De dónde sale |
|---|---|---|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe > Desarrolladores > Webhooks > tu endpoint > Secreto de firma |
| `TURNSTILE_SECRET` | Clave secreta del widget | Cloudflare > Turnstile > tu widget |
| `RESEND_API_KEY` | `re_...` | Resend > API Keys. Basta con permiso de envío (Sending access), limitado al dominio `hugocalvo.dev` |
| `MAIL_FROM` | `Hugo Calvo <avisos@hugocalvo.dev>` | Remitente de los correos, del dominio verificado en Resend |
| `MAIL_TO` | `hugocgarciat@gmail.com` | Dónde recibes los avisos |
| `NTFY_TOPIC` | Un nombre largo y aleatorio | Genéralo con `node -e "console.log('hc-' + crypto.randomUUID())"`. Quien conozca el tema puede leer los avisos |
| `ALLOWED_ORIGIN` | `https://hugocalvo.dev` | Origen desde el que se aceptan formularios. Admite varios separados por comas |
| `KV_REST_API_URL` y `KV_REST_API_TOKEN` | Los crea la integración | Vercel > Storage > Upstash for Redis, conectado al proyecto. Opcional: sin Redis no hay límite por IP ni control de avisos duplicados |
| `NTFY_SERVER` | `https://ntfy.sh` | Opcional. Solo si usas un servidor ntfy propio |

Después de añadir o cambiar una variable hay que volver a desplegar, porque no se aplica a los despliegues existentes.

## Pruebas

```
cd servidor
npm test
```

Las pruebas no usan la red y simulan `fetch`. También comprueban que `lib/catalogo.js` coincide con `assets/data/servicios.json` y con las opciones de `js/servicios.js`. Ejecútalas cada vez que cambies servicios o paquetes en el JSON.

## Despliegue

Los pasos completos (proyecto de Vercel, dominio `api.hugocalvo.dev`, registros DNS, Resend, Turnstile y Stripe) están en [docs/servicios-configuracion.md](../docs/servicios-configuracion.md).
