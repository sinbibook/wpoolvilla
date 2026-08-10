// Common JavaScript functions
(function() {
    'use strict';

    // Page load animation for main content sections
    function initPageLoadAnimation() {
        // Add fade-in animation to main content elements
        setTimeout(() => {
            const fadeElements = document.querySelectorAll('.main-content-fade-in');
            fadeElements.forEach((element, index) => {
                setTimeout(() => {
                    element.classList.add('animate');
                }, 300 + (index * 150)); // Start after page fade-in
            });
        }, 100);
    }

    // Also trigger animations on scroll for better UX (rAF-throttled to avoid scroll jank on mobile)
    let scrollTicking = false;
    function handleScrollAnimations() {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            const fadeElements = document.querySelectorAll('.main-content-fade-in:not(.animate)');
            if (fadeElements.length === 0) {
                scrollTicking = false;
                return;
            }
            const viewportCutoff = window.innerHeight - 100;
            fadeElements.forEach(element => {
                if (element.getBoundingClientRect().top < viewportCutoff) {
                    element.classList.add('animate');
                }
            });
            scrollTicking = false;
        });
    }

    // Scroll to next section function
    window.scrollToNextSection = function() {
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            const nextSection = heroSection.nextElementSibling;
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    };

    // Initialize page load animation when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            initPageLoadAnimation();
            window.addEventListener('scroll', handleScrollAnimations);
        });
    } else {
        initPageLoadAnimation();
        window.addEventListener('scroll', handleScrollAnimations);
    }

})();