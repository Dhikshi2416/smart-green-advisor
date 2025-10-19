# Smart Green Advisor - Entity Relationship (ER) Diagram

## 📊 ER Diagram Overview

The Smart Green Advisor database schema is designed to support real-time energy management, device monitoring, solar panel tracking, and comprehensive analytics.

## 🗂️ Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SMART GREEN ADVISOR ER DIAGRAM                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   USERS     │     │  PROFILES   │     │   DEVICES   │     │  SOLAR      │   │
│  │             │     │             │     │             │     │  PANELS     │   │
│  │ user_id (PK)│────▶│profile_id   │     │device_id    │     │panel_id     │   │
│  │ email       │     │(PK)         │     │(PK)         │     │(PK)         │   │
│  │ password    │     │user_id (FK) │     │user_id (FK) │     │user_id (FK) │   │
│  │ created_at  │     │first_name   │     │name         │     │name         │   │
│  │ updated_at  │     │last_name    │     │type         │     │capacity     │   │
│  │ is_active   │     │phone        │     │brand        │     │efficiency   │   │
│  └─────────────┘     │address      │     │model        │     │temperature  │   │
│                      │city         │     │consumption  │     │voltage      │   │
│                      │state        │     │max_consumpt │     │current      │   │
│                      │country      │     │is_on        │     │is_connected │   │
│                      │created_at   │     │status       │     │last_update  │   │
│                      │updated_at   │     │connection_  │     │created_at   │   │
│                      └─────────────┘     │type         │     │updated_at   │   │
│                                         │ip_address   │     └─────────────┘   │
│                                         │mac_address  │                       │
│                                         │bluetooth_id │                       │
│                                         │last_seen    │                       │
│                                         │capabilities │                       │
│                                         │temperature  │                       │
│                                         │mode         │                       │
│                                         │fan_speed    │                       │
│                                         │brightness   │                       │
│                                         │color        │                       │
│                                         │created_at   │                       │
│                                         │updated_at   │                       │
│                                         └─────────────┘                       │
│                                                │                               │
│                                                ▼                               │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │  DEVICE     │     │  SOLAR      │     │  ENERGY     │     │  WEATHER    │   │
│  │CONSUMPTION  │     │INVERTERS    │     │ ANALYTICS   │     │   DATA      │   │
│  │  HISTORY    │     │             │     │             │     │             │   │
│  │             │     │inverter_id  │     │analytics_id │     │weather_id   │   │
│  │history_id   │     │(PK)         │     │(PK)         │     │(PK)         │   │
│  │(PK)         │     │user_id (FK) │     │user_id (FK) │     │user_id (FK) │   │
│  │device_id    │     │name         │     │date         │     │date         │   │
│  │(FK)         │     │model        │     │consumption  │     │condition    │   │
│  │consumption  │     │input_power  │     │solar_gen    │     │temperature  │   │
│  │timestamp    │     │output_power │     │savings      │     │humidity     │   │
│  │created_at   │     │efficiency   │     │efficiency   │     │wind_speed   │   │
│  └─────────────┘     │temperature  │     │peak_hours   │     │generation_  │   │
│                      │voltage      │     │off_peak_hrs │     │impact       │   │
│                      │current      │     │created_at   │     │created_at   │   │
│                      │frequency    │     │updated_at   │     │updated_at   │   │
│                      │is_connected │     └─────────────┘     └─────────────┘   │
│                      │last_update  │                                               │
│                      │created_at   │                                               │
│                      │updated_at   │                                               │
│                      └─────────────┘                                               │
│                             │                                                      │
│                             ▼                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐   │
│  │   SOLAR     │     │  DEVICE     │     │   ALERTS    │     │  NOTIFICAT  │   │
│  │  BATTERIES  │     │ EFFICIENCY  │     │             │     │   IONS      │   │
│  │             │     │             │     │alert_id     │     │             │   │
│  │battery_id   │     │efficiency_id│     │(PK)         │     │notif_id     │   │
│  │(PK)         │     │(PK)         │     │user_id (FK) │     │(PK)         │   │
│  │user_id (FK) │     │device_id    │     │device_id    │     │user_id (FK) │   │
│  │name         │     │(FK)         │     │(FK)         │     │type         │   │
│  │model        │     │efficiency   │     │type         │     │title        │   │
│  │capacity     │     │timestamp    │     │priority     │     │message      │   │
│  │charge_level │     │created_at   │     │status       │     │is_read      │   │
│  │health       │     │updated_at   │     │message      │     │created_at   │   │
│  │voltage      │     └─────────────┘     │created_at   │     │updated_at   │   │
│  │current      │                         │updated_at   │     └─────────────┘   │
│  │temperature  │                         └─────────────┘                       │
│  │is_charging  │                                                               │
│  │last_update  │                                                               │
│  │created_at   │                                                               │
│  │updated_at   │                                                               │
│  └─────────────┘                                                               │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 Entity Relationships

### **Primary Relationships:**

1. **USERS ↔ PROFILES** (1:1)
   - One user has exactly one profile
   - Profile contains extended user information

2. **USERS ↔ DEVICES** (1:N)
   - One user can have multiple devices
   - Each device belongs to exactly one user

3. **USERS ↔ SOLAR_PANELS** (1:N)
   - One user can have multiple solar panels
   - Each solar panel belongs to exactly one user

4. **USERS ↔ SOLAR_INVERTERS** (1:N)
   - One user can have multiple inverters
   - Each inverter belongs to exactly one user

5. **USERS ↔ SOLAR_BATTERIES** (1:N)
   - One user can have multiple batteries
   - Each battery belongs to exactly one user

6. **DEVICES ↔ DEVICE_CONSUMPTION_HISTORY** (1:N)
   - One device can have multiple consumption records
   - Each consumption record belongs to exactly one device

7. **DEVICES ↔ DEVICE_EFFICIENCY** (1:N)
   - One device can have multiple efficiency measurements
   - Each efficiency record belongs to exactly one device

8. **USERS ↔ ENERGY_ANALYTICS** (1:N)
   - One user can have multiple analytics records
   - Each analytics record belongs to exactly one user

9. **USERS ↔ WEATHER_DATA** (1:N)
   - One user can have multiple weather records
   - Each weather record belongs to exactly one user

10. **USERS ↔ ALERTS** (1:N)
    - One user can have multiple alerts
    - Each alert belongs to exactly one user

11. **USERS ↔ NOTIFICATIONS** (1:N)
    - One user can have multiple notifications
    - Each notification belongs to exactly one user

12. **DEVICES ↔ ALERTS** (1:N)
    - One device can trigger multiple alerts
    - Each alert can be associated with a specific device

## 📋 Entity Descriptions

### **Core Entities:**

**USERS**
- Central entity for user authentication and management
- Contains login credentials and basic account information
- Links to all user-specific data

**PROFILES**
- Extended user information and personal details
- Contains contact information and location data
- One-to-one relationship with USERS

**DEVICES**
- Smart home devices connected to the system
- Contains device specifications, status, and real-time data
- Supports various device types (AC, lights, outlets, etc.)

**SOLAR_PANELS**
- Solar panel installations and specifications
- Tracks generation capacity, efficiency, and performance
- Links to weather data for generation analysis

**SOLAR_INVERTERS**
- Solar inverter systems and monitoring
- Tracks input/output power, efficiency, and status
- Critical for solar system performance monitoring

**SOLAR_BATTERIES**
- Battery storage systems (optional)
- Tracks charge level, capacity, and health
- Enables energy storage and backup power

### **Analytics Entities:**

**DEVICE_CONSUMPTION_HISTORY**
- Historical consumption data for all devices
- Time-series data for analytics and reporting
- Enables trend analysis and optimization

**DEVICE_EFFICIENCY**
- Device performance and efficiency tracking
- Helps identify underperforming devices
- Supports maintenance scheduling

**ENERGY_ANALYTICS**
- Aggregated energy consumption and generation data
- Daily, monthly, and yearly analytics
- Cost calculations and savings tracking

**WEATHER_DATA**
- Weather conditions affecting solar generation
- Temperature, humidity, wind speed, and conditions
- Correlates with solar panel performance

### **Communication Entities:**

**ALERTS**
- System alerts and warnings
- High consumption, device failures, maintenance
- Priority-based alert system

**NOTIFICATIONS**
- User notifications and messages
- System updates, recommendations, reminders
- Read/unread status tracking

## 🔑 Key Design Principles

### **1. Normalization**
- **3NF Compliance**: Eliminates redundancy and update anomalies
- **Referential Integrity**: Foreign key constraints ensure data consistency
- **Atomic Values**: Each field contains single, indivisible values

### **2. Scalability**
- **Time-Series Optimization**: Efficient storage for consumption history
- **Indexing Strategy**: Optimized queries for analytics and reporting
- **Partitioning**: Large tables partitioned by date for performance

### **3. Real-Time Support**
- **Timestamp Fields**: All entities include created_at and updated_at
- **Status Tracking**: Real-time device and system status
- **Event-Driven**: Supports real-time updates and notifications

### **4. Data Integrity**
- **Primary Keys**: UUID-based primary keys for global uniqueness
- **Foreign Keys**: Enforced referential integrity
- **Check Constraints**: Data validation at database level
- **Triggers**: Automated data updates and calculations

### **5. Security**
- **Row-Level Security**: User data isolation
- **Audit Trails**: Complete change tracking
- **Encryption**: Sensitive data encryption at rest
- **Access Control**: Role-based permissions

## 📊 Data Types and Constraints

### **Common Data Types:**
- **UUID**: Primary keys for global uniqueness
- **VARCHAR**: Variable-length strings with appropriate limits
- **DECIMAL**: Precise numeric values for consumption and generation
- **BOOLEAN**: True/false values for status fields
- **TIMESTAMP**: Date and time with timezone support
- **JSON**: Flexible data for device capabilities and settings

### **Key Constraints:**
- **NOT NULL**: Required fields cannot be empty
- **UNIQUE**: Email addresses and device identifiers
- **CHECK**: Value ranges and format validation
- **DEFAULT**: Default values for status and timestamp fields
- **CASCADE**: Referential integrity with appropriate cascade rules

This ER diagram provides a comprehensive foundation for the Smart Green Advisor database, supporting real-time energy management, device monitoring, and advanced analytics while maintaining data integrity and performance.
