# FENELS — Landing de preventa (lista de espera)

Landing estática para capturar reservas (nombre + email + talla) antes del primer drop.
**Sin checkout, sin pagos, sin precios con botón de compra.**

## Estructura

```
fenels/
├── index.html        # La página (hero, camiseta, cómo funciona, escasez, footer)
├── css/styles.css    # Estilos mobile-first, sin librerías
├── js/main.js        # Validación, envío, contador, reveal al scroll
├── api/waitlist.js   # Función serverless de Vercel (guardar reservas + contador)
└── README.md
```

## Desplegar en Vercel (opción recomendada)

1. Sube la carpeta `fenels/` a un repo (o `vercel deploy` desde la carpeta).
2. En el dashboard de Vercel → **Storage → Upstash for Redis** (o Vercel KV) → conéctalo
   al proyecto. Eso crea solas las variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`.
3. Listo. El formulario hace `POST /api/waitlist` y el contador `GET /api/waitlist`.

Las reservas se guardan en Redis:
- `fenels:emails` → set de emails únicos (es el contador, sin duplicados)
- `fenels:entries` → lista JSON con `{nombre, email, talla, ts}` de cada reserva

### Exportar la lista de emails

Desde la consola de Upstash (Data Browser) o por REST:

```bash
curl -H "Authorization: Bearer $KV_REST_API_TOKEN" "$KV_REST_API_URL/lrange/fenels:entries/0/-1"
```

## Alternativa: Formspree (cero backend)

Si prefieres no tocar Redis:

1. Crea un formulario en [formspree.io](https://formspree.io) y copia su ID (ej. `mqkvabcd`).
2. En `js/main.js`, rellena `CONFIG.FORMSPREE_ID = 'mqkvabcd'`.
3. Los envíos llegan a tu email/panel de Formspree. Sin endpoint propio no hay
   contador: la sección de objetivo muestra siempre el bloque de acceso prioritario.

## Configuración rápida (`js/main.js` → `CONFIG`)

| Clave | Qué hace |
|---|---|
| `FORMSPREE_ID` | Si lo rellenas, se usa Formspree en vez del endpoint propio |
| `GOAL` | Objetivo de reservas para fabricar el drop (300) |
| `REVEAL_COUNT_AT` | La barra de progreso X/300 solo se enseña a partir de este número de reservas reales (25). Por debajo, o si el endpoint falla, se muestra el bloque de "acceso prioritario" — nunca cifras inventadas |

## Fotos del producto

La sección `#camiseta` muestra una única imagen: `img/fenels-conjunto.jpg`
(las dos camisetas juntas, delantera y trasera, ~1402×1122).

Se muestra **siempre completa, sin recorte**: el contenedor usa el ratio natural
de la foto con `object-fit: contain`, y el fondo es el mismo negro `#0a0a0a` de la
foto, así que si el ratio no coincide exactamente las bandas no se notan.
Si tu archivo se llama distinto, ajusta el `src` en `index.html`.

## Contacto y redes

- Instagram: [@fenels_oficial](https://instagram.com/fenels_oficial) — también es la vía
  para pedir el borrado de datos (por DM), mientras no exista email ni dominio propio.
- Canal de WhatsApp: enlazado en el footer.
