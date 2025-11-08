document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const correoInput = document.getElementById("correo");
    const passInput = document.getElementById("password");

    // Define la URL de la API
    const API_URL = "http://localhost:8080";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const correo = correoInput.value.trim();
        const clave = passInput.value.trim();

        if (!correo || !clave) {
            alert("Por favor complete todos los campos.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: correo,    // El backend espera 'email'
                    password: clave,  // El backend espera 'password'
                }),
            });

            // Manejo de errores
            if (!response.ok) {
                // response.status 401 o 403 significa "no autorizado"
                alert("Correo o contraseña incorrectos.");
                return;
            }

            // Obtenemos los datos (token, rol, etc)
            const data = await response.json();

            // Guardamos en localStorage que persiste incluso si cierro el navegador
            localStorage.setItem("auth_token", data.token);
            localStorage.setItem("user_rol", data.rol);
            localStorage.setItem("user_nombre", data.nombre);
            localStorage.setItem("user_email", data.email);

            alert(`Bienvenido ${data.rol}: ${data.nombre}`);

            // Redirigir según el rol
            if (data.rol === "HUESPED") {
                window.location.href = "/html/huesped/menu_huesped.html";
            } else if (data.rol === "ANFITRION") {
                window.location.href = "/html/anfitrion/menu_anfitrion.html";
            } else {
                alert("Rol desconocido, contacte al administrador.");
            }

        } catch (error) {
            console.error("Error en login:", error);
            alert("Hubo un problema al conectar con el servidor.");
        }
    });
});