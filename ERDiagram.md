```mermaid
erDiagram
    REGIONS ||--o{ SUBREGIONS : contains
    REGIONS ||--o{ COUNTRIES : "belongs to"
    SUBREGIONS ||--o{ INTERMEDIATE_REGIONS : contains
    SUBREGIONS ||--o{ COUNTRIES : "belongs to"
    INTERMEDIATE_REGIONS ||--o{ COUNTRIES : "belongs to"
    COUNTRIES ||--o{ TFR_RECORDS : has
    
    REGIONS {
        int id PK
        string name
        string iso_region_code
    }
    
    SUBREGIONS {
        int id PK
        string name
        string iso_subregion_code
        int region_id FK
    }
    
    INTERMEDIATE_REGIONS {
        int id PK
        string name
        string iso_intermediate_code
        int subregion_id FK
    }
    
    COUNTRIES {
        int id PK
        string name
        string alpha2
        string alpha3
        int country_code
        string iso_3166_2
        int region_id FK
        int subregion_id FK
        int intermediate_region_id FK
    }
    
    TFR_RECORDS {
        int id PK
        int country_id FK
        int year
        float tfr
    }
