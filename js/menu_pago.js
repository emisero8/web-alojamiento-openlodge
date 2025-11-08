const API_URL = "http://localhost:8080";
let propiedadCache = null; 
let reservaDatos = {}; 

document.addEventListener("DOMContentLoaded", () => {
    // Verificación de Seguridad y Datos 
    const token = localStorage.getItem("auth_token");
    const rol = localStorage.getItem("user_rol");

    const propiedadId = localStorage.getItem("propiedadIdParaAlquilar");
    const fechaInicio = localStorage.getItem("reservaFechaInicio");
    const fechaFin = localStorage.getItem("reservaFechaFin");
    const notas = localStorage.getItem("reservaNotas");

    if (!token || rol !== "HUESPED") {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "/html/login.html";
        return;
    }

    if (!propiedadId || !fechaInicio || !fechaFin) {
        alert("Error: Faltan datos de la reserva.");
        window.location.href = "/html/huesped/menu_huesped.html";
        return;
    }

    // Guardamos los datos de la reserva
    reservaDatos = { propiedadId, fechaInicio, fechaFin, notas };

    // Cargar Datos de la Propiedad desde la API 
    fetch(`${API_URL}/api/propiedades/${propiedadId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) throw new Error("No se pudo cargar la propiedad.");
            return response.json();
        })
        .then(propiedad => {
            propiedadCache = propiedad; 
            renderizarPagina(propiedad, reservaDatos); 
        })
        .catch(error => {
            console.error("Error cargando propiedad:", error);
            alert("Error al cargar la propiedad.");
        });

    // Inicializar botones
    initBotonesDeAccion();
    initLogoutButton();
});

// Función para dibujar toda la página
function renderizarPagina(propiedad, reserva) {
    const titleDiv = document.getElementById("propiedad-titulo");
    const imgActual = document.getElementById("imgActual");
    const ticketsContainer = document.getElementById("tickets-container");

    // Llenar datos de la propiedad
    titleDiv.textContent = propiedad.titulo;
    imgActual.src = propiedad.imagenPrincipalUrl || "/img/propiedades/default.png";

    // Calcular Costos
    const ingreso = new Date(reserva.fechaInicio);
    const egreso = new Date(reserva.fechaFin);
    const noches = Math.round((egreso.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24));

    const costoAlojamiento = noches * propiedad.precioPorNoche;

    let costoServiciosTotal = 0;
    let detalleServiciosHTML = "";
    propiedad.servicios.forEach(s => {
        costoServiciosTotal += s.costo;
        detalleServiciosHTML += `<li>${s.nombre}: $${s.costo.toLocaleString()}</li>`;
    });

    const totalCalculado = costoAlojamiento + costoServiciosTotal;
    reservaDatos.precioTotal = totalCalculado;

    // Renderizar Resumen y Costos
    ticketsContainer.innerHTML = `
        <div class="resumen">
            <h3>Resumen de la reserva</h3>
            <p><strong>Propiedad:</strong> ${propiedad.titulo}</p>
            <p><strong>Huéspedes:</strong> ${propiedad.numeroHuespedes}</p>
            <p><strong>Fecha de ingreso:</strong> ${reserva.fechaInicio}</p>
            <p><strong>Fecha de egreso:</strong> ${reserva.fechaFin}</p>
            <p><strong>Notas al locador:</strong> ${reserva.notas || "Ninguna"}</p>
        </div>
        <div class="costos">
            <h3>Resumen de costos</h3>
            <p><strong>Noches:</strong> ${noches} × $${propiedad.precioPorNoche.toLocaleString()} = $${costoAlojamiento.toLocaleString()}</p>
            <p><strong>Servicios:</strong> $${costoServiciosTotal.toLocaleString()}</p>
            ${detalleServiciosHTML ? `<ul>${detalleServiciosHTML}</ul>` : ""}
            <hr>
            <p><strong>Total a pagar:</strong> <span class="total">$${totalCalculado.toLocaleString()}</span></p>
        </div>
    `;
}

// Inicializa los botones
function initBotonesDeAccion() {
    const btnPagar = document.getElementById("realizarPago");
    const btnCancelar = document.getElementById("cancelarPago");
    const token = localStorage.getItem("auth_token");

    btnCancelar.addEventListener("click", () => {
        if (confirm("¿Está seguro de cancelar el pago?")) {
            localStorage.removeItem("propiedadIdParaAlquilar");
            localStorage.removeItem("reservaFechaInicio");
            localStorage.removeItem("reservaFechaFin");
            localStorage.removeItem("reservaNotas");
            window.location.href = "/html/huesped/menu_huesped.html";
        }
    });

    // Lógica de pago
    btnPagar.addEventListener("click", async () => {
        const medioPago = document.querySelector("input[name='medioPago']:checked");

        if (!medioPago) {
            alert("Debe seleccionar un medio de pago.");
            return;
        }

        const reservaParaAPI = {
            propiedadId: reservaDatos.propiedadId,
            fechaInicio: reservaDatos.fechaInicio,
            fechaFin: reservaDatos.fechaFin,
            precioTotal: reservaDatos.precioTotal,
            notas: reservaDatos.notas,
        };

        btnPagar.disabled = true;
        btnPagar.textContent = "Procesando...";

        try {
            const response = await fetch(`${API_URL}/api/reservas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reservaParaAPI)
            });

           
            if (response.status === 409) { 
                const errorMessage = await response.text();
                alert(`Reserva Fallida: ${errorMessage}`);
            } else if (response.status === 403) { 
                alert("Error: Solo los huéspedes pueden reservar. Tu sesión puede haber expirado.");
                window.location.href = "/html/login.html";
            } else if (!response.ok) {
                throw new Error("No se pudo procesar la reserva.");
            } else {
                
                alert("¡Reserva confirmada con éxito!");

                
                localStorage.removeItem("propiedadIdParaAlquilar");
                localStorage.removeItem("reservaFechaInicio");
                localStorage.removeItem("reservaFechaFin");
                localStorage.removeItem("reservaNotas");

                window.location.href = "/html/huesped/menu_huesped.html"; 
            }

        } catch (error) {
            console.error("Error al pagar:", error);
            alert("Error de conexión al crear la reserva.");
        } finally {
            btnPagar.disabled = false;
            btnPagar.textContent = "Realizar pago";
        }
    });
}

// Botón de Cerrar Sesión
function initLogoutButton() {
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "/html/login.html";
        });
    }
}