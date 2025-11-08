const API_URL = "http://localhost:8080";
let token = null;

document.addEventListener("DOMContentLoaded", () => {
  // Verificación de Seguridad
  token = localStorage.getItem("auth_token");
  const rol = localStorage.getItem("user_rol");
  const nombre = localStorage.getItem("user_nombre") || "Usuario";
  const apellido = localStorage.getItem("user_apellido") || "";
  const email = localStorage.getItem("user_email") || "email@desconocido.com";

  if (!token || rol !== "HUESPED") {
    alert("Acceso denegado. Por favor, inicia sesión.");
    window.location.href = "/html/login.html";
    return;
  }

  renderizarPerfil(nombre, apellido, email);

  cargarMisReservas();

  initLogoutButton();
});

async function cargarMisReservas() {
  const reservasContainer = document.getElementById("reservas-area");
  reservasContainer.innerHTML = "<p>Cargando reservas...</p>";

  try {
    const response = await fetch(`${API_URL}/api/reservas/mis-reservas`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.status === 403) { logout(); return; }
    if (!response.ok) throw new Error("No se pudieron cargar tus reservas.");

    const reservas = await response.json();
    renderizarReservas(reservas);

  } catch (error) {
    console.error("Error cargando reservas:", error);
    reservasContainer.innerHTML = '<p>Error al cargar las reservas.</p>';
  }
}

function renderizarPerfil(nombre, apellido, email) {
  const profilePanel = document.getElementById("profile-panel");
  const userDetailsList = document.getElementById("user-details-list");
  if (!profilePanel || !userDetailsList) return;

  profilePanel.querySelector('h2').textContent = `Bienvenido, ${nombre} ${apellido}`;

  userDetailsList.innerHTML = `
        <li>• Correo: ${email}</li>
        <li>• Rol: Huésped</li>
        <li id="conteo-reservas">• Nº de reservas: (cargando...)</li>
    `;
}

function renderizarReservas(reservas) {
  const reservasContainer = document.getElementById("reservas-area");
  if (!reservasContainer) return;

  const reservasCountEl = document.getElementById("conteo-reservas");
  if (reservasCountEl) {
    reservasCountEl.textContent = `• Nº de reservas: ${reservas.length}`;
  }

  if (reservas.length === 0) {
    reservasContainer.innerHTML = "<p>No has realizado ninguna reserva aún.</p>";
    return;
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  reservasContainer.innerHTML = reservas.map(r => {

    const fechaInicioReserva = new Date(r.fechaInicio + 'T00:00:00-03:00');
    const esFutura = fechaInicioReserva > hoy;

    const botonCancelarHTML = esFutura
      ? `<button class="btn-ghost btn-cancelar-reserva" data-id="${r.id}">Cancelar reserva</button>`
      : `<button class="btn-ghost" disabled title="No se puede cancelar una reserva pasada.">Reserva completada</button>`; // Botón deshabilitado

    return `
            <article class="card" data-id="${r.id}">
                <div class="address">${r.propiedad.titulo}</div>
                <img src="${r.propiedad.imagenPrincipalUrl}" alt="Imagen de ${r.propiedad.titulo}" class="image">
                <div class="status">
                    <p>Desde: ${r.fechaInicio}</p>
                    <p>Hasta: ${r.fechaFin}</p>
                </div>
                <div class="status">
                    <strong>Total pagado: $${r.precioTotal.toLocaleString()}</strong>
                </div>
                <div class="actions">
                    ${botonCancelarHTML}
                </div>
            </article>
        `;
  }).join('');

  initCancelarBotones();
}

//Lógica de Botones

function initCancelarBotones() {
  document.querySelectorAll(".btn-cancelar-reserva").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const reservaId = e.target.getAttribute("data-id");
      if (confirm("¿Está seguro de que desea cancelar esta reserva?")) {
        cancelarReserva(reservaId);
      }
    });
  });
}

async function cancelarReserva(reservaId) {
  try {
    const response = await fetch(`${API_URL}/api/reservas/mis-reservas/${reservaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 403) {
      alert("Error: No tienes permiso o tu sesión expiró.");
      logout();
    } else if (response.status === 409 || response.status === 400) { 
      const errorMessage = await response.text();
      alert(`No se pudo cancelar: ${errorMessage}`);
    } else if (!response.ok && response.status !== 204) {
      throw new Error("No se pudo cancelar la reserva.");
    } else {
      alert("Reserva cancelada exitosamente.");
      cargarMisReservas();
    }

  } catch (err) {
    alert("Error de conexión al cancelar la reserva.");
    console.error(err);
  }
}

function initLogoutButton() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}

function logout() {
  localStorage.clear();
  window.location.href = "/html/login.html";
}