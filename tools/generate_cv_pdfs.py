from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader


ROOT = Path(__file__).resolve().parents[1]
PAGE_SIZE = landscape(A4)

OUTPUTS = [
    ("Curriculum_Hugo_Calvo.pdf", "light", "es"),
    ("Curriculum_Hugo_Calvo_Dark.pdf", "dark", "es"),
    ("Resume_Hugo_Calvo_Eng.pdf", "light", "en"),
    ("Resume_Hugo_Calvo_Eng_Dark.pdf", "dark", "en"),
]

THEMES = {
    "light": {
        "page": "#F5F7FB",
        "grid": "#E5EBF3",
        "surface": "#FFFFFF",
        "surface_alt": "#EEF3F8",
        "ink": "#101820",
        "muted": "#5F6C7B",
        "line": "#D8E0EA",
        "accent": "#0F766E",
        "accent_soft": "#D9F3EE",
        "warm": "#F97316",
        "primary_bg": "#101820",
        "primary_fg": "#FFFFFF",
        "secondary_bg": "#FFFFFF",
        "secondary_fg": "#101820",
    },
    "dark": {
        "page": "#0D0F12",
        "grid": "#17202A",
        "surface": "#151922",
        "surface_alt": "#1E2430",
        "ink": "#F7FAFC",
        "muted": "#B2BFCB",
        "line": "#2E3744",
        "accent": "#2DD4BF",
        "accent_soft": "#102C2A",
        "warm": "#FB923C",
        "primary_bg": "#F7FAFC",
        "primary_fg": "#0D0F12",
        "secondary_bg": "#1E2430",
        "secondary_fg": "#F7FAFC",
    },
}

LINKS = {
    "email": "mailto:hugocgarciat@gmail.com",
    "phone": "tel:+34638091795",
    "linkedin": "https://www.linkedin.com/in/hugo-calvo-garc%C3%ADa-9b980a329",
    "github": "https://github.com/Hugocalvo545",
    "web_es": "https://hugocalvo.dev/curriculum.html",
    "web_en": "https://hugocalvo.dev/curriculum_english.html",
    "portfolio_es": "https://hugocalvo.dev/portfolio/portfolio.html",
    "portfolio_en": "https://hugocalvo.dev/portfolio/portfolio_eng.html",
    "geopilot": "https://geopilot.es",
    "gestolio": "https://gestolio.com",
    "dadomania": "https://dadomania.com",
}

# Medidas comunes de las tarjetas
CARD_BODY_SIZE = 9.1
CARD_BODY_LEADING = 12.2
TAG_ROW = 19


def c(theme, key):
    return colors.HexColor(theme[key])


def wrap_text(text, font, size, width):
    lines = []
    current = ""
    for word in text.split():
        candidate = f"{current} {word}".strip()
        if stringWidth(candidate, font, size) <= width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def draw_text(pdf, text, x, y, width, theme, font="Helvetica", size=10, leading=13, color="ink"):
    pdf.setFont(font, size)
    pdf.setFillColor(c(theme, color))
    for line in wrap_text(text, font, size, width):
        pdf.drawString(x, y, line)
        y -= leading
    return y


def draw_upper(pdf, text, x, y, theme, size=7.2):
    pdf.setFont("Helvetica-Bold", size)
    pdf.setFillColor(c(theme, "accent"))
    pdf.drawString(x, y, text.upper())


def draw_upper_wrapped(pdf, text, x, y, width, theme, size=7.2, leading=10):
    lines = wrap_text(text.upper(), "Helvetica-Bold", size, width)
    for line in lines:
        draw_upper(pdf, line, x, y, theme, size)
        y -= leading
    return len(lines)


def draw_background(pdf, theme):
    width, height = PAGE_SIZE
    pdf.setFillColor(c(theme, "page"))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    pdf.setStrokeColor(c(theme, "grid"))
    pdf.setLineWidth(0.25)
    step = 28
    x = 0
    while x < width:
        pdf.line(x, 0, x, height)
        x += step
    y = 0
    while y < height:
        pdf.line(0, y, width, y)
        y += step


def round_rect(pdf, x, y, width, height, theme, fill="surface", stroke="line", radius=7, line_width=0.7):
    pdf.setFillColor(c(theme, fill))
    pdf.setStrokeColor(c(theme, stroke))
    pdf.setLineWidth(line_width)
    pdf.roundRect(x, y, width, height, radius, fill=1, stroke=1)


def draw_button(pdf, x, y, width, height, label, url, theme, primary=False):
    bg = "primary_bg" if primary else "secondary_bg"
    fg = "primary_fg" if primary else "secondary_fg"
    stroke = "primary_bg" if primary else "line"
    pdf.setFillColor(c(theme, bg))
    pdf.setStrokeColor(c(theme, stroke))
    pdf.roundRect(x, y, width, height, 6, fill=1, stroke=1)
    pdf.setFont("Helvetica-Bold", 8.8)
    pdf.setFillColor(c(theme, fg))
    pdf.drawCentredString(x + width / 2, y + height / 2 - 3.2, label)
    if url:
        pdf.linkURL(url, (x, y, x + width, y + height), relative=0)


def draw_status(pdf, x, y, width, height, label, theme):
    # Etiqueta sin enlace (por ejemplo, "Demo bajo petición"), con borde discontinuo como en la web
    pdf.setFillColor(c(theme, "surface"))
    pdf.setStrokeColor(c(theme, "muted"))
    pdf.setLineWidth(0.7)
    pdf.setDash(2.5, 2)
    pdf.roundRect(x, y, width, height, 6, fill=1, stroke=1)
    pdf.setDash()
    pdf.setFont("Helvetica-Bold", 8.8)
    pdf.setFillColor(c(theme, "muted"))
    pdf.drawCentredString(x + width / 2, y + height / 2 - 3.2, label)


def draw_cover_image(pdf, path, x, y, width, height):
    image = ImageReader(str(path))
    image_width, image_height = image.getSize()
    scale = max(width / image_width, height / image_height)
    draw_width = image_width * scale
    draw_height = image_height * scale
    draw_x = x + (width - draw_width) / 2
    draw_y = y + (height - draw_height) / 2

    pdf.saveState()
    clip = pdf.beginPath()
    clip.rect(x, y, width, height)
    pdf.clipPath(clip, stroke=0, fill=0)
    pdf.drawImage(image, draw_x, draw_y, draw_width, draw_height)
    pdf.restoreState()


def tag_width(label):
    return max(48, min(92, stringWidth(label, "Helvetica-Bold", 6.6) + 16))


def draw_tag(pdf, x, y, label, theme, width=None):
    width = width or tag_width(label)
    pdf.setFillColor(c(theme, "accent_soft"))
    pdf.setStrokeColor(c(theme, "line"))
    pdf.roundRect(x, y, width, 15, 3, fill=1, stroke=1)
    pdf.setFont("Helvetica-Bold", 6.6)
    pdf.setFillColor(c(theme, "accent"))
    pdf.drawCentredString(x + width / 2, y + 4.2, label)
    return width


def tag_rows(tags, max_width):
    rows = [[]]
    used = 0
    for tag in tags:
        w = tag_width(tag)
        if rows[-1] and used + w > max_width:
            rows.append([])
            used = 0
        rows[-1].append(tag)
        used += w + 6
    return rows if tags else []


def draw_tags(pdf, x, y, tags, theme, max_width):
    """Dibuja las etiquetas con la última fila apoyada en y (crecen hacia arriba)."""
    rows = tag_rows(tags, max_width)
    for index, row in enumerate(rows):
        cursor_x = x
        cursor_y = y + (len(rows) - 1 - index) * TAG_ROW
        for tag in row:
            cursor_x += draw_tag(pdf, cursor_x, cursor_y, tag, theme, tag_width(tag)) + 6
    return len(rows)


def draw_footer(pdf, data, theme, page_number, line_start=52):
    width, _ = PAGE_SIZE
    pdf.setStrokeColor(c(theme, "line"))
    pdf.setLineWidth(0.55)
    pdf.line(line_start, 24, width - 52, 24)
    pdf.setFont("Helvetica", 7.4)
    pdf.setFillColor(c(theme, "muted"))
    pdf.drawCentredString(width / 2, 12.5, f"Hugo Calvo García · {data['footer_label']} · {data['page_label']} {page_number}")


def draw_topbar(pdf, x, y, width, data, theme):
    round_rect(pdf, x, y, width, 52, theme, fill="surface", stroke="line")
    draw_button(pdf, x + 14, y + 12, 35, 28, data["language_primary"], data["web"], theme, primary=True)
    draw_button(pdf, x + 58, y + 12, 35, 28, data["language_secondary"], data["alternate_web"], theme, primary=False)
    pdf.setFont("Helvetica-Bold", 8.7)
    pdf.setFillColor(c(theme, "muted"))
    pdf.drawRightString(x + width - 116, y + 29, data["static_label"])
    draw_button(pdf, x + width - 104, y + 12, 90, 28, data["open_web_label"], data["web"], theme, primary=False)


def draw_section_title(pdf, text, x, y, theme, size=23):
    pdf.setFont("Helvetica-Bold", size)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(x, y, text)


def draw_profile_sidebar(pdf, x, y, width, height, data, theme):
    round_rect(pdf, x, y, width, height, theme)
    padding = 18
    inner = width - padding * 2
    button_h = 34
    button_y = y + padding

    kicker_lines = len(wrap_text(data["kicker"].upper(), "Helvetica-Bold", 7.2, inner))
    role_lines = len(wrap_text(data["role"], "Helvetica", 11, inner))

    # Espacio desde la línea del kicker hasta el final del texto del rol
    text_block = (kicker_lines - 1) * 10 + 34 + 33 + 26 + (role_lines - 1) * 15 + 4
    # La foto ocupa lo que sobra para que el rol nunca quede debajo de los botones
    photo_gap = 20
    space_for_photo = height - padding * 2 - button_h - 14 - text_block - photo_gap
    photo = max(90, min(145, space_for_photo))

    img_path = ROOT / "img" / "porfile.jpg"
    photo_y = y + height - padding - photo
    if img_path.exists():
        draw_cover_image(pdf, img_path, x + padding, photo_y, photo, photo)
        pdf.setStrokeColor(c(theme, "line"))
        pdf.roundRect(x + padding, photo_y, photo, photo, 6, fill=0, stroke=1)

    text_y = photo_y - photo_gap
    draw_upper_wrapped(pdf, data["kicker"], x + padding, text_y, inner, theme)
    name_y = text_y - (kicker_lines - 1) * 10 - 34
    pdf.setFont("Helvetica-Bold", 31)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(x + padding, name_y, "Hugo Calvo")
    pdf.drawString(x + padding, name_y - 33, "García")
    draw_text(pdf, data["role"], x + padding, name_y - 59, inner, theme, size=11, leading=15, color="muted")

    draw_button(pdf, x + padding, button_y, 90, button_h, data["portfolio_label"], data["portfolio"], theme, primary=True)
    draw_button(pdf, x + padding + 100, button_y, 96, button_h, data["pdf_label"], data["download_pdf"], theme, primary=False)


def draw_contact_card(pdf, x, y, width, height, data, theme):
    round_rect(pdf, x, y, width, height, theme)
    px = x + 18
    top = y + height - 24
    pdf.setFont("Helvetica-Bold", 11)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(px, top, data["contact_title"])

    entries = [
        (data["phone_label"], "+34 638 091 795", LINKS["phone"]),
        ("Email", "hugocgarciat@gmail.com", LINKS["email"]),
        (data["location_label"], data["location"], None),
        (data["mobility_label"], data["mobility"], None),
    ]
    yy = top - 26
    for label, value, url in entries:
        draw_upper(pdf, label, px, yy, theme, size=7)
        pdf.setFont("Helvetica-Bold", 9.8)
        pdf.setFillColor(c(theme, "ink" if not url else "accent"))
        pdf.drawString(px, yy - 15, value)
        if url:
            pdf.linkURL(url, (px, yy - 18, px + stringWidth(value, "Helvetica-Bold", 9.8), yy - 4), relative=0)
        yy -= 29

    draw_upper(pdf, "Links", px, yy, theme, size=7)
    link_y = yy - 15
    pdf.setFont("Helvetica-Bold", 9.8)
    pdf.setFillColor(c(theme, "accent"))
    pdf.drawString(px, link_y, "LinkedIn")
    pdf.linkURL(LINKS["linkedin"], (px, link_y - 3, px + 42, link_y + 10), relative=0)
    pdf.drawString(px + 50, link_y, "GitHub")
    pdf.linkURL(LINKS["github"], (px + 50, link_y - 3, px + 92, link_y + 10), relative=0)


def draw_intro_card(pdf, x, y, width, height, data, theme):
    round_rect(pdf, x, y, width, height, theme)
    px = x + 24
    metric_h = 88
    metric_y = y + 32
    metrics_top = metric_y + metric_h

    # Ajusta el tamaño del titular para que el texto nunca pise las métricas
    for title_size in (42, 40, 38, 36, 34, 32, 30):
        title_leading = title_size * 1.07
        title_lines = wrap_text(data["intro_title"], "Helvetica-Bold", title_size, width - 48)
        intro_lines = wrap_text(data["intro"], "Helvetica", 12, width - 62)
        bottom = y + height - 36 - 39 - title_leading * len(title_lines) - 8 - 18 * (len(intro_lines) - 1)
        if bottom - 4 >= metrics_top + 18:
            break

    yy = y + height - 36
    draw_upper(pdf, data["cv_kicker"], px, yy, theme)
    yy -= 39
    pdf.setFont("Helvetica-Bold", title_size)
    pdf.setFillColor(c(theme, "ink"))
    for line in title_lines:
        pdf.drawString(px, yy, line)
        yy -= title_leading
    yy -= 8
    draw_text(pdf, data["intro"], px, yy, width - 62, theme, size=12, leading=18, color="muted")

    metric_w = (width - 48 - 18 * 2) / 3
    for index, (number, label) in enumerate(data["metrics"]):
        mx = px + index * (metric_w + 18)
        round_rect(pdf, mx, metric_y, metric_w, metric_h, theme, fill="surface", stroke="line")
        pdf.setFont("Helvetica-Bold", 28)
        pdf.setFillColor(c(theme, "warm"))
        pdf.drawString(mx + 14, metric_y + 54, number)
        draw_text(pdf, label, mx + 14, metric_y + 38, metric_w - 28, theme, size=9.2, leading=13, color="muted")


def draw_cta_banner(pdf, x, y, width, data, theme):
    round_rect(pdf, x, y, width, 48, theme, fill="accent_soft", stroke="accent")
    pdf.setFont("Helvetica-Bold", 10)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(x + 16, y + 28, data["cta_title"])
    draw_text(pdf, data["cta_text"], x + 16, y + 14, width - 190, theme, size=8.4, leading=10.5, color="muted")
    draw_button(pdf, x + width - 166, y + 10, 66, 28, data["open_web_label"], data["web"], theme, primary=True)
    draw_button(pdf, x + width - 92, y + 10, 76, 28, data["portfolio_label"], data["portfolio"], theme, primary=False)


def simple_card_height(width, body, tags, title_size=12):
    body_lines = len(wrap_text(body, "Helvetica", CARD_BODY_SIZE, width - 24))
    rows = len(tag_rows(tags, width - 24))
    text = 23 + 18 + CARD_BODY_LEADING * (body_lines - 1) + 4
    tags_h = (14 + 15 + (rows - 1) * TAG_ROW + 6) if rows else 10
    return text + tags_h


def draw_simple_card(pdf, x, y, width, height, title, body, tags, theme):
    round_rect(pdf, x, y, width, height, theme)
    px = x + 12
    yy = y + height - 23
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(px, yy, title)
    draw_text(pdf, body, px, yy - 18, width - 24, theme, size=CARD_BODY_SIZE, leading=CARD_BODY_LEADING, color="muted")
    if tags:
        draw_tags(pdf, px, y + 14, tags, theme, width - 24)


def project_card_height(width, project):
    body_lines = len(wrap_text(project["body"], "Helvetica", CARD_BODY_SIZE, width - 24))
    rows = len(tag_rows(project["tags"], width - 24))
    text = 20 + 18 + 18 + CARD_BODY_LEADING * (body_lines - 1) + 4
    footer = 12 + 26 + 10 + 15 + (rows - 1) * TAG_ROW + 8
    return text + footer


def draw_project_card(pdf, x, y, width, height, project, theme):
    round_rect(pdf, x, y, width, height, theme)
    px = x + 12
    yy = y + height - 20
    draw_upper(pdf, project["kicker"], px, yy, theme)
    yy -= 18
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(px, yy, project["title"])
    draw_text(pdf, project["body"], px, yy - 18, width - 24, theme, size=CARD_BODY_SIZE, leading=CARD_BODY_LEADING, color="muted")
    draw_tags(pdf, px, y + 48, project["tags"], theme, width - 24)
    label, url = project["button"]
    if url:
        draw_button(pdf, px, y + 12, 86, 26, label, url, theme, primary=True)
    else:
        draw_status(pdf, px, y + 12, max(86, stringWidth(label, "Helvetica-Bold", 8.8) + 24), 26, label, theme)


def achievement_height(width, data):
    title_lines = len(wrap_text(data["achievement_title"], "Helvetica-Bold", 12, width - 24))
    body_lines = len(wrap_text(data["achievement_body"], "Helvetica", CARD_BODY_SIZE, width - 24))
    return 20 + 18 + 15 * (title_lines - 1) + 16 + CARD_BODY_LEADING * (body_lines - 1) + 14


def draw_achievement(pdf, x, y, width, height, data, theme):
    round_rect(pdf, x, y, width, height, theme, fill="surface", stroke="accent")
    px = x + 12
    yy = y + height - 20
    draw_upper(pdf, data["achievement_kicker"], px, yy, theme)
    yy -= 18
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(c(theme, "ink"))
    for line in wrap_text(data["achievement_title"], "Helvetica-Bold", 12, width - 24):
        pdf.drawString(px, yy, line)
        yy -= 15
    draw_text(pdf, data["achievement_body"], px, yy - 1, width - 24, theme, size=CARD_BODY_SIZE, leading=CARD_BODY_LEADING, color="muted")


def timeline_entry_height(width, item):
    _, title, body = item
    title_lines = len(wrap_text(title, "Helvetica-Bold", 10.8, width - 88))
    body_lines = len(wrap_text(body, "Helvetica", 8.9, width - 88))
    return 14 * (title_lines - 1) + 16 + 11.5 * (body_lines - 1) + 20


def draw_timeline(pdf, x, y, width, items, theme):
    yy = y
    for item in items:
        date, title, body = item
        entry_h = timeline_entry_height(width, item)
        pdf.setFont("Helvetica-Bold", 8.8)
        pdf.setFillColor(c(theme, "warm"))
        pdf.drawString(x, yy, date)
        pdf.setStrokeColor(c(theme, "line"))
        pdf.line(x + 76, yy + 5, x + 76, yy - entry_h + 13)
        pdf.setFont("Helvetica-Bold", 10.8)
        pdf.setFillColor(c(theme, "ink"))
        ty = yy
        for line in wrap_text(title, "Helvetica-Bold", 10.8, width - 88):
            pdf.drawString(x + 88, ty, line)
            ty -= 14
        draw_text(pdf, body, x + 88, ty - 2, width - 88, theme, size=8.9, leading=11.5, color="muted")
        yy -= entry_h
    return yy


def page_one(pdf, data, theme):
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 18
    gap = 22
    side_w = 250
    main_x = margin + side_w + gap
    main_w = width - main_x - margin
    top = height - margin

    profile_h = 350
    draw_profile_sidebar(pdf, margin, top - profile_h, side_w, profile_h, data, theme)
    draw_contact_card(pdf, margin, margin, side_w, top - profile_h - margin - 18, data, theme)
    draw_topbar(pdf, main_x, top - 52, main_w, data, theme)
    draw_intro_card(pdf, main_x, margin + 44, main_w, top - 52 - 12 - margin - 44, data, theme)
    draw_footer(pdf, data, theme, 1, line_start=main_x)
    pdf.showPage()


def page_two(pdf, data, theme):
    """Productos (2x2) y caso real."""
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 28
    top = height - margin
    draw_cta_banner(pdf, margin, top - 48, width - margin * 2, data, theme)

    y_title = top - 82
    draw_section_title(pdf, data["projects_title"], margin, y_title, theme)

    gap = 18
    card_w = (width - margin * 2 - gap) / 2
    projects = data["projects"]
    cursor = y_title - 16
    for row in range(0, len(projects), 2):
        pair = projects[row:row + 2]
        card_h = max(project_card_height(card_w, p) for p in pair)
        for col, project in enumerate(pair):
            draw_project_card(pdf, margin + col * (card_w + gap), cursor - card_h, card_w, card_h, project, theme)
        cursor -= card_h + 12

    full_w = width - margin * 2
    ach_h = achievement_height(full_w, data)
    draw_achievement(pdf, margin, cursor - ach_h, full_w, ach_h, data, theme)
    assert cursor - ach_h > 40, "La página 2 no cabe"

    draw_footer(pdf, data, theme, 2)
    pdf.showPage()


def page_three(pdf, data, theme):
    """Stack técnico, formación y experiencia."""
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 28
    top = height - margin
    draw_topbar(pdf, margin, top - 52, width - margin * 2, data, theme)

    stack_title_y = top - 86
    draw_section_title(pdf, data["stack_title"], margin, stack_title_y, theme)
    gap = 18
    cols = 3
    card_w = (width - margin * 2 - gap * (cols - 1)) / cols
    cursor = stack_title_y - 14
    stack = data["stack"]
    for row in range(0, len(stack), cols):
        group = stack[row:row + cols]
        card_h = max(simple_card_height(card_w, s["body"], s["tags"]) for s in group)
        for col, item in enumerate(group):
            draw_simple_card(pdf, margin + col * (card_w + gap), cursor - card_h, card_w, card_h, item["title"], item["body"], item["tags"], theme)
        cursor -= card_h + 10

    left_w = 455
    right_x = margin + left_w + 24
    right_w = width - right_x - margin

    title_y = cursor - 26
    draw_section_title(pdf, data["education_title"], margin, title_y, theme)
    left_bottom = draw_timeline(pdf, margin, title_y - 28, left_w, data["education"], theme)

    draw_section_title(pdf, data["work_title"], right_x, title_y, theme)
    yy = title_y - 14
    for item in data["traits"]:
        card_h = simple_card_height(right_w, item["body"], [])
        draw_simple_card(pdf, right_x, yy - card_h, right_w, card_h, item["title"], item["body"], [], theme)
        yy -= card_h + 10

    assert left_bottom > 30 and yy > 40, f"La página 3 no cabe ({left_bottom:.0f}, {yy:.0f})"
    draw_footer(pdf, data, theme, 3)
    pdf.showPage()


def build_pdf(output_path, data, theme_name):
    theme = THEMES[theme_name]
    pdf = canvas.Canvas(str(output_path), pagesize=PAGE_SIZE)
    pdf.setTitle(data["title"])
    pdf.setAuthor("Hugo Calvo García")
    pdf.setSubject(data["subject"])
    page_one(pdf, data, theme)
    page_two(pdf, data, theme)
    page_three(pdf, data, theme)
    pdf.save()


SPANISH = {
    "title": "Currículum Hugo Calvo García",
    "subject": "Currículum actualizado de Hugo Calvo García",
    "footer_label": "CV web estático",
    "page_label": "página",
    "language_primary": "ES",
    "language_secondary": "EN",
    "static_label": "Versión estática",
    "open_web_label": "Abrir web",
    "cta_title": "Versión estática del CV",
    "cta_text": "Para mejor visibilidad, animaciones y navegación interactiva, visita la web.",
    "kicker": "Full-stack · IA aplicada · Ciberseguridad",
    "role": "Construyo y lanzo productos propios y aplicaciones web de principio a fin, del producto al soporte.",
    "cv_kicker": "Currículum web",
    "intro_title": "Construyo y lanzo software de principio a fin.",
    "intro": "Desarrollador full-stack y autónomo. Construyo y lanzo productos propios (GEOPilot, Gestolio, Hostiva y DadoManía), cubriendo el ciclo completo: producto, desarrollo, despliegue y soporte. Técnico Superior en DAM (2026). Trabajo a diario con IA: la integro en mis productos, diseño sistemas de agentes y desarrollo con agentes de código. Cursando un Máster en Ciberseguridad (2026 - 2027), con foco en seguridad de aplicaciones web.",
    "metrics": [
        ("3", "productos en producción (GEOPilot, Gestolio y DadoManía)"),
        ("1", "plataforma en desarrollo con foco en seguridad (Hostiva)"),
        ("C1", "inglés con estancia académica en Canadá"),
    ],
    "stack_title": "Stack técnico",
    "projects_title": "Productos en producción y en desarrollo",
    "education_title": "Formación",
    "work_title": "Experiencia",
    "contact_title": "Contacto",
    "phone_label": "Tel",
    "location_label": "Ubicación",
    "location": "Madrid, España",
    "mobility_label": "Movilidad",
    "mobility": "Carné de conducir B y vehículo propio",
    "portfolio_label": "Ver portfolio",
    "pdf_label": "Descargar PDF",
    "web": LINKS["web_es"],
    "alternate_web": LINKS["web_en"],
    "portfolio": LINKS["portfolio_es"],
    "download_pdf": LINKS["web_es"],
    "stack": [
        {"title": "Frontend", "body": "HTML5, CSS responsive, JavaScript, React, Next.js y accesibilidad.", "tags": ["React", "Next.js", "JavaScript", "CSS"]},
        {"title": "Backend y datos", "body": "Node.js, Firebase, Supabase, SQL y APIs REST para producto real.", "tags": ["Node.js", "Firebase", "Supabase", "SQL"]},
        {"title": "Producto y negocio", "body": "Stripe (suscripciones), Vercel, PWA, SEO/GEO y analítica.", "tags": ["Stripe", "Vercel", "PWA", "SEO/GEO"]},
        {"title": "Seguridad", "body": "2FA con TOTP, passkeys (WebAuthn), Row Level Security, cifrado de datos y OWASP Top 10.", "tags": ["2FA TOTP", "WebAuthn", "RLS", "OWASP"]},
        {"title": "IA aplicada", "body": "IA en producto, agentes con aprobación humana, desarrollo con agentes de código, GEO y prompts.", "tags": ["Agentes", "Claude Code", "Gemini", "GEO"]},
        {"title": "Base DAM", "body": "Java, Python y Android.", "tags": ["Java", "Python", "Android"]},
    ],
    "projects": [
        {
            "kicker": "SaaS propio · En producción",
            "title": "GEOPilot",
            "body": "SaaS de contenido para SEO y GEO: generación de artículos con IA, calculadora de costes por tokens, calendario editorial y visibilidad en motores de IA. Validado con Gestolio, citado como fuente por la IA de Google y por Perplexity.",
            "tags": ["Next.js", "Firebase", "Gemini + Claude", "Stripe", "Vercel"],
            "button": ("Ver producto", LINKS["geopilot"]),
        },
        {
            "kicker": "SaaS propio · En producción",
            "title": "Gestolio",
            "body": "PWA fiscal para autónomos: facturación, gastos, IVA e IRPF, Modelos 303 y 130, calendario fiscal y asistente IA. Freemium con suscripciones Stripe y acceso sin contraseña con passkeys (WebAuthn).",
            "tags": ["Next.js 14", "Supabase", "Stripe", "WebAuthn", "PWA"],
            "button": ("Ver producto", LINKS["gestolio"]),
        },
        {
            "kicker": "Plataforma propia · En desarrollo (fase 1 completada)",
            "title": "Hostiva",
            "body": "Reservas directas, check-in online y registro de viajeros (SES Hospedajes) para pisos turísticos, con la seguridad como requisito: 2FA con TOTP, Row Level Security, datos de check-in cifrados, tests y revisión de seguridad.",
            "tags": ["Supabase", "Row Level Security", "2FA TOTP", "Stripe", "Cifrado"],
            "button": ("Demo bajo petición", None),
        },
        {
            "kicker": "Juego propio · En producción",
            "title": "DadoManía",
            "body": "Juego web de estrategia y defensa con dados, con usuarios reales jugando. Progresión por cofres, tienda con moneda del juego y entorno de pruebas separado de producción para validar cada versión.",
            "tags": ["Supabase", "Vercel"],
            "button": ("Ver juego", LINKS["dadomania"]),
        },
    ],
    "achievement_kicker": "Logro destacado",
    "achievement_title": "Caso real: Gestolio citado por la IA de Google y por Perplexity",
    "achievement_body": "Gestolio aparece como fuente en las respuestas de la IA de Google y de Perplexity sobre el Modelo 303, y GEOPilot lo detecta en 2 de 3 IAs consultadas.",
    "education": [
        ("2026 - 2027", "Máster en Ciberseguridad · Digitech FP · En curso", "Seguridad ofensiva y defensiva, con foco en aplicaciones web."),
        ("2024 - 2026", "Grado Superior Dual en Desarrollo de Aplicaciones Multiplataforma", "Título de Técnico Superior obtenido en 2026. Formación centrada en programación, bases de datos, desarrollo web, desarrollo móvil y sistemas."),
        ("2023 - 2024", "Universidad Rey Juan Carlos", "Grado en Ciencia, Gestión e Ingeniería de Servicios. Primer contacto universitario con tecnología, gestión y trabajo en equipo."),
        ("2022 - 2023", "Salmon Arm Secondary, Canadá", "Bachillerato científico cursado en inglés, con inmersión académica y cultural."),
    ],
    "traits": [
        {"title": "Full-stack y fundador (autónomo)", "body": "2025 - Actualidad. Diseño y desarrollo de SaaS propios y plataformas a medida: producto, suscripciones con Stripe, despliegue y soporte. Sistema propio de agentes de IA con aprobación humana para el marketing de mis productos."},
        {"title": "Desarrollador web en agencia", "body": "2024 - 2025. Desarrollo web para clientes: maquetación HTML/CSS, firmas de email HTML y WordPress."},
    ],
}

ENGLISH = {
    **SPANISH,
    "title": "Resume Hugo Calvo García",
    "subject": "Updated resume for Hugo Calvo García",
    "footer_label": "static web resume",
    "page_label": "page",
    "language_primary": "EN",
    "language_secondary": "ES",
    "static_label": "Static version",
    "open_web_label": "Open web",
    "cta_title": "Static resume version",
    "cta_text": "For better visibility, animations and interactive navigation, visit the website.",
    "kicker": "Full-stack · Applied AI · Cybersecurity",
    "role": "I build and ship my own products and web applications from start to finish, from product to support.",
    "cv_kicker": "Web resume",
    "intro_title": "I build and ship software from start to finish.",
    "intro": "Full-stack developer and freelancer. I build and ship my own products (GEOPilot, Gestolio, Hostiva and DadoManía), covering the full cycle: product, development, deployment and support. Higher Technician in Multiplatform Application Development, DAM (2026). I work daily with AI: I integrate it into my products, design agent systems and build with coding agents. Currently pursuing a Cybersecurity Master's (2026 - 2027), with a focus on web application security.",
    "metrics": [
        ("3", "products in production (GEOPilot, Gestolio and DadoManía)"),
        ("1", "platform in development with a security focus (Hostiva)"),
        ("C1", "English with an academic year in Canada"),
    ],
    "stack_title": "Technical stack",
    "projects_title": "Products in production and in development",
    "education_title": "Education",
    "work_title": "Experience",
    "contact_title": "Contact",
    "phone_label": "Phone",
    "location_label": "Location",
    "location": "Madrid, Spain",
    "mobility_label": "Mobility",
    "mobility": "Driving licence (B) and own car",
    "portfolio_label": "View portfolio",
    "pdf_label": "Download PDF",
    "web": LINKS["web_en"],
    "alternate_web": LINKS["web_es"],
    "portfolio": LINKS["portfolio_en"],
    "download_pdf": LINKS["web_en"],
    "stack": [
        {"title": "Frontend", "body": "HTML5, responsive CSS, JavaScript, React, Next.js and accessibility.", "tags": ["React", "Next.js", "JavaScript", "CSS"]},
        {"title": "Backend and data", "body": "Node.js, Firebase, Supabase, SQL and REST APIs for real products.", "tags": ["Node.js", "Firebase", "Supabase", "SQL"]},
        {"title": "Product and business", "body": "Stripe (subscriptions), Vercel, PWA, SEO/GEO and analytics.", "tags": ["Stripe", "Vercel", "PWA", "SEO/GEO"]},
        {"title": "Security", "body": "2FA with TOTP, passkeys (WebAuthn), Row Level Security, data encryption and OWASP Top 10.", "tags": ["2FA TOTP", "WebAuthn", "RLS", "OWASP"]},
        {"title": "Applied AI", "body": "AI in products, human-in-the-loop agents, coding agents (Claude Code, Gemini), GEO and prompts.", "tags": ["Agents", "Claude Code", "Gemini", "GEO"]},
        {"title": "DAM foundation", "body": "Java, Python and Android.", "tags": ["Java", "Python", "Android"]},
    ],
    "projects": [
        {
            "kicker": "Own SaaS · In production",
            "title": "GEOPilot",
            "body": "SaaS for SEO and GEO content: AI article generation, token-based cost calculator, editorial calendar and AI-engine visibility. Validated with Gestolio, cited as a source by Google AI and Perplexity.",
            "tags": ["Next.js", "Firebase", "Gemini + Claude", "Stripe", "Vercel"],
            "button": ("View product", LINKS["geopilot"]),
        },
        {
            "kicker": "Own SaaS · In production",
            "title": "Gestolio",
            "body": "Fiscal PWA for Spanish freelancers: invoicing, expenses, VAT and income tax, quarterly tax summaries, fiscal calendar and an AI assistant. Freemium with Stripe subscriptions and passwordless sign-in with passkeys (WebAuthn).",
            "tags": ["Next.js 14", "Supabase", "Stripe", "WebAuthn", "PWA"],
            "button": ("View product", LINKS["gestolio"]),
        },
        {
            "kicker": "Own platform · In development (phase 1 completed)",
            "title": "Hostiva",
            "body": "Direct booking, online check-in and guest registration (Spanish SES Hospedajes) for tourist apartments, with security as a requirement: 2FA with TOTP, Row Level Security, encrypted check-in data, tests and security review.",
            "tags": ["Supabase", "Row Level Security", "2FA TOTP", "Stripe", "Encryption"],
            "button": ("Demo on request", None),
        },
        {
            "kicker": "Own game · In production",
            "title": "DadoManía",
            "body": "Web strategy and dice defense game with real players. Chest progression, in-game currency shop and a staging environment separated from production to validate every release.",
            "tags": ["Supabase", "Vercel"],
            "button": ("View game", LINKS["dadomania"]),
        },
    ],
    "achievement_kicker": "Featured achievement",
    "achievement_title": "Real case: Gestolio cited by Google AI and Perplexity",
    "achievement_body": "Gestolio appears as a source in Google AI and Perplexity answers about Spain's Form 303 VAT return, and GEOPilot detects it in 2 out of 3 AI engines queried.",
    "education": [
        ("2026 - 2027", "Cybersecurity Master's · Digitech FP · In progress", "Offensive and defensive security, with a focus on web applications."),
        ("2024 - 2026", "Dual Higher Degree in Multiplatform Application Development", "Higher Technician degree completed in 2026. Training focused on programming, databases, web development, mobile development and systems."),
        ("2023 - 2024", "Rey Juan Carlos University", "Degree in Science, Management and Service Engineering. Early university experience with technology, management and teamwork."),
        ("2022 - 2023", "Salmon Arm Secondary, Canada", "Scientific baccalaureate studied in English, with academic and cultural immersion."),
    ],
    "traits": [
        {"title": "Full-stack developer and founder (freelance)", "body": "2025 - Present. Design and development of my own SaaS products and custom platforms: product, Stripe subscriptions, deployment and support. Custom AI agent system with human approval to automate marketing for my products."},
        {"title": "Web developer at an agency", "body": "2024 - 2025. Web development for clients: HTML/CSS layout, HTML email signatures and WordPress."},
    ],
}


DATA = {"es": SPANISH, "en": ENGLISH}


if __name__ == "__main__":
    for filename, theme_name, lang in OUTPUTS:
        output_path = ROOT / filename
        build_pdf(output_path, DATA[lang], theme_name)
        print(f"Generated {output_path}")
