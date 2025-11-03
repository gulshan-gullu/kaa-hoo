#!/usr/bin/env python3
"""
Claude AI Logo with Letter "C" - Alternative Version
"""

from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

def create_claude_logo_with_letter(size=512, output_path="static/images/claude_ai_c_logo.png"):
    """
    Create Claude AI logo with letter "C"
    """
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center = size / 2
    main_radius = size * 0.42
    
    # Gradient circle
    gradient_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient_layer)
    
    num_layers = 100
    for i in range(num_layers, 0, -1):
        t = i / num_layers
        
        # Purple to Blue gradient
        r = int(102 + (138 - 102) * (1 - t))
        g = int(51 + (161 - 51) * (1 - t))
        b = int(153 + (255 - 153) * (1 - t))
        alpha = int(255 * 0.9)
        
        radius = main_radius * t
        x1 = center - radius
        y1 = center - radius
        x2 = center + radius
        y2 = center + radius
        
        gradient_draw.ellipse([x1, y1, x2, y2], fill=(r, g, b, alpha))
    
    gradient_layer = gradient_layer.filter(ImageFilter.GaussianBlur(radius=2))
    img = Image.alpha_composite(img, gradient_layer)
    
    # Add inner glow
    glow_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    
    glow_radius = main_radius * 0.7
    glow_x1 = center - glow_radius
    glow_y1 = center - glow_radius
    glow_x2 = center + glow_radius
    glow_y2 = center + glow_radius
    
    glow_draw.ellipse([glow_x1, glow_y1, glow_x2, glow_y2], 
                      fill=(200, 220, 255, 80))
    
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=15))
    img = Image.alpha_composite(img, glow_layer)
    
    # Add letter "C"
    text_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    text_draw = ImageDraw.Draw(text_layer)
    
    # Try to load a font, fallback to default
    try:
        # Try different font paths
        font_size = int(size * 0.5)
        font_paths = [
            "C:\\Windows\\Fonts\\arial.ttf",
            "C:\\Windows\\Fonts\\calibri.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/System/Library/Fonts/Helvetica.ttc"
        ]
        
        font = None
        for font_path in font_paths:
            try:
                font = ImageFont.truetype(font_path, font_size)
                break
            except:
                continue
        
        if font is None:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    # Draw "C" with shadow
    letter = "C"
    
    # Get text size
    bbox = text_draw.textbbox((0, 0), letter, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) / 2
    text_y = (size - text_height) / 2 - size * 0.05
    
    # Shadow
    shadow_offset = size * 0.01
    text_draw.text((text_x + shadow_offset, text_y + shadow_offset), 
                   letter, fill=(0, 0, 0, 100), font=font)
    
    # Main text (white)
    text_draw.text((text_x, text_y), letter, fill=(255, 255, 255, 255), font=font)
    
    # Slight blur on text for glow
    text_layer = text_layer.filter(ImageFilter.GaussianBlur(radius=1))
    
    img = Image.alpha_composite(img, text_layer)
    
    # Outer ring
    ring_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring_layer)
    
    ring_width = max(3, int(size * 0.012))
    for i in range(ring_width):
        ring_x1 = center - main_radius - i
        ring_y1 = center - main_radius - i
        ring_x2 = center + main_radius + i
        ring_y2 = center + main_radius + i
        
        alpha = int(200 - (i * 30))
        ring_draw.ellipse([ring_x1, ring_y1, ring_x2, ring_y2],
                         outline=(138, 161, 255, alpha))
    
    img = Image.alpha_composite(img, ring_layer)
    
    img.save(output_path, 'PNG', optimize=True)
    print(f"✅ Claude 'C' logo saved: {output_path}")
    
    return img

def create_both_versions():
    """Create both sparkle and letter versions"""
    
    print("🎨 Creating BOTH Claude AI Logo Versions")
    print("=" * 60)
    
    os.makedirs("static/images", exist_ok=True)
    
    print("\n📦 Version 1: Sparkle/Star Effect")
    from PIL import Image, ImageDraw, ImageFilter
    # Call original function
    exec(open(__file__).read().split('def create_claude_logo')[1].split('def create_claude_logo_with_letter')[0])
    
    print("\n📦 Version 2: Letter 'C'")
    create_claude_logo_with_letter(512, "static/images/claude_ai_c_logo.png")
    create_claude_logo_with_letter(256, "static/images/claude_ai_c_small.png")
    create_claude_logo_with_letter(128, "static/images/claude_ai_c_icon.png")
    
    print("\n" + "=" * 60)
    print("✅ Both versions created!")
    print("\n📁 Choose your preferred version:")
    print("   Style 1: claude_ai_logo.png (Sparkle/Meta style)")
    print("   Style 2: claude_ai_c_logo.png (Letter C)")

if __name__ == "__main__":
    create_claude_logo_with_letter()
    print("\n💡 Want the sparkle version too? Run the main script!")