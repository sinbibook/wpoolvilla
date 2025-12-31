// Footer JavaScript
(function() {
    'use strict';

    // Footer functionality can be added here if needed
    // For example: dynamic year update, form submissions, etc.

    // Update copyright year dynamically
    function updateCopyrightYear() {
        const yearElements = document.querySelectorAll('.copyright');
        const currentYear = new Date().getFullYear();

        yearElements.forEach(element => {
            element.innerHTML = element.innerHTML.replace(/\d{4}/, currentYear);
        });
    }

    // Initialize footer
    document.addEventListener('DOMContentLoaded', function() {
        updateCopyrightYear();
    });

})();