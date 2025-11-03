// Definimos la URL de tu API
const API_URL = "http://localhost:8080";
let token = null;
let propiedadIdParaEditar = null;

document.addEventListener("DOMContentLoaded", () => {
  // 1. --- Verificación de Seguridad ---
  token = localStorage.getItem("auth_token");
  const rol = localStorage.getItem("user_rol");
  propiedadIdParaEditar = localStorage.getItem("propiedadIdParaEditar");

  if (!token || rol !== "ANFITRION") {
    alert("Acceso denegado. Por favor, inicia sesión como Anfitrión.");
    window.location.href = "/html/login.html";
    return;
  }
  if (!propiedadIdParaEditar) {
    alert("No se encontró la propiedad a editar.");
    window.location.href = "/html/anfitrion/menu_anfitrion.html";
    return;
  }

  // 2. --- Cargar Datos (Servicios y Propiedad) ---
  Promise.all([
    fetch(`${API_URL}/api/servicios`, { headers: { 'Authorization': `Bearer ${token}` } }),
    fetch(`${API_URL}/api/propiedades/${propiedadIdParaEditar}`, { headers: { 'Authorization': `Bearer ${token}` } })
  ])
    .then(async ([serviciosRes, propiedadRes]) => {
      if (serviciosRes.status === 403 || propiedadRes.status === 403) {
        logout();
        return;
      }
      if (!serviciosRes.ok) throw new Error("No se pudieron cargar los servicios");
      if (!propiedadRes.ok) throw new Error("No se pudo cargar la propiedad");

      const serviciosMaestros = await serviciosRes.json();
      const propiedad = await propiedadRes.json(); // ⬅️ 'propiedad' (con la URL) vive aquí

      // 3. --- Renderizar Formulario ---
      renderizarFormulario(propiedad, serviciosMaestros);

      // 4. --- ¡CAMBIO! Movemos la inicialización del formulario AQUÍ ---
      // Así, la función 'submit' tiene acceso a la 'propiedad' original
      initFormulario(propiedad);

    })
    .catch(error => {
      console.error("Error cargando datos:", error);
      alert("Error al cargar los datos para editar.");
    });

  // 5. --- Inicializar Botón de Logout ---
  initLogoutButton();
});

// Llena el formulario con los datos de la propiedad
function renderizarFormulario(propiedad, serviciosMaestros) {
  const form = document.getElementById("formEditar");
  const serviciosContainer = document.getElementById("servicios-container");

  // Llenar campos de texto
  form.titulo.value = propiedad.titulo;
  form.direccion.value = propiedad.direccion;
  form.precioPorNoche.value = propiedad.precioPorNoche;
  form.numeroHuespedes.value = propiedad.numeroHuespedes;
  form.descripcion.value = propiedad.descripcion;

  // Crear un Set con los IDs de los servicios que la propiedad YA TIENE
  const serviciosQueTiene = new Set(propiedad.servicios.map(s => s.id));

  // Llenar checkboxes de servicios
  serviciosContainer.innerHTML = ""; // Limpiar "cargando..."
  serviciosMaestros.forEach(s => {
    const label = document.createElement('label');
    const isChecked = serviciosQueTiene.has(s.id) ? "checked" : "";
    label.innerHTML = `<input type="checkbox" name="servicios" value="${s.id}" ${isChecked}> ${s.nombre} (+$${s.costo})`;
    serviciosContainer.appendChild(label);
  });
}

// 6. ¡CAMBIO! La función ahora recibe la 'propiedad' original
function initFormulario(propiedadOriginal) {
  const form = document.getElementById("formEditar");
  const cancelarBtn = document.getElementById("cancelarBtn");

  cancelarBtn.addEventListener("click", () => {
    if (confirm("¿Seguro que deseas cancelar la edición?")) {
      localStorage.removeItem("propiedadIdParaEditar");
      window.location.href = "menu_anfitrion.html";
    }
  });

  // --- ¡LÓGICA DE GUARDAR (API PUT) CORREGIDA! ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1. Recolectar datos (queda igual)
    const titulo = form.titulo.value;
    const direccion = form.direccion.value;
    const descripcion = form.descripcion.value;
    const precioPorNoche = parseFloat(form.precioPorNoche.value);
    const numeroHuespedes = parseInt(form.numeroHuespedes.value);

    // 2. Recolectar Servicios (queda igual)
    const serviciosSeleccionados = [];
    document.querySelectorAll("#servicios-container input:checked").forEach(chk => {
      serviciosSeleccionados.push({ id: parseInt(chk.value) });
    });

    // 3. Crear el objeto Propiedad (DTO)
    const propiedadActualizada = {
      titulo,
      direccion,
      descripcion,
      precioPorNoche,
      numeroHuespedes,
      servicios: serviciosSeleccionados,
      // 7. ¡AQUÍ ESTÁ LA CORRECCIÓN!
      // Volvemos a enviar la URL de la imagen que ya tenía,
      // para que el backend no la ponga en NULL.
      imagenPrincipalUrl: propiedadOriginal.imagenPrincipalUrl
    };

    // 4. ¡Llamar a la API (PUT)!
    try {
      const btnSubmit = form.querySelector("button[type='submit']");
      btnSubmit.disabled = true;
      btnSubmit.textContent = "Guardando...";

      const response = await fetch(`${API_URL}/api/propiedades/${propiedadIdParaEditar}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(propiedadActualizada)
      });

      if (response.status === 403) {
        alert("Error: Tu sesión expiró o no tienes permisos.");
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudo guardar la propiedad.");
      }

      // ¡Éxito!
      alert("Propiedad actualizada con éxito.");
      localStorage.removeItem("propiedadIdParaEditar");
      window.location.href = "menu_anfitrion.html";

    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Error de conexión al guardar la propiedad.");
    } finally {
      const btnSubmit = form.querySelector("button[type='submit']");
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Guardar cambios";
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