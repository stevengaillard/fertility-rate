/**
 * frontend.js
 * Frontend page routes with professional glassmorphism design
 */

const express = require('express');
const router = express.Router();
const { Layout, CollapsibleCard } = require('../views/layout');

router.get('/', (req, res) => {
    const db = req.app.locals.db;

    // Fetch dropdown data
    db.all("SELECT * FROM countries ORDER BY name", [], (err, countries) => {
        db.all("SELECT * FROM regions ORDER BY name", [], (err, regions) => {
            db.all("SELECT * FROM subregions ORDER BY name", [], (err, subregions) => {
                
                res.send(Layout(`
                    <!-- Hero Section with Stats -->
                    <div class="mb-8">
                        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                            Global Fertility Analytics
                        </h1>
                        <p class="text-slate-400">Professional demographic insights and forecasting platform</p>
                    </div>

                    <!-- Quick Stats Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div class="glass-card rounded-2xl p-6 stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-slate-400 text-sm">Countries</span>
                                <span class="text-3xl">🌍</span>
                            </div>
                            <div class="text-3xl font-bold text-blue-400">${countries.length}</div>
                            <div class="text-xs text-slate-500 mt-1">Tracked entities</div>
                        </div>
                        
                        <div class="glass-card rounded-2xl p-6 stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-slate-400 text-sm">Regions</span>
                                <span class="text-3xl">🗺️</span>
                            </div>
                            <div class="text-3xl font-bold text-purple-400">${regions.length}</div>
                            <div class="text-xs text-slate-500 mt-1">Major regions</div>
                        </div>
                        
                        <div class="glass-card rounded-2xl p-6 stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-slate-400 text-sm">Sub-regions</span>
                                <span class="text-3xl">📍</span>
                            </div>
                            <div class="text-3xl font-bold text-emerald-400">${subregions.length}</div>
                            <div class="text-xs text-slate-500 mt-1">Geographic divisions</div>
                        </div>
                        
                        <div class="glass-card rounded-2xl p-6 stat-card">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-slate-400 text-sm">Data Points</span>
                                <span class="text-3xl">📊</span>
                            </div>
                            <div class="text-3xl font-bold text-orange-400" hx-get="/api/record-count" hx-trigger="load" hx-swap="innerHTML">...</div>
                            <div class="text-xs text-slate-500 mt-1">TFR records</div>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        <!-- Left Column: Main Charts -->
                        <div class="xl:col-span-2 space-y-6">
                            
                            ${CollapsibleCard('country-history', 'Country TFR History', `
                                <select class="w-full glass p-4 rounded-xl mb-4 text-slate-200 border-none outline-none" 
                                        name="country_id" hx-get="/api/history" hx-target="#chart-area">
                                    <option value="">🔍 Select a country...</option>
                                    ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                                <div id="chart-area" class="chart-container glass rounded-xl flex items-center justify-center text-slate-400">
                                    Select a country to view historical trends
                                </div>
                            `, '📈')}

                            ${CollapsibleCard('comparison', 'Country Comparison Tool', `
                                <form hx-get="/api/compare" hx-target="#compare-area">
                                    <div class="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label class="text-xs text-slate-400 mb-2 block">Country A</label>
                                            <select name="country_a" class="w-full glass p-3 rounded-xl text-slate-200">
                                                <option value="">Select...</option>
                                                ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                            </select>
                                        </div>
                                        <div>
                                            <label class="text-xs text-slate-400 mb-2 block">Country B</label>
                                            <select name="country_b" class="w-full glass p-3 rounded-xl text-slate-200">
                                                <option value="">Select...</option>
                                                ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <button type="submit" 
                                            class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 p-3 rounded-xl transition-all">
                                        Compare Trends
                                    </button>
                                </form>

                                <div id="compare-summary" class="mt-4 text-sm text-slate-300"></div>
                                
                                <div id="compare-area" class="chart-container glass rounded-xl mt-4">
                                    <div class="h-full flex items-center justify-center text-slate-400">
                                        Select two countries to compare
                                    </div>
                                </div>
                            `, '⚖️', false)}

                            ${CollapsibleCard('map', 'Interactive World Map', `
                                <div class="mb-4">
                                    <label class="text-xs text-slate-400 mb-2 block">Select Year</label>
                                    <div class="flex gap-2">
                                        <input type="number" name="map_year" value="2023" min="1950" max="2023" 
                                               class="flex-1 glass p-3 rounded-xl text-slate-200">
                                        <button hx-include="previous input" hx-get="/api/map-data" hx-target="#map-container" 
                                                class="px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all">
                                            Load Map
                                        </button>
                                    </div>
                                </div>
                                <div id="map-container" style="height: 500px;" class="glass rounded-xl flex items-center justify-center text-slate-400">
                                    Click "Load Map" to visualize global TFR data
                                </div>
                            `, '🗺️', false)}

                            ${CollapsibleCard('global-trends', 'Global Trends Analysis', `
                                <form hx-get="/api/global-trends" hx-target="#trends-area" class="flex gap-3 mb-4">
                                    
                                    <input type="number" name="start_year" value="1950" 
                                        class="flex-1 glass p-3 rounded-xl text-slate-200 placeholder-slate-400" 
                                        placeholder="Start Year">
                                        
                                    <input type="number" name="end_year" value="2023" 
                                        class="flex-1 glass p-3 rounded-xl text-slate-200 placeholder-slate-400" 
                                        placeholder="End Year">
                                        
                                    <button type="submit" 
                                            class="px-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl transition-all">
                                        Analyze
                                    </button>
                                </form>
                                
                                <div id="trends-area" class="chart-container glass rounded-xl flex items-center justify-center text-slate-400">
                                    Configure year range and click Analyze
                                </div>
                            `, '🌐')}
                            
                            ${CollapsibleCard('forecast', 'TFR Forecast (Linear Regression)', `
                                <select name="forecast_country" class="w-full glass p-4 rounded-xl mb-4 text-slate-200">
                                    <option value="">🔮 Select a country...</option>
                                    ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                                <button hx-include="previous select" hx-get="/api/forecast" hx-target="#forecast-area" 
                                        class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 p-3 rounded-xl transition-all mb-4">
                                    🚀 Predict Next 5 Years
                                </button>
                                
                                <div id="forecast-area" class="glass rounded-xl p-4">
                                    <div class="h-64 flex items-center justify-center text-slate-400">
                                        Select a country to generate forecast
                                    </div>
                                </div>
                            `, '🔮', false)}
                        </div>

                        <!-- Right Column: Query & CRUD Operations -->
                        <div class="space-y-6">
                            
                            ${CollapsibleCard('queries', 'Query Operations', `
                                <!-- Search -->
                                <div class="mb-6 pb-6 border-b border-slate-700">
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">🔎 Search Country</label>
                                    <form hx-get="/api/search" hx-target="#search-res" hx-trigger="keyup delay:500ms from:input, change from:input">
                                        <div class="flex gap-2 mb-3">
                                            <input type="text" name="search" class="flex-1 glass p-3 rounded-xl text-slate-200" placeholder="Type country name...">
                                            <input type="number" name="year" value="2023" class="w-24 glass p-3 rounded-xl text-slate-200" placeholder="Year">
                                        </div>
                                    </form>
                                    <div id="search-res" class="max-h-64 overflow-y-auto"></div>
                                </div>

                                <!-- Sub-region -->
                                <div class="mb-6 pb-6 border-b border-slate-700">
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">📍 Sub-region Rankings</label>
                                    <form hx-get="/api/subregion" hx-target="#sub-res">
                                        <select name="subregion_id" class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                            <option value="">Select sub-region...</option>
                                            ${subregions.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                                        </select>
                                        <input type="number" name="year" value="2021" class="w-full glass p-3 rounded-xl text-slate-200 mb-2" placeholder="Year">
                                        <button type="submit" class="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 p-3 rounded-xl transition-all">
                                            Show Rankings
                                        </button>
                                    </form>
                                    <div id="sub-res" class="mt-3 max-h-48 overflow-y-auto text-sm"></div>
                                </div>

                                <!-- Region -->
                                <div>
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">🗺️ Region Averages</label>
                                    <form hx-get="/api/region" hx-target="#reg-res">
                                        <select name="region_id" class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                            <option value="">Select region...</option>
                                            ${regions.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
                                        </select>
                                        <input type="number" name="year" value="2021" class="w-full glass p-3 rounded-xl text-slate-200 mb-2" placeholder="Year">
                                        <button type="submit" class="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 p-3 rounded-xl transition-all">
                                            Calculate Averages
                                        </button>
                                    </form>
                                    <div id="reg-res" class="mt-3 max-h-48 overflow-y-auto text-sm"></div>
                                </div>
                            `, '🔍')}

                            ${CollapsibleCard('crud', 'Data Management (CRUD)', `
                                <!-- Add -->
                                <form hx-post="/api/add-year" hx-swap="beforeend" hx-target="#toast" class="mb-6 pb-6 border-b border-slate-700">
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">➕ Add Record</label>
                                    <select name="country_id" required class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                        <option value="">Select country...</option>
                                        ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                    <input type="number" step="0.01" name="tfr" required placeholder="TFR Value (e.g. 2.15)" 
                                           class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                    <button type="submit" class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 p-3 rounded-xl transition-all">
                                        Add Next Year
                                    </button>
                                </form>

                                <!-- Update -->
                                <form hx-put="/api/update" hx-swap="beforeend" hx-target="#toast" class="mb-6 pb-6 border-b border-slate-700">
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">✏️ Update Record</label>
                                    <select name="country_id" required class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                        <option value="">Select country...</option>
                                        ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                    <div class="grid grid-cols-2 gap-2 mb-2">
                                        <input type="number" name="year" required placeholder="Year" class="glass p-3 rounded-xl text-slate-200">
                                        <input type="number" step="0.01" name="tfr" required placeholder="New TFR" class="glass p-3 rounded-xl text-slate-200">
                                    </div>
                                    <button type="submit" class="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 p-3 rounded-xl transition-all">
                                        Update Record
                                    </button>
                                </form>

                                <!-- Delete -->
                                <form hx-delete="/api/delete" hx-swap="beforeend" hx-target="#toast" hx-confirm="Are you sure you want to delete these records?">
                                    <label class="text-xs uppercase font-bold text-slate-400 mb-2 block">🗑️ Delete Range</label>
                                    <select name="country_id" required class="w-full glass p-3 rounded-xl text-slate-200 mb-2">
                                        <option value="">Select country...</option>
                                        ${countries.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                    </select>
                                    <div class="grid grid-cols-2 gap-2 mb-2">
                                        <input type="number" name="start" required placeholder="Start Year" class="glass p-3 rounded-xl text-slate-200">
                                        <input type="number" name="end" required placeholder="End Year" class="glass p-3 rounded-xl text-slate-200">
                                    </div>
                                    <button type="submit" class="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 p-3 rounded-xl transition-all">
                                        Delete Range
                                    </button>
                                </form>
                            `, '✏️')}
                        </div>
                    </div>
                `));
            });
        });
    });
});

// Stats route with glassmorphism
router.get('/stats', (req, res) => {
    const db = req.app.locals.db;
    db.get(`SELECT 
        (SELECT COUNT(*) FROM regions) as regions, 
        (SELECT COUNT(*) FROM subregions) as subregions, 
        (SELECT COUNT(*) FROM countries) as countries, 
        (SELECT COUNT(*) FROM tfr_records) as records, 
        (SELECT MIN(year) FROM tfr_records) as min_year, 
        (SELECT MAX(year) FROM tfr_records) as max_year, 
        (SELECT AVG(tfr) FROM tfr_records) as avg_tfr`, (err, stats) => {
        if(err) return res.send("Error");
        res.send(Layout(`
            <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-8">
                📊 Database Statistics
            </h1>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="glass-card rounded-2xl p-8 text-center stat-card">
                    <div class="text-5xl font-bold text-blue-400">${stats.regions}</div>
                    <div class="text-slate-400 mt-3">Regions</div>
                </div>
                <div class="glass-card rounded-2xl p-8 text-center stat-card">
                    <div class="text-5xl font-bold text-purple-400">${stats.subregions}</div>
                    <div class="text-slate-400 mt-3">Sub-regions</div>
                </div>
                <div class="glass-card rounded-2xl p-8 text-center stat-card">
                    <div class="text-5xl font-bold text-emerald-400">${stats.countries}</div>
                    <div class="text-slate-400 mt-3">Countries</div>
                </div>
                <div class="glass-card rounded-2xl p-8 text-center stat-card">
                    <div class="text-5xl font-bold text-orange-400">${stats.records.toLocaleString()}</div>
                    <div class="text-slate-400 mt-3">TFR Records</div>
                </div>
            </div>
            
            <div class="glass-card rounded-2xl p-8 shadow-2xl">
                <h2 class="text-2xl font-bold mb-6 text-slate-100">Data Overview</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300">
                    <div class="flex items-center gap-4">
                        <span class="text-3xl">📅</span>
                        <div>
                            <span class="text-slate-400 text-sm">Year Range</span>
                            <div class="font-bold text-xl">${stats.min_year} - ${stats.max_year}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-3xl">📊</span>
                        <div>
                            <span class="text-slate-400 text-sm">Global Average TFR</span>
                            <div class="font-bold text-xl">${stats.avg_tfr ? stats.avg_tfr.toFixed(3) : 'N/A'}</div>
                        </div>
                    </div>
                </div>
            </div>
        `));
    });
});

module.exports = router;