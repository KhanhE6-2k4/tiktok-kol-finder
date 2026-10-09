
document.addEventListener('DOMContentLoaded', () => {
    // Update copyright year
    document.querySelectorAll('[data-current-year]').forEach(element => {
        element.textContent = new Date().getFullYear();
    });

    // Mobile navigation
    document.querySelectorAll('.menu-toggle').forEach(button => {
        const navId = button.getAttribute('aria-controls');
        const nav = navId
            ? document.getElementById(navId)
            : null;

        if (!nav) return;

        button.addEventListener('click', () => {
            const isOpen = nav.classList.toggle('is-open');

            button.setAttribute(
                'aria-expanded',
                String(isOpen)
            );
        });

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            });
        });

        document.addEventListener('click', event => {
            if (
                !nav.contains(event.target) &&
                !button.contains(event.target)
            ) {
                nav.classList.remove('is-open');
                button.setAttribute('aria-expanded', 'false');
            }
        });
    });
});
