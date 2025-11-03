// Definimos la URL de tu API
const API_URL = "http://localhost:8080";
let token = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. --- Verificación de Seguridad ---
  token = localStorage.getItem("auth_token");
  const rol = localStorage.getItem("user_rol");

  if (!token || rol !== "ANFITRION") {
    alert("Acceso denegado. Por favor, inicia sesión como Anfitrión.");
    window.location.href = "/html/login.html";
    return;
  }

  // 2. --- Cargar Servicios desde la API ---
  cargarServicios();

  // 3. --- Inicializar Botones ---
  initFormulario();
  initLogoutButton();
});

// Carga los checkboxes de servicios desde la API
async function cargarServicios() {
  const container = document.getElementById("servicios-container");
  try {
    const response = await fetch(`${API_URL}/api/servicios`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('No se pudieron cargar los servicios');

    const servicios = await response.json();

    container.innerHTML = ""; // Limpiar "cargando..."
    servicios.forEach(s => {
      const label = document.createElement('label');
      // Usamos el ID del servicio como el 'value'
      label.innerHTML = `<input type="checkbox" name="servicios" value="${s.id}"> ${s.nombre} (+$${s.costo})`;
      container.appendChild(label);
    });

  } catch (error) {
    console.error("Error cargando servicios:", error);
    container.innerHTML = "<p>Error al cargar servicios.</p>";
  }
}

// Maneja el formulario de publicación
function initFormulario() {
  const form = document.getElementById("formPublicar");
  const cancelarBtn = document.getElementById("cancelarBtn");

  // Botón Cancelar
  cancelarBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas cancelar la publicación?")) {
      window.location.href = "menu_anfitrion.html";
    }
  });

  // --- ¡LÓGICA DE PUBLICAR (API)! ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Recolectar datos del formulario
    const titulo = form.titulo.value;
    const direccion = form.direccion.value;
    const descripcion = form.descripcion.value;
    const precioPorNoche = parseFloat(form.precioPorNoche.value);
    const numeroHuespedes = parseInt(form.numeroHuespedes.value);

    // 2. Recolectar Servicios (convertir a formato Objeto)
    const serviciosSeleccionados = [];
    document.querySelectorAll("#servicios-container input:checked").forEach(chk => {
      // El backend espera: { "id": 1 }, { "id": 2 }
      serviciosSeleccionados.push({ id: parseInt(chk.value) });
    });

    // 3. Validaciones
    if (!titulo || !direccion || !precioPorNoche || !numeroHuespedes) {
      alert("Por favor completa todos los campos.");
      return;
    }

    // 4. Crear el objeto Propiedad (DTO) que espera el backend
    const nuevaPropiedad = {
      titulo,
      direccion,
      descripcion,
      precioPorNoche,
      numeroHuespedes,
      servicios: serviciosSeleccionados
      // No enviamos 'imagenPrincipalUrl', el backend la asigna
    };

    // 5. ¡Llamar a la API para crear la propiedad!
    try {
      const btnSubmit = form.querySelector("button[type='submit']");
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Publicando...";

      const response = await fetch(`${API_URL}/api/propiedades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(nuevaPropiedad)
      });

      if (response.status === 403) {
        alert("Error: Tu sesión expiró o no tienes permisos.");
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudo publicar la propiedad.");
      }

      // ¡Éxito!
      alert("Propiedad publicada con éxito.");
      window.location.href = "menu_anfitrion.html";

    } catch (error) {
      console.error("Error al publicar:", error);
      alert("Error de conexión al publicar la propiedad.");
    } finally {
      const btnSubmit = form.querySelector("button[type='submit']");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Finalizar";
    }
  });
}


// --- Botón de Cerrar Sesión ---
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