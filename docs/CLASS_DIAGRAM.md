# Smart Green Advisor - Class Diagram

## 🏗️ Class Diagram Overview

The Smart Green Advisor follows a modular, service-oriented architecture with clear separation of concerns, dependency injection, and real-time data management.

## 📊 Class Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SMART GREEN ADVISOR CLASS DIAGRAM                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                              FRONTEND LAYER                           │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   App.tsx       │  │   Index.tsx     │  │   Auth.tsx      │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ + render()      │  │ + render()      │  │ + render()      │        │   │
│  │  │ + useEffect()   │  │ + useEffect()   │  │ + handleLogin() │        │   │
│  │  │ + useState()    │  │ + useState()    │  │ + handleSignup()│        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │ DeviceList.tsx  │  │EnergyMetrics.tsx│  │VoiceAssistant   │        │   │
│  │  │                 │  │                 │  │.tsx             │        │   │
│  │  │ + render()      │  │ + render()      │  │                 │        │   │
│  │  │ + handleToggle()│  │ + calculate()   │  │ + render()      │        │   │
│  │  │ + handleRemove()│  │ + formatData()  │  │ + speak()       │        │   │
│  │  │ + useState()    │  │ + useState()    │  │ + listen()      │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │RealTimeAnalytics│  │AddDeviceDialog  │  │DeviceRemoveDialog│       │   │
│  │  │.tsx             │  │.tsx             │  │.tsx             │       │   │
│  │  │                 │  │                 │  │                 │       │   │
│  │  │ + render()      │  │ + render()      │  │ + render()      │       │   │
│  │  │ + loadData()    │  │ + handleScan()  │  │ + handleRemove()│       │   │
│  │  │ + updateChart() │  │ + handleAdd()   │  │ + confirmDelete()│      │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            SERVICE LAYER                              │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │RealTimeDevice   │  │RealTimeSolar    │  │RealTimeAnalytics│        │   │
│  │  │Service          │  │Service          │  │Service          │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ - devices: Map  │  │ - solarPanels:  │  │ - analyticsCache│        │   │
│  │  │ - listeners:    │  │   Map           │  │ - updateInterval│        │   │
│  │  │   Set           │  │ - listeners:    │  │ - isMonitoring  │        │   │
│  │  │                 │  │   Set           │  │                 │        │   │
│  │  │ + connectWiFi   │  │ + startMonitor  │  │ + getAnalytics  │        │   │
│  │  │   Device()      │  │   ing()         │  │   Data()        │        │   │
│  │  │ + connectBT     │  │ + stopMonitor   │  │ + updateCache() │        │   │
│  │  │   Device()      │  │   ing()         │  │ + stopMonitor   │        │   │
│  │  │ + controlDevice │  │ + getSolarData  │  │   ing()         │        │   │
│  │  │   ()            │  │   ()            │  │                 │        │   │
│  │  │ + disconnect    │  │ + addListener() │  │ + getConsumption│        │   │
│  │  │   Device()      │  │ + removeListener│  │   Analytics()   │        │   │
│  │  │ + addListener() │  │   ()            │  │ + getDevice     │        │   │
│  │  │ + removeListener│  │                 │  │   Analytics()   │        │   │
│  │  │   ()            │  │                 │  │ + getSolar      │        │   │
│  │  │ + getConnected  │  │                 │  │   Analytics()   │        │   │
│  │  │   Devices()     │  │                 │  │ + getInsights() │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │DeviceScanner    │  │SolarAdvisor     │  │WeatherService   │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ + scanBluetooth │  │ - recommendations│  │ - weatherData:  │        │   │
│  │  │   Devices()     │  │   : Array       │  │   Map           │        │   │
│  │  │ + scanWiFi      │  │                 │  │ - apiKey: string│        │   │
│  │  │   Devices()     │  │ + analyzeEnergy │  │                 │        │   │
│  │  │ + getCapabilities│  │   Situation()   │  │ + getCurrent    │        │   │
│  │  │   ()            │  │ + getRecommend  │  │   Weather()     │        │   │
│  │  │                 │  │   ations()      │  │ + getForecast() │        │   │
│  │  │                 │  │ + calculateSolar│  │ + updateWeather │        │   │
│  │  │                 │  │   Efficiency()  │  │   Data()        │        │   │
│  │  │                 │  │ + isPeakSolar   │  │                 │        │   │
│  │  │                 │  │   Hour()        │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            DATA LAYER                                 │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │SupabaseClient   │  │DatabaseService  │  │CacheService     │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ - url: string   │  │ - supabase:     │  │ - redis: Redis  │        │   │
│  │  │ - anonKey:      │  │   SupabaseClient│  │ - cache: Map    │        │   │
│  │  │   string        │  │                 │  │                 │        │   │
│  │  │                 │  │ + getUserDevices│  │ + get(key)      │        │   │
│  │  │ + auth          │  │   ()            │  │ + set(key, val) │        │   │
│  │  │ + from()        │  │ + addDevice()   │  │ + delete(key)   │        │   │
│  │  │ + rpc()         │  │ + updateDevice  │  │ + clear()       │        │   │
│  │  │ + storage       │  │   ()            │  │ + has(key)      │        │   │
│  │  │                 │  │ + deleteDevice  │  │                 │        │   │
│  │  │                 │  │   ()            │  │                 │        │   │
│  │  │                 │  │ + getConsumption│  │                 │        │   │
│  │  │                 │  │   History()     │  │                 │        │   │
│  │  │                 │  │ + addConsumption│  │                 │        │   │
│  │  │                 │  │   Record()      │  │                 │        │   │
│  │  │                 │  │ + getAnalytics  │  │                 │        │   │
│  │  │                 │  │   Data()        │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                            MODEL LAYER                                │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │RealTimeDevice   │  │SolarPanelData   │  │AnalyticsData    │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ + id: string    │  │ + id: string    │  │ + consumption:  │        │   │
│  │  │ + name: string  │  │ + name: string  │  │   ConsumptionData│       │   │
│  │  │ + type: string  │  │ + capacity:     │  │ + devices:      │        │   │
│  │  │ + brand: string │  │   number        │  │   DeviceData    │        │   │
│  │  │ + model: string │  │ + efficiency:   │  │ + solar:        │        │   │
│  │  │ + consumption:  │  │   number        │  │   SolarData     │        │   │
│  │  │   number        │  │ + generation:   │  │ + insights:     │        │   │
│  │  │ + isOn: boolean │  │   number        │  │   Insight[]     │        │   │
│  │  │ + isConnected:  │  │ + temperature:  │  │                 │        │   │
│  │  │   boolean       │  │   number        │  │                 │        │   │
│  │  │ + status: string│  │ + voltage:      │  │                 │        │   │
│  │  │ + connectionType│  │   number        │  │                 │        │   │
│  │  │ + lastSeen: Date│  │ + current:      │  │                 │        │   │
│  │  │ + temperature:  │  │   number        │  │                 │        │   │
│  │  │   number        │  │ + isConnected:  │  │                 │        │   │
│  │  │ + mode: string  │  │   boolean       │  │                 │        │   │
│  │  │ + fanSpeed:     │  │ + lastUpdate:   │  │                 │        │   │
│  │  │   number        │  │   Date          │  │                 │        │   │
│  │  │ + brightness:   │  │                 │  │                 │        │   │
│  │  │   number        │  │                 │  │                 │        │   │
│  │  │ + color: string │  │                 │  │                 │        │   │
│  │  │ + capabilities: │  │                 │  │                 │        │   │
│  │  │   string[]      │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │ScannedDevice    │  │SolarRecommend   │  │WeatherData      │        │   │
│  │  │                 │  │ation            │  │                 │        │   │
│  │  │ + name: string  │  │ + type: string  │  │ + date: Date    │        │   │
│  │  │ + type: string  │  │ + title: string │  │ + condition:    │        │   │
│  │  │ + signal: number│  │ + description:  │  │   string        │        │   │
│  │  │ + address:      │  │   string        │  │ + temperature:  │        │   │
│  │  │   string        │  │ + impact: number│  │   number        │        │   │
│  │  │ + manufacturer: │  │ + priority:     │  │ + humidity:     │        │   │
│  │  │   string        │  │   string        │  │   number        │        │   │
│  │  │ + services:     │  │ + savings:      │  │ + windSpeed:    │        │   │
│  │  │   string[]      │  │   number        │  │   number        │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  │                                                                         │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🔗 Class Relationships

### **Inheritance Relationships:**

```
Component (React)
    ├── App
    ├── Index
    ├── Auth
    ├── DeviceList
    ├── EnergyMetrics
    ├── VoiceAssistant
    ├── RealTimeAnalytics
    ├── AddDeviceDialog
    └── DeviceRemoveDialog

Service (Base Class)
    ├── RealTimeDeviceService
    ├── RealTimeSolarService
    ├── RealTimeAnalyticsService
    ├── DeviceScanner
    ├── SolarAdvisor
    └── WeatherService
```

### **Composition Relationships:**

```
App
    ├── Index (composition)
    └── Auth (composition)

Index
    ├── DeviceList (composition)
    ├── EnergyMetrics (composition)
    ├── VoiceAssistant (composition)
    └── RealTimeAnalytics (composition)

RealTimeDeviceService
    ├── RealTimeDevice[] (aggregation)
    └── DeviceListener[] (aggregation)

RealTimeSolarService
    ├── SolarPanelData[] (aggregation)
    └── SolarListener[] (aggregation)
```

### **Dependency Relationships:**

```
DeviceList ──depends on──> RealTimeDeviceService
EnergyMetrics ──depends on──> RealTimeDeviceService
VoiceAssistant ──depends on──> SolarAdvisor
RealTimeAnalytics ──depends on──> RealTimeAnalyticsService
AddDeviceDialog ──depends on──> DeviceScanner
DeviceRemoveDialog ──depends on──> DatabaseService
```

## 📋 Class Descriptions

### **Frontend Layer Classes:**

**App.tsx**
- Root component of the application
- Manages routing and global state
- Handles authentication state

**Index.tsx**
- Main dashboard component
- Orchestrates all dashboard components
- Manages real-time data updates

**DeviceList.tsx**
- Displays and manages smart devices
- Handles device control and removal
- Shows real-time device status

**RealTimeAnalytics.tsx**
- Comprehensive analytics dashboard
- Real-time data visualization
- Interactive charts and insights

**VoiceAssistant.tsx**
- Voice control interface
- Speech recognition and synthesis
- Alert management and notifications

### **Service Layer Classes:**

**RealTimeDeviceService**
- Manages all smart device connections
- Handles WiFi and Bluetooth device control
- Provides real-time device data updates

**RealTimeSolarService**
- Monitors solar panel performance
- Tracks generation and efficiency
- Weather-based generation forecasting

**RealTimeAnalyticsService**
- Processes and analyzes energy data
- Generates insights and recommendations
- Manages analytics caching

**DeviceScanner**
- Scans for available devices
- Supports Bluetooth and WiFi discovery
- Provides device capability detection

**SolarAdvisor**
- AI-powered energy recommendations
- Analyzes consumption patterns
- Suggests optimization strategies

### **Data Layer Classes:**

**SupabaseClient**
- Database connection and operations
- Authentication and authorization
- Real-time subscriptions

**DatabaseService**
- High-level database operations
- Data validation and transformation
- Query optimization

**CacheService**
- In-memory and Redis caching
- Performance optimization
- Data consistency management

### **Model Layer Classes:**

**RealTimeDevice**
- Device data model
- Real-time status and control
- Device capabilities and settings

**SolarPanelData**
- Solar panel information
- Generation and performance data
- Environmental conditions

**AnalyticsData**
- Comprehensive analytics model
- Consumption and generation data
- Insights and recommendations

## 🎯 Design Patterns

### **1. Service Layer Pattern**
- **Purpose**: Separates business logic from presentation
- **Implementation**: Service classes handle all business operations
- **Benefits**: Reusability, testability, maintainability

### **2. Observer Pattern**
- **Purpose**: Real-time data updates and notifications
- **Implementation**: Listener-based event system
- **Benefits**: Loose coupling, real-time updates

### **3. Singleton Pattern**
- **Purpose**: Single instance of service classes
- **Implementation**: Static instance management
- **Benefits**: Resource efficiency, global access

### **4. Factory Pattern**
- **Purpose**: Device creation and management
- **Implementation**: Device factory for different types
- **Benefits**: Extensibility, type safety

### **5. Repository Pattern**
- **Purpose**: Data access abstraction
- **Implementation**: Database service layer
- **Benefits**: Data source independence, testability

## 🔧 Key Methods and Responsibilities

### **RealTimeDeviceService Methods:**
- `connectWiFiDevice()`: Establishes WiFi device connection
- `connectBluetoothDevice()`: Establishes Bluetooth device connection
- `controlDevice()`: Sends control commands to devices
- `disconnectDevice()`: Safely disconnects devices
- `addListener()`: Registers for device updates
- `removeListener()`: Unregisters from device updates

### **RealTimeAnalyticsService Methods:**
- `getAnalyticsData()`: Retrieves comprehensive analytics
- `getConsumptionAnalytics()`: Processes consumption data
- `getDeviceAnalytics()`: Analyzes device performance
- `getSolarAnalytics()`: Tracks solar generation
- `getInsights()`: Generates AI recommendations

### **DeviceScanner Methods:**
- `scanBluetoothDevices()`: Discovers Bluetooth devices
- `scanWiFiDevices()`: Discovers WiFi devices
- `getCapabilities()`: Checks browser support
- `validateDevice()`: Validates device compatibility

### **SolarAdvisor Methods:**
- `analyzeEnergySituation()`: Analyzes current energy state
- `getRecommendations()`: Provides optimization suggestions
- `calculateSolarEfficiency()`: Computes solar performance
- `isPeakSolarHour()`: Determines optimal solar hours

## 🚀 Architecture Benefits

### **1. Modularity**
- Clear separation of concerns
- Independent component development
- Easy testing and maintenance

### **2. Scalability**
- Service-oriented architecture
- Horizontal scaling support
- Performance optimization

### **3. Maintainability**
- Consistent code structure
- Clear dependencies
- Comprehensive documentation

### **4. Extensibility**
- Plugin-based device support
- Configurable services
- API-driven architecture

### **5. Real-Time Capabilities**
- Event-driven updates
- WebSocket integration
- Live data streaming

This class diagram provides a comprehensive overview of the Smart Green Advisor's object-oriented architecture, ensuring maintainable, scalable, and efficient code organization.
