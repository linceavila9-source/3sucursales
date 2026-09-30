/* =====================================================================
   ROSTY POLLO A LA LEÑA — app.js
   Módulos: 1) Datos  2) Estado  3) Utilidades  4) Sucursal  5) Menú
            6) Carrito  7) Mapa  8) Checkout + WhatsApp  9) Arranque
   ===================================================================== */

/* ============================ 1) DATOS ============================ */

// Provincias → sucursales. lat/lng son los que ubican el pin en el mapa.
// IMPORTANTE: las 3 sucursales de Veraguas son las reales del volante, pero
// las coordenadas son APROXIMADAS: confírmalas en Google Maps (clic derecho
// sobre el local → copiar coordenadas) y reemplázalas aquí.
// Las de Coclé son de EJEMPLO (demuestran el filtro por provincia).
// Los números de WhatsApp son SIMULADOS: formato internacional sin "+".
const PROVINCIAS = [
  { id: "veraguas", nombre: "Veraguas", sucursales: [
    { id: "don-bosco", nombre: "Don Bosco", direccion: "Calle 10, Ave. Don Bosco, Santiago",
      lat: 8.0952, lng: -80.9836, whatsapp: "50760000001", horario: "10:00 am – 9:00 pm" },
    { id: "terminal", nombre: "Terminal", direccion: "Frente a Materiales Héctor, Santiago",
      lat: 8.1040, lng: -80.9792, whatsapp: "50760000002", horario: "10:00 am – 9:00 pm" },
    { id: "canto-llano", nombre: "Canto del Llano", direccion: "Canto del Llano, Santiago",
      lat: 8.1148, lng: -80.9868, whatsapp: "50760000003", horario: "10:00 am – 9:00 pm",
      agotados: ["combo-familiar"] }   // ejemplo: producto no disponible en esta sucursal
  ]},
  { id: "cocle", nombre: "Coclé (ejemplo)", sucursales: [
    { id: "penonome", nombre: "Penonomé Centro", direccion: "Vía Interamericana, Penonomé",
      lat: 8.5186, lng: -80.3574, whatsapp: "50760000004", horario: "11:00 am – 8:00 pm" }
  ]}
];

// Menú base. Cada sucursal puede quitar productos con `agotados: [ids]`.
// Imágenes: Unsplash; si alguna no carga, la tarjeta muestra el logo.
const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=300&q=70`;
const CATEGORIAS = [
  { id: "pollos", nombre: "Pollos" },
  { id: "combos", nombre: "Combos" },
  { id: "acomp", nombre: "Acompañamientos" },
  { id: "bebidas", nombre: "Bebidas" }
];
const MENU = [
  { id: "pollo-entero", cat: "pollos", nombre: "Pollo entero a la leña", precio: 11.5,
    desc: "Marinado y asado lentamente sobre leña.", img: U("photo-1598103442097-8b74394b95c6"), tag: "El favorito" },
  { id: "medio-pollo", cat: "pollos", nombre: "Medio pollo", precio: 6.5,
    desc: "La mitad del pollo, jugoso y ahumado.", img: U("photo-1532550907401-a500c9a57435") },
  { id: "cuarto-pollo", cat: "pollos", nombre: "Cuarto de pollo", precio: 3.75,
    desc: "Pierna o pechuga, a tu elección.", img: U("photo-1527477396000-e27163b481c2") },
  { id: "combo-individual", cat: "combos", nombre: "Combo individual", precio: 5.5,
    desc: "Cuarto de pollo, papas o arroz, ensalada y soda.", img: U("photo-1626645738196-c2a7c87a8f58") },
  { id: "combo-pareja", cat: "combos", nombre: "Combo pareja", precio: 12.75,
    desc: "Medio pollo, 2 acompañamientos y 2 sodas.", img: U("photo-1598103442097-8b74394b95c6") },
  { id: "combo-familiar", cat: "combos", nombre: "Combo familiar", precio: 21.0,
    desc: "Pollo entero, 3 acompañamientos y soda de 2 L.", img: U("photo-1544025162-d76694265947"), tag: "Para 4" },
  { id: "papas", cat: "acomp", nombre: "Papas fritas", precio: 2.25,
    desc: "Doradas y crujientes.", img: U("photo-1573080496219-bb080dd4f877") },
  { id: "arroz", cat: "acomp", nombre: "Arroz con guandú", precio: 2.0,
    desc: "Como en casa, con coco.", img: U("photo-1512621776951-a57141f2eefd") },
  { id: "ensalada", cat: "acomp", nombre: "Ensalada de repollo", precio: 1.75,
    desc: "Fresca, con zanahoria y aderezo.", img: U("photo-1512621776951-a57141f2eefd") },
  { id: "yuca", cat: "acomp", nombre: "Yuca frita", precio: 2.25,
    desc: "Porción grande, con salsa de ajo.", img: U("photo-1630431341973-02e1b662ec35") },
  { id: "soda", cat: "bebidas", nombre: "Soda en lata", precio: 1.25,
    desc: "Coca-Cola, Sprite o Fanta, bien fría.", img: U("photo-1622483767028-3f66f32aef97") },
  { id: "soda-2l", cat: "bebidas", nombre: "Soda 2 litros", precio: 2.75,
    desc: "Ideal para compartir.", img: U("photo-1622483767028-3f66f32aef97") },
  { id: "chicha", cat: "bebidas", nombre: "Chicha de maracuyá", precio: 1.75,
    desc: "Natural, vaso grande.", img: U("photo-1544145945-f90425340c7e") }
];

const ITBMS = 0.07;      // impuesto (7 % en Panamá). Pon 0 si no aplica.
const DELIVERY_FEE = 1.5; // costo de delivery. Pon 0 si es gratis.

/* ============================ 2) ESTADO ============================ */
const LS = { branch: "rosty_sucursal", cart: "rosty_carrito" };
let sucursal = null;   // { ...sucursal, provincia }
let carrito = {};      // { idProducto: cantidad }
let catActiva = "todo";
let gpsLink = "";      // enlace de Google Maps con la ubicación del cliente

/* ========================== 3) UTILIDADES ========================== */
const $ = (id) => document.getElementById(id);
const money = (n) => `$${n.toFixed(2)}`;
const producto = (id) => MENU.find((p) => p.id === id);
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const leer = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => t.classList.remove("show"), 2800);
}

function encontrarSucursal(id) {
  for (const p of PROVINCIAS) {
    const s = p.sucursales.find((x) => x.id === id);
    if (s) return { ...s, provincia: p.nombre };
  }
  return null;
}

/* ===================== 4) SELECTOR DE SUCURSAL ===================== */
function initSelector() {
  const prov = $("provSelect"), suc = $("branchSelect");
  prov.innerHTML = `<option value="">Selecciona una provincia</option>` +
    PROVINCIAS.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("");

  // Al cambiar la provincia se filtran sus sucursales.
  prov.addEventListener("change", () => {
    const p = PROVINCIAS.find((x) => x.id === prov.value);
    suc.disabled = !p;
    suc.innerHTML = p
      ? `<option value="">Selecciona una sucursal</option>` +
        p.sucursales.map((s) => `<option value="${s.id}">${s.nombre}</option>`).join("")
      : "";
    actualizarInfo();
  });
  suc.addEventListener("change", actualizarInfo);

  function actualizarInfo() {
    const s = suc.value ? encontrarSucursal(suc.value) : null;
    $("locConfirm").disabled = !s;
    $("branchInfo").textContent = s ? `${s.direccion} · ${s.horario}` : "";
  }

  $("locConfirm").addEventListener("click", () => {
    seleccionarSucursal(suc.value);
    cerrarModal();
  });
  $("locCancel").addEventListener("click", cerrarModal);
  $("branchChip").addEventListener("click", abrirModal);
}

function abrirModal() {
  $("locModal").hidden = false;
  $("locCancel").hidden = !sucursal; // solo se puede cancelar si ya hay una elegida
  $("provSelect").focus();
}
function cerrarModal() { $("locModal").hidden = true; }

function seleccionarSucursal(id) {
  const s = encontrarSucursal(id);
  if (!s) return;
  const cambio = sucursal && sucursal.id !== s.id;
  sucursal = s;
  guardar(LS.branch, id);
  // Si cambia la sucursal se quitan productos que allí no existen.
  Object.keys(carrito).forEach((pid) => { if (!disponible(pid)) delete carrito[pid]; });
  if (cambio) toast(`Ahora pides en ${s.nombre}`);
  pintarSucursal();
  refrescar();
}

function pintarSucursal() {
  $("branchChipText").textContent = sucursal ? `${sucursal.nombre} · ${sucursal.provincia}` : "Elegir sucursal";
  $("heroBranch").textContent = sucursal
    ? `Pides en ${sucursal.nombre} (${sucursal.direccion}). Abierto ${sucursal.horario}.`
    : "Elige tu sucursal para ver el menú y pedir por WhatsApp.";
  pintarMapa();
}

const disponible = (pid) => !(sucursal && (sucursal.agotados || []).includes(pid));

/* =========================== 5) MENÚ =========================== */
function pintarCategorias() {
  const items = [{ id: "todo", nombre: "Todo" }, ...CATEGORIAS];
  $("catNav").innerHTML = items.map((c) =>
    `<button type="button" data-cat="${c.id}" class="${c.id === catActiva ? "on" : ""}">${c.nombre}</button>`).join("");
}

function pintarMenu() {
  if (!sucursal) { $("menuRoot").innerHTML = ""; return; }
  $("menuRoot").innerHTML = CATEGORIAS
    .filter((c) => catActiva === "todo" || c.id === catActiva)
    .map((c) => `
      <section class="menu-cat" id="cat-${c.id}">
        <h2>${c.nombre}</h2>
        <div class="grid">${MENU.filter((p) => p.cat === c.id).map(tarjeta).join("")}</div>
      </section>`).join("");
}

function tarjeta(p) {
  const qty = carrito[p.id] || 0, ok = disponible(p.id);
  const accion = !ok
    ? `<span class="hint">No disponible aquí</span>`
    : qty
      ? `<span class="qty"><button data-a="dec" data-id="${p.id}" aria-label="Quitar uno">−</button><span>${qty}</span><button data-a="inc" data-id="${p.id}" aria-label="Agregar uno">+</button></span>`
      : `<button class="add" data-a="inc" data-id="${p.id}">Agregar al carrito</button>`;
  return `
    <article class="card ${ok ? "" : "off"}">
      <div class="card__img"><img src="${p.img}" alt="${p.nombre}" loading="lazy"
        onerror="this.src='assets/logo.png';this.className='fallback'"></div>
      <div class="card__body">
        ${p.tag ? `<span class="tag">${p.tag}</span>` : ""}
        <h3 class="card__name" style="font-family:var(--body);font-weight:800">${p.nombre}</h3>
        <p class="card__desc">${p.desc}</p>
        <div class="card__foot"><span class="price">${money(p.precio)}</span>${accion}</div>
      </div>
    </article>`;
}

/* ========================== 6) CARRITO ========================== */
function cambiarCantidad(id, delta) {
  if (!sucursal) return abrirModal();
  if (!disponible(id)) return;
  carrito[id] = (carrito[id] || 0) + delta;
  if (carrito[id] <= 0) delete carrito[id];
  refrescar();
}

function calcularTotales() {
  const subtotal = Object.entries(carrito).reduce((s, [id, q]) => s + producto(id).precio * q, 0);
  const impuesto = subtotal * ITBMS;
  const esDelivery = document.querySelector('input[name="delivery"]:checked').value === "delivery";
  const envio = esDelivery && subtotal > 0 ? DELIVERY_FEE : 0;
  return { subtotal, impuesto, envio, total: subtotal + impuesto + envio, esDelivery };
}

function filasTotales(t) {
  return `<div><span>Subtotal</span><span>${money(t.subtotal)}</span></div>
    <div><span>ITBMS (${Math.round(ITBMS * 100)} %)</span><span>${money(t.impuesto)}</span></div>
    ${t.envio ? `<div><span>Delivery</span><span>${money(t.envio)}</span></div>` : ""}
    <div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
}

function pintarCarrito() {
  const ids = Object.keys(carrito);
  $("cartEmpty").hidden = ids.length > 0;
  $("cartItems").innerHTML = ids.map((id) => {
    const p = producto(id), q = carrito[id];
    return `<div class="line">
      <div><div class="line__name">${p.nombre}</div>
        <div class="line__sub">${q} × ${money(p.precio)} = ${money(p.precio * q)}</div>
        <button class="line__rm" data-a="rm" data-id="${id}">Eliminar</button></div>
      <span class="qty"><button data-a="dec" data-id="${id}" aria-label="Quitar uno">−</button><span>${q}</span><button data-a="inc" data-id="${id}" aria-label="Agregar uno">+</button></span>
    </div>`;
  }).join("");
  const t = calcularTotales();
  $("totals").innerHTML = ids.length ? filasTotales(t) : "";
  $("checkoutTotals").innerHTML = filasTotales(t);
  $("clearCart").hidden = !ids.length;
  $("toCheckout").disabled = !ids.length;
  const n = Object.values(carrito).reduce((a, b) => a + b, 0);
  $("cartBadge").textContent = n;
  $("cartBadge").hidden = n === 0;
  guardar(LS.cart, carrito);
}

function refrescar() { pintarMenu(); pintarCarrito(); }

function abrirCarrito(vista = "cart") {
  $("viewCart").hidden = vista !== "cart";
  $("viewCheckout").hidden = vista !== "checkout";
  $("drawerTitle").textContent = vista === "cart" ? "Tu pedido" : "Datos de entrega";
  $("drawer").classList.add("open");
  $("drawer").setAttribute("aria-hidden", "false");
  $("overlay").hidden = false;
}
function cerrarCarrito() {
  $("drawer").classList.remove("open");
  $("drawer").setAttribute("aria-hidden", "true");
  $("overlay").hidden = true;
}

/* ============================ 7) MAPA ============================ */
// Leaflet + OpenStreetMap: muestra la ubicación exacta (lat/lng) de cada sucursal.
let mapa = null, capaPines = null;

function pintarMapa() {
  if (!window.L) { $("map").innerHTML = `<p class="hint" style="padding:16px">No se pudo cargar el mapa. Revisa tu conexión.</p>`; return; }
  // Sin sucursal elegida se muestran todas; con sucursal, las de su provincia.
  const lista = sucursal
    ? PROVINCIAS.find((p) => p.nombre === sucursal.provincia).sucursales
    : PROVINCIAS.flatMap((p) => p.sucursales);

  if (!mapa) {
    mapa = L.map("map", { scrollWheelZoom: false }).setView([8.1, -80.98], 13);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap"
    }).addTo(mapa);
    capaPines = L.layerGroup().addTo(mapa);
  }
  capaPines.clearLayers();
  const icono = L.divIcon({ className: "", html: '<div class="pin">🍗</div>', iconSize: [26, 26], iconAnchor: [13, 24] });
  const puntos = lista.map((s) => {
    const m = L.marker([s.lat, s.lng], { icon: icono, title: s.nombre }).addTo(capaPines);
    m.bindPopup(`<strong>${s.nombre}</strong><br>${s.direccion}`);
    m.on("click", () => marcarLista(s.id));
    s._marker = m;
    return [s.lat, s.lng];
  });
  if (puntos.length > 1) mapa.fitBounds(puntos, { padding: [40, 40] });
  else mapa.setView(puntos[0], 16);
  setTimeout(() => mapa.invalidateSize(), 100);

  $("branchList").innerHTML = lista.map((s) => `
    <li class="branch-item ${sucursal && sucursal.id === s.id ? "sel" : ""}" data-id="${s.id}">
      <strong>${s.nombre}</strong><small>${s.direccion}</small><small>${s.horario}</small>
      <div class="branch-actions">
        <a href="https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}" target="_blank" rel="noopener">Cómo llegar</a>
        <button type="button" class="pick" data-pick="${s.id}">Pedir aquí</button>
      </div>
    </li>`).join("");
}

function marcarLista(id) {
  document.querySelectorAll(".branch-item").forEach((li) => li.classList.toggle("sel", li.dataset.id === id));
}

/* ================== 8) CHECKOUT + MENSAJE DE WHATSAPP ================== */
function pedirGPS() {
  const st = $("gpsStatus");
  st.hidden = false;
  if (!navigator.geolocation) { st.textContent = "Tu navegador no permite ubicación. Escribe la dirección."; return; }
  st.textContent = "Obteniendo tu ubicación…";
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude, accuracy } = pos.coords;
    gpsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    st.textContent = `Ubicación guardada (±${Math.round(accuracy)} m). Agrega una referencia si hace falta.`;
  }, () => {
    st.textContent = "No pudimos obtener tu ubicación. Activa el GPS o escribe la dirección.";
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 });
}

function actualizarFormulario() {
  const delivery = document.querySelector('input[name="delivery"]:checked').value === "delivery";
  $("addrBox").hidden = !delivery;
  $("proofBox").hidden = document.querySelector('input[name="pay"]:checked').value === "Efectivo";
  pintarCarrito(); // recalcula el delivery
}

function validar() {
  const delivery = document.querySelector('input[name="delivery"]:checked').value === "delivery";
  if (!$("fName").value.trim()) return "Escribe tu nombre.";
  if (!/^[\d\s+()-]{7,}$/.test($("fPhone").value.trim())) return "Escribe un teléfono válido.";
  if (delivery && !$("fAddr").value.trim() && !gpsLink) return "Escribe tu dirección o usa el GPS.";
  return "";
}

function construirMensaje() {
  const t = calcularTotales();
  const pago = document.querySelector('input[name="pay"]:checked').value;
  const ref = $("fRef").value.trim();
  const L = [];
  L.push("*Nuevo pedido — Rosty Pollo a la Leña*");
  L.push(`Sucursal: ${sucursal.nombre} (${sucursal.provincia})`);
  L.push(`Dirección del local: ${sucursal.direccion}`);
  L.push(`Mapa: https://maps.google.com/?q=${sucursal.lat},${sucursal.lng}`, "");
  L.push("*Pedido:*");
  Object.entries(carrito).forEach(([id, q]) => {
    const p = producto(id);
    L.push(`• ${q} x ${p.nombre} — ${money(p.precio * q)}`);
  });
  L.push("", `Subtotal: ${money(t.subtotal)}`, `ITBMS: ${money(t.impuesto)}`);
  if (t.envio) L.push(`Delivery: ${money(t.envio)}`);
  L.push(`*Total: ${money(t.total)}*`, "");
  L.push("*Cliente:*", `Nombre: ${$("fName").value.trim()}`, `Teléfono: ${$("fPhone").value.trim()}`);
  L.push(`Entrega: ${t.esDelivery ? "Delivery" : "Retiro en local"}`);
  if (t.esDelivery) {
    if ($("fAddr").value.trim()) L.push(`Dirección: ${$("fAddr").value.trim()}`);
    if (gpsLink) L.push(`Ubicación GPS: ${gpsLink}`);
  }
  if ($("fNotes").value.trim()) L.push(`Notas: ${$("fNotes").value.trim()}`);
  L.push("", `*Pago:* ${pago}`);
  if (pago !== "Efectivo") {
    if (ref) L.push(`Referencia: ${ref}`);
    L.push($("fProof").checked ? "Comprobante: lo envío en este chat." : "Comprobante: pendiente de envío.");
  }
  return L.join("\n");
}

function enviarWhatsApp(e) {
  e.preventDefault();
  const error = validar();
  $("formError").hidden = !error;
  $("formError").textContent = error;
  if (error) return;
  // Número de la sucursal elegida + mensaje codificado.
  const url = `https://wa.me/${sucursal.whatsapp}?text=${encodeURIComponent(construirMensaje())}`;
  if (!window.open(url, "_blank")) window.location.href = url; // si bloquean la ventana
  carrito = {};
  gpsLink = "";
  $("viewCheckout").reset();
  actualizarFormulario();
  cerrarCarrito();
  refrescar();
  toast("Pedido enviado. Confírmalo en WhatsApp.");
}

/* ============================ 9) ARRANQUE ============================ */
document.addEventListener("DOMContentLoaded", () => {
  $("year").textContent = new Date().getFullYear();
  pintarCategorias();
  initSelector();

  // Recuperar preferencia y carrito guardados
  carrito = leer(LS.cart) || {};
  const guardada = leer(LS.branch);
  if (guardada && encontrarSucursal(guardada)) { sucursal = encontrarSucursal(guardada); }
  Object.keys(carrito).forEach((id) => { if (!producto(id) || !disponible(id)) delete carrito[id]; });
  pintarSucursal();
  refrescar();
  if (!sucursal) abrirModal();

  // Clics en menú y carrito (delegación de eventos)
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-a]");
    if (!b) return;
    const { a, id } = b.dataset;
    if (a === "inc") cambiarCantidad(id, 1);
    if (a === "dec") cambiarCantidad(id, -1);
    if (a === "rm") { delete carrito[id]; refrescar(); }
  });

  $("catNav").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    catActiva = b.dataset.cat;
    pintarCategorias();
    pintarMenu();
    $("menu").scrollIntoView({ behavior: "smooth" });
  });

  // Lista de sucursales bajo el mapa
  $("branchList").addEventListener("click", (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) { seleccionarSucursal(pick.dataset.pick); toast(`Pedirás en ${sucursal.nombre}`); return; }
    const li = e.target.closest(".branch-item");
    if (li && !e.target.closest("a")) {
      const s = encontrarSucursal(li.dataset.id);
      mapa.flyTo([s.lat, s.lng], 17);
      marcarLista(s.id);
    }
  });

  // Drawer
  $("cartBtn").addEventListener("click", () => (sucursal ? abrirCarrito() : abrirModal()));
  $("closeDrawer").addEventListener("click", cerrarCarrito);
  $("overlay").addEventListener("click", cerrarCarrito);
  $("clearCart").addEventListener("click", () => { carrito = {}; refrescar(); });
  $("toCheckout").addEventListener("click", () => { abrirCarrito("checkout"); actualizarFormulario(); });
  $("backToCart").addEventListener("click", () => abrirCarrito("cart"));
  $("viewCheckout").addEventListener("change", actualizarFormulario);
  $("gpsBtn").addEventListener("click", pedirGPS);
  $("viewCheckout").addEventListener("submit", enviarWhatsApp);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") cerrarCarrito(); });
});
