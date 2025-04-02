
var focusImages = [
    'img/Focus1.jpg',
    'img/Focus2.jpg',
    'img/Focus3.jpg',
    'img/Focus4.jpg',
    'img/Focus5.jpg',
    'img/Focus6.jpg',
    'img/Focus7.jpg',
    'img/Focus8.jpg',
    'img/Focus9.jpg',
];

var focusImage = document.getElementById('Focus');
var i = 0;
function changeFocus() {

    if (i === focusImages.length) {
        i = 0;
    }
    focusImage.src = focusImages[i];
    i++;
}

setInterval(changeFocus, 3000);

changeFocus();