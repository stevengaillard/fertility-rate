-- ==========================================
-- ETL.sql
-- Software Engineering in CIS 2025 - Final Exam
-- Student: Steven Gaillard (D11405806)
-- ==========================================
-- 
-- This file contains the database schema for the TFR Analytics application.
-- The schema follows Third Normal Form (3NF) principles to ensure data integrity
-- and minimize redundancy.
--
-- ETL Process Overview:
-- 1. EXTRACT: Read data from data1.csv (TFR records) and data2.csv (geography)
-- 2. TRANSFORM: Clean headers, validate data types, remove invalid entries
-- 3. LOAD: Insert into normalized tables using transactions for atomicity
--
-- ==========================================

-- ==========================================
-- TABLE 1: regions
-- ==========================================
-- Purpose: Stores continent-level geographic regions
-- Normalization: Eliminates redundancy by separating region data
-- Primary Key: id (auto-increment)
-- Unique Constraint: name (each region appears only once)
CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
);

-- ==========================================
-- TABLE 2: subregions
-- ==========================================
-- Purpose: Stores sub-continental regions (e.g., Western Europe, East Asia)
-- Normalization: Links to parent region, avoiding duplication of region data
-- Foreign Key: region_id references regions(id)
-- Example: "Western Europe" belongs to "Europe"
CREATE TABLE IF NOT EXISTS subregions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    region_id INTEGER NOT NULL,
    FOREIGN KEY(region_id) REFERENCES regions(id)
);

-- ==========================================
-- TABLE 3: countries
-- ==========================================
-- Purpose: Stores country data with ISO codes for international standardization
-- Normalization: Links to subregion instead of storing region/subregion names repeatedly
-- Foreign Key: subregion_id references subregions(id)
-- alpha3: Used as the joining key with CSV data (e.g., "USA", "CHN", "DEU")
-- Unique Constraint: alpha3 (ISO 3166-1 alpha-3 codes are unique)
CREATE TABLE IF NOT EXISTS countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    alpha2 TEXT,
    alpha3 TEXT UNIQUE NOT NULL,
    region_id INTEGER,
    subregion_id INTEGER,
    intermediate_region_id INTEGER,
    FOREIGN KEY(region_id) REFERENCES regions(id),
    FOREIGN KEY(subregion_id) REFERENCES subregions(id),
    FOREIGN KEY(intermediate_region_id) REFERENCES intermediate_regions(id)
);
-- ==========================================
-- TABLE 4: tfr_records
-- ==========================================
-- Purpose: Stores Total Fertility Rate data per country per year
-- Normalization: Separates time-series data from static country information
-- Foreign Key: country_id references countries(id)
-- Unique Constraint: (country_id, year) ensures one TFR value per country per year
-- Check Constraints:
--   - year: Must be between 1900 and 2100 (reasonable historical and future range)
--   - tfr: Must be between 0 and 15 (biological and statistical validity)
CREATE TABLE IF NOT EXISTS tfr_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country_id INTEGER NOT NULL,
    year INTEGER NOT NULL CHECK(year >= 1900 AND year <= 2100),
    tfr REAL NOT NULL CHECK(tfr >= 0 AND tfr <= 15),
    FOREIGN KEY(country_id) REFERENCES countries(id),
    UNIQUE(country_id, year)
);

CREATE TABLE IF NOT EXISTS intermediate_regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    subregion_id INTEGER NOT NULL,
    FOREIGN KEY(subregion_id) REFERENCES subregions(id)
);



-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================
-- These indexes optimize frequently executed queries

-- Index for Requirement 1: Country history queries (by country and year)
CREATE INDEX IF NOT EXISTS idx_tfr_country_year ON tfr_records(country_id, year);

-- Index for year-based queries (e.g., global trends, regional averages)
CREATE INDEX IF NOT EXISTS idx_tfr_year ON tfr_records(year);

-- Index for joining countries to subregions (Requirement 2)
CREATE INDEX IF NOT EXISTS idx_countries_subregion ON countries(subregion_id);

-- Index for joining subregions to regions (Requirement 3, 8)
CREATE INDEX IF NOT EXISTS idx_subregions_region ON subregions(region_id);

-- ==========================================
-- DATA QUALITY ENFORCEMENT
-- ==========================================
-- Remove any invalid records that might bypass constraints
-- This ensures data integrity after bulk imports
DELETE FROM tfr_records WHERE tfr IS NULL OR tfr < 0;

-- ==========================================
-- ETL PROCESS NOTES
-- ==========================================
-- The actual ETL logic is implemented in Node.js (database.js) and performs:
--
-- 1. EXTRACT Phase:
--    - Read data2.csv using csv-parser with BOM handling
--    - Read data1.csv using csv-parser with BOM handling
--
-- 2. TRANSFORM Phase:
--    - Clean CSV headers (trim whitespace, remove UTF-8 BOM characters)
--    - Validate data types (year as INTEGER, tfr as REAL)
--    - Filter invalid records (NULL values, out-of-range TFR, missing codes)
--
-- 3. LOAD Phase:
--    - Insert regions, subregions, countries from data2.csv
--    - Match countries by alpha3 code and insert TFR records from data1.csv
--    - Use transactions (BEGIN/COMMIT) for atomicity
--    - Use INSERT OR IGNORE to handle duplicates gracefully
--
-- Data Flow:
-- data2.csv → regions → subregions → countries
-- data1.csv + countries (via alpha3) → tfr_records
--
-- ==========================================
-- NORMALIZATION VERIFICATION
-- ==========================================
-- ✓ First Normal Form (1NF):
--   - All attributes are atomic (no repeating groups or arrays)
--   - Each table has a primary key
--
-- ✓ Second Normal Form (2NF):
--   - All non-key attributes fully depend on the primary key
--   - No partial dependencies exist
--
-- ✓ Third Normal Form (3NF):
--   - No transitive dependencies
--   - Non-key attributes do not depend on other non-key attributes
--   - Example: Countries link to subregions (not directly to regions)
--
-- ==========================================