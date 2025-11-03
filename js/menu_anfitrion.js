// Definimos la URL de tu API
const API_URL = "http://localhost:8080";
let properties = []; // Array global para guardar las propiedades del anfitrión

document.addEventListener("DOMContentLoaded", () => {
  // 1. --- Verificación de Seguridad ---
  const token = localStorage.getItem("auth_token");
  const rol = localStorage.getItem("user_rol");

  if (!token || rol !== "ANFITRION") {
    alert("Acceso denegado. Por favor, inicia sesión como Anfitrión.");
    window.location.href = "/html/login.html";
    return;
  }

  // 2. --- Cargar Propiedades (Ruta Protegida) ---
  cargarPropiedades(token);

  // 3. --- Inicializar botón de Logout ---
  initLogoutButton();
});

// Cargar propiedades del anfitrión
function cargarPropiedades(token) {
  fetch(`${API_URL}/api/propiedades/mis-propiedades`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (response.status === 403) {
        alert("Sesión expirada. Por favor, inicia sesión de nuevo.");
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error("No se pudieron cargar tus propiedades.");
      }
      return response.json();
    })
    .then(data => {
      properties = data; // Guardamos los datos
      renderCards();     // Dibujamos las tarjetas
    })
    .catch(error => {
      console.error("Error cargando mis propiedades:", error);
      alert("Error al cargar propiedades desde el servidor.");
    });
}

// Renderizar tarjetas
function renderCards() {
  const cardsContainer = document.getElementById("cards");
  if (!cardsContainer) return;

  if (properties.length === 0) {
    cardsContainer.innerHTML = "<p>No tienes propiedades publicadas. ¡Publica tu primera propiedad!</p>";
    return;
  }

  // Usamos los campos de la API: 'id', 'titulo', 'imagenPrincipalUrl'
  cardsContainer.innerHTML = properties.map(p => `
        <article class="card" data-id="${p.id}">
            <div class="title">${p.titulo}</div>
            <div class="address">${p.direccion}</div>
            <img src="${p.imagenPrincipalUrl}" alt="Imagen de ${p.titulo}">
            <div class="actions">
                <button class="seeBtn">Ver Detalles</button>
            </div>
        </article>
    `).join("");

  initCardButtons();
}

// Activar evento a todos los botones "Ver más detalles"
function initCardButtons() {
  document.querySelectorAll(".seeBtn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const card = e.target.closest(".card");
      const id = card.getAttribute("data-id");
      showDetails(id);
    });
  });
}

// Mostrar detalles
function showDetails(id) {
  const detailPanel = document.getElementById("detailPanel");
  const prop = properties.find(p => p.id == id);

  if (!prop) {
    detailPanel.className = "detail empty";
    detailPanel.textContent = "Propiedad no encontrada.";
    return;
  }

  detailPanel.className = "detail";

  // Convertimos la lista de objetos 'servicios' en <li>
  const serviciosHtml = prop.servicios.map(s => `<li>${s.nombre} (+$${s.costo})</li>`).join('');

  // Usamos los campos de la API
  detailPanel.innerHTML = `
        <div class="title">${prop.titulo}</div>
        <div class="subtitle">${prop.direccion}</div>
        <img src="${prop.imagenPrincipalUrl}" alt="Imagen de ${prop.titulo}">
        
        <div><strong>Descripción:</strong></div>
        <p class="info">${prop.descripcion || "No hay descripción."}</p>
        
        <div><strong>Servicios:</strong></div>
        <ul class="info">
            ${serviciosHtml || "<li>No hay servicios asignados.</li>"}
        </ul>
        
        <div class="spacer"></div>
        <div class="footer">
            <button class="btn-primary" id="editBtn">Editar detalles</button>
            <button class="btn-danger" id="deleteBtn">Dar de baja</button>
        </div>
    `;

  // Botones del panel
  document.getElementById('editBtn').addEventListener('click', () => {
    editarPropiedad(prop.id);
  });

  document.getElementById('deleteBtn').addEventListener('click', () => {
    darDeBaja(prop.id);
  });
}

// Editar propiedad
function editarPropiedad(id) {
  // Guardamos el ID de la propiedad a editar en localStorage
  localStorage.setItem("propiedadIdParaEditar", id);
  window.location.href = "/html/anfitrion/menu_editar.html";
}

// Dar de baja propiedad (¡AHORA LLAMA A LA API!)
async function darDeBaja(id) {
  if (!confirm("¿Seguro que deseas dar de baja esta propiedad?")) return;

  const token = localStorage.getItem("auth_token");
  if (!token) return;

  try {
    const response = await fetch(`${API_URL}/api/propiedades/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 403) {
      alert("Error: No tienes permiso para borrar esta propiedad o tu sesión expiró.");
      logout();
    } else if (response.status === 409) {
      // ¡Manejamos el error de reservas!
      const errorMessage = await response.text();
      alert(`Acción Bloqueada: ${errorMessage}`);
    } else if (!response.ok && response.status !== 204) {
      throw new Error("No se pudo eliminar la propiedad.");
    } else {
      // ¡Éxito!
      alert("Propiedad eliminada correctamente.");

      // Recargamos las propiedades desde la API
      cargarPropiedades(token);

      // Limpiamos el panel de detalle
      const detailPanel = document.getElementById("detailPanel");
      detailPanel.className = "detail empty";
      detailPanel.textContent = "Selecciona una propiedad para ver sus detalles.";
    }

  } catch (err) {
    alert("Error de conexión al eliminar la propiedad.");
    console.error(err);
  }
}

// --- Botón de Cerrar Sesión ---
function initLogoutButton() {
  const logoutBtn = document.querySelector(".logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout); // Llama a la función logout
  }
}

function logout() {
  localStorage.clear(); // Limpia todo
  window.location.href = "/html/login.html";
}