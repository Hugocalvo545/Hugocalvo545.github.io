
var kugaImages = [
    'img/Kuga1.jpg',
    'img/Kuga2.jpg',
    'img/Kuga3.jpg',
    'img/Kuga4.jpg',
    'img/Kuga5.jpg',
    'img/Kuga6.jpg',
    'img/Kuga7.jpg',
    'img/Kuga8.jpg',
    'img/Kuga9.jpg',
];

var kugaImage = document.getElementById('Kuga');
var i = 0;
function changeKuga() {

    if (i === kugaImages.length) {
        i = 0;
    }
    kugaImage.src = kugaImages[i];
    i++;
}

setInterval(changeKuga, 3000);

changeKuga();