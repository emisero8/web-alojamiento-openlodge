document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("crearCuentaForm");

    const API_URL = "http://localhost:8080";

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const tipo = document.getElementById("tipo").value; // 'huesped' o 'anfitrion'

        // Validaciones
        if (!nombre || !apellido || !email || !password || !tipo) {
            alert("Por favor complete todos los campos.");
            return;
        }

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        const userData = {
            nombre: nombre,
            apellido: apellido,
            email: email,
            password: password,
            rol: tipo.toUpperCase(),
        };

        // Solicitud HTTP POST al backend
        try {
            const response = await fetch(`${API_URL}/api/usuarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });

            if (response.status === 409) { // 409 Conflict (Email duplicado)
                alert("El email ya se encuentra registrado.");
            } else if (!response.ok) {
                const errorText = await response.text();
                console.error("Error del servidor:", errorText);
                alert(`Error de registro: ${errorText || "No se pudo crear la cuenta."}`);
            } else {
                // Éxito (Código 201 Created o 200 OK)
                alert(
                    "¡Tu cuenta ha sido creada exitosamente! Por favor, inicia sesión."
                );
                window.location.href = "/html/login.html";
            }
        } catch (error) {
            console.error("Error de red o conexión:", error);
            alert("Error de red: No se pudo conectar al servidor.");
        }
    });
});