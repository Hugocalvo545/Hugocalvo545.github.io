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
