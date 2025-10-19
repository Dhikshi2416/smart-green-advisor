# Smart Green Advisor - Relational Model

## 🗄️ Relational Model Overview

The Smart Green Advisor relational model is designed for PostgreSQL with TimescaleDB extension for time-series data optimization. All tables follow 3NF normalization with proper constraints, indexes, and relationships.

## 📊 Complete Table Definitions

### **1. USERS Table**

```sql
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT users_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_password_length CHECK (length(password_hash) >= 8)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Triggers
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **2. PROFILES Table**

```sql
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT profiles_phone_format CHECK (phone ~* '^[+]?[0-9\s\-\(\)]{10,20}$'),
    CONSTRAINT profiles_name_length CHECK (length(first_name) >= 2 AND length(last_name) >= 2)
);

-- Indexes
CREATE UNIQUE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_city ON profiles(city);
CREATE INDEX idx_profiles_country ON profiles(country);

-- Triggers
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **3. USER_DEVICES Table**

```sql
CREATE TABLE user_devices (
    device_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    consumption DECIMAL(10,3) DEFAULT 0.0,
    max_consumption DECIMAL(10,3) NOT NULL,
    is_on BOOLEAN DEFAULT false,
    is_connected BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'offline',
    connection_type VARCHAR(20) CHECK (connection_type IN ('wifi', 'bluetooth', 'ethernet', 'zigbee', 'zwave')),
    ip_address INET,
    mac_address MACADDR,
    bluetooth_id VARCHAR(100),
    last_seen TIMESTAMP WITH TIME ZONE,
    capabilities JSONB DEFAULT '[]',
    temperature DECIMAL(5,2),
    mode VARCHAR(50),
    fan_speed INTEGER CHECK (fan_speed >= 0 AND fan_speed <= 100),
    brightness INTEGER CHECK (brightness >= 0 AND brightness <= 100),
    color VARCHAR(7) CHECK (color ~* '^#[0-9A-Fa-f]{6}$'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT devices_consumption_positive CHECK (consumption >= 0),
    CONSTRAINT devices_max_consumption_positive CHECK (max_consumption > 0),
    CONSTRAINT devices_type_valid CHECK (type IN ('ac', 'tv', 'light', 'refrigerator', 'washer', 'outlet', 'thermostat', 'fan', 'heater', 'other')),
    CONSTRAINT devices_status_valid CHECK (status IN ('online', 'offline', 'connecting', 'error', 'maintenance'))
);

-- Indexes
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_type ON user_devices(type);
CREATE INDEX idx_user_devices_status ON user_devices(status);
CREATE INDEX idx_user_devices_is_connected ON user_devices(is_connected);
CREATE INDEX idx_user_devices_last_seen ON user_devices(last_seen);
CREATE INDEX idx_user_devices_consumption ON user_devices(consumption);

-- Triggers
CREATE TRIGGER trigger_user_devices_updated_at
    BEFORE UPDATE ON user_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **4. DEVICE_CONSUMPTION_HISTORY Table (TimescaleDB)**

```sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE device_consumption_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES user_devices(device_id) ON DELETE CASCADE,
    consumption DECIMAL(10,3) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    temperature DECIMAL(5,2),
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    power_factor DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT consumption_history_positive CHECK (consumption >= 0),
    CONSTRAINT consumption_history_temperature_range CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT consumption_history_voltage_positive CHECK (voltage >= 0),
    CONSTRAINT consumption_history_current_positive CHECK (current >= 0),
    CONSTRAINT consumption_history_power_factor_range CHECK (power_factor >= 0 AND power_factor <= 1)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('device_consumption_history', 'timestamp');

-- Indexes
CREATE INDEX idx_device_consumption_device_id ON device_consumption_history(device_id);
CREATE INDEX idx_device_consumption_timestamp ON device_consumption_history(timestamp DESC);
CREATE INDEX idx_device_consumption_device_timestamp ON device_consumption_history(device_id, timestamp DESC);

-- Compression policy (compress data older than 7 days)
SELECT add_compression_policy('device_consumption_history', INTERVAL '7 days');

-- Retention policy (keep data for 2 years)
SELECT add_retention_policy('device_consumption_history', INTERVAL '2 years');
```

### **5. SOLAR_PANELS Table**

```sql
CREATE TABLE solar_panels (
    panel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    capacity DECIMAL(8,2) NOT NULL, -- kW
    efficiency DECIMAL(5,2) NOT NULL, -- percentage
    temperature DECIMAL(5,2),
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    power_output DECIMAL(8,2),
    is_connected BOOLEAN DEFAULT false,
    installation_date DATE,
    warranty_years INTEGER DEFAULT 25,
    last_maintenance DATE,
    next_maintenance DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT solar_panels_capacity_positive CHECK (capacity > 0),
    CONSTRAINT solar_panels_efficiency_range CHECK (efficiency >= 0 AND efficiency <= 100),
    CONSTRAINT solar_panels_temperature_range CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT solar_panels_voltage_positive CHECK (voltage >= 0),
    CONSTRAINT solar_panels_current_positive CHECK (current >= 0),
    CONSTRAINT solar_panels_power_positive CHECK (power_output >= 0),
    CONSTRAINT solar_panels_warranty_positive CHECK (warranty_years > 0)
);

-- Indexes
CREATE INDEX idx_solar_panels_user_id ON solar_panels(user_id);
CREATE INDEX idx_solar_panels_is_connected ON solar_panels(is_connected);
CREATE INDEX idx_solar_panels_capacity ON solar_panels(capacity);

-- Triggers
CREATE TRIGGER trigger_solar_panels_updated_at
    BEFORE UPDATE ON solar_panels
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **6. SOLAR_INVERTERS Table**

```sql
CREATE TABLE solar_inverters (
    inverter_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    input_power DECIMAL(8,2) NOT NULL, -- kW
    output_power DECIMAL(8,2) NOT NULL, -- kW
    efficiency DECIMAL(5,2) NOT NULL, -- percentage
    temperature DECIMAL(5,2),
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    frequency DECIMAL(5,2),
    is_connected BOOLEAN DEFAULT false,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT solar_inverters_input_power_positive CHECK (input_power >= 0),
    CONSTRAINT solar_inverters_output_power_positive CHECK (output_power >= 0),
    CONSTRAINT solar_inverters_efficiency_range CHECK (efficiency >= 0 AND efficiency <= 100),
    CONSTRAINT solar_inverters_temperature_range CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT solar_inverters_voltage_positive CHECK (voltage >= 0),
    CONSTRAINT solar_inverters_current_positive CHECK (current >= 0),
    CONSTRAINT solar_inverters_frequency_range CHECK (frequency >= 0 AND frequency <= 100)
);

-- Indexes
CREATE INDEX idx_solar_inverters_user_id ON solar_inverters(user_id);
CREATE INDEX idx_solar_inverters_is_connected ON solar_inverters(is_connected);
CREATE INDEX idx_solar_inverters_efficiency ON solar_inverters(efficiency);

-- Triggers
CREATE TRIGGER trigger_solar_inverters_updated_at
    BEFORE UPDATE ON solar_inverters
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **7. SOLAR_BATTERIES Table**

```sql
CREATE TABLE solar_batteries (
    battery_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    model VARCHAR(100),
    capacity DECIMAL(8,2) NOT NULL, -- kWh
    charge_level DECIMAL(5,2) NOT NULL, -- percentage
    health DECIMAL(5,2) NOT NULL, -- percentage
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    temperature DECIMAL(5,2),
    is_charging BOOLEAN DEFAULT false,
    cycles INTEGER DEFAULT 0,
    max_cycles INTEGER DEFAULT 6000,
    last_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT solar_batteries_capacity_positive CHECK (capacity > 0),
    CONSTRAINT solar_batteries_charge_level_range CHECK (charge_level >= 0 AND charge_level <= 100),
    CONSTRAINT solar_batteries_health_range CHECK (health >= 0 AND health <= 100),
    CONSTRAINT solar_batteries_voltage_positive CHECK (voltage >= 0),
    CONSTRAINT solar_batteries_current_positive CHECK (current >= 0),
    CONSTRAINT solar_batteries_temperature_range CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT solar_batteries_cycles_positive CHECK (cycles >= 0),
    CONSTRAINT solar_batteries_max_cycles_positive CHECK (max_cycles > 0)
);

-- Indexes
CREATE INDEX idx_solar_batteries_user_id ON solar_batteries(user_id);
CREATE INDEX idx_solar_batteries_charge_level ON solar_batteries(charge_level);
CREATE INDEX idx_solar_batteries_health ON solar_batteries(health);

-- Triggers
CREATE TRIGGER trigger_solar_batteries_updated_at
    BEFORE UPDATE ON solar_batteries
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **8. DEVICE_EFFICIENCY Table (TimescaleDB)**

```sql
CREATE TABLE device_efficiency (
    efficiency_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES user_devices(device_id) ON DELETE CASCADE,
    efficiency DECIMAL(5,2) NOT NULL, -- percentage
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    temperature DECIMAL(5,2),
    voltage DECIMAL(8,2),
    current DECIMAL(8,2),
    power_factor DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT device_efficiency_range CHECK (efficiency >= 0 AND efficiency <= 100),
    CONSTRAINT device_efficiency_temperature_range CHECK (temperature >= -50 AND temperature <= 100),
    CONSTRAINT device_efficiency_voltage_positive CHECK (voltage >= 0),
    CONSTRAINT device_efficiency_current_positive CHECK (current >= 0),
    CONSTRAINT device_efficiency_power_factor_range CHECK (power_factor >= 0 AND power_factor <= 1)
);

-- Convert to hypertable
SELECT create_hypertable('device_efficiency', 'timestamp');

-- Indexes
CREATE INDEX idx_device_efficiency_device_id ON device_efficiency(device_id);
CREATE INDEX idx_device_efficiency_timestamp ON device_efficiency(timestamp DESC);
CREATE INDEX idx_device_efficiency_efficiency ON device_efficiency(efficiency);

-- Compression and retention policies
SELECT add_compression_policy('device_efficiency', INTERVAL '7 days');
SELECT add_retention_policy('device_efficiency', INTERVAL '1 year');
```

### **9. ENERGY_ANALYTICS Table**

```sql
CREATE TABLE energy_analytics (
    analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    consumption DECIMAL(10,3) NOT NULL, -- kWh
    solar_generation DECIMAL(10,3) NOT NULL, -- kWh
    savings DECIMAL(10,2) NOT NULL, -- INR
    efficiency DECIMAL(5,2) NOT NULL, -- percentage
    peak_hours DECIMAL(10,3) DEFAULT 0.0, -- kWh
    off_peak_hours DECIMAL(10,3) DEFAULT 0.0, -- kWh
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT energy_analytics_consumption_positive CHECK (consumption >= 0),
    CONSTRAINT energy_analytics_solar_positive CHECK (solar_generation >= 0),
    CONSTRAINT energy_analytics_savings_positive CHECK (savings >= 0),
    CONSTRAINT energy_analytics_efficiency_range CHECK (efficiency >= 0 AND efficiency <= 100),
    CONSTRAINT energy_analytics_peak_hours_positive CHECK (peak_hours >= 0),
    CONSTRAINT energy_analytics_off_peak_positive CHECK (off_peak_hours >= 0),
    UNIQUE(user_id, date)
);

-- Indexes
CREATE UNIQUE INDEX idx_energy_analytics_user_date ON energy_analytics(user_id, date);
CREATE INDEX idx_energy_analytics_date ON energy_analytics(date);
CREATE INDEX idx_energy_analytics_consumption ON energy_analytics(consumption);
CREATE INDEX idx_energy_analytics_savings ON energy_analytics(savings);

-- Triggers
CREATE TRIGGER trigger_energy_analytics_updated_at
    BEFORE UPDATE ON energy_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **10. WEATHER_DATA Table**

```sql
CREATE TABLE weather_data (
    weather_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    condition VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2) NOT NULL, -- Celsius
    humidity DECIMAL(5,2) NOT NULL, -- percentage
    wind_speed DECIMAL(5,2) NOT NULL, -- km/h
    generation_impact DECIMAL(5,2) NOT NULL, -- percentage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT weather_data_temperature_range CHECK (temperature >= -50 AND temperature <= 60),
    CONSTRAINT weather_data_humidity_range CHECK (humidity >= 0 AND humidity <= 100),
    CONSTRAINT weather_data_wind_speed_positive CHECK (wind_speed >= 0),
    CONSTRAINT weather_data_generation_impact_range CHECK (generation_impact >= 0 AND generation_impact <= 100),
    CONSTRAINT weather_data_condition_valid CHECK (condition IN ('clear', 'partly-cloudy', 'cloudy', 'overcast', 'rain', 'snow', 'storm')),
    UNIQUE(user_id, date)
);

-- Indexes
CREATE UNIQUE INDEX idx_weather_data_user_date ON weather_data(user_id, date);
CREATE INDEX idx_weather_data_date ON weather_data(date);
CREATE INDEX idx_weather_data_condition ON weather_data(condition);
CREATE INDEX idx_weather_data_temperature ON weather_data(temperature);

-- Triggers
CREATE TRIGGER trigger_weather_data_updated_at
    BEFORE UPDATE ON weather_data
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **11. ALERTS Table**

```sql
CREATE TABLE alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    device_id UUID REFERENCES user_devices(device_id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT alerts_type_valid CHECK (type IN ('consumption', 'efficiency', 'maintenance', 'security', 'weather', 'system')),
    CONSTRAINT alerts_priority_valid CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    CONSTRAINT alerts_status_valid CHECK (status IN ('active', 'resolved', 'dismissed', 'archived'))
);

-- Indexes
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_device_id ON alerts(device_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_is_read ON alerts(is_read);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);

-- Triggers
CREATE TRIGGER trigger_alerts_updated_at
    BEFORE UPDATE ON alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

### **12. NOTIFICATIONS Table**

```sql
CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT notifications_type_valid CHECK (type IN ('info', 'warning', 'success', 'error', 'reminder', 'recommendation')),
    CONSTRAINT notifications_title_length CHECK (length(title) >= 5 AND length(title) <= 200),
    CONSTRAINT notifications_message_length CHECK (length(message) >= 10 AND length(message) <= 1000)
);

-- Indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);

-- Triggers
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

## 🔗 Foreign Key Relationships

### **Primary Relationships:**

```sql
-- Users to Profiles (1:1)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Devices (1:N)
ALTER TABLE user_devices ADD CONSTRAINT fk_user_devices_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Solar Panels (1:N)
ALTER TABLE solar_panels ADD CONSTRAINT fk_solar_panels_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Solar Inverters (1:N)
ALTER TABLE solar_inverters ADD CONSTRAINT fk_solar_inverters_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Solar Batteries (1:N)
ALTER TABLE solar_batteries ADD CONSTRAINT fk_solar_batteries_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Devices to Consumption History (1:N)
ALTER TABLE device_consumption_history ADD CONSTRAINT fk_consumption_history_device_id 
    FOREIGN KEY (device_id) REFERENCES user_devices(device_id) ON DELETE CASCADE;

-- Devices to Efficiency (1:N)
ALTER TABLE device_efficiency ADD CONSTRAINT fk_device_efficiency_device_id 
    FOREIGN KEY (device_id) REFERENCES user_devices(device_id) ON DELETE CASCADE;

-- Users to Energy Analytics (1:N)
ALTER TABLE energy_analytics ADD CONSTRAINT fk_energy_analytics_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Weather Data (1:N)
ALTER TABLE weather_data ADD CONSTRAINT fk_weather_data_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Users to Alerts (1:N)
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- Devices to Alerts (1:N)
ALTER TABLE alerts ADD CONSTRAINT fk_alerts_device_id 
    FOREIGN KEY (device_id) REFERENCES user_devices(device_id) ON DELETE SET NULL;

-- Users to Notifications (1:N)
ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user_id 
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE;
```

## 📊 Indexes and Performance Optimization

### **Composite Indexes:**

```sql
-- Multi-column indexes for common queries
CREATE INDEX idx_user_devices_user_status ON user_devices(user_id, status);
CREATE INDEX idx_user_devices_user_type ON user_devices(user_id, type);
CREATE INDEX idx_consumption_history_device_timestamp ON device_consumption_history(device_id, timestamp DESC);
CREATE INDEX idx_energy_analytics_user_date_range ON energy_analytics(user_id, date DESC);
CREATE INDEX idx_alerts_user_status_priority ON alerts(user_id, status, priority);
CREATE INDEX idx_notifications_user_read_created ON notifications(user_id, is_read, created_at DESC);
```

### **Partial Indexes:**

```sql
-- Indexes for specific conditions
CREATE INDEX idx_user_devices_connected ON user_devices(user_id) WHERE is_connected = true;
CREATE INDEX idx_user_devices_on ON user_devices(user_id) WHERE is_on = true;
CREATE INDEX idx_alerts_active ON alerts(user_id, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_notifications_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;
```

## 🔒 Row Level Security (RLS)

### **Enable RLS:**

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_consumption_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_inverters ENABLE ROW LEVEL SECURITY;
ALTER TABLE solar_batteries ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_efficiency ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
```

### **RLS Policies:**

```sql
-- Users can only access their own data
CREATE POLICY users_own_data ON users FOR ALL USING (auth.uid() = user_id);
CREATE POLICY profiles_own_data ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY user_devices_own_data ON user_devices FOR ALL USING (auth.uid() = user_id);
CREATE POLICY consumption_history_own_data ON device_consumption_history FOR ALL 
    USING (device_id IN (SELECT device_id FROM user_devices WHERE user_id = auth.uid()));
CREATE POLICY solar_panels_own_data ON solar_panels FOR ALL USING (auth.uid() = user_id);
CREATE POLICY solar_inverters_own_data ON solar_inverters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY solar_batteries_own_data ON solar_batteries FOR ALL USING (auth.uid() = user_id);
CREATE POLICY device_efficiency_own_data ON device_efficiency FOR ALL 
    USING (device_id IN (SELECT device_id FROM user_devices WHERE user_id = auth.uid()));
CREATE POLICY energy_analytics_own_data ON energy_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY weather_data_own_data ON weather_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY alerts_own_data ON alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY notifications_own_data ON notifications FOR ALL USING (auth.uid() = user_id);
```

## 🔄 Database Functions and Procedures

### **Utility Functions:**

```sql
-- Function to calculate device efficiency
CREATE OR REPLACE FUNCTION calculate_device_efficiency(
    p_device_id UUID,
    p_consumption DECIMAL,
    p_max_consumption DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    IF p_max_consumption = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN LEAST(100, (p_consumption / p_max_consumption) * 100);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's total consumption for a date
CREATE OR REPLACE FUNCTION get_user_daily_consumption(
    p_user_id UUID,
    p_date DATE
) RETURNS DECIMAL AS $$
DECLARE
    total_consumption DECIMAL;
BEGIN
    SELECT COALESCE(SUM(consumption), 0)
    INTO total_consumption
    FROM device_consumption_history dch
    JOIN user_devices ud ON dch.device_id = ud.device_id
    WHERE ud.user_id = p_user_id
    AND DATE(dch.timestamp) = p_date;
    
    RETURN total_consumption;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data() RETURNS VOID AS $$
BEGIN
    -- Delete old notifications (older than 30 days)
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Delete resolved alerts older than 90 days
    DELETE FROM alerts 
    WHERE status = 'resolved' 
    AND resolved_at < NOW() - INTERVAL '90 days';
    
    -- Update device status for devices not seen in 24 hours
    UPDATE user_devices 
    SET is_connected = false, status = 'offline'
    WHERE last_seen < NOW() - INTERVAL '24 hours'
    AND is_connected = true;
END;
$$ LANGUAGE plpgsql;
```

## 📈 Performance Monitoring

### **Query Performance Views:**

```sql
-- View for device performance summary
CREATE VIEW device_performance_summary AS
SELECT 
    ud.user_id,
    ud.device_id,
    ud.name,
    ud.type,
    ud.brand,
    ud.consumption,
    ud.max_consumption,
    calculate_device_efficiency(ud.device_id, ud.consumption, ud.max_consumption) as efficiency,
    ud.is_connected,
    ud.status,
    ud.last_seen
FROM user_devices ud;

-- View for daily energy summary
CREATE VIEW daily_energy_summary AS
SELECT 
    ea.user_id,
    ea.date,
    ea.consumption,
    ea.solar_generation,
    ea.savings,
    ea.efficiency,
    wd.condition as weather_condition,
    wd.temperature,
    wd.generation_impact
FROM energy_analytics ea
LEFT JOIN weather_data wd ON ea.user_id = wd.user_id AND ea.date = wd.date;
```

This comprehensive relational model provides a robust, scalable, and secure foundation for the Smart Green Advisor database with proper normalization, constraints, indexes, and performance optimization.
