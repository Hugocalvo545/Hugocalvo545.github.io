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
  const precio = (p) => `${p.desde ? "desde " : ""}${eur(p.precio)}${p.unidad.startsWith("/") ? p.unidad : ""}`;

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
    return `${desde}${eur(p.precio)}${p.unidad.startsWith("/") ? p.unidad : ""}`;
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
      h("div", { class: "price" }, h("span", {}, s.nota_tarjeta || ""), h("b", {}, precioTarjeta(s))),
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

  const paqueteCard = (s, p, multiple, i) => {
    const cabecera = h(
      "span",
      { class: "pkg__head" },
      h("span", { class: "pkg__name" }, multiple && h("span", { class: "pkg__check", "aria-hidden": "true" }), p.nombre),
      h(
        "span",
        { class: "pkg__price" },
        h("b", {}, precio(p)),
        p.unidad && !p.unidad.startsWith("/") ? ` · ${p.unidad}` : ""
      )
    );
    const detalle = p.detalle?.length ? h("ul", {}, p.detalle.map((d) => h("li", {}, d))) : null;
    if (!multiple) return h("div", { class: "pkg" }, cabecera, detalle);
    return h(
      "label",
      { class: "pkg" },
      h("input", { type: "radio", name: "sd-paquete", value: p.id, checked: i === 0 }),
      cabecera,
      detalle
    );
  };

  const paqueteElegido = (s) => {
    const marcado = sdBody.querySelector('input[name="sd-paquete"]:checked');
    return s.paquetes.find((p) => p.id === marcado?.value) || s.paquetes[0];
  };

  // Hasta que los formularios estén activos, las solicitudes van al formulario de contacto
  const irAContacto = (s, p) => {
    cerrar();
    const form = document.querySelector("#contacto form");
    const mensaje = form?.querySelector("textarea");
    if (mensaje && !mensaje.value.trim()) {
      const plan = s.paquetes.length > 1 ? ` (${p.nombre})` : "";
      mensaje.value = `Me interesa: ${s.nombre}${plan}.\n`;
    }
    document.getElementById("contacto")?.scrollIntoView({ behavior: "smooth" });
    form?.querySelector("input:not([type=hidden]):not(.honey)")?.focus({ preventScroll: true });
  };

  const accion = (s) => {
    const nivel = datos.niveles[s.nivel];
    const caja = h("div", { class: "sd__accion" });

    if (s.nivel === "pago-directo") {
      const p = s.paquetes[0];
      const total = conIva(p.precio, datos.iva);
      const link = s.pago?.payment_link;
      caja.append(
        h("p", { class: "sd__iva" }, `${eur(p.precio)} + ${datos.iva} % de IVA = `, h("b", {}, `${eur(total)} con IVA`)),
        h("p", {}, nivel.descripcion)
      );
      const botones = h("div", { class: "sd__botones" });
      if (link) {
        botones.append(h("a", { class: "btn primary", href: link, rel: "noopener" }, `${s.pago.boton} · ${eur(total)}`));
        caja.append(h("p", { class: "sd__aviso" }, "Pago seguro en Stripe. Después del pago te escribo en menos de 24 h laborables."));
      } else {
        botones.append(h("button", { type: "button", class: "btn primary", onclick: () => irAContacto(s, p) }, "Pedir la auditoría"));
        caja.append(h("p", { class: "sd__aviso" }, "El pago con tarjeta estará disponible muy pronto. Mientras, escríbeme y te envío el enlace de pago."));
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
        h("button", { type: "button", class: "btn primary", onclick: () => irAContacto(s, paqueteElegido(s)) }, texto)
      )
    );
    return caja;
  };

  const detalle = (s) => {
    const multiple = s.paquetes.length > 1;
    const paquetes = s.paquetes.map((p, i) => paqueteCard(s, p, multiple, i));
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

  const abrir = (s, desde) => {
    opener = desde || document.activeElement;
    sdTitle.textContent = s.nombre;
    sdNivel.textContent = datos.niveles[s.nivel].etiqueta;
    sdNivel.dataset.nivel = s.nivel;
    sdBody.replaceChildren(...detalle(s));
    sdBody.scrollTop = 0;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  };

  const cerrar = () => {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  };

  // Escape lo gestiona el propio <dialog>; aquí devolvemos el foco a la tarjeta
  dialog.addEventListener("close", () => {
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    if (location.hash.startsWith("#detalle-")) history.replaceState(null, "", location.pathname + location.search);
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest("[data-sd-close]")) cerrar();
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
      h("div", { class: "cmp__head" }, h("span", { class: "cmp__concepto" }, c.concepto), h("span", { class: "cmp__mio" }, `Mi precio: ${rangoEur(c.mio, c.unidad)}`)),
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
