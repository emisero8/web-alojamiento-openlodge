// Definimos la URL de tu API
const API_URL = "http://localhost:8080";
let propiedadCache = null; // Guardamos la propiedad cargada

document.addEventListener("DOMContentLoaded", () => {
    // 1. --- Verificación de Seguridad ---
    const token = localStorage.getItem("auth_token");
    const rol = localStorage.getItem("user_rol");
    const propiedadId = localStorage.getItem("propiedadIdParaAlquilar");

    if (!token || rol !== "HUESPED") {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "/html/login.html";
        return;
    }

    if (!propiedadId) {
        alert("Error: No se seleccionó ninguna propiedad.");
        window.location.href = "/html/huesped/menu_huesped.html";
        return;
    }

    // 2. --- Cargar Datos de la Propiedad desde la API ---
    fetch(`${API_URL}/api/propiedades/${propiedadId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}` // Necesario si la ruta es protegida
        }
    })
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar la propiedad.");
            return response.json();
        })
        .then(propiedad => {
            propiedadCache = propiedad; // Guardamos la propiedad
            renderizarDetalles(propiedad); // Dibujamos la pantalla
        })
        .catch(error => {
            console.error("Error cargando propiedad:", error);
            alert("Error al cargar la propiedad.");
        });

    // 3. --- Inicializar botones ---
    initBotonesDeAccion();
    initLogoutButton();
});


function renderizarDetalles(prop) {
    // --- Referencias DOM ---
    const titleDiv = document.querySelector('.detail .title');
    const imgActual = document.getElementById("imgActual");
    const serviciosGroup = document.getElementById("servicios-group");
    const capacidadTexto = document.getElementById("capacidad-texto");

    // --- Llenar datos ---
    titleDiv.textContent = prop.titulo;
    imgActual.src = prop.imagenPrincipalUrl || "/img/propiedades/default.png";
    capacidadTexto.textContent = `Capacidad: ${prop.numeroHuespedes} huéspedes`;

    // --- Llenar Servicios ---
    serviciosGroup.innerHTML = ''; // Limpiar "cargando..."
    if (prop.servicios && prop.servicios.length > 0) {
        prop.servicios.forEach(s => {
            const label = document.createElement('label');
            label.className = 'checkbox-row';
            // Creamos un checkbox "falso" (solo visual)
            label.innerHTML = `
                <div class"checkbox checked"></div> 
                <span>${s.nombre} (+$${s.costo.toLocaleString()})</span>
            `;
            serviciosGroup.appendChild(label);
        });
    } else {
        serviciosGroup.textContent = "No hay servicios adicionales.";
    }
}

function initBotonesDeAccion() {
    const btnReserva = document.getElementById("realizarReserva");
    const btnCancelar = document.getElementById("cancelarReserva");
    const token = localStorage.getItem("auth_token");

    btnCancelar.addEventListener("click", () => {
        window.location.href = "/html/huesped/menu_huesped.html";
    });

    // --- ¡LÓGICA DE RESERVA (API)! ---
    btnReserva.addEventListener("click", async () => {
        if (!propiedadCache) {
            alert("Error: La propiedad no se ha cargado.");
            return;
        }

        // 1. Obtener datos del formulario
        const fechaIngreso = document.getElementById("fecha-ingreso").value;
        const fechaEgreso = document.getElementById("fecha-egreso").value;
        const notas = document.getElementById("notas-locador").value;

        // 2. Validaciones
        if (!fechaIngreso || !fechaEgreso) {
            alert("Debe ingresar fecha de ingreso y egreso.");
            return;
        }
        if (new Date(fechaEgreso) <= new Date(fechaIngreso)) {
            alert("La fecha de egreso debe ser posterior a la de ingreso.");
            return;
        }

        // 3. Calcular Precio Total (como en MenuPagoScreen de React)
        const fIngreso = new Date(fechaIngreso);
        const fEgreso = new Date(fechaEgreso);
        const noches = Math.round((fEgreso.getTime() - fIngreso.getTime()) / (1000 * 60 * 60 * 24));

        if (noches <= 0) {
            alert("Debe reservar al menos 1 noche.");
            return;
        }

        const costoAlojamiento = noches * propiedadCache.precioPorNoche;
        let costoServiciosTotal = 0;
        propiedadCache.servicios.forEach(s => {
            costoServiciosTotal += s.costo;
        });
        const precioTotalCalculado = costoAlojamiento + costoServiciosTotal;

        // 4. Confirmación
        const confirmar = confirm(`¿Confirmar reserva?\n\n` +
            `Propiedad: ${propiedadCache.titulo}\n` +
            `Fechas: ${fechaIngreso} al ${fechaEgreso} (${noches} noches)\n` +
            `Total: $${precioTotalCalculado.toLocaleString()}`
        );
        if (!confirmar) return;

        // 5. Crear objeto ReservaRequest (el DTO del backend)
        const reservaRequest = {
            propiedadId: propiedadCache.id,
            fechaInicio: fechaIngreso,
            fechaFin: fechaEgreso,
            precioTotal: precioTotalCalculado,
            notas: notas,
        };

        // 6. ¡Llamar a la API para crear la reserva!
        localStorage.setItem('propiedadIdParaAlquilar', propiedadCache.id);
        localStorage.setItem('reservaFechaInicio', fechaIngreso);
        localStorage.setItem('reservaFechaFin', fechaEgreso);
        localStorage.setItem('reservaNotas', notas);

        // Y redirigimos a la pantalla de pago
        window.location.href = "/html/huesped/menu_pago.html";
    });
}

// --- Botón de Cerrar Sesión ---
function initLogoutButton() {
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user_rol");
            localStorage.removeItem("user_nombre");
            localStorage.removeItem("user_email");
            window.location.href = "/html/login.html";
        });
    }
}