/* ==========================================
   ?? MOBILE MENU FUNCTIONALITY
   ========================================== */

(function() {
    console.log('?? [MOBILE] Initializing mobile menu...');

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileMenu);
    } else {
        initMobileMenu();
    }

    function initMobileMenu() {
        const menuBtn = document.getElementById('mobile-menu-btn');
        const overlay = document.getElementById('mobile-overlay');
        
        // Find sidebar (try multiple selectors)
        const sidebar = document.querySelector('.app-sidebar') || 
                       document.querySelector('.glass-sidebar') || 
                       document.querySelector('.contacts-sidebar') ||
                       document.querySelector('.sidebar');

        if (!menuBtn || !overlay || !sidebar) {
            console.warn('?? [MOBILE] Menu elements not found');
            return;
        }

        console.log('? [MOBILE] Menu elements found');

        // Toggle menu
        menuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMenu();
        });

        // Close on overlay click
        overlay.addEventListener('click', function() {
            closeMenu();
        });

        // Close on contact click
        document.addEventListener('click', function(e) {
            if (e.target.closest('.contact-item')) {
                closeMenu();
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeMenu();
            }
        });

        function toggleMenu() {
            const isOpen = sidebar.classList.contains('mobile-open');
            
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        function openMenu() {
            sidebar.classList.add('mobile-open');
            overlay.classList.add('show');
            menuBtn.innerHTML = '<i class="fas fa-times"></i>';
            console.log('?? [MOBILE] Menu opened');
        }

        function closeMenu() {
            sidebar.classList.remove('mobile-open');
            overlay.classList.remove('show');
            menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            console.log('?? [MOBILE] Menu closed');
        }

        console.log('? [MOBILE] Menu initialized successfully');
    }
})();
