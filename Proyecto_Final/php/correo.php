<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = htmlspecialchars($_POST['nombre']);
    $email = htmlspecialchars($_POST['email']);
    $opciones = htmlspecialchars($_POST['opciones']);
    $mensaje = htmlspecialchars($_POST['mensaje']);

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        die("Correo inválido.");
    }

    $archivo = fopen("mensajes.txt", "a");
    fwrite($archivo, "Nombre: $nombre\nCorreo: $email\nOpciones: $opciones\nMensaje: $mensaje\n\n");
    fclose($archivo);

    echo "Mensaje recibido correctamente.";
} else {
    echo "Acceso no permitido.";
}
?>