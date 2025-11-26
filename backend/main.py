import os
import time
import uvicorn
import firebase_admin
from firebase_admin import credentials, firestore
from typing import TypedDict, List, Dict, Any, Optional
from dotenv import load_dotenv
import requests
import json
from collections import Counter
import random 

# FastAPI
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# AI & Logic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

# Geocoding
from geopy.geocoders import Nominatim

# Load Env
load_dotenv()

# --- CONFIGURATION ---
API_KEY = os.getenv("GOOGLE_API_KEY")

# 1. INITIALIZE FIREBASE
if not firebase_admin._apps:
    try:
        cred = credentials.Certificate("serviceAccountKey.json")
        firebase_admin.initialize_app(cred)
        print("🔥 Firebase Connected Successfully!")
    except Exception as e:
        print(f"⚠️ Firebase Error: {e}")

db = firestore.client()

# Initialize AI & Geocoder
geolocator = Nominatim(user_agent="hackathon_city_brain_v2", timeout=10)
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.4, google_api_key=API_KEY)

# ### NEW CHANGE: GLOBAL IN-MEMORY STORE ###
# This dictionary will store the data for cities we have analyzed.
# Format: { "mumbai": { "gov_data": {...}, "citizen_stats": {...} } }
CITY_DATA_STORE = {} 

# --- DATA SOURCE FUNCTIONS (Standard) ---

def get_state_from_city(city_name):
    city_lower = city_name.lower().strip()
    mapping = {
        "bangalore": "Karnataka", "bengaluru": "Karnataka",
        "mumbai": "Maharashtra", "pune": "Maharashtra", "nagpur": "Maharashtra",
        "delhi": "Delhi", "new delhi": "Delhi",
        "chennai": "Tamil Nadu", "coimbatore": "Tamil Nadu",
        "hyderabad": "Telangana", "kolkata": "West Bengal",
        "ahmedabad": "Gujarat", "surat": "Gujarat",
        "jaipur": "Rajasthan", "lucknow": "Uttar Pradesh", "kanpur": "Uttar Pradesh",
        "indore": "Madhya Pradesh", "bhopal": "Madhya Pradesh"
    }
    return mapping.get(city_lower, "")

def fetch_ogd_resource(resource_id, filters=None):
    """Generic function to hit api.data.gov.in with DEBUG logging"""
    api_key = os.getenv("GOVT_DATA_API")
    if not api_key:
        print("⚠️ GOVT_DATA_API key missing in .env")
        return None

    base_url = f"https://api.data.gov.in/resource/{resource_id}"
    
    # Use limit 20 to increase odds of finding valid data
    params = {
        "api-key": api_key,
        "format": "json",
        "limit": 20 
    }
    
    if filters:
        for k, v in filters.items():
            params[f"filters[{k}]"] = v

    # --- LOGGING POINT 1: What are we asking for? ---
    print(f"\n   [API REQUEST] ID: {resource_id} | Filters: {filters}")

    try:
        response = requests.get(base_url, params=params, timeout=5)
        
        # --- LOGGING POINT 2: Did it work? ---
        print(f"   [API RESPONSE] Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            records = data.get("records", [])
            
            # --- LOGGING POINT 3: What did we get? ---
            print(f"   [API DATA] Found {len(records)} records.")
            if records:
                # Print the first record to see if fields like 'pollutant_avg' are actually present
                print(f"   [API SAMPLE] {json.dumps(records[0], indent=2)}")
            else:
                print("   [API WARNING] returned 0 records (Check city spelling or API limit).")
                
            return records
        else:
            print(f"   [API ERROR] Failed {resource_id}: {response.status_code}")
    except Exception as e:
        print(f"   [API EXCEPTION] Error {resource_id}: {e}")
    
    return []

# --- NEW DATA FETCHERS ---

def fetch_ground_water(district, state):
    """
    Fetches Ground Water Levels.
    NOTE: You must find a valid Resource ID on data.gov.in for 'Ground Water Level'
    """
    # REPLACE THIS WITH A REAL RESOURCE ID FROM OGD
    RESOURCE_ID = "d23c7de6-867b-4679-b8c7-36ee8a95b15b" 
    
    print(f"   [API] 💧 Checking Ground Water for {district}...")
    
    # Groundwater is usually filed by District, not City
    filters = {"district_name": district, "state_name": state}
    
    # If you don't have a real ID yet, return a mock for testing
    if RESOURCE_ID == "resource_id_for_ground_water_here":
        return {"status": "No Resource ID Configured", "level": "N/A"}

    data = fetch_ogd_resource(RESOURCE_ID, filters)
    return data[0] if data else {"status": "No Data"}

def fetch_soil_quality(district, state):
    """
    Fetches Soil Health Card data.
    NOTE: You must find a valid Resource ID on data.gov.in for 'Soil Health'
    """
    # REPLACE THIS WITH A REAL RESOURCE ID FROM OGD
    RESOURCE_ID = "4554a3c8-74e3-4f93-8727-8fd92161e345"
    
    print(f"   [API] 🌱 Checking Soil Quality for {district}...")
    
    filters = {"district_name": district}
    
    if RESOURCE_ID == "resource_id_for_soil_health_here":
        return {"status": "No Resource ID Configured", "ph_level": "N/A"}

    data = fetch_ogd_resource(RESOURCE_ID, filters)
    return data[0] if data else {"status": "No Data"}

# --- UPDATE MAIN AGGREGATOR ---

def fetch_gov_api_data(city: str):
    print(f"\n   [API] 📡 Connecting to Govt Data for {city}...")
    state = get_state_from_city(city)
    
    # OGD API often uses 'District' for Water/Soil, which is usually the City name
    district = city 
    
    compiled_data = {}

    # 1. AQI (Existing)
    aqi_data = fetch_ogd_resource("3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69", {"city": city})
    if not aqi_data and city.lower() == "bangalore":
         aqi_data = fetch_ogd_resource("3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69", {"city": "Bengaluru"})
    
    if aqi_data:
        best_station = aqi_data[0]
        # ... (Keep your existing AQI logic here) ...
        compiled_data["aqi"] = {
            "value": best_station.get('pollutant_avg'),
            "pollutant": best_station.get('pollutant_id'),
            "station": best_station.get('station'),
            "status": "Active"
        }
    else:
        compiled_data["aqi"] = {"status": "Data Unavailable", "value": "N/A"}

    # 2. Rainfall (Existing)
    rain_data = fetch_ogd_resource("6c05cd1b-ed59-40c2-bc31-e314f39c6971", {"district": city})
    compiled_data["rainfall"] = rain_data[0] if rain_data else {"status": "No Recent Data"}

    # 3. Power (Existing)
    if state:
        power_data = fetch_ogd_resource("8c55baee-3e42-457f-92c4-a0005e954bcc", {"state_name": state})
        compiled_data["power"] = power_data[0] if power_data else {"status": "No Data"}
        
    # --- NEW DATA POINTS ---
    
    # 4. Water Levels
    compiled_data["water_level"] = fetch_ground_water(district, state)

    # 5. Soil Quality
    compiled_data["soil"] = fetch_soil_quality(district, state)

    return compiled_data


# def fetch_gov_api_data(city: str):
#     print(f"\n   [API] 📡 Connecting to Govt Data for {city}...")
#     state = get_state_from_city(city)
#     compiled_data = {}

#     # 1. AQI
#     aqi_data = fetch_ogd_resource("3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69", {"city": city})
#     # Retry logic
#     if not aqi_data and city.lower() == "bangalore":
#          print("   [API RETRY] Switching to 'Bengaluru'...")
#          aqi_data = fetch_ogd_resource("3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69", {"city": "Bengaluru"})
    
#     if aqi_data:
#         # Default to first
#         best_station = aqi_data[0]
        
#         # Try to find PM2.5 or PM10
#         pm25_station = next((item for item in aqi_data if item.get("pollutant_id") == "PM2.5"), None)
#         pm10_station = next((item for item in aqi_data if item.get("pollutant_id") == "PM10"), None)
        
#         if pm25_station:
#             best_station = pm25_station
#         elif pm10_station:
#             best_station = pm10_station

#         # --- LOGGING POINT 4: What exactly did we select? ---
#         print(f"   [LOGIC SELECTED] Station: {best_station.get('station')}")
#         print(f"   [LOGIC SELECTED] Pollutant: {best_station.get('pollutant_id')}")
#         print(f"   [LOGIC SELECTED] Value: {best_station.get('pollutant_avg')}")

#         compiled_data["aqi"] = {
#             "value": best_station.get('pollutant_avg'),
#             "pollutant": best_station.get('pollutant_id'),
#             "station": best_station.get('station'),
#             "status": "Active"
#         }
#     else:
#         print("   [LOGIC FAILURE] No AQI data found after fetch.")
#         compiled_data["aqi"] = {"status": "Data Unavailable", "value": "N/A"}

#     # 2. Rainfall
#     rain_data = fetch_ogd_resource("6c05cd1b-ed59-40c2-bc31-e314f39c6971", {"district": city})
#     if rain_data:
#         print(f"   [LOGIC RAIN] Found data for {rain_data[0].get('district')}")
#     else:
#         print("   [LOGIC RAIN] No rain data found.")
        
#     compiled_data["rainfall"] = rain_data[0] if rain_data else {"status": "No Recent Data"}

#     # 3. Power
#     if state:
#         power_data = fetch_ogd_resource("8c55baee-3e42-457f-92c4-a0005e954bcc", {"state_name": state})
#         compiled_data["power"] = power_data[0] if power_data else {"status": "No Data"}

#     return compiled_data
# /
def fetch_real_firebase_issues(city: str):
    print(f"   [DB] 📲 Fetching Citizen Reports from Firebase...")
    
    issues_list = []
    try:
        # Fetch all documents from 'issues' collection
        docs = db.collection('issues').stream()
        
        count = 0
        for doc in docs:
            count += 1
            data = doc.to_dict()
            loc_data = data.get('location', {})
            geo_point = loc_data.get('geopoint')
            
            # --- LOGGING POINT 1: Print every single report found ---
            print(f"\n      📄 [Report #{count}] ID: {doc.id}")
            print(f"          Category: {data.get('category')}")
            print(f"          Description: {data.get('description')}")
            print(f"          Location: {loc_data.get('neighborhood')} ({loc_data.get('streetName')})")
            print(f"          Coords: {geo_point.latitude}, {geo_point.longitude}" if geo_point else "          Coords: ❌ None")

            issue_obj = {
                "id": doc.id,
                "location_name": loc_data.get('neighborhood', 'Unknown'),
                "description": data.get('description', 'Issue reported'),
                "category": data.get('category', 'general'),
                "street": loc_data.get('streetName', ''),
                "photo": data.get('photoUrl', ''),
                "timestamp": data.get('createdAt', ''),
                "source": "citizen_app"
            }

            if geo_point:
                issue_obj["lat"] = geo_point.latitude
                issue_obj["lng"] = geo_point.longitude
                issue_obj["has_coords"] = True
            else:
                issue_obj["has_coords"] = False
            
            issues_list.append(issue_obj)

        print(f"\n   [DB] ✅ Finished. Total Valid Reports: {len(issues_list)}")

    except Exception as e:
        print(f"   !!! Firebase Fetch Error: {e}")
        return []

    return issues_list

# --- 3. MODELS & STATE ---

class CityAnalysisRequest(BaseModel):
    city: str

# ### NEW CHANGE: Simplified Chat Request ###
# We don't ask the frontend for data anymore. Just the city and message.
class ChatRequest(BaseModel):
    city: str
    message: str

class CityState(TypedDict):
    city: str
    city_coords: List[float]
    raw_gov_data: Dict
    raw_citizen_reports: List[Dict]
    analyzed_locations: List[Dict]
    ai_summary: str

# --- 4. AGENT NODES ---

# def data_aggregator(state: CityState):
#     city = state["city"]
#     return {
#         "raw_gov_data": fetch_gov_api_data(city),
#         "raw_citizen_reports": fetch_real_firebase_issues(city)
#     }

def data_aggregator(state: CityState):
    city = state["city"]
    
    # 1. Get City Center immediately (Fallback to Mumbai if fails)
    try:
        loc = geolocator.geocode(city)
        center = [loc.latitude, loc.longitude] if loc else [19.07, 72.87]
    except:
        center = [19.07, 72.87]

    return {
        "city_coords": center, # <--- Pass this to state
        "raw_gov_data": fetch_gov_api_data(city),
        "raw_citizen_reports": fetch_real_firebase_issues(city)
    }

def city_analyst(state: CityState):
    """Node 2: AI Analysis + Govt Data Integration."""
    firebase_reports = state['raw_citizen_reports']
    gov_data = state['raw_gov_data']
    city_name = state['city']
    
    # --- STEP 1: Ask AI to process Citizen Reports ---
    prompt = f"""
    City: {city_name}
    Citizen Reports: {str(firebase_reports)[:2000]} 
    
    TASK: Return a JSON Array of map markers based ONLY on the citizen reports.
    - Use specific location names found in the reports.
    - Determine sentiment (negative/positive).
    
    JSON ONLY.
    """
    
    final_list = []
    
    try:
        parser = JsonOutputParser()
        chain = llm | parser
        ai_response = chain.invoke([HumanMessage(content=prompt)])
        
        # 1. Add Real Citizen Reports (Prioritize Lat/Lng from App)
        for report in firebase_reports:
            if report.get('has_coords'):
                final_list.append({
                    "location_name": report['location_name'],
                    "lat": report['lat'],
                    "lng": report['lng'],
                    "category": report['category'],
                    "description": report['description'],
                    "sentiment": "negative", # Reports are usually issues
                    "is_real_report": True
                })
        
        # 2. Add AI Inferred Locations (from text-only reports)
        if isinstance(ai_response, list):
            for item in ai_response:
                # Avoid duplicates if we already added the real report
                if not any(r['location_name'] == item.get('location_name') for r in final_list):
                    final_list.append(item)

    except Exception as e:
        print(f"AI Error: {e}")

    # --- STEP 2: Manually Add Government Data Markers ---
    # We create markers for these so the Cartographer node will geocode them
    
    # A. AQI Marker
    if gov_data.get('aqi') and gov_data['aqi'].get('value') != "N/A":
        aqi = gov_data['aqi']
        try:
            val = int(aqi['value'])
            sentiment = "positive" if val <= 100 else "negative"
            desc = f"AQI is {val} ({aqi['pollutant']}). Status: {aqi.get('status', 'Active')}"
        except:
            sentiment = "neutral"
            desc = f"AQI Data: {aqi['value']}"

        final_list.append({
            "location_name": f"{aqi.get('station')}, {city_name}", # Add city name to help geocoder
            "category": "air",
            "sentiment": sentiment,
            "description": desc,
            "is_gov_data": True
        })

    # B. Rainfall Marker
    # Rainfall is usually district level, so we map it to the city name generally
    if gov_data.get('rainfall') and gov_data['rainfall'].get('status') != "No Recent Data":
        rain = gov_data['rainfall']
        final_list.append({
            "location_name": f"{city_name} Center", # Will map to city center
            "category": "rain",
            "sentiment": "neutral", # Rain is neutral unless flood data exists
            "description": f"Rainfall: {rain.get('actual_rainfall', '0')}mm (Normal: {rain.get('normal_rainfall')}mm)",
            "is_gov_data": True
        })

     # C. Ground Water Marker
    if gov_data.get('water_level') and gov_data['water_level'].get('level') != "N/A":
        water = gov_data['water_level']
        # Logic: Assume 'level' is depth in meters. > 10m might be bad?
        desc = f"Ground Water Level: {water.get('level', 'Unknown')}m. Source: {water.get('source', 'Govt Sensor')}"
        
        final_list.append({
            "location_name": f"{city_name} Groundwater Station",
            "category": "water",
            "sentiment": "neutral",
            "description": desc,
            "is_gov_data": True
        })

    # D. Soil Marker
    if gov_data.get('soil') and gov_data['soil'].get('ph_level') != "N/A":
        soil = gov_data['soil']
        desc = f"Soil Health: pH {soil.get('ph_level', 'N/A')}, Nitrogen: {soil.get('N', '?')}"
        
        final_list.append({
            "location_name": f"{city_name} Agri-Zone",
            "category": "ecology", # Will use the Leaf icon
            "sentiment": "positive",
            "description": desc,
            "is_gov_data": True
        })

    return {"analyzed_locations": final_list}

    



def cartographer(state: CityState):
    final_markers = []
    city_center = state.get("city_coords", [19.07, 72.87])

    for item in state['analyzed_locations']:
        # Case 1: Already has coordinates (Citizen App Data)
        if item.get("lat") and item.get("lng"):
            final_markers.append(item)
            continue

        # Case 2: Needs Geocoding (Gov Data)
        try:
            # Add a small delay to be nice to the free API
            time.sleep(0.5) 
            query = f"{item['location_name']}, {state['city']}"
            
            print(f"   [GEO] Looking up: {query}")
            loc = geolocator.geocode(query, timeout=2)
            
            if loc:
                item['lat'] = loc.latitude
                item['lng'] = loc.longitude
            else:
                raise Exception("Location not found")

        except Exception as e:
            print(f"   [GEO FALLBACK] Could not find '{item['location_name']}'. Using City Center.")
            
            # Use City Center
            base_lat, base_lng = city_center
            
            # Add slight random offset so markers don't stack perfectly on top of each other
            # 0.005 is roughly 500 meters
            offset_lat = (random.random() - 0.5) * 0.01 
            offset_lng = (random.random() - 0.5) * 0.01
            
            item['lat'] = base_lat + offset_lat
            item['lng'] = base_lng + offset_lng
            item['location_name'] = f"{item['location_name']} (Approx)"

        # Always append the marker, even if we used the fallback
        final_markers.append(item)
            
    return {"analyzed_locations": final_markers}


# --- 5. WORKFLOW SETUP ---

workflow = StateGraph(CityState)
workflow.add_node("aggregator", data_aggregator)
workflow.add_node("analyst", city_analyst)
workflow.add_node("cartographer", cartographer)

workflow.set_entry_point("aggregator")

workflow.add_edge("aggregator", "analyst")
workflow.add_edge("analyst", "cartographer")
workflow.add_edge("cartographer", END)
app_brain = workflow.compile()

# --- 6. ENDPOINTS ---

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/analyze-city")
async def analyze_city_endpoint(request: CityAnalysisRequest):
    print(f"\n=== 🧠 REQUEST: Analyze {request.city} ===")
    
    initial_state = {
        "city": request.city,
        "raw_gov_data": {},
        "raw_citizen_reports": [],
        "analyzed_locations": [],
        "ai_summary": ""
    }
    
    # 1. Run the LangGraph Workflow
    result = app_brain.invoke(initial_state)
    
    # 2. Process Stats for Dashboard
    categories = [r['category'] for r in result['raw_citizen_reports']]
    category_stats = dict(Counter(categories))

    # ### NEW CHANGE: STORE DATA IN SERVER MEMORY ###
    # We save this data so the chatbot can access it later.
    city_key = request.city.lower().strip()
    CITY_DATA_STORE[city_key] = {
        "gov_data": result["raw_gov_data"],
        "citizen_stats": {
            "total": len(result["raw_citizen_reports"]),
            "breakdown": category_stats
        },
        "markers": result["analyzed_locations"]
    }
    print(f"   ✅ Data for {city_key} cached in memory.")

    # 3. Get Center
    try:
        loc = geolocator.geocode(request.city)
        center = [loc.latitude, loc.longitude] if loc else [19.07, 72.87]
    except:
        center = [19.07, 72.87]

    # 4. Return structure for React Dashboard
    return {
        "city": result["city_coords"],
        "city_center": center,
        "map_markers": result["analyzed_locations"],
        "gov_data": result["raw_gov_data"],
        "citizen_stats": {
            "total_reports": len(result["raw_citizen_reports"]),
            "category_breakdown": category_stats
        },
        "recent_issues": result["raw_citizen_reports"][:5]
    }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    # ### NEW CHANGE: RETRIEVE FROM SERVER MEMORY ###
    
    city_key = request.city.lower().strip()
    stored_data = CITY_DATA_STORE.get(city_key)

    # If user hasn't analyzed the city yet, we can't answer specifics
    if not stored_data:
        return {
            "reply": f"I don't have the data for {request.city} loaded yet. Please click 'Analyze City' on the dashboard first."
        }

    # Construct the prompt using the STORED Govt & App Data
    gov_context = stored_data['gov_data']
    stats_context = stored_data['citizen_stats']

    print(f"   💬 Chat Query for {city_key} (Using Cached Data)")

    prompt = f"""
    You are the 'City Brain' AI Assistant for {request.city}.
    
    --- REAL-TIME GOVT SENSOR DATA ---
    {json.dumps(gov_context, indent=2)}
    
    --- CITIZEN ISSUE REPORT STATS ---
    Total Reports: {stats_context['total']}
    Breakdown: {json.dumps(stats_context['breakdown'], indent=2)}
    
    --- USER QUESTION ---
    "{request.message}"
    
    --- INSTRUCTIONS ---
    1. Answer the question using ONLY the data above.
    2. If the user asks about Air Quality (AQI), use the exact number from the sensor data.
    3. If the user asks about problems, cite the citizen report statistics.
    4. Keep it helpful, professional, and concise.
    """
    
    try:
        response = llm.invoke([HumanMessage(content=prompt)])
        return {"reply": response.content}
    except Exception as e:
        print(f"Chat Error: {e}")
        return {"reply": "I'm having trouble processing that request right now."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)