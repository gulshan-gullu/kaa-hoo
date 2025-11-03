# create_favicon.py
from PIL import Image, ImageDraw, ImageFont

# Create a 64x64 image with a gradient background
img = Image.new('RGB', (64, 64), color='white')
draw = ImageDraw.Draw(img)

# Draw gradient background (purple)
for y in range(64):
    color_value = int(102 + (118 - 102) * (y / 64))  # Gradient from #667eea to #764ba2
    draw.rectangle([(0, y), (64, y+1)], fill=(color_value, 78, 234))

# Draw "KH" text in white (Kaa Ho initials)
try:
    # Try to use a nice font
    font = ImageFont.truetype("arial.ttf", 28)
except:
    # Fallback to default font
    font = ImageFont.load_default()

# Calculate text position to center it
text = "KH"  # Changed to "KH" for Kaa Ho
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]
x = (64 - text_width) // 2
y = (64 - text_height) // 2 - 5

# Draw text with shadow effect
draw.text((x+1, y+1), text, fill=(0, 0, 0, 128), font=font)  # Shadow
draw.text((x, y), text, fill='white', font=font)  # Main text

# Save as ICO file
img.save('static/favicon.ico', format='ICO', sizes=[(64, 64), (32, 32), (16, 16)])

print("✅ Favicon created successfully at: static/favicon.ico")