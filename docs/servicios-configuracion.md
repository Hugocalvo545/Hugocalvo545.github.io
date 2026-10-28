# Zona de servicios: configuración externa

Guía de lo que hay que configurar fuera del repo para la zona de servicios de `index.html`. Ningún secreto va en el repo: los valores se ponen en los paneles de cada servicio.

Comprobado en la documentación oficial el 28/10/2026. Los nombres de los botones del panel pueden variar un poco según el idioma del panel.

## 1. Stripe: Payment Link de la auditoría

### 1.1 Decisión: Stripe cobra, la factura la emites tú desde Gestolio

- El Payment Link cobra **422,29 €** (349 € + 21 % de IVA) **sin Stripe Tax y sin factura automática de Stripe**. Coste extra en Stripe: 0 €.
- Stripe solo envía al cliente el justificante del pago (recibo). El recibo no es una factura.
- **La factura con el IVA desglosado la emites tú desde Gestolio**, con tu serie y tu numeración habituales. Los datos que necesitas llegan en el correo de aviso del pago: nombre, empresa, NIF (si lo ha puesto), email, web e importe.
- Así toda tu facturación queda en una sola serie, dentro de tu programa de facturación.

### 1.2 Antes de crear el enlace

**Datos públicos** (Configuración > Empresa > Datos públicos). Salen en la página de pago y en el recibo:

- Nombre legal: Hugo Calvo García.
- Dirección y correo de soporte.
- URL de la política de privacidad: `https://hugocalvo.dev/privacidad.html`, cuando esté publicada.
- URL de las condiciones: `https://hugocalvo.dev/condiciones.html`, cuando estén publicadas.

**No actives Stripe Tax** ni configures nada de facturación de Stripe (Invoicing).

### 1.3 Crear el Payment Link

En Catálogo de productos, crea el producto **Auditoría de visibilidad en IA** con precio único de **422,29 EUR**. Al no usar Stripe Tax, el precio es el importe final que paga el cliente.

En Payment Links, crea un enlace con ese producto y estas opciones:

| Opción | Valor |
|---|---|
| Cantidad | Fija en 1 (sin permitir que el cliente la cambie) |
| Recoger impuestos automáticamente (Stripe Tax) | **No** |
| Recoger nombre del cliente | Sí, obligatorio |
| Recoger nombre de la empresa | Sí, obligatorio |
| Permitir que las empresas indiquen su número fiscal | Sí. Es opcional para el cliente, así que el NIF queda opcional |
| Campo personalizado 1 | Tipo texto, etiqueta `Web a auditar`, obligatorio, máximo 255 caracteres |
| Email | Stripe lo pide siempre |
| Crear factura tras el pago | **No**. La factura la emites tú desde Gestolio |
| Después del pago | No mostrar la página de confirmación. Redirigir a `https://hugocalvo.dev/gracias.html?servicio=auditoria` |
| Aceptación de condiciones | Actívala cuando las condiciones estén publicadas. Requiere su URL en Datos públicos |
| Metadatos | `servicio` = `auditoria-ia`. Así el aviso dice qué servicio se ha pagado |

Payment Links admite como máximo 3 campos personalizados. Aquí solo se usa uno.

Copia la URL pública del enlace (`https://buy.stripe.com/...`) en `assets/data/servicios.json`, en el campo `servicios[auditoria-ia].pago.payment_link`.

- Es el único dato de Stripe que va en el repo, y es público.
- Mientras esté vacío, el panel muestra «Pedir la auditoría» y lleva al formulario de contacto.

**Después de cada pago:** emite en Gestolio la factura de 349 € + 21 % de IVA (422,29 €) con los datos del correo de aviso y envíasela al cliente. La web y los correos automáticos ya le dicen al cliente que la factura se la envías tú.

### 1.4 Webhook (después de desplegar `servidor/`)

1. En Desarrolladores > Webhooks, añade un endpoint.
2. URL: `https://api.hugocalvo.dev/api/stripe-webhook`.
3. Eventos:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
4. Copia el secreto de firma (`whsec_...`) en la variable `STRIPE_WEBHOOK_SECRET` de Vercel (ver sección 2).
5. Prueba el enlace en modo de prueba antes de pasarlo a modo real. El modo real tiene otro secreto de firma.

## 2. Vercel: proyecto de la API

**Ojo:** al conectar el repo, Vercel despliega cada push de cualquier rama: `main` va a producción y las demás ramas a vista previa. Conéctalo solo cuando quieras empezar a desplegar.

1. Ve a Add New… > Project > Import y elige el repo del portfolio.
2. **Root Directory:** pulsa Edit y elige `servidor`.
3. **Framework Preset:** Other.
4. **Build Command:** activa Override y déjalo vacío. Las funciones de `api/` se despliegan igual. `public/` solo contiene un `robots.txt`, para que no se sirva el código como archivos estáticos.
5. **Node.js:** 22.x. Ya lo fija `package.json`.
6. Antes del primer despliegue real, añade las variables de entorno de [servidor/README.md](../servidor/README.md) en Settings > Environment Variables, entorno Production.
7. **Opcional, para no redesplegar la API cuando solo cambia la web:** en Settings > Build and Deployment > Ignored Build Step, elige Custom y pon:
   ```
   git diff HEAD^ HEAD --quiet -- .
   ```
8. **Opcional, límite por IP y control de avisos duplicados:** Storage > Upstash for Redis, conectado al proyecto. Crea `KV_REST_API_URL` y `KV_REST_API_TOKEN` solas.

### Dominio `api.hugocalvo.dev`

1. En el proyecto, ve a Settings > Domains > Add Domain y escribe `api.hugocalvo.dev`.
2. Vercel muestra el CNAME que tienes que crear. Es único por proyecto, del tipo `xxxxxxxx.vercel-dns-017.com`. Cópialo tal cual.
3. En tu proveedor de DNS de `hugocalvo.dev`, crea este registro:

   | Tipo | Nombre | Valor |
   |---|---|---|
   | CNAME | `api` | el valor que muestra Vercel |

4. Si el DNS está en Cloudflare, ponlo como «Solo DNS» (nube gris), no como proxy.
5. Si Vercel pide además un TXT en `_vercel.hugocalvo.dev` (pasa cuando el dominio ya está en otra cuenta de Vercel), créalo también.
6. Los registros A de GitHub Pages del dominio raíz no se tocan.
7. Cuando el estado pase a «Valid Configuration», la API responde en `https://api.hugocalvo.dev/api/...`. Es la URL que ya tiene `formularios.endpoint` en `assets/data/servicios.json`.

## 3. Resend: correo desde `avisos@hugocalvo.dev`

1. En Domains > Add Domain, escribe `hugocalvo.dev` y elige la región `eu-west-1` (Irlanda).
2. Resend genera los registros. Los valores de la tabla son orientativos: copia los que muestra la pestaña Records, que deben coincidir exactamente.

   | Tipo | Nombre | Valor | Prioridad |
   |---|---|---|---|
   | MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` | 10 |
   | TXT | `send` | `v=spf1 include:amazonses.com ~all` | |
   | TXT | `resend._domainkey` | `p=...` (clave pública generada para tu dominio) | |
   | TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hugocgarciat@gmail.com` (recomendado, si no tienes ya uno) | |

3. Estos registros van en el subdominio `send` y no chocan con el correo que ya tengas en el dominio raíz.
4. Si el DNS está en Cloudflare, el registro DKIM tiene que estar en «Solo DNS».
5. Pulsa Verify. Suele tardar unos 15 minutos y como mucho 72 horas.
6. En API Keys, crea una clave con permiso «Sending access», limitada a `hugocalvo.dev`, y ponla en `RESEND_API_KEY`.
7. Plan gratuito: 100 correos al día y 3.000 al mes. Cada formulario envía 2 correos y cada pago otros 2.

## 4. Cloudflare Turnstile

1. En el panel de Cloudflare, ve a Turnstile > Add widget.
2. Nombre: `hugocalvo.dev`. Hostname: `hugocalvo.dev`. Modo: Managed.
3. Copia la **site key**, que es pública, en `assets/data/servicios.json`, en `formularios.turnstile_sitekey`.
4. Copia la **secret key** en `TURNSTILE_SECRET` de Vercel.
5. Es gratis y no hace falta que la web pase por el proxy de Cloudflare.
6. En local, la web usa sola la clave de prueba de Cloudflare.

## 5. ntfy en el móvil

1. Instala la app ntfy (Android o iOS).
2. Suscríbete al tema que hayas puesto en `NTFY_TOPIC`, en el servidor `ntfy.sh`.
3. Los temas de ntfy.sh son públicos para quien conozca el nombre. Por eso el nombre es largo y aleatorio, y el aviso solo lleva el tipo y el servicio (por ejemplo «Nuevo pago: Auditoría de visibilidad en IA»). El detalle llega solo por correo.

## 6. Activar los formularios en producción

Los formularios están apagados (`formularios.activos: false`) hasta que la política de privacidad esté publicada. Mientras tanto, los botones llevan al formulario de contacto.

Para activarlos:

1. Sustituye `privacidad.html`, hoy la versión de la fase 1, por la versión completa de `docs/politica-privacidad.md`, una vez revisada.
2. Comprueba que `formularios.privacidad_url` apunta a ella.
3. Pon la site key de Turnstile (sección 4).
4. Comprueba que la API responde en `api.hugocalvo.dev`.
5. Pon `formularios.activos: true`.

El botón de pago de la auditoría no depende de `formularios.activos`: aparece en cuanto rellenas `pago.payment_link`.

- Stripe recoge nombre, empresa, NIF y web.
- Rellena el enlace cuando la política de privacidad y las condiciones estén publicadas y su URL figure en Datos públicos de Stripe.

El formulario de contacto con FormSubmit se retiró el 28/10/2026: su política (de 2019) no indica entidad, país ni garantías de protección de datos. Ahora el contacto es directo, por email y por WhatsApp.

## 7. Prueba completa antes de anunciarlo

1. **Stripe en modo de prueba:** paga el Payment Link con la tarjeta `4242 4242 4242 4242`. Tienen que llegar:
   - el aviso de ntfy, con «Nuevo pago: Auditoría de visibilidad en IA»;
   - el correo con el resumen y el recordatorio de emitir la factura en Gestolio;
   - el correo al cliente;
   - la redirección a `gracias.html?servicio=auditoria`.
2. **Formularios:** envía una solicitud y un briefing desde la web publicada. Comprueba que llegan el aviso, los dos correos y la redirección a gracias.
3. **Reintento de Stripe:** en Stripe, reenvía el evento. No debe llegar un segundo aviso si Upstash está conectado.
