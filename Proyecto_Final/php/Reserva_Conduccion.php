<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = htmlspecialchars($_POST["nombre"]);
    $email = htmlspecialchars($_POST["email"]);
    $telefono = htmlspecialchars($_POST["telefono"]);
    $fecha = htmlspecialchars($_POST["fecha"]);
    $hora = htmlspecialchars($_POST["hora"]);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Correo inválido.");
    }

    $archivo = fopen("ReservaConduccion.txt", "a");
    fwrite($archivo, "Nombre: $nombre\nCorreo: $email\nTelefono: $telefono\nFecha: $fecha\nHora: $hora\n\n");
    fclose($archivo);

    echo "Mensaje recibido correctamente.";
} else {
    echo "Acceso no permitido.";
}
?>