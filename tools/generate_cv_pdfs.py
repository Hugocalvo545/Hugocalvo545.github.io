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
    "linkedin": "https://www.linkedin.com/in/hugo-calvo-garc%C3%ADa-9b980a329?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
    "github": "https://github.com/Hugocalvo545",
    "web_es": "https://hugocalvo.dev/",
    "web_en": "https://hugocalvo.dev/curriculum_english.html",
    "portfolio_es": "https://hugocalvo.dev/portfolio/portfolio.html",
    "portfolio_en": "https://hugocalvo.dev/portfolio/portfolio_eng.html",
    "geopilot": "https://geopilot.es",
    "gestolio": "https://gestolio.com",
    "jerez": "https://jla-demo.web.app/multi/",
}


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
    pdf.linkURL(url, (x, y, x + width, y + height), relative=0)


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


def draw_tag(pdf, x, y, label, theme, width=None):
    width = width or max(48, stringWidth(label, "Helvetica-Bold", 6.6) + 16)
    pdf.setFillColor(c(theme, "accent_soft"))
    pdf.setStrokeColor(c(theme, "line"))
    pdf.roundRect(x, y, width, 15, 3, fill=1, stroke=1)
    pdf.setFont("Helvetica-Bold", 6.6)
    pdf.setFillColor(c(theme, "accent"))
    pdf.drawCentredString(x + width / 2, y + 4.2, label)
    return width


def draw_tags(pdf, x, y, tags, theme, max_width):
    cursor_x = x
    cursor_y = y
    for tag in tags:
        tag_width = max(48, min(92, stringWidth(tag, "Helvetica-Bold", 6.6) + 16))
        if cursor_x + tag_width > x + max_width:
            cursor_x = x
            cursor_y -= 19
        draw_tag(pdf, cursor_x, cursor_y, tag, theme, tag_width)
        cursor_x += tag_width + 6
    return cursor_y - 3


def draw_footer(pdf, data, theme, page_number, line_start=52):
    width, _ = PAGE_SIZE
    pdf.setStrokeColor(c(theme, "line"))
    pdf.setLineWidth(0.55)
    pdf.line(line_start, 24, width - 52, 24)
    pdf.setFont("Helvetica", 7.4)
    pdf.setFillColor(c(theme, "muted"))
    pdf.drawCentredString(width / 2, 12.5, f"Hugo Calvo García · {data['footer_label']} · página {page_number}")


def draw_topbar(pdf, x, y, width, data, theme):
    round_rect(pdf, x, y, width, 52, theme, fill="surface", stroke="line")
    draw_button(pdf, x + 14, y + 12, 35, 28, data["language_primary"], data["web"], theme, primary=True)
    draw_button(pdf, x + 58, y + 12, 35, 28, data["language_secondary"], data["alternate_web"], theme, primary=False)
    pdf.setFont("Helvetica-Bold", 8.7)
    pdf.setFillColor(c(theme, "muted"))
    pdf.drawRightString(x + width - 116, y + 29, data["static_label"])
    draw_button(pdf, x + width - 104, y + 12, 90, 28, data["open_web_label"], data["web"], theme, primary=False)


def draw_profile_sidebar(pdf, x, y, width, height, data, theme):
    round_rect(pdf, x, y, width, height, theme)
    padding = 18
    img_path = ROOT / "img" / "porfile.jpg"
    if img_path.exists():
        draw_cover_image(pdf, img_path, x + padding, y + height - padding - 145, 145, 145)
        pdf.setStrokeColor(c(theme, "line"))
        pdf.roundRect(x + padding, y + height - padding - 145, 145, 145, 6, fill=0, stroke=1)

    text_y = y + height - padding - 168
    draw_upper(pdf, data["kicker"], x + padding, text_y, theme)
    pdf.setFont("Helvetica-Bold", 31)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(x + padding, text_y - 36, "Hugo Calvo")
    pdf.drawString(x + padding, text_y - 69, "García")
    draw_text(pdf, data["role"], x + padding, text_y - 96, width - padding * 2, theme, size=11, leading=15, color="muted")

    button_y = y + 24
    draw_button(pdf, x + padding, button_y, 90, 34, data["portfolio_label"], data["portfolio"], theme, primary=True)
    draw_button(pdf, x + padding + 100, button_y, 96, 34, data["pdf_label"], data["download_pdf"], theme, primary=False)


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
        (data["location_label"], "Madrid, España", None),
    ]
    yy = top - 27
    for label, value, url in entries:
        draw_upper(pdf, label, px, yy, theme, size=7)
        pdf.setFont("Helvetica-Bold", 9.8)
        pdf.setFillColor(c(theme, "ink" if not url else "accent"))
        pdf.drawString(px, yy - 15, value)
        if url:
            pdf.linkURL(url, (px, yy - 18, px + stringWidth(value, "Helvetica-Bold", 9.8), yy - 4), relative=0)
        yy -= 32

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
    yy = y + height - 36
    draw_upper(pdf, data["cv_kicker"], px, yy, theme)
    yy -= 39
    pdf.setFont("Helvetica-Bold", 42)
    pdf.setFillColor(c(theme, "ink"))
    for line in wrap_text(data["intro_title"], "Helvetica-Bold", 42, width - 48):
        pdf.drawString(px, yy, line)
        yy -= 45
    yy -= 8
    yy = draw_text(pdf, data["intro"], px, yy, width - 62, theme, size=12, leading=18, color="muted")

    metric_y = y + 32
    metric_w = (width - 48 - 18 * 2) / 3
    for index, (number, label) in enumerate(data["metrics"]):
        mx = px + index * (metric_w + 18)
        round_rect(pdf, mx, metric_y, metric_w, 78, theme, fill="surface", stroke="line")
        pdf.setFont("Helvetica-Bold", 28)
        pdf.setFillColor(c(theme, "warm"))
        pdf.drawString(mx + 14, metric_y + 42, number)
        draw_text(pdf, label, mx + 14, metric_y + 28, metric_w - 28, theme, size=9.2, leading=13, color="muted")


def draw_cta_banner(pdf, x, y, width, data, theme):
    round_rect(pdf, x, y, width, 48, theme, fill="accent_soft", stroke="accent")
    pdf.setFont("Helvetica-Bold", 10)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(x + 16, y + 28, data["cta_title"])
    draw_text(pdf, data["cta_text"], x + 16, y + 14, width - 168, theme, size=8.4, leading=10.5, color="muted")
    draw_button(pdf, x + width - 144, y + 10, 62, 28, data["open_web_label"], data["web"], theme, primary=True)
    draw_button(pdf, x + width - 74, y + 10, 58, 28, data["portfolio_label"], data["portfolio"], theme, primary=False)


def draw_simple_card(pdf, x, y, width, height, title, body, tags, data, theme, button=None):
    round_rect(pdf, x, y, width, height, theme)
    px = x + 12
    yy = y + height - 23
    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(px, yy, title)
    yy = draw_text(pdf, body, px, yy - 18, width - 24, theme, size=9.1, leading=12.2, color="muted")
    draw_tags(pdf, px, y + 14 + (38 if button else 0), tags, theme, width - 24)
    if button:
        draw_button(pdf, px, y + 12, 86, 26, button[0], button[1], theme, primary=True)


def draw_timeline(pdf, x, y, width, items, theme):
    yy = y
    for date, title, body in items:
        pdf.setFont("Helvetica-Bold", 8.8)
        pdf.setFillColor(c(theme, "warm"))
        pdf.drawString(x, yy, date)
        pdf.setStrokeColor(c(theme, "line"))
        pdf.line(x + 76, yy + 5, x + 76, yy - 42)
        pdf.setFont("Helvetica-Bold", 10.8)
        pdf.setFillColor(c(theme, "ink"))
        pdf.drawString(x + 88, yy, title)
        draw_text(pdf, body, x + 88, yy - 16, width - 88, theme, size=8.9, leading=11.5, color="muted")
        yy -= 55


def page_one(pdf, data, theme):
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 18
    gap = 22
    side_w = 250
    main_x = margin + side_w + gap
    main_w = width - main_x - margin
    top = height - margin

    profile_h = 365
    draw_profile_sidebar(pdf, margin, top - profile_h, side_w, profile_h, data, theme)
    draw_contact_card(pdf, margin, margin, side_w, top - profile_h - margin - 18, data, theme)
    draw_topbar(pdf, main_x, top - 52, main_w, data, theme)
    draw_intro_card(pdf, main_x, margin + 44, main_w, top - 52 - 12 - margin - 44, data, theme)
    draw_footer(pdf, data, theme, 1, line_start=main_x)
    pdf.showPage()


def page_two(pdf, data, theme):
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 28
    top = height - margin
    draw_cta_banner(pdf, margin, top - 48, width - margin * 2, data, theme)

    y_title = top - 82
    pdf.setFont("Helvetica-Bold", 23)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(margin, y_title, data["stack_title"])

    card_w = (width - margin * 2 - 18) / 2
    card_h = 92
    y1 = y_title - 108
    y2 = y1 - card_h - 12
    for index, item in enumerate(data["stack"]):
        col = index % 2
        row = index // 2
        x = margin + col * (card_w + 18)
        y = y1 if row == 0 else y2
        draw_simple_card(pdf, x, y, card_w, card_h, item["title"], item["body"], item["tags"], data, theme)

    project_title_y = y2 - 44
    pdf.setFont("Helvetica-Bold", 23)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(margin, project_title_y, data["projects_title"])
    project_w = (width - margin * 2 - 18 * 2) / 3
    project_y = 58
    for index, project in enumerate(data["projects"]):
        x = margin + index * (project_w + 18)
        draw_simple_card(
            pdf,
            x,
            project_y,
            project_w,
            project_title_y - project_y - 18,
            project["title"],
            project["body"],
            project["tags"],
            data,
            theme,
            button=project["button"],
        )

    draw_footer(pdf, data, theme, 2)
    pdf.showPage()


def page_three(pdf, data, theme):
    width, height = PAGE_SIZE
    draw_background(pdf, theme)
    margin = 28
    top = height - margin
    draw_topbar(pdf, margin, top - 52, width - margin * 2, data, theme)

    left_w = 455
    right_x = margin + left_w + 24
    right_w = width - right_x - margin

    title_y = top - 92
    pdf.setFont("Helvetica-Bold", 23)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(margin, title_y, data["education_title"])
    draw_timeline(pdf, margin, title_y - 32, left_w, data["education"], theme)

    pdf.setFont("Helvetica-Bold", 23)
    pdf.setFillColor(c(theme, "ink"))
    pdf.drawString(right_x, title_y, data["work_title"])
    card_h = 88
    for index, item in enumerate(data["traits"]):
        y = title_y - 30 - index * (card_h + 12) - card_h
        draw_simple_card(pdf, right_x, y, right_w, card_h, item["title"], item["body"], [], data, theme)

    draw_cta_banner(pdf, margin, 62, width - margin * 2, data, theme)
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
    "language_primary": "ES",
    "language_secondary": "EN",
    "static_label": "Versión estática",
    "open_web_label": "Abrir web",
    "cta_title": "Versión estática del CV",
    "cta_text": "Para mejor visibilidad, animaciones y navegación interactiva, visita la web.",
    "kicker": "Full-stack · Fundador de SaaS",
    "role": "Construyo y comercializo SaaS propios y plataformas a medida para clientes reales, del producto al soporte.",
    "cv_kicker": "Currículum web",
    "intro_title": "Construyo y lanzo software que se usa y se cobra.",
    "intro": "Desarrollador full-stack y autónomo. Construyo y comercializo productos SaaS propios (GEOPilot, Gestolio) y plataformas a medida para clientes reales, cubriendo el ciclo completo: producto, desarrollo, pagos, despliegue y soporte. Técnico Superior en DAM (2026).",
    "metrics": [
        ("3", "productos en producción con usuarios y pagos reales"),
        ("2", "SaaS propios (GEOPilot y Gestolio)"),
        ("C1", "inglés con estancia académica en Canadá"),
    ],
    "stack_title": "Stack técnico",
    "projects_title": "Productos en producción",
    "education_title": "Formación",
    "work_title": "Experiencia",
    "contact_title": "Contacto",
    "phone_label": "Tel",
    "location_label": "Ubicación",
    "linkedin_label": "Perfil profesional",
    "portfolio_label": "Ver portfolio",
    "pdf_label": "Descargar PDF",
    "web": LINKS["web_es"],
    "alternate_web": LINKS["web_en"],
    "portfolio": LINKS["portfolio_es"],
    "download_pdf": LINKS["web_es"],
    "stack": [
        {"title": "Frontend", "body": "HTML5, CSS responsive, JavaScript, React, Next.js y accesibilidad.", "tags": ["React", "Next.js", "JavaScript", "CSS"]},
        {"title": "Backend y datos", "body": "Node.js, Firebase, Supabase, SQL y APIs REST para producto real.", "tags": ["Node.js", "Firebase", "Supabase", "SQL"]},
        {"title": "Producto y negocio", "body": "Stripe (suscripciones y pagos), Vercel, PWA, SEO/GEO y analítica.", "tags": ["Stripe", "Vercel", "PWA", "SEO/GEO"]},
        {"title": "IA", "body": "Integración de LLMs (API de Anthropic, Gemini), pipelines de contenido y prompt engineering.", "tags": ["Anthropic", "Gemini", "LLMs", "Prompts"]},
    ],
    "projects": [
        {"title": "GEOPilot", "body": "SaaS de contenido para SEO y GEO. Generación de artículos con IA, calculadora de costes por tokens, calendario editorial y visibilidad en motores de IA. Pagos con Stripe.", "tags": ["Next.js", "Firebase", "Stripe", "IA"], "button": ("Ver producto", LINKS["geopilot"])},
        {"title": "Gestolio", "body": "PWA fiscal para autónomos: facturación, IVA/IRPF, Modelos 303 y 130 y asistente IA. Freemium con suscripciones Stripe y acceso WebAuthn.", "tags": ["Next.js 14", "Supabase", "Stripe", "PWA"], "button": ("Ver producto", LINKS["gestolio"])},
        {"title": "Tu Casa en Jerez", "body": "Plataforma de reservas multi-propiedad para cliente real: motor de reservas con Stripe, registro de viajeros (SES), chat, fidelización y panel de administración.", "tags": ["JavaScript", "Firebase", "Stripe", "Maps"], "button": ("Ver demo", LINKS["jerez"])},
    ],
    "education": [
        ("2024 - 2026", "Grado Superior Dual en Desarrollo de Aplicaciones Multiplataforma", "Título de Técnico Superior obtenido en 2026. Formación centrada en programación, bases de datos, desarrollo web, desarrollo móvil y sistemas."),
        ("2023 - 2024", "Universidad Rey Juan Carlos", "Grado en Ciencia, Gestión e Ingeniería de Servicios. Primer contacto universitario con tecnología, gestión y trabajo en equipo."),
        ("2022 - 2023", "Salmon Arm Secondary, Canadá", "Bachillerato científico cursado en inglés, con inmersión académica y cultural."),
    ],
    "traits": [
        {"title": "Full-stack y fundador (autónomo)", "body": "2025 – Actualidad. Diseño, desarrollo y venta de SaaS propios y plataformas a medida. Ciclo completo: producto, pagos, despliegue y soporte."},
        {"title": "Desarrollador web en agencia", "body": "2024 – 2025. Desarrollo web para clientes: maquetación HTML/CSS, firmas de email HTML y WordPress."},
    ],
}

ENGLISH = {
    **SPANISH,
    "title": "Resume Hugo Calvo García",
    "subject": "Updated resume for Hugo Calvo García",
    "footer_label": "static web resume",
    "language_primary": "EN",
    "language_secondary": "ES",
    "static_label": "Static version",
    "open_web_label": "Open web",
    "cta_title": "Static resume version",
    "cta_text": "For better visibility, animations and interactive navigation, visit the website.",
    "kicker": "Full-stack · SaaS founder",
    "role": "I build and commercialize my own SaaS products and custom platforms for real clients, from product to support.",
    "cv_kicker": "Web resume",
    "intro_title": "I build and ship software that gets used and paid for.",
    "intro": "Full-stack developer and freelancer. I build and commercialize my own SaaS products (GEOPilot, Gestolio) and custom platforms for real clients, covering the full cycle: product, development, payments, deployment and support. Higher Technician in Multiplatform Application Development, DAM (2026).",
    "metrics": [
        ("3", "products in production with real users and payments"),
        ("2", "own SaaS products (GEOPilot and Gestolio)"),
        ("C1", "English with an academic year in Canada"),
    ],
    "stack_title": "Technical stack",
    "projects_title": "Products in production",
    "education_title": "Education",
    "work_title": "Experience",
    "contact_title": "Contact",
    "phone_label": "Phone",
    "location_label": "Location",
    "linkedin_label": "Professional profile",
    "portfolio_label": "View portfolio",
    "pdf_label": "Download PDF",
    "web": LINKS["web_en"],
    "alternate_web": LINKS["web_es"],
    "portfolio": LINKS["portfolio_en"],
    "stack": [
        {"title": "Frontend", "body": "HTML5, responsive CSS, JavaScript, React, Next.js and accessibility.", "tags": ["React", "Next.js", "JavaScript", "CSS"]},
        {"title": "Backend and data", "body": "Node.js, Firebase, Supabase, SQL and REST APIs for real products.", "tags": ["Node.js", "Firebase", "Supabase", "SQL"]},
        {"title": "Product and business", "body": "Stripe (subscriptions and payments), Vercel, PWA, SEO/GEO and analytics.", "tags": ["Stripe", "Vercel", "PWA", "SEO/GEO"]},
        {"title": "AI", "body": "LLM integration (Anthropic API, Gemini), content pipelines and prompt engineering.", "tags": ["Anthropic", "Gemini", "LLMs", "Prompts"]},
    ],
    "projects": [
        {"title": "GEOPilot", "body": "SaaS for SEO and GEO content. AI article generation, token-based cost calculator, editorial calendar and AI-engine visibility. Stripe payments.", "tags": ["Next.js", "Firebase", "Stripe", "AI"], "button": ("View product", LINKS["geopilot"])},
        {"title": "Gestolio", "body": "Fiscal PWA for freelancers: invoicing, VAT/income tax, quarterly tax forms and an AI assistant. Freemium with Stripe subscriptions and WebAuthn access.", "tags": ["Next.js 14", "Supabase", "Stripe", "PWA"], "button": ("View product", LINKS["gestolio"])},
        {"title": "Tu Casa en Jerez", "body": "Multi-property booking platform for a real client: booking engine with Stripe, guest registration (Spanish SES), chat, loyalty and admin panel.", "tags": ["JavaScript", "Firebase", "Stripe", "Maps"], "button": ("View demo", LINKS["jerez"])},
    ],
    "education": [
        ("2024 - 2026", "Dual Higher Degree in Multiplatform Application Development", "Higher Technician degree completed in 2026. Training focused on programming, databases, web development, mobile development and systems."),
        ("2023 - 2024", "Rey Juan Carlos University", "Degree in Science, Management and Service Engineering. Early university experience with technology, management and teamwork."),
        ("2022 - 2023", "Salmon Arm Secondary, Canada", "Scientific baccalaureate studied in English, with academic and cultural immersion."),
    ],
    "traits": [
        {"title": "Full-stack developer and founder (freelance)", "body": "2025 – Present. Design, development and sale of my own SaaS products and custom platforms. Full cycle: product, payments, deployment and support."},
        {"title": "Web developer at an agency", "body": "2024 – 2025. Web development for clients: HTML/CSS layout, HTML email signatures and WordPress."},
    ],
}


DATA = {"es": SPANISH, "en": ENGLISH}


if __name__ == "__main__":
    for filename, theme_name, lang in OUTPUTS:
        output_path = ROOT / filename
        build_pdf(output_path, DATA[lang], theme_name)
        print(f"Generated {output_path}")
