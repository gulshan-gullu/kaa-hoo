#!/usr/bin/env python3
"""
CA360 Chat - Pure Glassmorphism Logo Generator
Generates a premium glass-effect chat bubble logo with connected bubbles
"""

from PIL import Image, ImageDraw, ImageFilter
import os
import math

def create_pure_glassmorphism_logo(size=512, output_path="static/images/logo.png"):
    """
    Create a pure glassmorphism chat bubble logo with connected bubbles
    
    Args:
        size: Output image size (square)
        output_path: Path to save the logo
    """
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Calculate bubble sizes and positions for overlap/connection
    padding = size * 0.18
    bubble1_size = size * 0.40
    bubble2_size = size * 0.32
    
    # Position bubbles to overlap/connect
    bubble1_x = size * 0.38
    bubble1_y = size * 0.35
    
    # Position second bubble to overlap and connect
    bubble2_x = size * 0.62
    bubble2_y = size * 0.65
    
    # Create multiple layers for depth
    base_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    base_draw = ImageDraw.Draw(base_layer)
    
    # Pure glass colors - very subtle, more transparent
    glass_main = (180, 220, 200, 85)  # Very subtle cyan-green
    glass_dark = (140, 200, 180, 95)   # Slightly darker
    
    # Shadow color - for depth
    shadow_color = (80, 120, 100, 40)
    
    # FIRST BUBBLE (back/top-left)
    # Shadow first (slightly offset)
    shadow_offset = size * 0.015
    x1 = bubble1_x - bubble1_size / 2 + shadow_offset
    y1 = bubble1_y - bubble1_size / 2 + shadow_offset
    x2 = bubble1_x + bubble1_size / 2 + shadow_offset
    y2 = bubble1_y + bubble1_size / 2 + shadow_offset
    base_draw.ellipse([x1, y1, x2, y2], fill=shadow_color)
    
    # Main bubble body
    x1 = bubble1_x - bubble1_size / 2
    y1 = bubble1_y - bubble1_size / 2
    x2 = bubble1_x + bubble1_size / 2
    y2 = bubble1_y + bubble1_size / 2
    base_draw.ellipse([x1, y1, x2, y2], fill=glass_main)
    
    # Inner glow (lighter center)
    glow_size = bubble1_size * 0.75
    gx1 = bubble1_x - glow_size / 2
    gy1 = bubble1_y - glow_size / 2
    gx2 = bubble1_x + glow_size / 2
    gy2 = bubble1_y + glow_size / 2
    base_draw.ellipse([gx1, gy1, gx2, gy2], fill=(200, 240, 220, 50))
    
    # Top-left highlight (glass reflection)
    highlight_offset = bubble1_size * 0.12
    highlight_size = bubble1_size * 0.35
    hx1 = x1 + highlight_offset
    hy1 = y1 + highlight_offset
    hx2 = hx1 + highlight_size
    hy2 = hy1 + highlight_size
    base_draw.ellipse([hx1, hy1, hx2, hy2], fill=(255, 255, 255, 140))
    
    # Subtle secondary highlight
    sec_highlight_size = bubble1_size * 0.15
    shx1 = x1 + highlight_offset * 0.5
    shy1 = y1 + highlight_offset * 0.5
    shx2 = shx1 + sec_highlight_size
    shy2 = shy1 + sec_highlight_size
    base_draw.ellipse([shx1, shy1, shx2, shy2], fill=(255, 255, 255, 80))
    
    # CONNECTION BRIDGE between bubbles (glassmorphism connector)
    # Calculate connection points
    dx = bubble2_x - bubble1_x
    dy = bubble2_y - bubble1_y
    distance = math.sqrt(dx*dx + dy*dy)
    
    # Create smooth connection with overlapping circles
    steps = 8
    for i in range(steps):
        t = i / (steps - 1)
        # Interpolate position
        cx = bubble1_x + dx * t
        cy = bubble1_y + dy * t
        # Interpolate size (narrower in middle)
        connector_size = bubble1_size * (0.6 - 0.2 * math.sin(t * math.pi))
        
        # Draw connector circle
        conn_x1 = cx - connector_size / 2
        conn_y1 = cy - connector_size / 2
        conn_x2 = cx + connector_size / 2
        conn_y2 = cy + connector_size / 2
        
        # Use averaged color
        conn_alpha = int(85 + 10 * math.sin(t * math.pi))
        base_draw.ellipse([conn_x1, conn_y1, conn_x2, conn_y2], 
                         fill=(160, 210, 190, conn_alpha))
    
    # SECOND BUBBLE (front/bottom-right)
    # Shadow
    x1 = bubble2_x - bubble2_size / 2 + shadow_offset
    y1 = bubble2_y - bubble2_size / 2 + shadow_offset
    x2 = bubble2_x + bubble2_size / 2 + shadow_offset
    y2 = bubble2_y + bubble2_size / 2 + shadow_offset
    base_draw.ellipse([x1, y1, x2, y2], fill=shadow_color)
    
    # Main bubble body
    x1 = bubble2_x - bubble2_size / 2
    y1 = bubble2_y - bubble2_size / 2
    x2 = bubble2_x + bubble2_size / 2
    y2 = bubble2_y + bubble2_size / 2
    base_draw.ellipse([x1, y1, x2, y2], fill=glass_dark)
    
    # Inner glow
    glow_size = bubble2_size * 0.75
    gx1 = bubble2_x - glow_size / 2
    gy1 = bubble2_y - glow_size / 2
    gx2 = bubble2_x + glow_size / 2
    gy2 = bubble2_y + glow_size / 2
    base_draw.ellipse([gx1, gy1, gx2, gy2], fill=(200, 240, 220, 55))
    
    # Top-left highlight
    highlight_offset = bubble2_size * 0.12
    highlight_size = bubble2_size * 0.35
    hx1 = x1 + highlight_offset
    hy1 = y1 + highlight_offset
    hx2 = hx1 + highlight_size
    hy2 = hy1 + highlight_size
    base_draw.ellipse([hx1, hy1, hx2, hy2], fill=(255, 255, 255, 150))
    
    # Secondary highlight
    sec_highlight_size = bubble2_size * 0.15
    shx1 = x1 + highlight_offset * 0.5
    shy1 = y1 + highlight_offset * 0.5
    shx2 = shx1 + sec_highlight_size
    shy2 = shy1 + sec_highlight_size
    base_draw.ellipse([shx1, shy1, shx2, shy2], fill=(255, 255, 255, 90))
    
    # Apply blur for glass effect
    base_layer = base_layer.filter(ImageFilter.GaussianBlur(radius=size*0.004))
    
    # Composite
    img = Image.alpha_composite(img, base_layer)
    
    # Add crisp border for definition
    border_layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    border_draw = ImageDraw.Draw(border_layer)
    border_width = max(2, int(size * 0.006))
    
    # Border for first bubble
    x1 = bubble1_x - bubble1_size / 2
    y1 = bubble1_y - bubble1_size / 2
    x2 = bubble1_x + bubble1_size / 2
    y2 = bubble1_y + bubble1_size / 2
    
    for i in range(border_width):
        alpha = int(180 - (i * 30))
        border_draw.ellipse([x1-i, y1-i, x2+i, y2+i], 
                           outline=(255, 255, 255, alpha))
    
    # Border for second bubble
    x1 = bubble2_x - bubble2_size / 2
    y1 = bubble2_y - bubble2_size / 2
    x2 = bubble2_x + bubble2_size / 2
    y2 = bubble2_y + bubble2_size / 2
    
    for i in range(border_width):
        alpha = int(200 - (i * 30))
        border_draw.ellipse([x1-i, y1-i, x2+i, y2+i], 
                           outline=(255, 255, 255, alpha))
    
    # Composite border
    img = Image.alpha_composite(img, border_layer)
    
    # Save the image
    img.save(output_path, 'PNG', optimize=True)
    print(f"✅ Logo saved to: {output_path}")
    
    return img

def create_favicon_from_logo(logo_path="static/images/logo.png", 
                            favicon_path="static/images/favicon.ico"):
    """
    Create a multi-resolution favicon from the logo
    
    Args:
        logo_path: Path to the source logo
        favicon_path: Path to save the favicon
    """
    try:
        # Ensure directory exists
        os.makedirs(os.path.dirname(favicon_path), exist_ok=True)
        
        # Open the logo
        img = Image.open(logo_path)
        
        # Create background for small sizes (works better in browsers)
        sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
        
        # For better visibility in small sizes
        favicon_images = []
        for size in sizes:
            # Resize logo
            resized = img.resize(size, Image.Resampling.LANCZOS)
            
            # Create new image with transparent background
            bg = Image.new('RGBA', size, (0, 0, 0, 0))
            
            # Composite
            final = Image.alpha_composite(bg, resized)
            favicon_images.append(final)
        
        # Save as ICO with multiple sizes
        favicon_images[0].save(
            favicon_path, 
            format='ICO', 
            sizes=sizes,
            append_images=favicon_images[1:]
        )
        
        print(f"✅ Favicon saved to: {favicon_path}")
        print(f"   Includes sizes: {', '.join([f'{s[0]}x{s[1]}' for s in sizes])}")
        
    except Exception as e:
        print(f"❌ Error creating favicon: {e}")

def main():
    """Generate all logo assets"""
    
    print("🎨 CA360 Chat - Pure Glassmorphism Logo Generator")
    print("=" * 60)
    
    # Create all required directories
    os.makedirs("static/images", exist_ok=True)
    
    print("\n📦 Creating main logo (512x512)...")
    create_pure_glassmorphism_logo(512, "static/images/logo.png")
    
    print("\n📦 Creating large logo (1024x1024)...")
    create_pure_glassmorphism_logo(1024, "static/images/logo_large.png")
    
    print("\n📦 Creating small logo (256x256)...")
    create_pure_glassmorphism_logo(256, "static/images/logo_small.png")
    
    print("\n📦 Creating favicon from logo...")
    create_favicon_from_logo("static/images/logo.png", "static/images/favicon.ico")
    
    print("\n" + "=" * 60)
    print("✅ All glassmorphism assets created successfully!")
    print("\n📁 Files created in static/images/:")
    print("   ✓ logo.png (512x512) - Main logo")
    print("   ✓ logo_large.png (1024x1024) - High-res")
    print("   ✓ logo_small.png (256x256) - Compact")
    print("   ✓ favicon.ico - Multi-size browser icon")
    print("\n🎨 Features:")
    print("   • Pure glassmorphism effect")
    print("   • Connected chat bubbles")
    print("   • Ultra-transparent glass material")
    print("   • Realistic light reflections")
    print("   • Subtle shadows for depth")
    print("   • Premium glass borders")
    print("   • Optimized PNG compression")
    print("\n🚀 Ready to use! Restart your Flask app to see changes.")

if __name__ == "__main__":
    main()