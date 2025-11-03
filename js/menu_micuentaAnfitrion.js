// Definimos la URL de tu API
const API_URL = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    // 1. --- Verificación de Seguridad ---
    const token = localStorage.getItem("auth_token");
    const rol = localStorage.getItem("user_rol");
    const nombre = localStorage.getItem("user_nombre") || "Anfitrión";
    const apellido = localStorage.getItem("user_apellido") || "";
    const email = localStorage.getItem("user_email") || "email@desconocido.com";

    if (!token || rol !== "ANFITRION") {
        alert("Acceso denegado. Por favor, inicia sesión como Anfitrión.");
        window.location.href = "/html/login.html";
        return;
    }

    // 2. --- Cargar Conteo de Propiedades ---
    // (Solo llamamos a la API para obtener el N° de propiedades)
    fetch(`${API_URL}/api/propiedades/mis-propiedades`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
        .then(response => {
            if (response.status === 403) { logout(); return; }
            if (!response.ok) throw new Error("Error al cargar propiedades");
            return response.json();
        })
        .then(propiedades => {
            // 3. --- Renderizar Perfil (con datos de localStorage y el conteo) ---
            renderizarPerfil(nombre, apellido, email, propiedades.length);
        })
        .catch(error => {
            console.error("Error cargando datos:", error);
            // Renderizar perfil incluso si falla el conteo
            renderizarPerfil(nombre, apellido, email, "Error");
        });

    // 4. --- Inicializar botón de Logout ---
    initLogoutButton();
});

function renderizarPerfil(nombre, apellido, email, conteoPropiedades) {
    const nombreUsuario = document.getElementById("nombreUsuario");
    const detallesCuenta = document.getElementById("detallesCuenta");

    if (nombreUsuario) {
        // Usamos .innerHTML para que el <span id="nombreUsuario"> se reemplace
        nombreUsuario.innerHTML = `${nombre} ${apellido}`;
    }

    if (detallesCuenta) {
        detallesCuenta.innerHTML = `
            <li>• Email: ${email}</li>
            <li>• Rol: Anfitrión</li>
            <li>• Propiedades publicadas: ${conteoPropiedades}</li>
        `;
    }
}

// --- Funciones de Logout ---
function initLogoutButton() {
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", logout);
    }
}

function logout() {
    localStorage.clear(); // Limpia todo
    window.location.href = "/html/login.html";
}