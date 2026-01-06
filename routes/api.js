/**
 * api.js
 * API routes for data operations (CRUD + Queries)
 * Three-tier Architecture: Business Logic Layer
 */

const express = require('express');
const router = express.Router();
const { toast } = require('../views/layout');

// ... [Keep Req 1, Req 4, Req 2, Req 3, Req 8 endpoints exactly as they were] ...
// (I will paste the full file content below for clarity, but the focus is on /add-year)

/**
 * Requirement 1: Get country TFR history
 */
router.get('/history', (req, res) => {
    if (!req.query.country_id) {
        return res.send('<div class="p-4 text-slate-500">Please select a country</div>');
    }
    
    const db = req.app.locals.db;
    
    // Get country name first
    db.get('SELECT name FROM countries WHERE id = ?', [req.query.country_id], (err, country) => {
        if (err || !country) {
            return res.send('<div class="p-4 text-red-500">Country not found</div>');
        }

        db.all(`
            SELECT year, tfr 
            FROM tfr_records 
            WHERE country_id = ? 
            ORDER BY year DESC
        `, [req.query.country_id], (err, rows) => {
            if (err || !rows.length) {
                return res.send('<div class="p-4 text-yellow-500">No data available</div>');
            }

            const labels = rows.map(r => r.year).reverse();
            const data = rows.map(r => r.tfr).reverse();

            res.send(`
                <canvas id="history-chart"></canvas>
                <script>
                    (function() {
                        const ctx = document.getElementById('history-chart');
                        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
                        gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.2)');
                        gradient.addColorStop(1, 'rgba(96, 165, 250, 0.05)');

                        window.createOrUpdateChart('history-chart', {
                            type: 'line',
                            data: {
                                labels: ${JSON.stringify(labels)},
                                datasets: [{
                                    label: '${country.name} - Total Fertility Rate',
                                    data: ${JSON.stringify(data)},
                                    borderColor: '#60a5fa',
                                    backgroundColor: gradient,
                                    borderWidth: 3,
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: 3,
                                    pointHoverRadius: 7,
                                    pointBackgroundColor: '#60a5fa',
                                    pointBorderColor: '#fff',
                                    pointBorderWidth: 2
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: { color: '#cbd5e1', font: { size: 14, weight: 'bold' } }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                        titleColor: '#cbd5e1',
                                        bodyColor: '#cbd5e1',
                                        borderColor: '#475569',
                                        borderWidth: 1,
                                        padding: 12,
                                        displayColors: true,
                                        callbacks: {
                                            label: function(context) {
                                                return 'TFR: ' + context.parsed.y.toFixed(2);
                                            }
                                        }
                                    },
                                    annotation: {
                                        annotations: {
                                            replacementLine: {
                                                type: 'line',
                                                yMin: 2.1,
                                                yMax: 2.1,
                                                borderColor: '#ef4444',
                                                borderWidth: 2,
                                                borderDash: [5, 5],
                                                label: {
                                                    content: 'Replacement Level (2.1)',
                                                    enabled: true,
                                                    position: 'end',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                    color: '#fff',
                                                    font: { size: 11 }
                                                }
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: false,
                                        grid: { color: '#334155' },
                                        ticks: { color: '#94a3b8', font: { size: 12 } },
                                        title: {
                                            display: true,
                                            text: 'Births per Woman',
                                            color: '#94a3b8',
                                            font: { size: 13 }
                                        }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { 
                                            color: '#94a3b8',
                                            maxRotation: 45,
                                            minRotation: 45
                                        },
                                        title: {
                                            display: true,
                                            text: 'Year',
                                            color: '#94a3b8',
                                            font: { size: 13 }
                                        }
                                    }
                                },
                                interaction: {
                                    mode: 'index',
                                    intersect: false
                                }
                            }
                        });
                    })();
                </script>
            `);
        });
    });
});

/**
 * Requirement 4: Search
 */
router.get('/search', (req, res) => {
    const db = req.app.locals.db;
    const searchTerm = req.query.search || '';
    const year = req.query.year || 2023;

    if (searchTerm.length < 2) return res.send('<div class="p-2 text-slate-500">Type at least 2 characters...</div>');

    const query = `
        SELECT c.name, t.tfr, t.year
        FROM countries c
        JOIN tfr_records t ON c.id = t.country_id
        WHERE c.name LIKE ? AND t.year = ?
        ORDER BY c.name LIMIT 20
    `;

    db.all(query, [`%${searchTerm}%`, year], (err, rows) => {
        if (err) return res.send('<div class="p-2 text-red-500">Search error</div>');
        if (!rows || rows.length === 0) return res.send(`<div class="p-2 text-slate-500">No data found for "${searchTerm}" in ${year}</div>`);
        const html = rows.map(r => `
            <div class="flex justify-between border-b border-slate-700 p-2 hover:bg-slate-700 transition">
                <span>${r.name}</span><span class="text-blue-300 font-mono">${r.tfr.toFixed(2)} (${r.year})</span>
            </div>`).join('');
        res.send(html);
    });
});

/**
 * Requirement 2: Sub-region
 */
router.get('/subregion', (req, res) => {
    const db = req.app.locals.db;
    const year = req.query.year || 2021;
    if (!req.query.subregion_id) return res.send('<div class="p-2 text-slate-500">Please select a sub-region</div>');
    db.all(`SELECT c.name, t.tfr FROM countries c JOIN tfr_records t ON c.id = t.country_id WHERE c.subregion_id = ? AND t.year = ? ORDER BY t.tfr ASC`, [req.query.subregion_id, year], (err, rows) => {
        if (err) return res.send('<div class="p-2 text-red-500">Database error</div>');
        if (!rows.length) return res.send(`<div class="p-2 text-yellow-500">No data available for year ${year}</div>`);
        res.send(rows.map((r, i) => `<div class="flex justify-between border-b border-slate-700 p-2 hover:bg-slate-700 transition"><span>${i + 1}. ${r.name}</span><span class="text-emerald-400 font-bold">${r.tfr.toFixed(2)}</span></div>`).join(''));
    });
});

/**
 * Requirement 3: Region
 */
router.get('/region', (req, res) => {
    const db = req.app.locals.db;
    const year = req.query.year || 2021;
    if (!req.query.region_id) return res.send('<div class="p-2 text-slate-500">Please select a region</div>');
    db.all(`SELECT s.name, AVG(t.tfr) as avg_tfr FROM subregions s JOIN countries c ON s.id = c.subregion_id JOIN tfr_records t ON c.id = t.country_id WHERE s.region_id = ? AND t.year = ? GROUP BY s.id ORDER BY s.name`, [req.query.region_id, year], (err, rows) => {
        if (err) return res.send('<div class="p-2 text-red-500">Database error</div>');
        if (!rows.length) return res.send(`<div class="p-2 text-yellow-500">No data available for year ${year}</div>`);
        res.send(rows.map(r => `<div class="flex justify-between border-b border-slate-700 p-2 hover:bg-slate-700 transition"><span>${r.name}</span><span class="text-orange-400 font-bold">${r.avg_tfr.toFixed(2)}</span></div>`).join(''));
    });
});

/**
 * Requirement 8: Global Trends
 */
router.get('/global-trends', (req, res) => {
    const db = req.app.locals.db;
    const start = req.query.start_year || 1950;
    const end = req.query.end_year || 2023;

    db.all(`
        SELECT r.name as region, t.year, AVG(t.tfr) as avg_tfr
        FROM regions r
        JOIN subregions s ON r.id = s.region_id
        JOIN countries c ON s.id = c.subregion_id
        JOIN tfr_records t ON c.id = t.country_id
        WHERE t.year BETWEEN ? AND ?
        GROUP BY r.id, t.year
        ORDER BY r.name, t.year
    `, [start, end], (err, rows) => {
        if (!rows || !rows.length) {
            return res.send('<div class="p-4 text-yellow-500">No data available for this range</div>');
        }

        const regions = [...new Set(rows.map(r => r.region))];
        const years = [...new Set(rows.map(r => r.year))];

        const colorPalette = [
            { border: '#ef4444', bg: 'rgba(239, 68, 68, 0.2)' },
            { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' },
            { border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' },
            { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.2)' },
            { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' },
            { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' }
        ];

        const datasets = regions.map((region, i) => {
            const color = colorPalette[i % colorPalette.length];
            const data = years.map(year => {
                const record = rows.find(x => x.region === region && x.year === year);
                return record ? record.avg_tfr : null;
            });

            return {
                label: region,
                data: data,
                borderColor: color.border,
                backgroundColor: color.bg,
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 2,
                pointHoverRadius: 6
            };
        });

        res.send(`
            <canvas id="trends-chart"></canvas>
            <script>
                (function() {
                    const ctx = document.getElementById('trends-chart');
                    window.createOrUpdateChart('trends-chart', {
                        type: 'line',
                        data: {
                            labels: ${JSON.stringify(years)},
                            datasets: ${JSON.stringify(datasets)}
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#cbd5e1',
                                        padding: 15,
                                        font: { size: 12 }
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                    titleColor: '#cbd5e1',
                                    bodyColor: '#cbd5e1',
                                    borderColor: '#475569',
                                    borderWidth: 1
                                },
                                annotation: {
                                    annotations: {
                                        replacementLine: {
                                            type: 'line',
                                            yMin: 2.1,
                                            yMax: 2.1,
                                            borderColor: '#ef4444',
                                            borderWidth: 2,
                                            borderDash: [5, 5],
                                            label: {
                                                content: 'Replacement Level',
                                                enabled: true,
                                                position: 'start',
                                                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                color: '#fff',
                                                font: { size: 10 }
                                            }
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: false,
                                    grid: { color: '#334155' },
                                    ticks: { color: '#94a3b8' },
                                    title: {
                                        display: true,
                                        text: 'Average TFR',
                                        color: '#94a3b8'
                                    }
                                },
                                x: {
                                    grid: { display: false },
                                    ticks: { 
                                        color: '#94a3b8',
                                        maxRotation: 45,
                                        minRotation: 45
                                    }
                                }
                            },
                            interaction: {
                                mode: 'index',
                                intersect: false
                            }
                        }
                    });
                })();
            </script>
        `);
    });
});

/**
 * Requirement 5: Add Next Year (Auto-Increment)
 * UPDATED: Calculates MAX(year) + 1 automatically
 */
router.post('/add-year', (req, res) => {
    const db = req.app.locals.db;
    const { country_id, tfr } = req.body; // 'year' removed from input

    if (!country_id || !tfr) {
        return res.send(toast("Please select country and TFR", "error"));
    }

    const tfrVal = parseFloat(tfr);
    if (isNaN(tfrVal) || tfrVal < 0 || tfrVal > 15) {
        return res.send(toast("TFR must be 0-15", "error"));
    }

    // 1. Get current max year for this country
    db.get("SELECT MAX(year) as max_year FROM tfr_records WHERE country_id = ?", [country_id], (err, row) => {
        if (err) {
            console.error(err);
            return res.send(toast("Database error", "error"));
        }

        // Determine next year (Default to 2024 if no history exists)
        const currentMax = row && row.max_year ? row.max_year : 2023;
        const nextYear = currentMax + 1;

        // 2. Insert record
        const insertQuery = `INSERT INTO tfr_records (country_id, year, tfr) VALUES (?, ?, ?)`;
        
        db.run(insertQuery, [country_id, nextYear, tfrVal], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.send(toast(`Record for ${nextYear} already exists`, "error"));
                }
                console.error("Error adding record:", err);
                return res.send(toast("Failed to add record", "error"));
            }
            // Success response
            res.send(toast(`✓ Added Year ${nextYear} - TFR ${tfrVal.toFixed(2)}`, "success"));
        });
    });
});

/**
 * Requirement 6: Update existing TFR record
 */
router.put('/update', (req, res) => {
    const db = req.app.locals.db;
    const { country_id, year, tfr } = req.body;
    db.run(`UPDATE tfr_records SET tfr=? WHERE country_id=? AND year=?`, [tfr, country_id, year], function(err) {
        if (err || this.changes === 0) return res.send(toast("Update failed or not found", "error"));
        res.send(toast("✓ Updated successfully", "success"));
    });
});

/**
 * Requirement 7: Delete TFR records
 */
router.delete('/delete', (req, res) => {
    const db = req.app.locals.db;
    const { country_id, start, end } = req.body;
    db.run(`DELETE FROM tfr_records WHERE country_id=? AND year >= ? AND year <= ?`, [country_id, start, end], function(err) {
        res.send(toast(`Deleted ${this.changes} records`, "success"));
    });
});

/**
 * Get total record count for stats card
 */
router.get('/record-count', (req, res) => {
    const db = req.app.locals.db;
    db.get('SELECT COUNT(*) as count FROM tfr_records', (err, row) => {
        if (err) return res.send('0');
        res.send(row.count.toLocaleString());
    });
});

/**
 * Feature A: Country Comparison
 * Compare two countries' TFR trends over time
 */
router.get('/compare', (req, res) => {
    const db = req.app.locals.db;
    const { country_a, country_b } = req.query;

    if (!country_a || !country_b) {
        return res.send('<div class="p-4 text-slate-400">Please select both countries</div>');
    }

    if (country_a === country_b) {
        return res.send('<div class="p-4 text-yellow-400">Please select different countries</div>');
    }

    // Get country names
    db.all(`SELECT id, name FROM countries WHERE id IN (?, ?)`, [country_a, country_b], (err, countryNames) => {
        if (err || countryNames.length !== 2) {
            return res.send('<div class="p-4 text-red-400">Error loading countries</div>');
        }

        const nameA = countryNames.find(c => c.id == country_a).name;
        const nameB = countryNames.find(c => c.id == country_b).name;

        // Get TFR data for both countries
        db.all(`
            SELECT country_id, year, tfr 
            FROM tfr_records 
            WHERE country_id IN (?, ?) 
            ORDER BY year ASC
        `, [country_a, country_b], (err, rows) => {
            if (err || !rows.length) {
                return res.send('<div class="p-4 text-yellow-400">No data available</div>');
            }

            // Separate data by country
            const dataA = rows.filter(r => r.country_id == country_a);
            const dataB = rows.filter(r => r.country_id == country_b);

            if (!dataA.length || !dataB.length) {
                return res.send('<div class="p-4 text-yellow-400">Insufficient data for comparison</div>');
            }

            // Get all unique years
            const years = [...new Set(rows.map(r => r.year))].sort();

            // Prepare datasets
            const datasetA = years.map(year => {
                const record = dataA.find(r => r.year === year);
                return record ? record.tfr : null;
            });

            const datasetB = years.map(year => {
                const record = dataB.find(r => r.year === year);
                return record ? record.tfr : null;
            });

            // Calculate latest difference
            const latestYear = Math.max(...years);
            const latestA = dataA.find(r => r.year === latestYear)?.tfr;
            const latestB = dataB.find(r => r.year === latestYear)?.tfr;
            
            let summary = '';
            if (latestA && latestB) {
                const diff = ((latestA - latestB) / latestB * 100).toFixed(1);
                const higher = latestA > latestB ? nameA : nameB;
                const lower = latestA > latestB ? nameB : nameA;
                const absDiff = Math.abs(diff);
                summary = `<p class="text-slate-300 mb-2">📊 <strong>Latest (${latestYear}):</strong> ${higher} has ${absDiff}% ${diff > 0 ? 'higher' : 'lower'} TFR than ${lower}</p>
                           <p class="text-slate-400 text-sm">${nameA}: <span class="text-blue-400 font-bold">${latestA.toFixed(2)}</span> | ${nameB}: <span class="text-purple-400 font-bold">${latestB.toFixed(2)}</span></p>`;
            }

            // Update summary area
            const summaryScript = `
                <script>
                    document.getElementById('compare-summary').innerHTML = \`${summary}\`;
                </script>
            `;

            // Generate chart
            const chartHTML = `
                <canvas id="compare-chart"></canvas>
                <script>
                    (function() {
                        const ctx = document.getElementById('compare-chart');
                        window.createOrUpdateChart('compare-chart', {
                            type: 'line',
                            data: {
                                labels: ${JSON.stringify(years)},
                                datasets: [
                                    {
                                        label: '${nameA}',
                                        data: ${JSON.stringify(datasetA)},
                                        borderColor: '#3b82f6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 3,
                                        pointHoverRadius: 6
                                    },
                                    {
                                        label: '${nameB}',
                                        data: ${JSON.stringify(datasetB)},
                                        borderColor: '#a855f7',
                                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.4,
                                        pointRadius: 3,
                                        pointHoverRadius: 6
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'top',
                                        labels: { color: '#cbd5e1', font: { size: 14, weight: 'bold' } }
                                    },
                                    tooltip: {
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        titleColor: '#cbd5e1',
                                        bodyColor: '#cbd5e1',
                                        borderColor: '#475569',
                                        borderWidth: 1
                                    },
                                    annotation: {
                                        annotations: {
                                            replacementLine: {
                                                type: 'line',
                                                yMin: 2.1,
                                                yMax: 2.1,
                                                borderColor: '#ef4444',
                                                borderWidth: 2,
                                                borderDash: [5, 5],
                                                label: {
                                                    content: 'Replacement Level (2.1)',
                                                    enabled: true,
                                                    position: 'end',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                                                    color: '#fff',
                                                    font: { size: 10 }
                                                }
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: {
                                        beginAtZero: false,
                                        grid: { color: '#334155' },
                                        ticks: { color: '#94a3b8' }
                                    },
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: '#94a3b8' }
                                    }
                                },
                                interaction: {
                                    mode: 'index',
                                    intersect: false
                                }
                            }
                        });
                        
                        // Update summary
                        document.getElementById('compare-summary').innerHTML = \`${summary}\`;
                    })();
                </script>
            `;

            res.send(chartHTML);
        });
    });
});

/**
 * Feature B: World Map Data
 * Get TFR data for all countries for a specific year to color-code map
 */
router.get('/map-data', (req, res) => {
    const db = req.app.locals.db;
    const year = req.query.map_year || 2023;

    db.all(`
        SELECT c.alpha2, c.name, t.tfr
        FROM countries c
        LEFT JOIN tfr_records t ON c.id = t.country_id AND t.year = ?
        WHERE c.alpha2 IS NOT NULL
        ORDER BY c.name
    `, [year], (err, rows) => {
        if (err) return res.send('<div class="p-4 text-red-400">Error loading map data</div>');
        if (!rows || rows.length === 0) return res.send('<div class="p-4 text-yellow-400">No data available for this year</div>');

        // 1. Prepare Data Buckets
        const countryColors = {}; 
        const countryInfo = {};   
        
        rows.forEach(row => {
            if (row.alpha2 && row.tfr !== null) {
                const code = row.alpha2.toUpperCase();
                
                // Determine color and Label server-side
                let color = '#e2e8f0'; 
                let label = 'No Data';

                if (row.tfr >= 3.0) {
                    color = '#059669';
                    label = 'High (≥3.0)';
                } else if (row.tfr >= 2.1) {
                    color = '#10b981';
                    label = 'Above Rep. (2.1-3.0)';
                } else if (row.tfr >= 1.5) {
                    color = '#f59e0b';
                    label = 'Replacement (1.5-2.1)';
                } else {
                    color = '#ef4444';
                    label = 'Low (<1.5)';
                }

                countryColors[code] = color;
                
                countryInfo[code] = { 
                    name: row.name, 
                    tfr: row.tfr.toFixed(2),
                    category: label // Storing the label here
                };
            }
        });

        // 2. Generate HTML
        const mapHTML = `
            <div id="world-map" style="height: 500px; width: 100%; background-color: #ffffff; border-radius: 0.75rem; overflow: hidden; border: 2px solid #e2e8f0;"></div>
            
            <div class="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded shadow" style="background: #059669"></div><span class="text-slate-300">High (≥3.0)</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded shadow" style="background: #10b981"></div><span class="text-slate-300">Above Rep. (2.1-3.0)</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded shadow" style="background: #f59e0b"></div><span class="text-slate-300">Replacement (1.5-2.1)</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded shadow" style="background: #ef4444"></div><span class="text-slate-300">Low (<1.5)</span></div>
                <div class="flex items-center gap-2"><div class="w-4 h-4 rounded shadow" style="background: #e5e7eb; border: 1px solid #9ca3af"></div><span class="text-slate-300">No Data</span></div>
            </div>
            
            <div class="mt-2 text-center text-xs text-slate-500">Year: ${year}</div>

            <script>
                (function() {
                    const countryColors = ${JSON.stringify(countryColors)};
                    const countryInfo = ${JSON.stringify(countryInfo)};
                    
                    // Cleanup previous map
                    const container = document.getElementById('world-map');
                    container.innerHTML = ''; 

                    const map = new jsVectorMap({
                        selector: '#world-map',
                        map: 'world',
                        backgroundColor: '#ffffff',
                        zoomButtons: true,
                        
                        // Style for countries WITHOUT data
                        regionStyle: {
                            initial: {
                                fill: '#e5e7eb',
                                stroke: '#9ca3af',
                                "stroke-width": 0.5,
                                "fill-opacity": 1
                            },
                            hover: {
                                "fill-opacity": 0.8,
                                cursor: 'pointer'
                            }
                        },

                        // Apply pre-calculated colors
                        series: {
                            regions: [{
                                attribute: 'fill',
                                values: countryColors 
                            }]
                        },

                        // UPDATED: Tooltip now includes the Category Label
                        onRegionTooltipShow(event, tooltip, code) {
                            const info = countryInfo[code];
                            if (info) {
                                tooltip.text(
                                    '<div style="text-align:left;">' + 
                                    '<strong style="color: #60a5fa;">' + info.name + '</strong><br>' +
                                    '<span style="color: #fff;">TFR: ' + info.tfr + '</span><br>' +
                                    '<span style="color: #cbd5e1; font-size: 11px;">' + info.category + '</span>' +
                                    '</div>',
                                    true
                                );
                            } else {
                                tooltip.text(code + ': No Data', true);
                            }
                        }
                    });
                })();
            </script>
        `;
        res.send(mapHTML);
    });
});

/**
 * Feature C: Simple Linear Forecast
 * Predict next 5 years using linear regression on last 10 years
 */
/**
 * Feature C: Simple Linear Forecast (FIXED LAYOUT)
 */
router.get('/forecast', (req, res) => {
    const db = req.app.locals.db;
    const country_id = req.query.forecast_country;

    if (!country_id) return res.send('<div class="p-4 text-slate-400">Please select a country</div>');

    db.get('SELECT name FROM countries WHERE id = ?', [country_id], (err, country) => {
        if (err || !country) return res.send('<div class="p-4 text-red-400">Country not found</div>');

        db.all(`SELECT year, tfr FROM tfr_records WHERE country_id = ? ORDER BY year DESC LIMIT 10`, [country_id], (err, rows) => {
            if (err || rows.length < 5) return res.send('<div class="p-4 text-yellow-400">Insufficient data (need at least 5 years)</div>');

            rows.reverse(); // Chronological order

            // Linear Regression Math
            const n = rows.length;
            const sumX = rows.reduce((sum, r) => sum + r.year, 0);
            const sumY = rows.reduce((sum, r) => sum + r.tfr, 0);
            const sumXY = rows.reduce((sum, r) => sum + (r.year * r.tfr), 0);
            const sumX2 = rows.reduce((sum, r) => sum + (r.year * r.year), 0);
            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const intercept = (sumY - slope * sumX) / n;

            // Predictions
            const lastYear = rows[rows.length - 1].year;
            const predictions = [];
            for (let i = 1; i <= 5; i++) {
                const futureYear = lastYear + i;
                const predictedTFR = Math.max(0, slope * futureYear + intercept);
                predictions.push({ year: futureYear, tfr: predictedTFR });
            }

            // Prepare Data for Chart
            const allYears = [...rows.map(r => r.year), ...predictions.map(p => p.year)];
            const historicalData = [...rows.map(r => r.tfr), ...Array(5).fill(null)];
            const forecastData = [...Array(rows.length).fill(null), ...predictions.map(p => p.tfr)];

            const trendDirection = slope > 0 ? '📈 Increasing' : '📉 Decreasing';
            const trendColor = slope > 0 ? 'text-green-400' : 'text-red-400';
            const annualChange = (Math.abs(slope) * 100).toFixed(2);

            // FIXED HTML STRUCTURE:
            // 1. Summary Div
            // 2. Explicit Chart Container (This stops the infinite resizing)
            const chartHTML = `
                <div class="mb-4 p-4 glass rounded-xl border border-slate-700/50">
                    <h3 class="text-lg font-bold text-slate-200 mb-2">${country.name} - TFR Forecast</h3>
                    <p class="text-slate-400 text-sm mb-1">Trend: <span class="${trendColor} font-bold">${trendDirection}</span></p>
                    <p class="text-slate-400 text-sm">Avg Annual Change: <span class="font-mono text-slate-200">${slope > 0 ? '+' : ''}${annualChange}%</span></p>
                    <div class="mt-3 text-xs text-slate-500 font-mono">
                        Future: ${predictions.map(p => `<span class="mx-1">${p.year}: <span class="text-indigo-400">${p.tfr.toFixed(2)}</span></span>`).join('|')}
                    </div>
                </div>
                
                <div class="chart-container" style="position: relative; height: 400px; width: 100%;">
                    <canvas id="forecast-chart"></canvas>
                </div>

                <script>
                    (function() {
                        const ctx = document.getElementById('forecast-chart');
                        window.createOrUpdateChart('forecast-chart', {
                            type: 'line',
                            data: {
                                labels: ${JSON.stringify(allYears)},
                                datasets: [
                                    {
                                        label: 'Historical',
                                        data: ${JSON.stringify(historicalData)},
                                        borderColor: '#3b82f6',
                                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                        borderWidth: 3,
                                        fill: true,
                                        tension: 0.3,
                                        pointRadius: 4
                                    },
                                    {
                                        label: 'Forecast',
                                        data: ${JSON.stringify(forecastData)},
                                        borderColor: '#a855f7',
                                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                                        borderWidth: 3,
                                        borderDash: [5, 5],
                                        fill: true,
                                        tension: 0.1,
                                        pointRadius: 5,
                                        pointStyle: 'rectRot'
                                    }
                                ]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { labels: { color: '#cbd5e1' } },
                                    tooltip: { mode: 'index', intersect: false },
                                    annotation: {
                                        annotations: {
                                            divider: {
                                                type: 'line',
                                                xMin: ${rows.length - 0.5},
                                                xMax: ${rows.length - 0.5},
                                                borderColor: '#a855f7',
                                                borderWidth: 2,
                                                borderDash: [2, 4],
                                                label: {
                                                    content: 'Now',
                                                    enabled: true,
                                                    position: 'start',
                                                    backgroundColor: 'rgba(168, 85, 247, 0.8)',
                                                    font: { size: 10 }
                                                }
                                            }
                                        }
                                    }
                                },
                                scales: {
                                    y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                                }
                            }
                        });
                    })();
                </script>
            `;
            res.send(chartHTML);
        });
    });
});

module.exports = router;