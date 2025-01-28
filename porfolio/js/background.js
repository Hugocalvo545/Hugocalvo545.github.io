document.addEventListener('DOMContentLoaded', function() {
    Particles.init({
        selector: '#canvas',
        color: ['#DA0463', '#404B69', '#DBEDF3'],
        connectParticles: true,
        responsive: [
            {
                breakpoint: 768,
                options: {
                    maxParticles: 80,
                    connectParticles: false
                }
            }, {
                breakpoint: 425,
                options: {
                    maxParticles: 50,
                    connectParticles: false
                }
            }, {
                breakpoint: 320,
                options: {
                    maxParticles: 30,
                    connectParticles: false
                }
            }
        ]
    });
});