/**
 * Global Application JavaScript - Markaz Tikrar Indonesia
 * Modular JavaScript for all application functionality
 */

// ==========================================================================
// APPLICATION CONFIGURATION
// ==========================================================================
const APP_CONFIG = {
    APP_NAME: 'Markaz Tikrar Indonesia',
    API_BASE_URL: '/api',
    STORAGE_KEYS: {
        USER: 'mti_user',
        TOKEN: 'mti_token',
        JURNAL_STATUS: 'jurnal_status',
        LAST_JURNAL_DATE: 'lastJurnalDate',
        THEME: 'theme_preference'
    },
    ANIMATION_DURATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 500
    },
    BREAKPOINTS: {
        MOBILE: 640,
        TABLET: 768,
        DESKTOP: 1024
    }
};

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================
const Utils = {
    /**
     * Safe localStorage operations with error handling
     */
    storage: {
        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.warn(`Error reading from localStorage: ${error.message}`);
                return defaultValue;
            }
        },

        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.warn(`Error writing to localStorage: ${error.message}`);
                return false;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.warn(`Error removing from localStorage: ${error.message}`);
                return false;
            }
        }
    },

    /**
     * DOM manipulation utilities
     */
    dom: {
        getElement: (selector) => document.querySelector(selector),
        getElements: (selector) => document.querySelectorAll(selector),

        createElement: (tag, className = '', content = '') => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (content) element.textContent = content;
            return element;
        },

        addClass: (element, className) => {
            if (element) element.classList.add(className);
        },

        removeClass: (element, className) => {
            if (element) element.classList.remove(className);
        },

        toggleClass: (element, className) => {
            if (element) element.classList.toggle(className);
        },

        show: (element) => {
            if (element) element.style.display = '';
        },

        hide: (element) => {
            if (element) element.style.display = 'none';
        }
    },

    /**
     * Event handling utilities
     */
    events: {
        on: (element, event, handler, options = {}) => {
            if (element) element.addEventListener(event, handler, options);
        },

        off: (element, event, handler) => {
            if (element) element.removeEventListener(event, handler);
        },

        delegate: (parent, selector, event, handler) => {
            if (parent) {
                parent.addEventListener(event, (e) => {
                    if (e.target.matches(selector)) {
                        handler(e);
                    }
                });
            }
        }
    },

    /**
     * Animation utilities
     */
    animate: {
        fadeIn: (element, duration = APP_CONFIG.ANIMATION_DURATION.NORMAL) => {
            if (!element) return;

            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            element.style.display = '';

            setTimeout(() => {
                element.style.transition = `all ${duration}ms ease`;
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 10);
        },

        fadeOut: (element, duration = APP_CONFIG.ANIMATION_DURATION.NORMAL) => {
            if (!element) return;

            element.style.transition = `all ${duration}ms ease`;
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';

            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        },

        slideInLeft: (element, duration = APP_CONFIG.ANIMATION_DURATION.NORMAL) => {
            if (!element) return;

            element.style.transform = 'translateX(-100%)';
            element.style.display = '';

            setTimeout(() => {
                element.style.transition = `transform ${duration}ms ease`;
                element.style.transform = 'translateX(0)';
            }, 10);
        },

        slideOutLeft: (element, duration = APP_CONFIG.ANIMATION_DURATION.NORMAL) => {
            if (!element) return;

            element.style.transition = `transform ${duration}ms ease`;
            element.style.transform = 'translateX(-100%)';

            setTimeout(() => {
                element.style.display = 'none';
            }, duration);
        }
    },

    /**
     * URL and navigation utilities
     */
    url: {
        getCurrentPage: () => {
            const path = window.location.pathname;
            return path.split('/').pop().replace('.html', '') || 'index';
        },

        navigate: (url, delay = 0) => {
            if (delay > 0) {
                setTimeout(() => {
                    window.location.href = url;
                }, delay);
            } else {
                window.location.href = url;
            }
        },

        getParams: () => {
            const params = new URLSearchParams(window.location.search);
            return Object.fromEntries(params);
        }
    },

    /**
     * Validation utilities
     */
    validate: {
        email: (email) => {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        },

        required: (value) => {
            return value !== null && value !== undefined && value.toString().trim() !== '';
        },

        minLength: (value, min) => {
            return value && value.toString().length >= min;
        },

        maxLength: (value, max) => {
            return value && value.toString().length <= max;
        }
    },

    /**
     * Date utilities
     */
    date: {
        format: (date, format = 'YYYY-MM-DD') => {
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day);
        },

        isToday: (date) => {
            const today = new Date();
            const checkDate = new Date(date);
            return today.toDateString() === checkDate.toDateString();
        },

        addDays: (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        }
    }
};

// ==========================================================================
// UI COMPONENTS
// ==========================================================================
const UI = {
    /**
     * Modal component
     */
    modal: {
        create: (title, content, footer = '') => {
            const overlay = Utils.dom.createElement('div', 'modal-overlay');
            overlay.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
                </div>
            `;

            // Close on overlay click
            Utils.events.on(overlay, 'click', (e) => {
                if (e.target === overlay) {
                    UI.modal.close(overlay);
                }
            });

            return overlay;
        },

        show: (modal) => {
            if (modal) {
                document.body.appendChild(modal);
                Utils.animate.fadeIn(modal.querySelector('.modal-content'));
            }
        },

        close: (modal) => {
            if (modal) {
                Utils.animate.fadeOut(modal.querySelector('.modal-content'));
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, APP_CONFIG.ANIMATION_DURATION.NORMAL);
            }
        }
    },

    /**
     * Loading spinner component
     */
    loading: {
        show: (container, message = 'Loading...') => {
            const spinner = Utils.dom.createElement('div', 'loading-container');
            spinner.innerHTML = `
                <div class="loading-spinner"></div>
                <p class="mt-2 text-secondary">${message}</p>
            `;
            spinner.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            `;

            if (container) {
                container.appendChild(spinner);
            }
            return spinner;
        },

        hide: (spinner) => {
            if (spinner && spinner.parentNode) {
                spinner.parentNode.removeChild(spinner);
            }
        }
    },

    /**
     * Toast notification component
     */
    toast: {
        show: (message, type = 'info', duration = 3000) => {
            const toast = Utils.dom.createElement('div', `toast toast-${type}`);
            toast.textContent = message;

            // Style the toast
            Object.assign(toast.style, {
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '500',
                zIndex: '1000',
                minWidth: '250px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                transform: 'translateX(100%)',
                transition: 'transform 0.3s ease'
            });

            // Set background color based on type
            const colors = {
                success: '#10b981',
                error: '#ef4444',
                warning: '#f59e0b',
                info: '#3b82f6'
            };
            toast.style.backgroundColor = colors[type] || colors.info;

            document.body.appendChild(toast);

            // Animate in
            setTimeout(() => {
                toast.style.transform = 'translateX(0)';
            }, 100);

            // Auto remove
            setTimeout(() => {
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }, duration);
        },

        success: (message, duration) => UI.toast.show(message, 'success', duration),
        error: (message, duration) => UI.toast.show(message, 'error', duration),
        warning: (message, duration) => UI.toast.show(message, 'warning', duration),
        info: (message, duration) => UI.toast.show(message, 'info', duration)
    },

    /**
     * Sidebar component
     */
    sidebar: {
        init: () => {
            const sidebar = Utils.dom.getElement('#sidebar');
            const burgerMenu = Utils.dom.getElement('#burger-menu');
            const overlay = Utils.dom.getElement('#sidebar-overlay');

            if (!sidebar || !burgerMenu) return;

            // Mobile menu toggle
            Utils.events.on(burgerMenu, 'click', () => {
                UI.sidebar.toggle();
            });

            // Close on overlay click
            if (overlay) {
                Utils.events.on(overlay, 'click', () => {
                    UI.sidebar.close();
                });
            }

            // Handle window resize
            Utils.events.on(window, 'resize', () => {
                if (window.innerWidth >= APP_CONFIG.BREAKPOINTS.TABLET) {
                    UI.sidebar.close();
                }
            });
        },

        open: () => {
            const sidebar = Utils.dom.getElement('#sidebar');
            const overlay = Utils.dom.getElement('#sidebar-overlay');

            if (sidebar && overlay) {
                Utils.dom.show(overlay);
                Utils.dom.removeClass(sidebar, 'hidden');
                Utils.animate.slideInLeft(sidebar);
            }
        },

        close: () => {
            const sidebar = Utils.dom.getElement('#sidebar');
            const overlay = Utils.dom.getElement('#sidebar-overlay');

            if (sidebar && overlay) {
                Utils.animate.slideOutLeft(sidebar);
                Utils.dom.hide(overlay);
                setTimeout(() => {
                    Utils.dom.addClass(sidebar, 'hidden');
                }, APP_CONFIG.ANIMATION_DURATION.NORMAL);
            }
        },

        toggle: () => {
            const sidebar = Utils.dom.getElement('#sidebar');
            if (sidebar) {
                if (sidebar.classList.contains('hidden')) {
                    UI.sidebar.open();
                } else {
                    UI.sidebar.close();
                }
            }
        },

        setActiveMenuItem: (pageName) => {
            const menuItems = Utils.dom.getElements('.sidebar nav a');
            menuItems.forEach(item => {
                const href = item.getAttribute('href');
                if (href && href.includes(pageName)) {
                    Utils.dom.addClass(item, 'active');
                } else {
                    Utils.dom.removeClass(item, 'active');
                }
            });
        }
    }
};

// ==========================================================================
// APPLICATION STATE
// ==========================================================================
const AppState = {
    user: null,
    isAuthenticated: false,
    currentPage: '',
    theme: 'light',

    init: () => {
        // Load user data
        const userData = Utils.storage.get(APP_CONFIG.STORAGE_KEYS.USER);
        if (userData) {
            AppState.user = userData;
            AppState.isAuthenticated = true;
        }

        // Load theme preference
        AppState.theme = Utils.storage.get(APP_CONFIG.STORAGE_KEYS.THEME, 'light');

        // Set current page
        AppState.currentPage = Utils.url.getCurrentPage();
    },

    setUser: (userData) => {
        AppState.user = userData;
        AppState.isAuthenticated = true;
        Utils.storage.set(APP_CONFIG.STORAGE_KEYS.USER, userData);
    },

    clearUser: () => {
        AppState.user = null;
        AppState.isAuthenticated = false;
        Utils.storage.remove(APP_CONFIG.STORAGE_KEYS.USER);
        Utils.storage.remove(APP_CONFIG.STORAGE_KEYS.TOKEN);
    },

    setTheme: (theme) => {
        AppState.theme = theme;
        Utils.storage.set(APP_CONFIG.STORAGE_KEYS.THEME, theme);
        document.documentElement.setAttribute('data-theme', theme);
    }
};

// ==========================================================================
// AUTHENTICATION
// ==========================================================================
const Auth = {
    login: async (email, password) => {
        try {
            // Validate input
            if (!Utils.validate.email(email)) {
                throw new Error('Format email tidak valid');
            }
            if (!Utils.validate.required(password)) {
                throw new Error('Password tidak boleh kosong');
            }

            // Simulate API call
            const loadingSpinner = UI.loading.show(document.body, 'Sedang masuk...');

            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

            UI.loading.hide(loadingSpinner);

            // Simulate successful login
            const userData = {
                id: 1,
                name: 'Fatimah Az-Zahra',
                email: email,
                avatar: 'https://placehold.co/100x100/E1B12C/FFFFFF?text=F',
                role: 'student'
            };

            AppState.setUser(userData);
            UI.toast.success('Login berhasil! Selamat datang kembali.');

            // Redirect to dashboard
            Utils.url.navigate('dashboard.html', 1000);

        } catch (error) {
            UI.toast.error(error.message);
            throw error;
        }
    },

    logout: () => {
        AppState.clearUser();
        UI.toast.info('Antunna telah keluar dari sistem');
        Utils.url.navigate('index.html', 1000);
    },

    requireAuth: () => {
        if (!AppState.isAuthenticated) {
            UI.toast.warning('Silakan login untuk melanjutkan');
            Utils.url.navigate('login.html');
            return false;
        }
        return true;
    }
};

// ==========================================================================
// JURNAL FUNCTIONALITY
// ==========================================================================
const Jurnal = {
    STATUS: {
        IDLE: 'idle',
        LOADING: 'loading',
        ACTIVE: 'active',
        COMPLETED: 'completed'
    },

    init: () => {
        Jurnal.updateStatusDisplay();
        Jurnal.initStepper();
    },

    updateStatusDisplay: () => {
        const today = Utils.date.format(new Date());
        const lastJurnalDate = Utils.storage.get(APP_CONFIG.STORAGE_KEYS.LAST_JURNAL_DATE);
        const jurnalStatus = Utils.storage.get(APP_CONFIG.STORAGE_KEYS.JURNAL_STATUS, Jurnal.STATUS.IDLE);

        // Update button on dashboard if exists
        const jurnalButton = Utils.dom.getElement('#jurnal-button');
        if (jurnalButton) {
            const buttonText = jurnalButton.querySelector('.button-text');
            const buttonSpinner = jurnalButton.querySelector('.button-spinner');

            if (lastJurnalDate === today && jurnalStatus === Jurnal.STATUS.COMPLETED) {
                // Jurnal already completed today
                buttonText.textContent = 'Jurnal Selesai ✓';
                jurnalButton.className = 'btn btn-success btn-lg';
                jurnalButton.disabled = true;
            } else {
                // Jurnal not completed today
                buttonText.textContent = 'Mulai Jurnal Harian';
                jurnalButton.className = 'btn btn-primary btn-lg';
                jurnalButton.disabled = false;
            }
        }
    },

    startJurnal: async () => {
        try {
            // Update status to loading
            Utils.storage.set(APP_CONFIG.STORAGE_KEYS.JURNAL_STATUS, Jurnal.STATUS.LOADING);
            Jurnal.updateStatusDisplay();

            // Navigate to jurnal page
            Utils.url.navigate('jurnal-harian.html');

        } catch (error) {
            UI.toast.error('Gagal memulai jurnal harian');
            Utils.storage.set(APP_CONFIG.STORAGE_KEYS.JURNAL_STATUS, Jurnal.STATUS.IDLE);
            Jurnal.updateStatusDisplay();
        }
    },

    initStepper: () => {
        if (Utils.url.getCurrentPage() !== 'jurnal-harian') return;

        const steps = Utils.dom.getElements('.step-item');
        let currentStep = 0;

        // Initialize first step as active
        if (steps.length > 0) {
            Utils.dom.addClass(steps[0], 'active');
        }

        // Step navigation
        window.nextStep = () => {
            if (currentStep < steps.length - 1) {
                Utils.dom.removeClass(steps[currentStep], 'active');
                Utils.dom.addClass(steps[currentStep], 'completed');
                currentStep++;
                Utils.dom.addClass(steps[currentStep], 'active');

                // Scroll to current step
                steps[currentStep].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        window.previousStep = () => {
            if (currentStep > 0) {
                Utils.dom.removeClass(steps[currentStep], 'active');
                currentStep--;
                Utils.dom.addClass(steps[currentStep], 'active');
                Utils.dom.removeClass(steps[currentStep], 'completed');

                // Scroll to current step
                steps[currentStep].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        window.completeJurnal = () => {
            const today = Utils.date.format(new Date());
            Utils.storage.set(APP_CONFIG.STORAGE_KEYS.LAST_JURNAL_DATE, today);
            Utils.storage.set(APP_CONFIG.STORAGE_KEYS.JURNAL_STATUS, Jurnal.STATUS.COMPLETED);

            UI.toast.success('Jurnal harian berhasil diselesaikan!');

            // Show completion modal
            const modal = UI.modal.create(
                'Jurnal Selesai! 🎉',
                '<p>Alhamdulillah, jurnal harian Antunna telah berhasil diselesaikan.</p><p class="mt-2">Terus istiqamah dalam belajar ya!</p>',
                '<button onclick="this.closest(\'.modal-overlay\').remove(); window.location.href=\'dashboard.html\'" class="btn btn-primary">Kembali ke Dashboard</button>'
            );
            UI.modal.show(modal);
        };
    }
};

// ==========================================================================
// DASHBOARD FUNCTIONALITY
// ==========================================================================
const Dashboard = {
    charts: {},
    motivationalQuotes: [
        "Belajar hari ini, sukses esok hari. Tetap semangat! 💪",
        "Setiap hafalan adalah investasi akhirat. Terus berlatih! 📚",
        "Al-Qur'an adalah teman terbaik. Dekatkan diri Antunna padanya! ❤️",
        "Konsistensi adalah kunci kesuksesan dalam menghafal. 🗝️",
        "Waktu yang Antunna investasikan untuk Al-Qur'an tidak akan sia-sia. ⏰"
    ],

    init: () => {
        Dashboard.updateWelcomeMessage();
        Dashboard.initCharts();
        Dashboard.updateStats();
    },

    updateWelcomeMessage: () => {
        const quoteElement = Utils.dom.getElement('#motivational-quote');
        if (quoteElement) {
            const randomQuote = Dashboard.motivationalQuotes[Math.floor(Math.random() * Dashboard.motivationalQuotes.length)];
            quoteElement.textContent = randomQuote;
        }
    },

    initCharts: () => {
        // Initialize progress chart if Chart.js is available
        if (typeof Chart !== 'undefined') {
            const progressCtx = Utils.dom.getElement('#progressChart');
            if (progressCtx) {
                Dashboard.charts.progress = new Chart(progressCtx, {
                    type: 'line',
                    data: {
                        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                        datasets: [{
                            label: 'Progress Harian',
                            data: [65, 78, 82, 81, 86, 87, 90],
                            borderColor: '#E1B12C',
                            backgroundColor: 'rgba(225, 177, 44, 0.1)',
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        }
                    }
                });
            }
        }
    },

    updateStats: () => {
        // Simulate dynamic stats update
        const stats = {
            totalHafalan: 15,
            hafalanBaru: 3,
            murojaah: 12,
            persentase: 85
        };

        // Update stat cards
        Object.keys(stats).forEach(key => {
            const element = Utils.dom.getElement(`#${key}`);
            if (element) {
                const value = element.querySelector('.stat-value');
                if (value) {
                    // Animate number counting
                    const target = stats[key];
                    let current = 0;
                    const increment = target / 50;
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        value.textContent = Math.floor(current) + (key === 'persentase' ? '%' : '');
                    }, 20);
                }
            }
        });
    }
};

// ==========================================================================
// APPLICATION INITIALIZATION
// ==========================================================================
const App = {
    init: () => {
        // Initialize application state
        AppState.init();

        // Initialize UI components
        UI.sidebar.init();
        UI.sidebar.setActiveMenuItem(AppState.currentPage);

        // Initialize page-specific functionality
        App.initPage();

        // Apply theme
        AppState.setTheme(AppState.theme);

        // Initialize global event listeners
        App.initGlobalEvents();

        console.log(`${APP_CONFIG.APP_NAME} initialized successfully`);
    },

    initPage: () => {
        const currentPage = Utils.url.getCurrentPage();

        switch (currentPage) {
            case 'login':
                App.initLoginPage();
                break;
            case 'dashboard':
                Dashboard.init();
                Jurnal.updateStatusDisplay();
                break;
            case 'jurnal-harian':
                Jurnal.initStepper();
                break;
            default:
                // Default initialization
                break;
        }
    },

    initLoginPage: () => {
        const loginForm = Utils.dom.getElement('#login-form');
        const googleButton = Utils.dom.getElement('#google-login');

        if (loginForm) {
            Utils.events.on(loginForm, 'submit', async (e) => {
                e.preventDefault();

                const email = Utils.dom.getElement('#email')?.value;
                const password = Utils.dom.getElement('#password')?.value;

                if (email && password) {
                    try {
                        await Auth.login(email, password);
                    } catch (error) {
                        // Error already handled in Auth.login
                    }
                }
            });
        }

        if (googleButton) {
            Utils.events.on(googleButton, 'click', () => {
                UI.toast.info('Login dengan Google akan segera tersedia');
            });
        }
    },

    initGlobalEvents: () => {
        // Handle logout links
        const logoutLinks = Utils.dom.getElements('a[href*="logout"]');
        logoutLinks.forEach(link => {
            Utils.events.on(link, 'click', (e) => {
                e.preventDefault();
                Auth.logout();
            });
        });

        // Handle jurnal button on dashboard
        const jurnalButton = Utils.dom.getElement('#jurnal-button');
        if (jurnalButton) {
            Utils.events.on(jurnalButton, 'click', () => {
                Jurnal.startJurnal();
            });
        }

        // Handle window resize for responsive behavior
        let resizeTimeout;
        Utils.events.on(window, 'resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                // Handle responsive adjustments
                if (window.innerWidth >= APP_CONFIG.BREAKPOINTS.TABLET) {
                    UI.sidebar.close();
                }
            }, 250);
        });

        // Handle page visibility change
        Utils.events.on(document, 'visibilitychange', () => {
            if (!document.hidden) {
                // Page became visible again
                Jurnal.updateStatusDisplay();
            }
        });
    }
};

// ==========================================================================
// AUTO-INITIALIZE WHEN DOM IS READY
// ==========================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    App.init();
}

// ==========================================================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ==========================================================================
window.MTI = {
    Utils,
    UI,
    AppState,
    Auth,
    Jurnal,
    Dashboard,
    App,
    APP_CONFIG
};