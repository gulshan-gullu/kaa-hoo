# create_logo.py
from PIL import Image, ImageDraw

# Create logo with exact green chat bubbles on dark background
img = Image.new('RGBA', (512, 512), color=(10, 14, 39, 255))  # Dark background matching your app
draw = ImageDraw.Draw(img)

# WhatsApp green
green = (37, 211, 102)

# First chat bubble (larger, top-left) - more rounded
draw.ellipse([60, 40, 280, 240], fill=green)
# Tail for first bubble (pointing down-left)
draw.polygon([(100, 240), (80, 290), (160, 250)], fill=green)

# Second chat bubble (smaller, bottom-right, overlapping)
draw.ellipse([220, 200, 420, 380], fill=green)
# Tail for second bubble (pointing down-right)
draw.polygon([(360, 380), (400, 430), (320, 390)], fill=green)

# Save as PNG
img.save('static/logo.png', format='PNG')
print("✅ Logo created: static/logo.png")

# Create favicon (smaller version)
favicon = Image.new('RGBA', (64, 64), color=(10, 14, 39, 255))
draw_fav = ImageDraw.Draw(favicon)

# Smaller bubbles for favicon
draw_fav.ellipse([6, 4, 34, 28], fill=green)
draw_fav.polygon([(12, 28), (10, 36), (22, 30)], fill=green)

draw_fav.ellipse([26, 24, 54, 48], fill=green)
draw_fav.polygon([(44, 48), (48, 56), (38, 50)], fill=green)

favicon.save('static/favicon.ico', format='ICO', sizes=[(64, 64), (32, 32), (16, 16)])
print("✅ Favicon created: static/favicon.ico")