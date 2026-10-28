// Zona de servicios: pinta el catálogo desde assets/data/servicios.json y abre el detalle en un <dialog>.
(() => {
  const lista = document.getElementById("servicios-lista");
  const dialog = document.getElementById("servicio-dialog");
  if (!lista || !dialog) return;

  const DATA_URL = "assets/data/servicios.json";
  const sdTitle = document.getElementById("sd-title");
  const sdNivel = document.getElementById("sd-nivel");
  const sdBody = document.getElementById("sd-body");

  const ICONOS = {
    lupa: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
    chispa: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 17l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
    pantalla: '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>',
    app: '<path d="M4 7h16v10H4zM8 7V5h8v2M12 17v3"/>',
    engranaje: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3"/>',
    escudo: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>',
  };

  // Formato español fijo: 1.490 €, 422,29 € (Intl en es-ES no agrupa los miles de 4 cifras)
  const eur = (n) => {
    const [ent, dec] = Number(n).toFixed(2).split(".");
    const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return (dec === "00" ? miles : `${miles},${dec}`) + " €";
  };
  const conIva = (base, iva) => Math.round(base * (100 + iva)) / 100;
  const unidad = (p) => (p.unidad.startsWith("/") ? p.unidad : "");
  const precio = (p) => `${p.desde ? "desde " : ""}${eur(p.precio)}${unidad(p)}`;
  // Todos los precios se muestran también con IVA: puede contratar un particular
  const precioIva = (p) => `${p.desde ? "desde " : ""}${eur(conIva(p.precio, datos.iva))}${unidad(p)}`;

  // Crea elementos sin innerHTML para el texto
  const h = (tag, attrs = {}, ...hijos) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    hijos.flat().forEach((c) => c != null && c !== false && el.append(c));
    return el;
  };
  const icono = (nombre) =>
    h("div", { class: "icon", html: `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONOS[nombre] || ICONOS.chispa}</svg>` });

  let datos = null;
  let opener = null;

  const precioTarjeta = (s) => {
    const p = s.paquetes.reduce((a, b) => (b.precio < a.precio ? b : a));
    const desde = s.paquetes.length > 1 || p.desde ? "desde " : "";
    return [
      `${desde}${eur(p.precio)}${unidad(p)} sin IVA`,
      h("small", { class: "price__iva" }, `${eur(conIva(p.precio, datos.iva))}${unidad(p)} con IVA`),
    ];
  };

  const tarjeta = (s) => {
    const nivel = datos.niveles[s.nivel];
    return h(
      "article",
      { class: `card svc${s.destacado ? " star" : ""}`, id: `servicio-${s.id}` },
      h(
        "div",
        { class: "svc__top" },
        icono(s.icono),
        h(
          "div",
          { class: "svc__flags" },
          s.destacado && h("span", { class: "svc__tag" }, s.destacado),
          h("span", { class: "nivel", "data-nivel": s.nivel }, nivel.etiqueta)
        )
      ),
      h("div", { class: "svc__body" }, h("h3", {}, s.nombre), h("p", {}, s.resumen)),
      h("div", { class: "price" }, h("span", {}, s.nota_tarjeta || ""), h("b", {}, ...precioTarjeta(s))),
      h(
        "button",
        {
          type: "button",
          class: "svc__more",
          "aria-haspopup": "dialog",
          "aria-label": `Ver detalles y precios de ${s.nombre}`,
          onclick: (e) => abrir(s, e.currentTarget),
        },
        "Ver detalles y precios ",
        h("span", { "aria-hidden": "true" }, "→")
      )
    );
  };

  const listaItems = (items, tipo) => h("ul", { class: `sd__lista sd__lista--${tipo}` }, items.map((t) => h("li", {}, t)));
  const bloque = (titulo, ...contenido) => h("section", {}, h("h3", {}, titulo), ...contenido);

  const paqueteCard = (s, p, multiple, marcado) => {
    const cabecera = h(
      "span",
      { class: "pkg__head" },
      h("span", { class: "pkg__name" }, multiple && h("span", { class: "pkg__check", "aria-hidden": "true" }), p.nombre),
      h(
        "span",
        { class: "pkg__price" },
        h("b", {}, precio(p)),
        " sin IVA",
        p.unidad && !p.unidad.startsWith("/") ? ` · ${p.unidad}` : "",
        h("span", { class: "pkg__iva" }, `${precioIva(p)} con IVA`)
      )
    );
    const detalle = p.detalle?.length ? h("ul", {}, p.detalle.map((d) => h("li", {}, d))) : null;
    if (!multiple) return h("div", { class: "pkg" }, cabecera, detalle);
    return h(
      "label",
      { class: "pkg" },
      h("input", { type: "radio", name: "sd-paquete", value: p.id, checked: p.id === marcado }),
      cabecera,
      detalle
    );
  };

  const paqueteElegido = (s) => {
    const marcado = sdBody.querySelector('input[name="sd-paquete"]:checked');
    return s.paquetes.find((p) => p.id === marcado?.value) || s.paquetes[0];
  };

  // Hasta que los formularios estén activos, las solicitudes van al contacto directo:
  // el email y el WhatsApp salen ya con el servicio y el plan escritos
  const irAContacto = (s, p) => {
    opener = null;
    cerrar();
    const plan = s.paquetes.length > 1 ? ` (${p.nombre})` : "";
    const asunto = `Me interesa: ${s.nombre}${plan}`;
    const texto = `Hola, Hugo. ${asunto}.\n\n`;
    const email = document.querySelector('#contacto [data-contacto="email"]');
    const whatsapp = document.querySelector('#contacto [data-contacto="whatsapp"]');
    if (email) email.href = `mailto:hugocgarciat@gmail.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(texto)}`;
    if (whatsapp) whatsapp.href = `https://wa.me/34638091795?text=${encodeURIComponent(texto)}`;
    const preparado = document.getElementById("contacto-preparado");
    if (preparado) preparado.textContent = `Mensaje preparado: ${asunto}.`;
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
    email?.focus({ preventScroll: true });
  };

  // ---------- Formularios: "Solicitar alta" (corto) y "Briefing" (por pasos) ----------
  // Solo se muestran con formularios.activos en servicios.json (requiere la política de privacidad publicada).
  // En localhost se pueden probar siempre, con la clave de prueba de Turnstile.
  const LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);
  const TURNSTILE_PRUEBA = "1x00000000000000000000AA"; // clave pública de prueba de Cloudflare: siempre pasa
  const formsActivos = () => Boolean(datos.formularios?.activos || LOCAL);
  const sitekey = () => datos.formularios?.turnstile_sitekey || (LOCAL ? TURNSTILE_PRUEBA : "");

  let turnstileCarga = null;
  const cargarTurnstile = () => {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    turnstileCarga ||= new Promise((ok, ko) => {
      const sc = document.createElement("script");
      sc.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      sc.async = true;
      sc.onload = () => ok(window.turnstile);
      sc.onerror = () => {
        turnstileCarga = null;
        ko(new Error("turnstile"));
      };
      document.head.append(sc);
    });
    return turnstileCarga;
  };

  const opcional = (texto, req) => h("span", {}, texto, !req && h("span", { class: "opc" }, " (opcional)"));
  const campoTexto = ({ etiqueta, name, type = "text", required = false, max = 200, ...resto }) =>
    h("label", {}, opcional(etiqueta, required), h("input", { type, name, required, maxlength: max, ...resto }));
  const campoArea = ({ etiqueta, name, required = false, max = 2000, ...resto }) =>
    h("label", {}, opcional(etiqueta, required), h("textarea", { name, required, maxlength: max, ...resto }));
  const grupo = ({ legend, name, tipo = "radio", opciones, required = false, valor }) =>
    h(
      "fieldset",
      { class: "opciones" },
      h("legend", {}, opcional(legend, required)),
      h(
        "div",
        { class: "opciones__lista" },
        opciones.map(([v, t]) =>
          h("label", { class: "opcion" }, h("input", { type: tipo, name, value: v, required: tipo === "radio" && required, checked: v === valor }), h("span", {}, t))
        )
      )
    );

  // La web se acepta con o sin https://
  const campoWeb = (etiqueta, required) => {
    const lbl = campoTexto({ etiqueta, name: "web", required, max: 200, inputmode: "url", autocomplete: "url", placeholder: "tunegocio.es" });
    const input = lbl.querySelector("input");
    input.addEventListener("input", () => {
      const v = input.value.trim();
      const ok = !v || /^(https?:\/\/)?([\p{L}\p{N}-]+\.)+[\p{L}]{2,}(\/\S*)?$/iu.test(v);
      input.setCustomValidity(ok ? "" : "Escribe una dirección web válida, por ejemplo tunegocio.es");
    });
    return lbl;
  };

  const camposContacto = () => [
    campoTexto({ etiqueta: "Nombre", name: "nombre", required: true, max: 100, autocomplete: "name", placeholder: "María López" }),
    campoTexto({ etiqueta: "Empresa o negocio", name: "empresa", max: 120, autocomplete: "organization", placeholder: "Clínica López" }),
    campoTexto({ etiqueta: "Email", name: "email", type: "email", required: true, max: 160, autocomplete: "email", placeholder: "maria@tunegocio.es" }),
    campoTexto({ etiqueta: "Teléfono", name: "telefono", type: "tel", max: 30, autocomplete: "tel", placeholder: "600 000 000" }),
  ];

  const bloqueLegal = () => {
    const url = datos.formularios?.privacidad_url || "privacidad.html";
    return [
      h(
        "p",
        { class: "form-legal" },
        "Responsable: Hugo Calvo García. Uso tus datos solo para responder a tu solicitud y, si encaja, preparar la propuesta. Puedes acceder a ellos, corregirlos o pedir que los borre cuando quieras. ",
        h("a", { href: url, target: "_blank", rel: "noopener" }, "Más información en la política de privacidad"),
        "."
      ),
      h(
        "label",
        { class: "opcion opcion--check" },
        h("input", { type: "checkbox", name: "privacidad", value: "si", required: true }),
        h("span", {}, "He leído la ", h("a", { href: url, target: "_blank", rel: "noopener" }, "política de privacidad"), " y acepto el uso de mis datos para responder a mi solicitud.")
      ),
      // Campo trampa: invisible para personas; los bots lo rellenan
      h(
        "div",
        { class: "trampa", "aria-hidden": "true" },
        h("label", {}, "No rellenes este campo", h("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off" }))
      ),
      h("div", { class: "turnstile" }),
    ];
  };

  const estadoForm = () => h("p", { class: "form-estado", role: "status", "aria-live": "polite" });

  const cabeceraForm = (s, titulo, intro) => [
    h(
      "button",
      { type: "button", class: "sd__volver", onclick: () => mostrarDetalle(s, sdBody.querySelector('[name="paquete"]')?.value, true) },
      h("span", { "aria-hidden": "true" }, "← "),
      "Volver al detalle"
    ),
    h("h3", { class: "form-titulo", tabindex: "-1" }, titulo),
    h("p", { class: "sd__resumen" }, intro),
  ];

  let widgetTurnstile = null;
  const quitarTurnstile = () => {
    if (widgetTurnstile != null) window.turnstile?.remove(widgetTurnstile);
    widgetTurnstile = null;
  };

  const montarTurnstile = async (form) => {
    const caja = form.querySelector(".turnstile");
    const clave = sitekey();
    if (!caja || !clave) return;
    try {
      const ts = await cargarTurnstile();
      if (!caja.isConnected) return; // el usuario ya ha salido del formulario
      quitarTurnstile();
      const avisar = (texto) => {
        const estado = form.querySelector(".form-estado");
        estado.className = "form-estado form-error";
        estado.textContent = texto;
      };
      widgetTurnstile = ts.render(caja, {
        sitekey: clave,
        theme: "dark",
        language: "es",
        action: form.dataset.tipo,
        "error-callback": () => avisar("La verificación anti-spam ha fallado. Recarga la página o escríbeme por WhatsApp."),
        "expired-callback": () => avisar("La verificación anti-spam ha caducado. Espera a que se renueve y vuelve a pulsar Enviar."),
      });
      form._turnstile = widgetTurnstile;
    } catch {
      caja.replaceChildren(h("p", { class: "form-error" }, "No se ha podido cargar la verificación anti-spam. Recarga la página o escríbeme por WhatsApp."));
    }
  };

  const recoger = (form) => {
    const fd = new FormData(form);
    const out = {};
    for (const [k, v] of fd.entries()) {
      if (k === "funcionalidades") (out[k] ||= []).push(v);
      else out[k] = typeof v === "string" ? v.trim() : v;
    }
    out.turnstile = fd.get("cf-turnstile-response") || "";
    delete out["cf-turnstile-response"];
    out.privacidad = fd.get("privacidad") === "si";
    out.ms = Math.round(performance.now() - Number(form.dataset.abierto || 0));
    return out;
  };

  const enviar = async (form) => {
    const estado = form.querySelector(".form-estado");
    const boton = form.querySelector('button[type="submit"]');
    if (!form.reportValidity()) return;
    const datosForm = recoger(form);
    if (sitekey() && !datosForm.turnstile) {
      estado.textContent = "Espera a que termine la verificación anti-spam y vuelve a pulsar Enviar.";
      return;
    }
    boton.disabled = true;
    estado.className = "form-estado";
    estado.textContent = "Enviando…";
    try {
      const r = await fetch(`${datos.formularios.endpoint}/${form.dataset.tipo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosForm),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || !json.ok) throw new Error(json.error || "No se ha podido enviar.");
      location.href = `gracias.html?servicio=${form.dataset.tipo}`;
    } catch (e) {
      boton.disabled = false;
      estado.className = "form-estado form-error";
      const motivo = e instanceof TypeError ? "No hay conexión con el servidor." : e.message;
      estado.textContent = `${motivo} Inténtalo de nuevo o escríbeme por WhatsApp al +34 638 091 795.`;
      if (form._turnstile != null) window.turnstile?.reset(form._turnstile);
    }
  };

  const nuevoForm = (tipo) => {
    const form = h("form", { class: "sd__form", "data-tipo": tipo });
    form.dataset.abierto = String(performance.now());
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      enviar(form);
    });
    return form;
  };

  const formSolicitud = (s, p) => {
    const form = nuevoForm("solicitud");
    form.append(
      h("input", { type: "hidden", name: "servicio", value: s.id }),
      h(
        "label",
        {},
        "Plan",
        h("select", { name: "paquete", required: true }, s.paquetes.map((x) => h("option", { value: x.id, selected: x.id === p.id }, `${x.nombre} · ${precio(x)} sin IVA (${precioIva(x)} con IVA)`)))
      ),
      campoWeb("Tu web", true),
      campoArea({
        etiqueta: "¿Qué necesitas?",
        name: "necesidad",
        required: true,
        max: 1500,
        placeholder:
          s.id === "mantenimiento"
            ? "Tengo una web en WordPress y quiero olvidarme de las actualizaciones y las copias."
            : "Quiero que mi clínica tenga más presencia cuando la gente pregunta a la IA por fisios en Madrid.",
      }),
      ...camposContacto(),
      ...bloqueLegal(),
      h("button", { type: "submit", class: "btn primary" }, "Enviar solicitud"),
      estadoForm()
    );
    return [
      ...cabeceraForm(s, `Solicitar alta: ${s.nombre}`, "Lo reviso y te respondo en menos de 24 h laborables. Si encaja, te envío el enlace de pago; si no, te lo digo y no pagas nada."),
      form,
    ];
  };

  const TIPOS_PROYECTO = [
    ["landing", "Landing (1 página)"],
    ["corporativa", "Web corporativa (hasta 5 páginas)"],
    ["completa", "Web completa (hasta 10 páginas)"],
    ["app", "App o plataforma a medida"],
    ["automatizacion", "Automatización con IA"],
    ["otro", "Otra cosa o no lo tengo claro"],
  ];
  const tipoInicial = (s, p) => (s.id === "webs" ? p.id : s.id === "apps" ? "app" : s.id === "automatizaciones" ? "automatizacion" : "otro");

  const formBriefing = (s, p) => {
    const form = nuevoForm("briefing");
    const pasos = [
      {
        titulo: "El proyecto",
        campos: [
          grupo({ legend: "Tipo de proyecto", name: "proyecto", opciones: TIPOS_PROYECTO, required: true, valor: tipoInicial(s, p) }),
          campoArea({ etiqueta: "¿Qué quieres conseguir?", name: "objetivo", required: true, max: 1500, placeholder: "Que los pacientes reserven cita online sin llamar por teléfono." }),
        ],
      },
      {
        titulo: "Funcionalidades",
        campos: [
          grupo({
            legend: "¿Qué debería tener?",
            name: "funcionalidades",
            tipo: "checkbox",
            opciones: [
              ["formulario", "Formulario de contacto"],
              ["blog", "Blog"],
              ["idiomas", "Varios idiomas"],
              ["reservas", "Reservas o citas"],
              ["pagos", "Pagos online"],
              ["area-clientes", "Área de clientes"],
              ["panel", "Panel de gestión"],
              ["integraciones", "Conexión con otras herramientas"],
              ["ia", "Funciones con IA"],
            ],
          }),
          campoArea({ etiqueta: "Cuéntame más", name: "funcionalidades_detalle", max: 1500, placeholder: "Usamos Google Calendar y querríamos que las citas aparezcan allí." }),
          campoWeb("Web actual, si tienes", false),
        ],
      },
      {
        titulo: "Plazo y presupuesto",
        campos: [
          grupo({
            legend: "¿Para cuándo lo necesitas?",
            name: "plazo",
            required: true,
            opciones: [
              ["urgente", "Lo antes posible"],
              ["1-mes", "En 1 mes"],
              ["2-3-meses", "En 2 o 3 meses"],
              ["sin-prisa", "Sin prisa"],
            ],
          }),
          grupo({
            legend: "Presupuesto orientativo (sin IVA)",
            name: "presupuesto",
            required: true,
            opciones: [
              ["menos-1000", "Menos de 1.000 €"],
              ["1000-2500", "De 1.000 a 2.500 €"],
              ["2500-5000", "De 2.500 a 5.000 €"],
              ["5000-10000", "De 5.000 a 10.000 €"],
              ["mas-10000", "Más de 10.000 €"],
              ["no-se", "No lo sé todavía"],
            ],
          }),
        ],
      },
      { titulo: "Contacto", campos: [...camposContacto(), ...bloqueLegal()] },
    ];
    const total = pasos.length;
    const progreso = h("p", { class: "pasos__progreso", "aria-live": "polite" });
    const barra = h("div", { class: "pasos__barra", "aria-hidden": "true" }, h("span"));
    const nodos = pasos.map((paso, i) =>
      h(
        "div",
        { class: "paso", hidden: i !== 0, "data-paso": i },
        h("h4", { class: "paso__titulo", tabindex: "-1" }, paso.titulo),
        ...paso.campos,
        h(
          "div",
          { class: "paso__nav" },
          i > 0 && h("button", { type: "button", class: "btn ghost", "data-paso-anterior": "" }, "Atrás"),
          i === total - 1
            ? h("button", { type: "submit", class: "btn primary" }, "Enviar briefing")
            : h("button", { type: "button", class: "btn primary", "data-paso-siguiente": "" }, "Siguiente")
        )
      )
    );
    let actual = 0;
    const pintarProgreso = () => {
      progreso.textContent = `Paso ${actual + 1} de ${total}: ${pasos[actual].titulo}`;
      barra.firstChild.style.width = `${((actual + 1) / total) * 100}%`;
    };
    const ir = (n) => {
      nodos[actual].hidden = true;
      actual = n;
      nodos[actual].hidden = false;
      pintarProgreso();
      nodos[actual].querySelector(".paso__titulo").focus();
    };
    const pasoValido = (nodo) => {
      const invalido = [...nodo.querySelectorAll("input, select, textarea")].find((c) => !c.checkValidity());
      if (invalido) invalido.reportValidity();
      return !invalido;
    };
    form.addEventListener("click", (e) => {
      if (e.target.closest("[data-paso-siguiente]") && pasoValido(nodos[actual])) ir(actual + 1);
      if (e.target.closest("[data-paso-anterior]")) ir(actual - 1);
    });
    // Enter en un campo de una línea avanza de paso en lugar de enviar
    form.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && actual < total - 1) {
        e.preventDefault();
        if (pasoValido(nodos[actual])) ir(actual + 1);
      }
    });
    pintarProgreso();
    form.append(
      h("input", { type: "hidden", name: "servicio", value: s.id }),
      h("input", { type: "hidden", name: "paquete", value: p.id }),
      progreso,
      barra,
      ...nodos,
      estadoForm()
    );
    return [...cabeceraForm(s, "Briefing del proyecto", "Cuatro pasos cortos. Con esto te envío un presupuesto cerrado por escrito en 48 h laborables."), form];
  };

  const mostrarFormulario = (s, p) => {
    quitarTurnstile();
    sdBody.replaceChildren(...(s.nivel === "solicitar" ? formSolicitud(s, p) : formBriefing(s, p)));
    sdBody.scrollTop = 0;
    montarTurnstile(sdBody.querySelector("form"));
    sdBody.querySelector(".form-titulo").focus();
  };

  const contratar = (s, p) => (formsActivos() ? mostrarFormulario(s, p) : irAContacto(s, p));

  const accion = (s) => {
    const nivel = datos.niveles[s.nivel];
    const caja = h("div", { class: "sd__accion" });

    if (s.nivel === "pago-directo") {
      const p = s.paquetes[0];
      const total = conIva(p.precio, datos.iva);
      const link = s.pago?.payment_link;
      caja.append(
        h("p", { class: "sd__iva" }, `${eur(p.precio)} + ${datos.iva} % de IVA = `, h("b", {}, `${eur(total)} con IVA`)),
        link && h("p", {}, nivel.descripcion)
      );
      const botones = h("div", { class: "sd__botones" });
      if (link) {
        botones.append(h("a", { class: "btn primary", href: link, rel: "noopener" }, `${s.pago.boton} · ${eur(total)}`));
        caja.append(h("p", { class: "sd__aviso" }, "Pago seguro en Stripe. Después del pago te escribo en menos de 24 h laborables y te envío la factura."));
      } else {
        botones.append(h("button", { type: "button", class: "btn primary", onclick: () => irAContacto(s, p) }, "Pedir la auditoría"));
        caja.append(h("p", {}, "Escríbeme y te envío el enlace de pago con tarjeta. La factura con el IVA desglosado te la envío yo por correo."));
      }
      caja.append(botones);
      return caja;
    }

    const texto = s.nivel === "solicitar" ? "Solicitar alta" : "Empezar el briefing";
    caja.append(
      h("p", {}, nivel.descripcion),
      h(
        "div",
        { class: "sd__botones" },
        h("button", { type: "button", class: "btn primary", onclick: () => contratar(s, paqueteElegido(s)) }, texto)
      )
    );
    return caja;
  };

  const detalle = (s, marcado = s.paquetes[0].id) => {
    const multiple = s.paquetes.length > 1;
    const paquetes = s.paquetes.map((p) => paqueteCard(s, p, multiple, marcado));
    const pkgs = h("div", { class: `pkgs n${s.paquetes.length}` }, paquetes);
    const datosClave = h(
      "dl",
      { class: "sd__datos" },
      h("div", { class: "sd__dato" }, h("dt", {}, "Plazo"), h("dd", {}, s.plazo)),
      h("div", { class: "sd__dato" }, h("dt", {}, "Forma de pago"), h("dd", {}, s.forma_pago))
    );
    return [
      h("p", { class: "sd__resumen" }, s.resumen),
      multiple
        ? h("fieldset", { class: "sd__paquetes" }, h("legend", {}, h("h3", {}, "Elige un plan")), pkgs)
        : bloque("Precio", pkgs),
      bloque("Qué incluye", listaItems(s.incluye, "si")),
      s.no_incluye?.length && bloque("Qué no incluye", listaItems(s.no_incluye, "no")),
      s.limites?.length && bloque("Límites", listaItems(s.limites, "info")),
      datosClave,
      ...(s.notas || []).map((n) => h("p", { class: "sd__nota" }, n)),
      accion(s),
    ].filter(Boolean);
  };

  const mostrarDetalle = (s, marcado, enfocarAccion = false) => {
    quitarTurnstile();
    sdBody.replaceChildren(...detalle(s, marcado));
    if (enfocarAccion) {
      const boton = sdBody.querySelector(".sd__accion .btn");
      boton?.scrollIntoView({ block: "center" });
      boton?.focus({ preventScroll: true });
    } else {
      sdBody.scrollTop = 0;
    }
  };

  const abrir = (s, desde) => {
    opener = desde || document.activeElement;
    sdTitle.textContent = s.nombre;
    sdNivel.textContent = datos.niveles[s.nivel].etiqueta;
    sdNivel.dataset.nivel = s.nivel;
    mostrarDetalle(s);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const cerrar = () => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  };

  // Escape lo gestiona el propio <dialog>; aquí devolvemos el foco a la tarjeta
  const hayDatos = () =>
    [...sdBody.querySelectorAll(".sd__form input:not([type=hidden]):not([type=radio]):not([type=checkbox]), .sd__form textarea")].some((c) => c.value.trim());

  dialog.addEventListener("cancel", (e) => {
    if (hayDatos() && !window.confirm("¿Cerrar el formulario? Se perderá lo que has escrito.")) e.preventDefault();
  });

  dialog.addEventListener("close", () => {
    quitarTurnstile();
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    if (location.hash.startsWith("#detalle-")) history.replaceState(null, "", location.pathname + location.search);
  });
  // El fondo solo cierra si el clic empieza y acaba en él (no al soltar fuera tras seleccionar texto)
  let pulsadoEnFondo = false;
  dialog.addEventListener("pointerdown", (e) => {
    pulsadoEnFondo = e.target === dialog;
  });
  dialog.addEventListener("click", (e) => {
    const fondo = e.target === dialog && pulsadoEnFondo;
    if (!fondo && !e.target.closest("[data-sd-close]")) return;
    if (hayDatos() && !window.confirm("¿Cerrar el formulario? Se perderá lo que has escrito.")) return;
    cerrar();
  });

  // Enlace directo a un panel: hugocalvo.dev/#detalle-auditoria-ia
  const abrirDesdeHash = () => {
    const id = location.hash.startsWith("#detalle-") ? location.hash.slice(9) : null;
    const s = id && datos?.servicios.find((x) => x.id === id);
    if (!s) return;
    const btn = document.querySelector(`#servicio-${s.id} .svc__more`);
    btn?.scrollIntoView({ block: "center" });
    abrir(s, btn);
  };

  // Bloque "¿Por qué estos precios?": mi precio frente al rango orientativo del mercado
  const rangoEur = ([a, b], unidad) => (a === b ? `${eur(a)}${unidad}` : `${eur(a).replace(" €", "")} a ${eur(b)}${unidad}`);
  const comparacion = (c) => {
    const escala = Math.max(c.mercado[1], c.mio[1]) * 1.08;
    const pct = (n) => `${((n / escala) * 100).toFixed(2)}%`;
    return h(
      "li",
      { class: "cmp" },
      h("div", { class: "cmp__head" }, h("span", { class: "cmp__concepto" }, c.concepto), h("span", { class: "cmp__mio" }, `Mi precio: ${rangoEur(c.mio, c.unidad)} sin IVA`)),
      h(
        "div",
        { class: "cmp__barra", "aria-hidden": "true" },
        h("span", { class: "cmp__rango", style: `left:${pct(c.mercado[0])};width:${pct(c.mercado[1] - c.mercado[0])}` }),
        h("span", { class: "cmp__yo", style: `left:${pct(c.mio[0])};width:${pct(c.mio[1] - c.mio[0])}` })
      ),
      h("p", { class: "cmp__mercado" }, `Mercado: ${c.rango}.`),
      h("p", { class: "cmp__fuente" }, "Fuente: ", h("a", { href: c.url, target: "_blank", rel: "noopener" }, c.fuente))
    );
  };
  const pintarPrecios = () => {
    const caja = document.getElementById("precios-mercado");
    if (!caja || !datos.mercado) return;
    const m = datos.mercado;
    document.getElementById("precios-title").textContent = m.titulo;
    document.getElementById("precios-texto").replaceChildren(...m.texto.map((t) => h("p", {}, t)));
    document.getElementById("precios-lista").replaceChildren(...datos.servicios.flatMap((s) => s.mercado || []).map(comparacion));
    document.getElementById("precios-nota").replaceChildren(m.nota, m.sin_rango ? ` ${m.sin_rango}` : "");
    caja.hidden = false;
  };

  fetch(DATA_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    })
    .then((json) => {
      datos = json;
      lista.replaceChildren(...datos.servicios.map(tarjeta));
      pintarPrecios();
      abrirDesdeHash();
      window.addEventListener("hashchange", abrirDesdeHash);
    })
    .catch(() => {
      lista.replaceChildren(
        h("p", { class: "servicios-cargando" }, "No se han podido cargar los servicios. ", h("a", { href: "#contacto" }, "Escríbeme"), " y te envío el detalle.")
      );
    });
})();
