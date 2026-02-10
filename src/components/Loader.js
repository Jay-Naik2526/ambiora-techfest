/**
 * Initial Page Loader - Shows load.gif on first visit to home page
 * For the intro/splash screen experience
 */
export function initLoader() {
    // Logic Checks
    const path = window.location.pathname;
    // Normalize path to check if home (allowing for /index.html locally)
    const isHome = path === '/' || path.endsWith('/index.html') || path.endsWith('/AMBIORA/');
    const hasVisited = sessionStorage.getItem('ambiora_intro_shown');

    // If not home or already shown, skip
    if (!isHome || hasVisited) {
        return;
    }

    // Mark as shown for this session
    sessionStorage.setItem('ambiora_intro_shown', 'true');

    // Create Loader Markup with GIF
    const loaderHTML = `
        <div id="loader-wrapper">
            <div class="loader-content">
                <img src="/assets/load.gif" alt="Loading..." class="loader-gif">
            </div>
        </div>
    `;

    // Inject Styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/components/Loader.css';
    document.head.appendChild(link);

    // Inject HTML
    document.body.insertAdjacentHTML('afterbegin', loaderHTML);

    const loader = document.getElementById('loader-wrapper');

    // Handle Removal
    const hideLoader = () => {
        if (!loader) return;

        loader.classList.add('hidden');

        // Wait for transition to finish before removing from DOM
        setTimeout(() => {
            if (loader.parentNode) {
                loader.parentNode.removeChild(loader);
            }
            document.body.classList.add('loaded');
        }, 800);
    };

    // Ensure loader stays for at least 4 seconds for full GIF effect
    const minTime = 4000;
    const start = Date.now();

    window.addEventListener('load', () => {
        const elapsed = Date.now() - start;
        const remaining = minTime - elapsed;

        if (remaining > 0) {
            setTimeout(hideLoader, remaining);
        } else {
            hideLoader();
        }
    });

    // Fallback if load event already fired or takes too long
    setTimeout(() => {
        if (loader && !loader.classList.contains('hidden')) {
            hideLoader();
        }
    }, 5000);
}
