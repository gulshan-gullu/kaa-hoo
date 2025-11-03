"""
Kaa-Ho Logo Generator - Professional Quality
Generates logos in multiple sizes with chat bubble design
UPDATED: Now includes icon-192x192.png and icon-512x512.png for PWA
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_kaa_ho_logo(size, filename):
    """
    Create Kaa-Ho logo with chat bubbles
    
    Args:
        size: Size of the logo (width = height for square)
        filename: Output filename
    """
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Colors
    bg_color = (47, 54, 64, 255)  # Dark gray background
    bubble1_color = (163, 203, 159, 255)  # Light green
    bubble2_color = (139, 179, 135, 255)  # Darker green
    text_color = (163, 203, 159, 255)  # Light green
    tagline_color = (150, 150, 150, 255)  # Gray
    
    # Add background
    draw.rectangle([0, 0, size, size], fill=bg_color)
    
    # Calculate proportions based on size
    bubble_section = int(size * 0.35)  # Top 35% for bubbles
    text_section = int(size * 0.4)  # Middle 40% for text
    
    # Draw chat bubbles (two overlapping circles)
    bubble_size = int(size * 0.18)
    bubble1_x = int(size * 0.38)
    bubble1_y = int(size * 0.12)
    bubble2_x = int(size * 0.52)
    bubble2_y = int(size * 0.18)
    
    # Bubble 1 (left, lighter)
    draw.ellipse(
        [bubble1_x, bubble1_y, bubble1_x + bubble_size, bubble1_y + bubble_size],
        fill=bubble1_color
    )
    
    # Bubble 2 (right, darker)
    draw.ellipse(
        [bubble2_x, bubble2_y, bubble2_x + bubble_size, bubble2_y + bubble_size],
        fill=bubble2_color
    )
    
    # Try to load a system font, fallback to default
    try:
        # For main text
        font_size = int(size * 0.18)
        font = ImageFont.truetype("arial.ttf", font_size)
        
        # For tagline
        tagline_size = int(size * 0.06)
        tagline_font = ImageFont.truetype("arial.ttf", tagline_size)
    except:
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", int(size * 0.18))
            tagline_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", int(size * 0.06))
        except:
            font = ImageFont.load_default()
            tagline_font = ImageFont.load_default()
    
    # Draw "Kaa Ho" text
    text = "Kaa Ho"
    
    # Calculate text position (centered)
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
    except:
        text_width = len(text) * int(size * 0.12)
        text_height = int(size * 0.18)
    
    text_x = (size - text_width) // 2
    text_y = bubble_section + int(size * 0.08)
    
    draw.text((text_x, text_y), text, fill=text_color, font=font)
    
    # Draw tagline "Stay Connected, Stay Close"
    tagline = "Stay Connected, Stay Close"
    
    try:
        tag_bbox = draw.textbbox((0, 0), tagline, font=tagline_font)
        tag_width = tag_bbox[2] - tag_bbox[0]
    except:
        tag_width = len(tagline) * int(size * 0.035)
    
    tag_x = (size - tag_width) // 2
    tag_y = text_y + text_height + int(size * 0.08)
    
    draw.text((tag_x, tag_y), tagline, fill=tagline_color, font=tagline_font)
    
    # Save image
    img.save(filename, quality=95)
    print(f"✅ Created: {filename} ({size}x{size})")

def create_favicon_ico(sizes=[16, 32, 48, 64]):
    """Create multi-size ICO file for favicon"""
    images = []
    for size in sizes:
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        # Background
        draw.rectangle([0, 0, size, size], fill=(47, 54, 64, 255))
        
        # Simplified bubbles for small sizes
        bubble_size = int(size * 0.25)
        bubble1_x = int(size * 0.25)
        bubble1_y = int(size * 0.2)
        bubble2_x = int(size * 0.45)
        bubble2_y = int(size * 0.3)
        
        draw.ellipse(
            [bubble1_x, bubble1_y, bubble1_x + bubble_size, bubble1_y + bubble_size],
            fill=(163, 203, 159, 255)
        )
        draw.ellipse(
            [bubble2_x, bubble2_y, bubble2_x + bubble_size, bubble2_y + bubble_size],
            fill=(139, 179, 135, 255)
        )
        
        # Simple "K" or "KH" text
        try:
            font = ImageFont.truetype("arial.ttf", int(size * 0.4))
        except:
            font = ImageFont.load_default()
        
        text = "K" if size <= 32 else "KH"
        try:
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
        except:
            text_width = len(text) * int(size * 0.3)
        
        text_x = (size - text_width) // 2
        text_y = int(size * 0.5)
        
        draw.text((text_x, text_y), text, fill=(163, 203, 159, 255), font=font)
        images.append(img)
    
    # Save as ICO
    images[0].save('static/icons/favicon.ico', format='ICO', sizes=[(s, s) for s in sizes], append_images=images[1:])
    print(f"✅ Created: static/icons/favicon.ico with sizes {sizes}")

def main():
    """Generate all logo sizes"""
    
    # Create output directories
    os.makedirs('static/images', exist_ok=True)
    os.makedirs('static/icons', exist_ok=True)
    
    print("🎨 Generating Kaa-Ho Logos...\n")
    
    # Logo sizes for different uses
    logo_sizes = {
        'logo_tiny.png': 64,
        'logo_small.png': 128,
        'logo.png': 256,
        'logo_large.png': 512,
        'logo_xlarge.png': 1024,
    }
    
    # Generate main logos
    for filename, size in logo_sizes.items():
        create_kaa_ho_logo(size, f'static/images/{filename}')
    
    print("\n🌟 Generating Favicon sizes...\n")
    
    # Favicon sizes
    favicon_sizes = {
        'favicon-16x16.png': 16,
        'favicon-32x32.png': 32,
        'favicon-48x48.png': 48,
        'favicon-64x64.png': 64,
        'favicon-128x128.png': 128,
        'favicon-192x192.png': 192,
        'favicon-512x512.png': 512,
    }
    
    # Generate favicons
    for filename, size in favicon_sizes.items():
        create_kaa_ho_logo(size, f'static/icons/{filename}')
    
    # Create ICO file with multiple sizes
    print("\n🎯 Creating favicon.ico...\n")
    create_favicon_ico([16, 32, 48, 64])
    
    # Create app icons for mobile
    print("\n📱 Creating mobile app icons...\n")
    mobile_sizes = {
        'apple-touch-icon.png': 180,
        'android-chrome-192x192.png': 192,
        'android-chrome-512x512.png': 512,
    }
    
    for filename, size in mobile_sizes.items():
        create_kaa_ho_logo(size, f'static/icons/{filename}')
    
    # ⭐ NEW: Create PWA icon sizes (for service worker)
    print("\n🚀 Creating PWA icon sizes...\n")
    pwa_icon_sizes = {
        'icon-192x192.png': 192,
        'icon-512x512.png': 512,
        'icon-96x96.png': 96,  # For badge
    }
    
    for filename, size in pwa_icon_sizes.items():
        create_kaa_ho_logo(size, f'static/icons/{filename}')
    
    print("\n" + "="*60)
    print("✅ ALL LOGOS GENERATED SUCCESSFULLY!")
    print("="*60)
    print("\n📁 Files created in:")
    print("   - static/images/  (Main logos: 64px to 1024px)")
    print("   - static/icons/   (Favicons: 16px to 512px)")
    print("   - static/icons/   (PWA icons: icon-192x192.png, icon-512x512.png)")
    print("\n🎉 Your Kaa-Ho branding is ready!")
    print("\n📱 PWA Icons created:")
    print("   ✅ icon-192x192.png")
    print("   ✅ icon-512x512.png")
    print("   ✅ icon-96x96.png (badge)")

if __name__ == "__main__":
    main()