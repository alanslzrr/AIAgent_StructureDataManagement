import base64

def get_image_base64(image_path):
    """Convierte una imagen a base64."""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode()

# Preparar la imagen de fondo en base64
background_base64 = get_image_base64("images/background.png")
# Preparar el logo de Phoenix en base64
logo_phoenix_base64 = get_image_base64("images/LogoPhoenix.png")

CSS_STYLES = f"""
<style>
    /* Establecer la imagen de fondo para la página principal */
    body, .stApp {{
        background-image: url("data:image/png;base64,{background_base64}");
        background-size: cover;
        background-attachment: fixed;
    }}
    /* Personalizar el sidebar con un efecto semi-transparente */
    .sidebar .sidebar-content {{
        background-color: rgba(200, 202, 205, 0.8); /* Gris semi-transparente */
        color: #262730; /* Color de texto */
    }}
    /* Estilo para el título con degradado */
    .gradient-text {{
        background: linear-gradient(to right, #eb2227, #ed6f38, #fec814);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-align: center;
        font-size: 2rem; /* Ajusta el tamaño del texto según necesites */
    }}
</style>
"""

LOGO_TITLE_HTML = """
<div class="logo-title-container">
    <h1 class="gradient-text">Chat with Certificates</h1>
</div>
"""