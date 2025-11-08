const API_URL = "http://localhost:8080";
let properties = []; 

document.addEventListener("DOMContentLoaded", () => {
  // Verificación de Seguridad
  const token = localStorage.getItem("auth_token");
  const rol = localStorage.getItem("user_rol");

  if (!token || rol !== "HUESPED") {
    alert("Acceso denegado. Por favor, inicia sesión como Huésped.");
    window.location.href = "/html/login.html";
    return;
  }

  // Cargar Propiedades desde la API
  fetch(`${API_URL}/api/propiedades`, {
    method: 'GET',
    headers: {

    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudieron cargar las propiedades.");
      }
      return response.json();
    })
    .then(data => {
      properties = data;
      renderCards(properties);
    })
    .catch(error => {
      console.error("Error cargando propiedades:", error);
      alert("Error al cargar propiedades desde el servidor.");
    });

  // Inicializar los botones y filtros
  initFiltroModal();
  initBusqueda();
  initFiltroPrecio();
  initLogoutButton();
});

function renderCards(propiedadesAMostrar) {
  const cardsContainer = document.getElementById('cards');
  if (!cardsContainer) return;

  // Usamos los campos de la API: 'id', 'titulo', 'imagenPrincipalUrl', 'precioPorNoche'
  cardsContainer.innerHTML = propiedadesAMostrar.map(p => `
        <article class="card" data-id="${p.id}">
            <div class="address">${p.titulo}</div>
            <img src="${p.imagenPrincipalUrl}" alt="Imagen de ${p.titulo}" class="image">
            <div class="status">Precio: $${p.precioPorNoche.toLocaleString()} / noche</div>
            <div class="actions">
                <button class="seeBtn">Ver más detalles</button>
            </div>
        </article>
    `).join('');

  initCardButtons();
}

function initCardButtons() {
  const buttons = document.querySelectorAll('.seeBtn');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      const id = card.getAttribute('data-id');
      showDetails(id);
      document.querySelectorAll('.card').forEach(c => c.style.outline = 'none');
      card.style.outline = '3px solid rgba(0,0,0,0.1)';
    });
  });
}

// Mostrar detalles de la propiedad seleccionada
function showDetails(id) {
  const detailPanel = document.getElementById('detailPanel');
  const prop = properties.find(p => p.id == id); 

  if (!prop) {
    detailPanel.className = 'detail empty';
    detailPanel.textContent = 'Propiedad no encontrada.';
    return;
  }

  detailPanel.className = 'detail';

  const serviciosHtml = prop.servicios.map(s => `<li>${s.nombre} (+${s.costo})</li>`).join('');

  // Usamos los campos de la API: 'titulo', 'imagenPrincipalUrl', 'descripcion'
  detailPanel.innerHTML = `
        <div class="title">${prop.titulo}</div>
        <img src="${prop.imagenPrincipalUrl}" alt="Imagen de ${prop.titulo}" class="image-large">
        
        <div><strong>Descripción:</strong></div>
        <p class="info">${prop.descripcion || "No hay descripción."}</p>
        
        <div><strong>Servicios:</strong></div>
        <ul class="info">
            ${serviciosHtml || "<li>No hay servicios asignados.</li>"}
        </ul>
        
        <div class="spacer"></div>
        <div class="footer">
            <button class="btn-primary" id="rentBtn" data-id="${prop.id}">Alquilar</button>
            <button class="btn-ghost" id="cancelBtn">Cancelar</button>
        </div>
    `;

  // Botones del panel
  document.getElementById('rentBtn').addEventListener('click', (e) => {
    const propiedadId = e.target.getAttribute('data-id');

    localStorage.setItem('propiedadIdParaAlquilar', propiedadId);

    window.location.href = `menu_alquilar.html`;
  });

  document.getElementById('cancelBtn').addEventListener('click', () => {
    document.querySelectorAll('.card').forEach(c => c.style.outline = 'none');
    detailPanel.className = 'detail empty';
    detailPanel.textContent = 'Haz click en "Ver más detalles" para ver la información de la propiedad seleccionada.';
  });
}

// Lógica de Filtros

function initFiltroModal() {
  const modal = document.getElementById("modalFiltro");
  const btn = document.getElementById("btnFiltrar");
  const cerrar = document.getElementById("cerrarModal");
  const cancelar = document.getElementById("cancelarFiltro");

  if (btn) btn.onclick = () => modal.style.display = "flex";
  if (cerrar) cerrar.onclick = () => modal.style.display = "none";
  if (cancelar) cancelar.onclick = () => modal.style.display = "none";
  window.onclick = (event) => {
    if (event.target == modal) modal.style.display = "none";
  };
}

function initBusqueda() {
  const inputBusqueda = document.getElementById("busqueda");
  if (!inputBusqueda) return;

  inputBusqueda.addEventListener("input", () => {
    const texto = inputBusqueda.value.toLowerCase();

    // Filtramos sobre la lista global 'properties'
    const filtradas = properties.filter(p => {
      return p.titulo.toLowerCase().includes(texto) ||
        p.direccion.toLowerCase().includes(texto);
    });

    renderCards(filtradas);
  });
}

function initFiltroPrecio() {
  const formFiltro = document.querySelector(".filtro-form");
  const modal = document.getElementById("modalFiltro");
  const filtroActivo = document.getElementById("filtroActivo");
  if (!formFiltro) return;

  formFiltro.addEventListener("submit", (e) => {
    e.preventDefault();

    const precioMin = parseFloat(document.getElementById("precio-min").value) || 0;
    const precioMax = parseFloat(document.getElementById("precio-max").value) || Infinity;

    // Filtramos sobre la lista global 'properties'
    // Usamos el campo 'precioPorNoche' de la API
    const filtradas = properties.filter(p => {
      return p.precioPorNoche >= precioMin && p.precioPorNoche <= precioMax;
    });

    renderCards(filtradas);
    initCardButtons();

    if (precioMin > 0 || precioMax < Infinity) {
      filtroActivo.textContent = `Filtro aplicado: $${precioMin} - $${precioMax === Infinity ? "∞" : precioMax}`;
    } else {
      filtroActivo.textContent = "";
    }
    modal.style.display = "none";
  });
}

// Botón de Cerrar Sesión
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