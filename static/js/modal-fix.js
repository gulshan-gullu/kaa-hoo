// Modal Fix - Auto-hide overlays on page load
(function() {
    console.log('🔧 Modal fix loading...');
    
    function hideModals() {
        // Hide call modal and other overlays
        document.querySelectorAll('[id*="modal"], [class*="modal"], [id*="overlay"], [class*="overlay"]').forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide any high z-index fixed elements that might cover the page
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' && parseInt(style.zIndex) > 1000) {
                // Don't hide if it's a small element (likely a button or notification)
                if (el.offsetWidth > window.innerWidth * 0.8 || el.offsetHeight > window.innerHeight * 0.8) {
                    el.style.display = 'none';
                }
            }
        });
        
        console.log('✅ Modals hidden, page visible!');
    }
    
    // Run immediately
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideModals);
    } else {
        hideModals();
    }
    
    // Also run after a short delay to catch late-loading modals
    setTimeout(hideModals, 500);
})();
