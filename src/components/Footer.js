/**
 * Footer Component
 * Standardized footer for all pages with social media links
 */

export function initFooter(footerId = 'footer-container') {
    const footerContainer = document.getElementById(footerId);
    if (!footerContainer) {
        console.warn(`Footer container with id "${footerId}" not found`);
        return;
    }

    const footerHTML = `
        <footer class="footer">
            <div class="container">
                <div class="footer-content">
                    <div class="footer-brand">
                        <a href="/" class="nav-logo">
                            <img src="/assets/Topbarlog.png" alt="Ambiora" class="nav-logo-img">
                        </a>
                        <p class="footer-tagline">Building tomorrow, together.</p>
                    </div>

                    <div class="footer-links">
                        <div class="footer-column">
                            <h4 class="footer-heading">Navigation</h4>
                            <ul class="footer-list">
                                <li><a href="/">Home</a></li>
                                <li><a href="/events.html">Events</a></li>
                                <li><a href="/timeline.html">Timeline</a></li>
                                <li><a href="/about.html">About Us</a></li>
                                <li><a href="/contact.html">Contact</a></li>
                            </ul>
                        </div>

                        <div class="footer-column">
                            <h4 class="footer-heading">Connect</h4>
                            <ul class="footer-list">
                                <li><a href="https://x.com/ambiora_tech?s=11" target="_blank" rel="noopener noreferrer">Twitter / X</a></li>
                                <li><a href="https://www.instagram.com/ambioratechfest?igsh=Y244Mm1udno3ZWs5" target="_blank" rel="noopener noreferrer">Instagram</a></li>
                                <li><a href="https://www.linkedin.com/company/ambiora-techfest/" target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
                                <li><a href="#" target="_blank" rel="noopener noreferrer">Discord</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p class="footer-copyright">© 2026 Ambiora Tech Fest. All rights reserved.</p>
                    <p class="footer-credit">Built by Ambiora Technical Team</p>
                </div>
            </div>
        </footer>
    `;

    footerContainer.innerHTML = footerHTML;
}
