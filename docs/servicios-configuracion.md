# Zona de servicios: configuración externa

Guía de lo que hay que configurar fuera del repo para la zona de servicios de `index.html`. Ningún secreto va en el repo: los valores se ponen en los paneles de cada servicio.

Comprobado en la documentación oficial el 28/10/2026. Los nombres de los botones del panel pueden variar un poco según el idioma del panel.

## 1. Stripe: Payment Link de la auditoría

### 1.1 Antes de crear el enlace

1. **Datos públicos** (Configuración > Empresa > Datos públicos):
   - Nombre legal: Hugo Calvo García.
   - Dirección y correo de soporte.
   - URL de la política de privacidad: `https://hugocalvo.dev/privacidad.html`, cuando esté publicada.
   - URL de las condiciones: `https://hugocalvo.dev/condiciones.html`, cuando estén publicadas.
2. **NIF del vendedor en las facturas** (Configuración > Facturación > Facturas > Información fiscal de la factura):
   - Añade tu NIF.
   - Márcalo como predeterminado.
3. **Serie propia de facturas** (Configuración > Facturación > Facturas > Numeración):
   - Elige numeración **por cuenta**, con un prefijo propio. Ejemplo: `HCSTRIPE`.
   - Las facturas saldrán como `HCSTRIPE-0001`, `HCSTRIPE-0002`… y no se mezclan con tu numeración habitual.
   - Reglas del prefijo:
     - De 1 a 12 caracteres, solo mayúsculas y números, sin guiones.
     - No puede coincidir con un prefijo de cliente.
     - Si lo cambias, solo afecta a las facturas futuras.
   - Con numeración por cuenta solo hay una serie de Stripe a la vez.
   - Confirma con tu gestor que puedes usar una serie aparte para estas facturas y cómo encaja con VeriFactu (ver 1.3).

### 1.2 Crear el Payment Link

En Catálogo de productos, crea el producto **Auditoría de visibilidad en IA**, con precio único de **422,29 EUR**.

En Payment Links, crea un enlace con ese producto y estas opciones:

| Opción | Valor |
|---|---|
| Cantidad | Fija en 1 (sin permitir que el cliente la cambie) |
| Recoger nombre del cliente | Sí, obligatorio |
| Recoger nombre de la empresa | Sí, obligatorio |
| Permitir que las empresas indiquen su número fiscal | Sí. Es opcional para el cliente, así que el NIF queda opcional |
| Campo personalizado 1 | Tipo texto, etiqueta `Web a auditar`, obligatorio, máximo 255 caracteres |
| Email | Stripe lo pide siempre |
| Crear factura tras el pago | Según la opción de IVA elegida (ver 1.3) |
| Después del pago | No mostrar la página de confirmación. Redirigir a `https://hugocalvo.dev/gracias.html?servicio=auditoria` |
| Aceptación de condiciones | Actívala cuando las condiciones estén publicadas. Requiere su URL en Datos públicos |
| Metadatos | `servicio` = `auditoria-ia`. Así el aviso dice qué servicio se ha pagado |

Payment Links admite como máximo 3 campos personalizados. Aquí solo se usa uno.

Copia la URL pública del enlace (`https://buy.stripe.com/...`) en `assets/data/servicios.json`, en el campo `servicios[auditoria-ia].pago.payment_link`. Es el único dato de Stripe que va en el repo, y es público. Mientras esté vacío, el panel muestra «Pedir la auditoría» y lleva al formulario de contacto.

### 1.3 IVA desglosado en la factura: opciones

**Un Payment Link no admite tipos impositivos manuales.** La opción «el precio incluye impuestos» solo calcula IVA si activas Stripe Tax con tu registro de España. Sin Stripe Tax, la factura sale sin línea de IVA.

| Opción | Coste extra por venta de 422,29 € | IVA desglosado |
|---|---|---|
| **A. Payment Link sin factura de Stripe.** Emites tú la factura con tu herramienta y tu serie habitual a partir del aviso (nombre, empresa, NIF y email llegan en el correo de aviso) | 0 € | Sí, en tu factura |
| **B. Stripe Tax.** Registro de España en Stripe Tax, precio con impuestos incluidos y «Crear factura tras el pago» activado | 0,5 % de Stripe Tax + 0,4 % de factura ≈ 3,80 € | Sí, en la factura de Stripe |
| **C. Checkout creado desde `servidor/`** con un tipo de IVA manual del 21 % inclusivo y factura tras el pago | 0,4 % de factura ≈ 1,69 € | Sí, en la factura de Stripe |

Coste de la factura tras el pago: 0,4 % del total, con un tope de unos 2 USD por factura. No está incluido en el plan Invoicing Starter.

- **La más barata:** A.
- **La más sencilla con factura automática de Stripe:** B. Activa Stripe Tax > Registros > España (IVA) y deja el precio del producto como «incluye impuestos».
- **C** cambia el botón de pago por una llamada a la API. Es más barata que B, pero añade código. No está hecha. Pídemela si la quieres.

**VeriFactu:** Stripe no genera registros VeriFactu (ni hash encadenado, ni QR, ni envío a la AEAT). Confírmalo con tu gestor y revisa las fechas de obligatoriedad en la AEAT. Si tu herramienta de facturación ya cumple VeriFactu, la opción A mantiene todo en una sola serie.

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
3. Los temas de ntfy.sh son públicos para quien conozca el nombre. Por eso el nombre es largo y aleatorio, y el aviso solo lleva el tipo, el servicio y la empresa.

## 6. Activar los formularios en producción

Los formularios están apagados (`formularios.activos: false`) hasta que la política de privacidad esté publicada. Mientras tanto, los botones llevan al formulario de contacto.

Para activarlos:

1. Publica `privacidad.html` a partir de `docs/politica-privacidad.md`, una vez revisada.
2. Comprueba que `formularios.privacidad_url` apunta a ella.
3. Pon la site key de Turnstile (sección 4).
4. Comprueba que la API responde en `api.hugocalvo.dev`.
5. Pon `formularios.activos: true`.

## 7. Prueba completa antes de anunciarlo

1. **Stripe en modo de prueba:** paga el Payment Link con la tarjeta `4242 4242 4242 4242`. Tienen que llegar:
   - el aviso de ntfy, con «Pago: Auditoría de visibilidad en IA» y la empresa;
   - el correo con el resumen;
   - el correo al cliente;
   - la redirección a `gracias.html?servicio=auditoria`.
2. **Formularios:** envía una solicitud y un briefing desde la web publicada. Comprueba que llegan el aviso, los dos correos y la redirección a gracias.
3. **Reintento de Stripe:** en Stripe, reenvía el evento. No debe llegar un segundo aviso si Upstash está conectado.
