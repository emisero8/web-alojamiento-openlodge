const API_URL = "http://localhost:8080";
let token = null;

document.addEventListener("DOMContentLoaded", () => {
    // Verificación de Seguridad 
    token = localStorage.getItem("auth_token");
    const rol = localStorage.getItem("user_rol");

    if (!token || rol !== "ANFITRION") {
        alert("Acceso denegado. Por favor, inicia sesión como Anfitrión.");
        window.location.href = "/html/login.html";
        return;
    }

    // Cargar Reservas
    cargarReservas();
    initLogoutButton();
});

async function cargarReservas() {
    const listaSolicitudes = document.getElementById("listaSolicitudes");
    listaSolicitudes.innerHTML = "<p>Cargando reservas...</p>";

    try {
        const response = await fetch(`${API_URL}/api/reservas/de-mis-propiedades`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 403) {
            logout();
            return;
        }
        if (!response.ok) {
            throw new Error("No se pudieron cargar las reservas.");
        }

        const reservas = await response.json();
        renderReservas(reservas);

    } catch (error) {
        console.error("Error cargando reservas:", error);
        listaSolicitudes.innerHTML = "<p>Error al cargar las reservas.</p>";
    }
}

// Renderizar las tarjetas de reserva
function renderReservas(reservas) {
    const listaSolicitudes = document.getElementById("listaSolicitudes");
    listaSolicitudes.innerHTML = "";

    if (reservas.length === 0) {
        listaSolicitudes.innerHTML = "<p>No hay reservas confirmadas.</p>";
        return;
    }

    reservas.forEach((reserva) => {
        const div = document.createElement("div");
        div.className = "solicitud";
        div.innerHTML = `
            <h3>${reserva.propiedad.titulo}</h3>
            <p>Huésped: ${reserva.huesped.nombre} ${reserva.huesped.apellido}</p>
            <p>Desde: ${reserva.fechaInicio} - Hasta: ${reserva.fechaFin}</p>
            <p>Notas: ${reserva.notas || "Ninguna"}</p>
            <p>Total Pagado: $${reserva.precioTotal.toLocaleString()}</p>
            <div class="acciones">
                <button class="btn-cancelar" data-id="${reserva.id}">Cancelar Reserva</button>
            </div>
        `;
        listaSolicitudes.appendChild(div);
    });

    // Botones de cancelar
    initCancelarBotones();
}

function initCancelarBotones() {
    document.querySelectorAll(".btn-cancelar").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const reservaId = e.target.getAttribute("data-id");
            const reserva = e.target.closest(".solicitud").querySelector("h3").textContent;

            cancelarReserva(reservaId, reserva);
        });
    });
}

async function cancelarReserva(reservaId, nombrePropiedad) {
    if (!confirm(`¿Está seguro de que desea cancelar esta reserva para "${nombrePropiedad}"? Esta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/reservas/${reservaId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 403) {
            alert("Error: No tienes permiso para cancelar esta reserva o tu sesión expiró.");
            logout();
        } else if (!response.ok && response.status !== 204) { 
            throw new Error("No se pudo cancelar la reserva.");
        } else {
            alert("Reserva cancelada exitosamente.");
            cargarReservas(); 
        }

    } catch (err) {
        alert("Error de conexión al cancelar la reserva.");
        console.error(err);
    }
}

// Botón de Cerrar Sesión
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