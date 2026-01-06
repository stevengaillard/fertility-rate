/**
 * layout.js
 * HTML layout and component generators
 * Three-tier Architecture: Presentation Layer
 * FIXED: Scroll-to-section functionality and Card IDs
 */

const Layout = (content) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TFR Analytics Dashboard</title>
    
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-annotation@3.0.1"></script>
    
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jsvectormap/dist/css/jsvectormap.min.css" />
    <script src="https://cdn.jsdelivr.net/npm/jsvectormap/dist/js/jsvectormap.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsvectormap/dist/maps/world.js"></script>
    
    <style>
        * { font-family: 'Inter', sans-serif; }
        
        body {
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            background-attachment: fixed;
            color: #e2e8f0;
        }
        
        .jvm-tooltip {
            background-color: rgba(15, 23, 42, 0.95) !important;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 8px;
            padding: 8px 12px;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
            z-index: 9999;
        }

        .glass {
            background: rgba(30, 41, 59, 0.7);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .glass-card {
            background: rgba(30, 41, 59, 0.6);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(148, 163, 184, 0.15);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .glass-card:hover {
            background: rgba(30, 41, 59, 0.8);
            transform: translateY(-4px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        
        .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            width: 280px;
            background: rgba(15, 23, 42, 0.85);
            backdrop-filter: blur(20px);
            border-right: 1px solid rgba(148, 163, 184, 0.1);
            z-index: 100;
            overflow-y: auto;
        }
        
        .sidebar-logo {
            padding: 2rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }
        
        .sidebar-nav { padding: 1rem; }
        
        .nav-item {
            display: flex;
            align-items: center;
            padding: 0.875rem 1rem;
            margin-bottom: 0.5rem;
            border-radius: 0.75rem;
            color: #cbd5e1;
            text-decoration: none;
            transition: all 0.2s;
            cursor: pointer;
        }
        
        .nav-item:hover {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
        }
        
        .nav-item.active {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }
        
        .nav-icon { width: 1.25rem; height: 1.25rem; margin-right: 0.75rem; }
        
        .main-content {
            margin-left: 280px;
            min-height: 100vh;
            padding: 2rem;
        }
        
        .collapsible-header { cursor: pointer; user-select: none; }
        
        .collapsible-content {
            max-height: 1500px;
            overflow: hidden;
            transition: max-height 0.3s ease-out, opacity 0.3s ease-out;
            padding-bottom: 2rem;
        }
        
        .collapsible-content.collapsed {
            max-height: 0;
            opacity: 0;
            padding-bottom: 0;
        }
        
        .chart-container {
            position: relative;
            height: 500px;
            width: 100%;
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .toast-item { animation: slideIn 0.3s ease-out; }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
    </style>
</head>
<body>
    
    <aside class="sidebar">
        <div class="sidebar-logo">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                🌍 TFR Analytics
            </h1>
            <p class="text-xs text-slate-400 mt-1">Professional Dashboard</p>
            <p class="text-xs text-slate-500 mt-1">ID: D11405806</p>
        </div>
        
        <nav class="sidebar-nav">
            <a href="/" class="nav-item" data-section="dashboard">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                </svg>
                Dashboard
            </a>
            
            <a href="/stats" class="nav-item" data-section="stats">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Statistics
            </a>
            
            <div class="mt-8 px-4">
                <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Features</p>
            </div>
            
            <div class="nav-item" onclick="scrollToSection('comparison')">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                </svg>
                Compare Countries
            </div>
            
            <div class="nav-item" onclick="scrollToSection('map')">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                World Map
            </div>
            
            <div class="nav-item" onclick="scrollToSection('forecast')">
                <svg class="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
                Forecast
            </div>
        </nav>
        
        <div class="px-6 py-4 mt-auto border-t border-slate-700/50">
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Contact Me</p>
            
            <div class="space-y-3">
                <a href="tel:+886987067808" class="flex items-center gap-3 text-xs text-slate-400 hover:text-blue-400 transition-colors group">
                    <svg class="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>+886 987 067 808</span>
                </a>

                <a href="mailto:gacchuguts@gmail.com" class="flex items-center gap-3 text-xs text-slate-400 hover:text-emerald-400 transition-colors group">
                    <svg class="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                    <span>gacchuguts@gmail.com</span>
                </a>

                <a href="https://instagram.com/stevengaillard._" target="_blank" class="flex items-center gap-3 text-xs text-slate-400 hover:text-pink-400 transition-colors group">
                    <svg class="w-4 h-4 text-slate-600 group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/>
                    </svg>
                    <span>@stevengaillard._</span>
                </a>
            </div>
        </div>
    </aside>

    <div id="toast" class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80"></div>

    <main class="main-content">
        ${content}
    </main>

    <script>
        // FIXED: Navigation logic that works across pages
        function scrollToSection(id) {
            const element = document.getElementById(id);
            if (element) {
                // If element exists on current page, scroll to it
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                // If not (e.g. user is on /stats), redirect to home with hash
                window.location.href = '/#' + id;
            }
        }

        // Handle hash navigation on page load
        window.addEventListener('load', function() {
            if (window.location.hash) {
                const id = window.location.hash.substring(1);
                setTimeout(() => {
                    scrollToSection(id);
                }, 500); // Slight delay to ensure content is rendered
            }
        });
        
        // Highlight active nav item
        const currentPath = window.location.pathname;
        document.querySelectorAll('.nav-item[href]').forEach(link => {
            if (link.getAttribute('href') === currentPath) {
                link.classList.add('active');
            }
        });
        
        // Collapsible card functionality
        function toggleCollapse(id) {
            const content = document.getElementById(id);
            content.classList.toggle('collapsed');
        }

        // Global Chart Registry
        window.chartRegistry = window.chartRegistry || {};

        window.createOrUpdateChart = function(canvasId, config) {
            if (window.chartRegistry[canvasId]) {
                window.chartRegistry[canvasId].destroy();
                delete window.chartRegistry[canvasId];
            }
            const canvas = document.getElementById(canvasId);
            if (!canvas) return null;
            
            const chart = new Chart(canvas, config);
            window.chartRegistry[canvasId] = chart;
            return chart;
        };

        document.body.addEventListener('htmx:afterSwap', function(evt) {
            setTimeout(() => {
                const scripts = evt.detail.target.querySelectorAll('script');
                scripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.textContent = script.textContent;
                    document.body.appendChild(newScript);
                    document.body.removeChild(newScript);
                });
            }, 50);
        });

        window.addEventListener('beforeunload', function() {
            Object.keys(window.chartRegistry).forEach(key => {
                if (window.chartRegistry[key]) window.chartRegistry[key].destroy();
            });
        });
    </script>
</body>
</html>`;

/**
 * Generate toast notification HTML
 */
const toast = (msg, type = 'success') => {
    const configs = {
        success: { bg: 'bg-gradient-to-r from-green-600 to-emerald-600', icon: '✓' },
        error: { bg: 'bg-gradient-to-r from-red-600 to-rose-600', icon: '✕' },
        warning: { bg: 'bg-gradient-to-r from-yellow-600 to-orange-600', icon: '⚠' },
        info: { bg: 'bg-gradient-to-r from-blue-600 to-indigo-600', icon: 'ℹ' }
    };
    const config = configs[type] || configs.success;
    
    return `<div class="toast-item ${config.bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3" 
                 _="on load wait 4s then transition opacity to 0 then remove me">
                <span class="text-xl font-bold">${config.icon}</span>
                <span>${msg}</span>
            </div>`;
};

/**
 * Collapsible card component
 * FIXED: Added the id="${id}" to the outer div so scrollToSection can find it!
 */
const CollapsibleCard = (id, title, content, icon = '📊', defaultOpen = true) => `
    <div class="glass-card rounded-2xl shadow-2xl overflow-hidden mb-6" id="${id}">
        <div class="collapsible-header p-6 flex justify-between items-center" onclick="toggleCollapse('${id}-content')">
            <h2 class="text-xl font-bold text-slate-100 flex items-center gap-3">
                <span class="text-2xl">${icon}</span>
                ${title}
            </h2>
            <svg class="w-6 h-6 text-slate-400 transition-transform duration-300" id="${id}-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </div>
        <div id="${id}-content" class="collapsible-content ${defaultOpen ? '' : 'collapsed'} p-6 pt-0">
            ${content}
        </div>
    </div>
`;

module.exports = { Layout, toast, CollapsibleCard };