// Inicializar EmailJS
(function() {
    emailjs.init("YOUR_USER_ID"); // Reemplaza con tu User ID de EmailJS
})();

document.getElementById('contact-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Obtener los valores del formulario
    var name = this.name.value;
    var email = this.email.value;
    var message = this.message.value;

    // Enviar el email usando EmailJS
    emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", {
        from_name: name,
        from_email: email,
        message: message
    }).then(function(response) {
        console.log('SUCCESS!', response.status, response.text);
        alert('Mensaje enviado correctamente!');
    }, function(error) {
        console.log('FAILED...', error);
        alert('Hubo un error al enviar el mensaje. Por favor, inténtalo de nuevo.');
    });

    // Limpiar el formulario
    this.reset();
});

// Smooth scrolling para los enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});