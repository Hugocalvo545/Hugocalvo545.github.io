document.addEventListener("DOMContentLoaded", function () {
    const cookieBanner = document.getElementById("cookie-banner");
    const acceptBanner = document.getElementById("accept-banner");
    const rejectBanner = document.getElementById("reject-banner");
    const acceptCookies = document.getElementById("accept-cookies");
    const rejectCookies = document.getElementById("reject-cookies");
    const resetCookies = document.getElementById("reset-cookies");


    if (localStorage.getItem("cookiesAccepted")){
        cookieBanner.style.display = "none";
    }

    function acceptCookieAction() {
        localStorage.setItem("cookiesAccepted", "true");
        localStorage.removeItem("cookiesRejected");
        alert("Has aceptado las cookies.");
        cookieBanner.style.display = "none";
    }

    function rejectCookieAction() {
        localStorage.setItem("cookiesRejected", "true");
        localStorage.removeItem("cookiesAccepted");
        alert("Has rechazado las cookies.");
        cookieBanner.style.display = "none";
    }

    function resetCookieAction() {
        localStorage.removeItem("cookiesAccepted");
        localStorage.removeItem("cookiesRejected");
        alert("Se han restablecido tus preferencias de cookies. Recarga la página para aplicar los cambios.");
    }

    acceptBanner.addEventListener("click", acceptCookieAction);
    rejectBanner.addEventListener("click", rejectCookieAction);
    acceptCookies.addEventListener("click", acceptCookieAction);
    rejectCookies.addEventListener("click", rejectCookieAction);
    resetCookies.addEventListener("click", resetCookieAction);
});
