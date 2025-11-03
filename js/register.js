document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("crearCuentaForm");

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const tipo = document.getElementById("tipo").value;

        if (password.length < 6) {
            alert("La contraseña debe tener al menos 6 caracteres.");
            return;
        }

        // Obtener usuarios guardados en localStorage o array vacío
        const usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];

        // Verificar si el correo ya está registrado
        const existe = usuarios.some(u => u.email === email);
        if (existe) {
            alert("Ya existe una cuenta con este correo.");
            return;
        }

        // Crear usuario nuevo
        const nuevoUsuario = {
            nombre,
            correo: email,
            clave: password,
            rol: tipo.charAt(0).toUpperCase() + tipo.slice(1) // Huesped / Anfitrion
        };

        usuarios.push(nuevoUsuario);

        // Guardar en localStorage
        localStorage.setItem("usuarios", JSON.stringify(usuarios));

        alert("Cuenta creada con éxito. Ahora puedes iniciar sesión.");
        window.location.href = "/html/login.html";
    });
});
