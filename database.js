/**
 * database.js
 * Handles SQLite database connection, schema initialization, and ETL processes
 * Three-tier Architecture: Data Access Layer
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

class Database {
    constructor(dbPath = './data/tfr_database.sqlite') {
        this.db = new sqlite3.Database(dbPath);
        this.initializeSchema();
    }

    /**
     * Initialize database schema (3rd Normal Form)
     * Creates tables: regions, subregions, countries, tfr_records
     */
    initializeSchema() {
        this.db.serialize(() => {
            // Create regions table - stores continent-level geographic data
            this.db.run(`
                CREATE TABLE IF NOT EXISTS regions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                )
            `);

            // Create subregions table - stores sub-continental regions linked to regions
            this.db.run(`
                CREATE TABLE IF NOT EXISTS subregions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    region_id INTEGER NOT NULL,
                    FOREIGN KEY(region_id) REFERENCES regions(id)
                )
            `);

            // Create countries table - stores country data with ISO codes
            this.db.run(`
                CREATE TABLE IF NOT EXISTS countries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    alpha2 TEXT,
                    alpha3 TEXT UNIQUE NOT NULL,
                    subregion_id INTEGER NOT NULL,
                    FOREIGN KEY(subregion_id) REFERENCES subregions(id)
                )
            `);

            // Create tfr_records table - stores Total Fertility Rate data per country per year
            this.db.run(`
                CREATE TABLE IF NOT EXISTS tfr_records (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    country_id INTEGER NOT NULL,
                    year INTEGER NOT NULL CHECK(year >= 1900 AND year <= 2100),
                    tfr REAL NOT NULL CHECK(tfr >= 0 AND tfr <= 15),
                    FOREIGN KEY(country_id) REFERENCES countries(id),
                    UNIQUE(country_id, year)
                )
            `);

            // Create performance indexes for frequently queried columns
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_tfr_country_year ON tfr_records(country_id, year)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_tfr_year ON tfr_records(year)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_countries_subregion ON countries(subregion_id)`);
            this.db.run(`CREATE INDEX IF NOT EXISTS idx_subregions_region ON subregions(region_id)`);

            // Clean invalid data that might have been inserted
            this.db.run(`DELETE FROM tfr_records WHERE tfr IS NULL OR tfr < 0`);

            this.checkDataHealth();
        });
    }

    /**
     * Check if database has adequate data, trigger ETL if needed
     */
    checkDataHealth() {
        this.db.get("SELECT COUNT(*) as count FROM tfr_records", (err, row) => {
            if (err) {
                console.error("❌ Database health check failed:", err);
                return;
            }
            
            if (row && row.count < 100) {
                console.log("⚠️  Insufficient data detected. Starting ETL process...");
                this.performETL();
            } else {
                console.log(`✅ Database ready: ${row ? row.count : 0} TFR records loaded`);
            }
        });
    }

    /**
     * ETL Process: Extract, Transform, Load data from CSV files
     * Loads data2.csv (geography) then data1.csv (TFR data)
     */
    performETL() {
        const data1Path = path.join(__dirname, 'data', 'data1.csv');
        const data2Path = path.join(__dirname, 'data', 'data2.csv');

        // Validate CSV files exist
        if (!fs.existsSync(data1Path)) {
            console.error("❌ Missing data1.csv - TFR data file not found");
            console.log("📍 Expected location:", data1Path);
            return;
        }
        if (!fs.existsSync(data2Path)) {
            console.error("❌ Missing data2.csv - Geography data file not found");
            console.log("📍 Expected location:", data2Path);
            return;
        }

        // Helper function to clean CSV headers (removes BOM, trims whitespace)
        const cleanHeaders = ({ header }) => header.trim().replace(/^\ufeff/, '');

        const geographyData = [];

        // EXTRACT: Read geography data from data2.csv
        fs.createReadStream(data2Path)
            .pipe(csv({ mapHeaders: cleanHeaders }))
            .on('data', (row) => {
                // TRANSFORM: Validate required fields exist
                if (row['region'] && row['alpha-3']) {
                    geographyData.push(row);
                }
            })
            .on('end', () => {
                console.log(`📥 Extracted ${geographyData.length} geography records`);
                this.loadGeography(geographyData, data1Path, cleanHeaders);
            })
            .on('error', (err) => {
                console.error("❌ Error reading data2.csv:", err);
            });
    }

    /**
     * LOAD: Insert geography data into normalized tables
     * @param {Array} data - Parsed geography records
     * @param {String} data1Path - Path to TFR data CSV
     * @param {Function} cleanHeaders - Header cleaning function
     */
    loadGeography(data, data1Path, cleanHeaders) {
        this.db.run("BEGIN TRANSACTION");

        data.forEach((row) => {
            this.db.serialize(() => {
                // Insert region (if not exists)
                this.db.run(
                    `INSERT OR IGNORE INTO regions (name) VALUES (?)`,
                    [row['region']]
                );

                // Insert subregion linked to region
                this.db.run(
                    `INSERT OR IGNORE INTO subregions (name, region_id) 
                     VALUES (?, (SELECT id FROM regions WHERE name = ?))`,
                    [row['sub-region'] || 'Unknown', row['region']]
                );

                // Insert country linked to subregion
                this.db.run(
                    `INSERT OR IGNORE INTO countries (name, alpha2, alpha3, subregion_id) 
                     VALUES (?, ?, ?, (SELECT id FROM subregions WHERE name = ?))`,
                    [row['name'], row['alpha-2'], row['alpha-3'], row['sub-region'] || 'Unknown']
                );
            });
        });

        this.db.run("COMMIT", (err) => {
            if (err) {
                console.error("❌ Geography load failed:", err);
                return;
            }
            console.log(`✅ Geography data loaded successfully`);
            setTimeout(() => this.loadTFRData(data1Path, cleanHeaders), 1000);
        });
    }

    /**
     * LOAD: Insert TFR records into tfr_records table
     * @param {String} data1Path - Path to TFR data CSV
     * @param {Function} cleanHeaders - Header cleaning function
     */
    loadTFRData(data1Path, cleanHeaders) {
        this.db.run("BEGIN TRANSACTION");

        const stmt = this.db.prepare(`
            INSERT OR IGNORE INTO tfr_records (country_id, year, tfr) 
            SELECT id, ?, ? FROM countries WHERE alpha3 = ?
        `);

        let count = 0;
        let skipped = 0;

        fs.createReadStream(data1Path)
            .pipe(csv({ mapHeaders: cleanHeaders }))
            .on('data', (row) => {
                const year = parseInt(row['Year']);
                const tfr = parseFloat(row['TFR']);

                // TRANSFORM: Validate data quality
                if (row['Code'] && year && !isNaN(tfr) && tfr >= 0 && tfr <= 15) {
                    stmt.run(year, tfr, row['Code']);
                    count++;
                } else {
                    skipped++;
                }
            })
            .on('end', () => {
                stmt.finalize(() => {
                    this.db.run("COMMIT", (err) => {
                        if (err) {
                            console.error("❌ TFR data load failed:", err);
                            return;
                        }
                        console.log(`✅ ETL Complete: ${count} records loaded, ${skipped} skipped (invalid data)`);
                    });
                });
            })
            .on('error', (err) => {
                console.error("❌ Error reading data1.csv:", err);
            });
    }

    /**
     * Get the database connection instance
     */
    getConnection() {
        return this.db;
    }
}

module.exports = Database;