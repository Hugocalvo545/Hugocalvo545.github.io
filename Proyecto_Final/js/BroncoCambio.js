var broncoImages = [
    'img/Bronco1.jpg',
    'img/Bronco2.jpg',
    'img/Bronco3.jpg',
    'img/Bronco4.jpg',
    'img/Bronco5.jpg',
    'img/Bronco6.jpg',
    'img/Bronco7.jpg',
    'img/Bronco8.jpg',
    'img/Bronco9.jpg',
];

var broncoImage = document.getElementById('Bronco');
var i = 0;
function changeBronco() {

    if (i === broncoImages.length) {
        i = 0;
    }
    broncoImage.src = broncoImages[i];
    i++;
}

setInterval(changeBronco, 3000);

changeBronco();