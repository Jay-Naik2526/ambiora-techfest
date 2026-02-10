/**
 * Page Transition Loader - Minimal Loading Bar
 * Used when navigating between pages
 */

export class PageTransitionLoader {
  constructor() {
    this.container = null;
    this.styleElement = null;
    this.injectStyles();
  }

  injectStyles() {
    // Only inject once
    if (document.getElementById('loading-bar-styles')) return;

    this.styleElement = document.createElement('style');
    this.styleElement.id = 'loading-bar-styles';
    this.styleElement.textContent = `
            #page-transition-loader {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(10, 14, 26, 0.95);
                z-index: 99998;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
            }
            
            #page-transition-loader.active {
                opacity: 1;
                visibility: visible;
            }

            /* Pyramid Loader */
            .pyramid-loader {
                width: 100px;
                height: 100px;
                position: relative;
                display: block;
                transform-style: preserve-3d;
                transform: rotateX(-20deg);
                margin-bottom: 40px;
            }

            .pyramid-loader .wrapper {
                position: relative;
                width: 100%;
                height: 100%;
                transform-style: preserve-3d;
                animation: spin 2s ease-in-out infinite;
            }

            @keyframes spin {
                100% {
                    transform: rotateY(360deg);
                }
            }

            .pyramid-loader .wrapper .side {
                width: 100%;
                height: calc(100% * 167 / 240);
                clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                margin: auto;
                transform-origin: center top;
                background: conic-gradient(from 0deg, 
                    #00ffcc, 
                    #00c896, 
                    #007e7e, 
                    #00ffcc);
            }

            .pyramid-loader .wrapper .side1 {
                transform: rotateZ(-45deg) rotateY(90deg);
            }

            .pyramid-loader .wrapper .side2 {
                transform: rotateZ(45deg) rotateY(90deg);
            }

            .pyramid-loader .wrapper .side3 {
                transform: rotateX(45deg);
            }

            .pyramid-loader .wrapper .side4 {
                transform: rotateX(-45deg);
            }

            .pyramid-loader .wrapper .side5 {
                transform: rotateZ(-45deg) rotateY(90deg) rotateX(180deg);
                top: 148%;
            }

            .pyramid-loader .wrapper .side6 {
                transform: rotateZ(45deg) rotateY(90deg) rotateX(180deg);
                top: 148%;
            }

            .pyramid-loader .wrapper .side7 {
                transform: rotateX(45deg) rotateX(180deg);
                top: 148%;
            }

            .pyramid-loader .wrapper .side8 {
                transform: rotateX(-45deg) rotateX(180deg);
                top: 148%;
            }

            .pyramid-loader .wrapper .shadow {
                width: 66%;
                height: 66%;
                position: absolute;
                top: 55%;
                left: 0;
                right: 0;
                bottom: 0;
                margin: auto;
                transform: rotateX(90deg) translateZ(-40px);
                background: #00c896;
                filter: blur(20px);
            }

            /* Minimal Loading Bar */
            .loading-wrapper {
                width: 100%;
                max-width: 500px;
                padding: 40px;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            .loading-label {
                color: #00ffcc;
                font-size: 12px;
                font-weight: 500;
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-bottom: 16px;
                opacity: 0.8;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                align-self: flex-start;
            }

            .loading-bar-container {
                width: 100%;
                height: 4px;
                background: rgba(0, 255, 204, 0.1);
                border-radius: 2px;
                overflow: hidden;
                position: relative;
                box-shadow: 0 0 10px rgba(0, 255, 204, 0.1);
            }

            .loading-bar-indeterminate {
                height: 100%;
                width: 40%;
                background: linear-gradient(90deg, 
                    transparent 0%,
                    #00ffcc 20%, 
                    #00c896 50%,
                    #00ffcc 80%,
                    transparent 100%);
                border-radius: 2px;
                animation: slideIndeterminate 1.5s ease-in-out infinite;
                box-shadow: 0 0 15px rgba(0, 255, 204, 0.6);
            }

            @keyframes slideIndeterminate {
                0% {
                    transform: translateX(-100%);
                }
                100% {
                    transform: translateX(350%);
                }
            }
        `;
    document.head.appendChild(this.styleElement);
  }

  createLoader() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'page-transition-loader';
    this.container.innerHTML = `
            <div class="loading-wrapper">
                <div class="pyramid-loader">
                    <div class="wrapper">
                        <span class="side side1"></span>
                        <span class="side side2"></span>
                        <span class="side side3"></span>
                        <span class="side side4"></span>
                        <span class="side side5"></span>
                        <span class="side side6"></span>
                        <span class="side side7"></span>
                        <span class="side side8"></span>
                        <span class="shadow"></span>
                    </div>
                </div>
                <div class="loading-label">Loading</div>
                <div class="loading-bar-container">
                    <div class="loading-bar-indeterminate"></div>
                </div>
            </div>
        `;
    document.body.appendChild(this.container);
  }

  show() {
    this.createLoader();
    // Force reflow
    this.container.offsetHeight;
    this.container.classList.add('active');
  }

  hide() {
    if (!this.container) return;
    this.container.classList.remove('active');
  }
}

// Singleton instance
let transitionLoader = null;

/**
 * Initialize page transition system
 * Intercepts navigation links and shows minimal loading bar during transitions
 */
export function initPageTransitions() {
  transitionLoader = new PageTransitionLoader();

  // Intercept all internal navigation links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href) return;

    // Skip external links, anchor links, and special protocols
    if (href.startsWith('http') ||
      href.startsWith('#') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      link.target === '_blank') {
      return;
    }

    // Skip if same page
    const currentPath = window.location.pathname;
    const targetPath = new URL(href, window.location.origin).pathname;
    if (currentPath === targetPath) return;

    // Show loader and navigate
    e.preventDefault();
    transitionLoader.show();

    // Small delay for loader to be visible, then navigate
    setTimeout(() => {
      window.location.href = href;
    }, 300);
  });

  // Hide loader when page loads (for back/forward navigation)
  window.addEventListener('pageshow', () => {
    if (transitionLoader) {
      transitionLoader.hide();
    }
  });
}

/**
 * Manually show the transition loader
 */
export function showTransitionLoader() {
  if (!transitionLoader) {
    transitionLoader = new PageTransitionLoader();
  }
  transitionLoader.show();
}

/**
 * Manually hide the transition loader
 */
export function hideTransitionLoader() {
  if (transitionLoader) {
    transitionLoader.hide();
  }
}
