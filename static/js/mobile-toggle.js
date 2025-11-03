// Mobile Sidebar Toggle - Enterprise Version
(function() {
    // Only run on mobile
    if (window.innerWidth > 768) {
        console.log('Desktop mode - mobile toggle not needed');
        return;
    }
    
    console.log('📱 Initializing mobile toggle...');
    
    const sidebar = document.querySelector('.glass-sidebar');
    const iconSidebar = document.querySelector('.icon-sidebar');
    
    if (!sidebar || !iconSidebar) {
        console.warn('Sidebar elements not found');
        return;
    }
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    document.body.appendChild(overlay);
    console.log('✅ Overlay created');
    
    // Toggle sidebar function
    function toggleSidebar() {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
        console.log('Sidebar toggled:', sidebar.classList.contains('mobile-open'));
    }
    
    // Close sidebar function
    function closeSidebar() {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        console.log('Sidebar closed');
    }
    
    // Click on icon sidebar items
    const iconItems = iconSidebar.querySelectorAll('.icon-sidebar-item');
    iconItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            const tooltip = this.getAttribute('data-tooltip');
            console.log(`Icon clicked: ${tooltip}`);
            
            if (tooltip === 'Chats') {
                toggleSidebar();
            }
        });
    });
    
    // Click on overlay to close
    overlay.addEventListener('click', function() {
        console.log('Overlay clicked');
        closeSidebar();
    });
    
    // Click on contact to close sidebar
    const contacts = sidebar.querySelectorAll('.contact-item');
    contacts.forEach(contact => {
        contact.addEventListener('click', function() {
            console.log('Contact clicked');
            setTimeout(closeSidebar, 200);
        });
    });
    
    console.log('✅ Mobile toggle initialized successfully');
})();
