# RegeneraX - Regenerative City Operating System

## Overview

RegeneraX is an AI-powered urban intelligence platform that transforms cities into living, adaptive ecosystems. By combining government sensor data, satellite information, and citizen-reported issues, it creates a comprehensive digital twin of urban infrastructure to guide regenerative city planning and responsive governance.

## What It Does

RegeneraX acts as a "City Brain" - a cognitive layer that perceives urban environments through multiple data streams and provides actionable insights for city planners, administrators, and citizens. The platform:

- **Aggregates Multi-Source Data**: Integrates real-time government APIs (air quality, rainfall, power grids, groundwater levels, soil health) with citizen-generated reports from a partner mobile application
- **AI-Powered Analysis**: Uses Google Gemini AI to process thousands of data points, identify patterns, prioritize critical issues, and generate intelligent urban insights
- **Interactive Visualization**: Maps all data on an interactive geographical interface with color-coded markers indicating issue severity and environmental health metrics
- **Intelligent Chatbot**: Provides conversational access to city data, allowing users to query about pollution levels, infrastructure issues, and environmental trends

## Core Features

### 1. **Multi-Layer Data Integration**
- **Government APIs**: Fetches live data from India's Open Government Data (OGD) platform including:
  - Air Quality Index (AQI) from monitoring stations
  - Rainfall patterns and precipitation data
  - Power grid status and energy distribution
  - Groundwater levels
  - Soil health metrics (pH levels, nitrogen content)
  
- **Citizen Reports**: Integrates with Firebase to aggregate geo-tagged citizen reports containing:
  - Infrastructure issues (potholes, broken roads)
  - Waste management problems
  - Public facility degradation
  - Environmental concerns

### 2. **LangGraph AI Workflow**
The platform uses a sophisticated three-node AI pipeline:

- **Data Aggregator**: Collects and normalizes data from government APIs and Firebase citizen reports
- **City Analyst**: AI processes citizen reports to extract locations, categorize issues, assign sentiment (positive/negative), and merge with government sensor data
- **Cartographer**: Geocodes all data points using Nominatim, assigns precise coordinates, and prepares map markers with intelligent fallbacks

### 3. **Interactive Map Dashboard**
- Real-time visualization using React Leaflet with custom styled markers
- Color-coded indicators (green for positive metrics, red for issues)
- Popup details on each marker with comprehensive data
- Clean CartoDB light tiles for optimal readability
- Floating panels showing government data, citizen statistics, and recent issue feeds

### 4. **AI Assistant Chat**
- Context-aware chatbot powered by Google Gemini AI
- Answers questions about specific city metrics, pollution levels, and infrastructure issues
- Uses cached city data for accurate, real-time responses
- Natural language interface for non-technical users

### 5. **Citizen Engagement Portal**
- Partner mobile app allows citizens to become "city sensors"
- Upload geo-tagged photos of civic issues
- Automated GPS capture and categorization
- Direct contribution to city intelligence database

## Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework for API endpoints
- **LangChain + LangGraph**: AI workflow orchestration and state management
- **Google Gemini AI**: Advanced language model for data analysis and chat
- **Firebase Admin SDK**: Real-time database integration for citizen reports
- **Geopy**: Geocoding and location services via Nominatim
- **Python-dotenv**: Environment configuration management

### Frontend
- **React 19**: Modern UI with hooks and functional components
- **Vite**: Lightning-fast development and build tooling
- **Tailwind CSS v4**: Utility-first styling with custom animations
- **React Leaflet**: Interactive map rendering
- **Axios**: HTTP client for backend communication
- **Lucide React**: Beautiful icon system
- **Motion (Framer Motion)**: Smooth animations and transitions

### Infrastructure
- **Firebase Firestore**: NoSQL database for citizen reports
- **Open Government Data API**: Live sensor data from Indian cities
- **Nominatim OSM**: Free geocoding service

## How It Works

### Workflow Pipeline

1. **User enters a city name** (e.g., "Bangalore", "Mumbai", "Delhi")

2. **Data Aggregation Phase**:
   - Backend queries OGD APIs with city/state filters
   - Fetches all citizen reports from Firebase
   - Geocodes city center coordinates

3. **AI Analysis Phase**:
   - Gemini AI processes citizen report text
   - Extracts location names, categories, and sentiment
   - Merges AI insights with government sensor data
   - Creates unified data structure for visualization

4. **Cartography Phase**:
   - Geocodes location names to latitude/longitude
   - Uses smart fallbacks (city center + random offset) for ambiguous locations
   - Generates map marker objects with icons, colors, and descriptions

5. **Visualization**:
   - Frontend renders interactive map with all markers
   - Displays government data cards (AQI, rainfall, power)
   - Shows citizen report statistics and recent issues
   - Loads AI chatbot with cached city data

6. **Interactive Query**:
   - Users ask questions via chat interface
   - AI retrieves cached government and citizen data
   - Generates contextual, data-driven responses

## Key Capabilities

### For City Planners
- Identify pollution hotspots and environmental stress zones
- Track infrastructure degradation patterns
- Prioritize resource allocation based on citizen reports
- Monitor urban metabolism (water, energy, waste flows)

### For Citizens
- Report civic issues directly through mobile app
- View real-time city health metrics
- Query environmental data through natural language
- Track resolution of reported problems

### For Administrators
- Access comprehensive urban data dashboard
- Analyze trends across multiple data sources
- Make evidence-based policy decisions
- Respond to grassroots intelligence

## Data Sources

### Government APIs (api.data.gov.in)
- **AQI Monitoring**: Real-time pollutant measurements (PM2.5, PM10, NO2, SO2, CO, O3)
- **Rainfall Data**: District-wise precipitation tracking
- **Power Grid**: State-level electricity infrastructure status
- **Groundwater**: Well depth and water table measurements
- **Soil Health**: Agricultural zone pH levels and nutrient analysis

### Citizen Mobile App
- Geo-tagged photo uploads
- Category selection (infrastructure, waste, pollution, etc.)
- Automatic timestamp and location capture
- Firebase real-time synchronization

## Environmental Impact

RegeneraX supports regenerative urban development by:

- **Reducing Response Times**: Instant visibility into civic issues
- **Data-Driven Decisions**: Evidence-based urban planning
- **Citizen Empowerment**: Direct participation in city governance
- **Resource Optimization**: Prioritized intervention based on severity
- **Climate Adaptation**: Real-time environmental monitoring for proactive responses

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- Firebase account with Firestore database
- Google API key (for Gemini AI)
- Government Data API key (from data.gov.in)

### Backend Setup

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Create .env file with:
# GOOGLE_API_KEY=your_gemini_api_key
# GOVT_DATA_API=your_ogd_api_key

# Add Firebase service account key as serviceAccountKey.json

# Run the server
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
# Frontend runs on http://localhost:5173
```

## API Endpoints

### POST /analyze-city
Analyzes a city and returns comprehensive data:
```json
{
  "city": "Bangalore",
  "city_center": [12.9716, 77.5946],
  "map_markers": [...],
  "gov_data": {...},
  "citizen_stats": {...}
}
```

### POST /chat
Conversational interface for city data queries:
```json
{
  "city": "Mumbai",
  "message": "What is the air quality today?"
}
```

## Future Enhancements

- **Predictive Analytics**: ML models for forecasting pollution spikes and infrastructure failures
- **Historical Trends**: Time-series analysis of environmental and civic data
- **Multi-City Comparison**: Benchmark cities against each other
- **Mobile App Integration**: Direct in-app dashboard access
- **Automated Alerts**: Push notifications for critical issues
- **Satellite Imagery**: Integration with remote sensing data for land use analysis
- **Carbon Footprint Tracking**: Urban metabolism measurement for sustainability goals

## Contributing

RegeneraX is an open platform for regenerative urban development. Contributions are welcome in areas such as:
- Additional data source integrations
- AI analysis improvements
- UI/UX enhancements
- Mobile app development
- Documentation and testing

## License

This project is built for hackathons and educational purposes to demonstrate AI-driven civic technology.

## Acknowledgments

- **Open Government Data Platform India** for public API access
- **Google Gemini AI** for advanced language modeling
- **Firebase** for real-time database infrastructure
- **OpenStreetMap** for geocoding services
- **React and FastAPI communities** for excellent frameworks

---

**Built with ❤️ for smarter, regenerative cities**
