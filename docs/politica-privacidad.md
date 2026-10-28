# Política de privacidad (BORRADOR)

> **Borrador para revisar. No está publicado.** Los formularios de servicios no se pueden activar en producción hasta publicar esta política y enlazarla (ver `docs/servicios-configuracion.md`, sección 6).
> Los datos entre corchetes los completas tú. Las notas para Hugo van en bloques como este y se quitan al publicar.
> Conviene que la revise un asesor. Revisa especialmente las transferencias internacionales y los plazos de conservación.

Última actualización: [fecha de publicación]

## 1. Responsable

- Responsable: Hugo Calvo García.
- NIF: [NIF].
- Domicilio: [dirección postal], Madrid (España).
- Email: hugocgarciat@gmail.com.
- Teléfono: +34 638 091 795.

## 2. Qué datos trato y para qué

| Cuándo | Datos | Finalidad | Base jurídica |
|---|---|---|---|
| Formulario de contacto | Nombre, email y mensaje | Responderte y, si lo pides, enviarte un presupuesto | Medidas precontractuales a petición tuya (art. 6.1.b RGPD) |
| Formulario «Solicitar alta» | Servicio y plan, tu web, qué necesitas, nombre, empresa (opcional), email y teléfono (opcional) | Revisar si tu caso encaja, responderte y, si encaja, enviarte el enlace de pago | Medidas precontractuales (art. 6.1.b RGPD) |
| Briefing | Tipo de proyecto, objetivo, funcionalidades, plazo, presupuesto orientativo, web (opcional) y datos de contacto | Preparar y enviarte un presupuesto | Medidas precontractuales (art. 6.1.b RGPD) |
| Pago de la auditoría (Stripe) | Nombre, empresa, email, NIF (opcional), web a auditar e importe. **No recibo los datos de tu tarjeta**: los trata Stripe | Prestar el servicio contratado y emitir la factura | Ejecución del contrato (art. 6.1.b) y obligaciones fiscales (art. 6.1.c RGPD) |
| Clientes | Los anteriores, más los que hagan falta para el servicio | Prestar el servicio, facturar y atender incidencias | Ejecución del contrato (art. 6.1.b) y obligación legal (art. 6.1.c RGPD) |
| Protección contra spam y abusos | Dirección IP y la señal de verificación de Cloudflare Turnstile | Evitar envíos automáticos y limitar el número de envíos por hora | Interés legítimo en proteger la web y el servicio (art. 6.1.f RGPD) |

**Datos obligatorios.** Los campos marcados como obligatorios hacen falta para atender tu solicitud. Si no los facilitas, no puedo responderte por esa vía. Siempre puedes escribirme por email o por WhatsApp.

**Sin decisiones automatizadas.** Reviso cada solicitud personalmente.

**Sin publicidad.** No uso tus datos para enviarte publicidad ni los cedo a terceros con ese fin.

## 3. Cuánto tiempo los conservo

- **Solicitudes que no acaban en contrato:** 12 meses desde el último contacto, por si retomamos la conversación. Después los borro.
- **Clientes:**
  - Mientras dure la relación.
  - Después, durante los plazos legales: 6 años para la documentación contable y las facturas (art. 30 del Código de Comercio) y 4 años a efectos fiscales.
  - Para posibles responsabilidades, hasta 5 años.
- **Registros de protección contra abusos** (IP en el límite de envíos): 1 hora.
- **Avisos internos en el móvil:** hasta 12 horas en el servidor de avisos.
- Pasados los plazos, los datos se bloquean y se suprimen según el art. 32 de la LOPDGDD.

> **Nota para Hugo:** confirma con tu asesor los plazos de clientes.

## 4. Con quién se comparten

No vendo tus datos. Para prestar el servicio uso estos proveedores, que tratan los datos solo para eso:

| Proveedor | Para qué | Ubicación y garantías |
|---|---|---|
| Vercel Inc. | Servidor que recibe los formularios y los avisos de pago | EE. UU. Adherido al Marco de Privacidad de Datos UE-EE. UU. (DPF) |
| Resend | Envío de los correos de aviso y de confirmación | EE. UU. Adherido al DPF |
| Cloudflare, Inc. (Turnstile) | Verificación contra robots en los formularios | EE. UU. DPF y cláusulas contractuales tipo |
| Upstash, Inc. | Límite de envíos por hora (guarda la IP 1 hora) y control de avisos duplicados | [región elegida]. Cláusulas contractuales tipo del DPA |
| ntfy.sh | Aviso a mi móvil de que ha llegado una solicitud o un pago. **Solo recibe el tipo de aviso, el servicio y el nombre de la empresa** | [ubicación no publicada por el proveedor] |
| Stripe Payments Europe, Ltd. | Pasarela de pago de la auditoría | Irlanda (UE). Para el pago y la prevención del fraude, Stripe actúa como responsable independiente según su propia política de privacidad |
| Google (Gmail) | Mi buzón de correo, donde recibo los avisos y respondo | [según tu cuenta de Google] |
| FormSubmit | Envío del formulario de contacto general a mi correo | [verificar ubicación y garantías] |
| GitHub, Inc. (GitHub Pages) | Alojamiento de la web | EE. UU. Adherido al DPF |

También puedo comunicar datos a la Agencia Tributaria y a otras administraciones cuando lo exige la ley.

> **Notas para Hugo:**
> - Comprueba en https://www.dataprivacyframework.gov/list que Vercel, Resend, Cloudflare y GitHub siguen activos.
> - No he encontrado certificación DPF de Upstash. Si creas la base de datos en una región de la UE, indícalo.
> - ntfy.sh no publica entidad jurídica, DPA ni ubicación de servidores (https://docs.ntfy.sh/privacy/). Por eso el aviso solo lleva el nombre de la empresa. Si quieres eliminar ese riesgo, quita la empresa del aviso o aloja ntfy en un servidor propio.
> - Si dejas de usar FormSubmit para el formulario de contacto, quítalo de la tabla.

## 5. Tus derechos

Puedes ejercer en cualquier momento estos derechos escribiendo a hugocgarciat@gmail.com:

- **Acceso:** saber qué datos tuyos trato.
- **Rectificación:** corregirlos.
- **Supresión:** pedir que los borre.
- **Oposición:** oponerte al tratamiento.
- **Limitación:** pedir que limite su uso.
- **Portabilidad:** recibirlos en un formato que puedas llevarte.

Te respondo en un mes como máximo.

Si crees que no he tratado bien tus datos, puedes reclamar ante la Agencia Española de Protección de Datos (https://www.aepd.es).

## 6. Seguridad

- Los formularios viajan cifrados (HTTPS).
- Las claves de los servicios están guardadas fuera del código.
- Solo yo accedo a tus datos.

## 7. Cookies

La web no usa cookies de publicidad ni de analítica. Cloudflare Turnstile puede usar datos técnicos del navegador solo para comprobar que no eres un robot.

> **Nota para Hugo:** si añades analítica, crea una política de cookies y un banner.

---

## Texto corto para debajo de los formularios (primera capa, art. 11 LOPDGDD)

Ya está en `js/servicios.js`:

> Responsable: Hugo Calvo García. Uso tus datos solo para responder a tu solicitud y, si encaja, preparar la propuesta. Puedes acceder a ellos, corregirlos o pedir que los borre cuando quieras. Más información en la política de privacidad.
