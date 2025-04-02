document.getElementById("contacto-form").addEventListener("submit", function(event) {
    let nombre = document.getElementById("nombre").value.trim();
    let email = document.getElementById("email").value.trim();
    let mensaje = document.getElementById("mensaje").value.trim();

    let caracteresProhibidos = /[$@#]/;
    let errores = false;

    if (nombre === "" || caracteresProhibidos.test(nombre) || /^\d/.test(nombre)) {
        document.getElementById("error-nombre").textContent = "Nombre inválido";
        errores = true;
    } else {
        document.getElementById("error-nombre").textContent = "";
    }

    if (email === "" || !/\S+@\S+\.\S+/.test(email)) {
        document.getElementById("error-email").textContent = "Correo inválido";
        errores = true;
    } else {
        document.getElementById("error-email").textContent = "";
    }

    if (mensaje === "") {
        document.getElementById("error-mensaje").textContent = "El mensaje es obligatorio";
        errores = true;
    } else {
        document.getElementById("error-mensaje").textContent = "";
    }

    if (errores) {
        event.preventDefault();
    }
});