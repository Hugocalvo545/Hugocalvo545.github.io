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
3. Los envíos llegan a tu email/panel de Formspree. El contador pasa a usar
   `CONFIG.FALLBACK_COUNT` (Formspree no expone un contador público).

## Configuración rápida (`js/main.js` → `CONFIG`)

| Clave | Qué hace |
|---|---|
| `FORMSPREE_ID` | Si lo rellenas, se usa Formspree en vez del endpoint propio |
| `BASE_COUNT` | Número que se suma al contador real (para arrancar con base) |
| `FALLBACK_COUNT` | Contador mostrado si el endpoint no responde (vista local / Formspree) |

## Fotos del producto

La galería de `#camiseta` espera estos dos archivos en `img/`:

| Archivo | Qué es | Ratio |
|---|---|---|
| `img/fenels-conjunto.jpg` | Las dos camisetas juntas, delantera y trasera (la protagonista, a ancho completo) | ~1402×1122 |
| `img/fenels-detalle.jpg` | Detalle del lettering trasero (secundaria, más pequeña y centrada) | ~550×430 |

Se muestran **siempre completas, sin recorte**: cada contenedor usa el ratio natural
de su foto con `object-fit: contain`, y el fondo es el mismo negro `#0a0a0a` de las
fotos, así que si el ratio no coincide exactamente las bandas no se notan.
Si tus archivos se llaman distinto, ajusta los `src` en `index.html`.

## Pendiente de personalizar

- Enlaces reales de Instagram y TikTok en el footer.
- Email de contacto (`hola@fenels.com`) en el texto legal y el footer.
