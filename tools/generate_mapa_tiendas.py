"""Genera TiendaDeportiva/img/mapa-tiendas.webp: mapa estático de las tiendas de la demo.

Sustituye al mapa de Google Maps, que cargaba recursos de Google en cada visita.
Compone una vez teselas de OpenStreetMap (© colaboradores de OpenStreetMap, ODbL) y
dibuja un marcador por tienda. La página enlaza la atribución bajo la imagen.

Uso: python tools/generate_mapa_tiendas.py
"""
import io
import math
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
SALIDA = RAIZ / "TiendaDeportiva" / "img" / "mapa-tiendas.webp"
UA = "hugocalvo.dev-mapa-estatico/1.0 (+https://hugocalvo.dev)"
ZOOM = 6
# Península y Baleares
LAT_N, LAT_S, LNG_O, LNG_E = 44.2, 35.8, -9.8, 4.6

# Mismas tiendas que la lista de TiendaDeportiva/tiendas.html
TIENDAS = [
    (40.42084644450892, -3.7073319190143583),
    (40.44769630684048, -3.6655822852500863),
    (40.518041230246425, -3.9011149374343868),
    (39.473306645440886, -0.3727492300247204),
    (38.34342250289018, -0.48316839140166934),
    (36.48669097779623, -4.953382264418034),
    (41.394079371235684, 2.1746418797622757),
    (42.874796805703575, -4.16410102593384),
]


def a_pixel(lat, lng):
    n = 2**ZOOM * 256
    x = (lng + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y


def main():
    x0, y0 = a_pixel(LAT_N, LNG_O)
    x1, y1 = a_pixel(LAT_S, LNG_E)
    tx0, ty0, tx1, ty1 = int(x0 // 256), int(y0 // 256), int(x1 // 256), int(y1 // 256)
    lienzo = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            url = f"https://tile.openstreetmap.org/{ZOOM}/{tx}/{ty}.png"
            datos = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": UA})).read()
            lienzo.paste(Image.open(io.BytesIO(datos)).convert("RGB"), ((tx - tx0) * 256, (ty - ty0) * 256))
    recorte = lienzo.crop((int(x0 - tx0 * 256), int(y0 - ty0 * 256), int(x1 - tx0 * 256), int(y1 - ty0 * 256)))
    # Escala x2 para que se vea nítido en pantallas de alta densidad
    recorte = recorte.resize((recorte.width * 2, recorte.height * 2), Image.LANCZOS)
    dibujo = ImageDraw.Draw(recorte)
    for lat, lng in TIENDAS:
        x, y = a_pixel(lat, lng)
        px, py = (x - x0) * 2, (y - y0) * 2
        r = 11
        dibujo.ellipse((px - r - 3, py - r - 3, px + r + 3, py + r + 3), fill="white")
        dibujo.ellipse((px - r, py - r, px + r, py + r), fill="#1d3fe0")
    recorte.save(SALIDA, "WEBP", quality=80, method=6)
    print(SALIDA, recorte.size)


if __name__ == "__main__":
    main()
