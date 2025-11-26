import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Send, Loader2, AlertTriangle, Droplets, Zap, Leaf, ArrowLeft, Activity, CloudRain, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

// Fix for default Leaflet markers in Vite/Webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// --- 1. Marker Setup ---
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Colored Icons (Neon Glow Effect)
// const createCustomIcon = (color) => new L.DivIcon({
//   className: 'custom-icon',
//   html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>`,
//   iconSize: [24, 24],
//   iconAnchor: [12, 12],
//   popupAnchor: [0, -12]
// });

const createCustomIcon = (color, label) => {
  // We define the HTML structure: A dot + A white label
  const html = `
    <div style="display: flex; align-items: center; width: 120px;">
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px ${color};
        z-index: 10;
        flex-shrink: 0;
      "></div>
      
      <span style="
        background-color: white;
        color: #334155;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
        margin-left: -8px; /* Overlap slightly */
        padding-left: 12px; /* Make room for the dot */
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid #e2e8f0;
        white-space: nowrap;
        z-index: 5;
      ">
        ${label}
      </span>
    </div>
  `;

  return new L.DivIcon({
    className: 'custom-icon-container', // Empty class to prevent default styles
    html: html,
    iconSize: [120, 24], // Width needs to be big enough for text
    iconAnchor: [10, 12], // Anchor at the center of the DOT (not the text)
    popupAnchor: [0, -12]
  });
};

// --- 2. Helper Components ---
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 13);
  return null;
}

export default function Dashboard({ cityName, onBack }) {
  // State Management
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: `Hello! I am analyzing the ecosystem of ${cityName}. Ask me anything about the map.` }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  
  // Auto-scroll ref for chat
  const chatEndRef = useRef(null);

  // Backend URL - Ensure this matches your FastAPI port
  const API_URL = "http://localhost:8000"; 

  // Scroll to bottom whenever chatHistory changes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    analyzeCity();
  }, [cityName]);

  const analyzeCity = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/analyze-city`, { city: cityName });
      setData(response.data);
    } catch (error) {
      console.error("Error analyzing city:", error);
      setChatHistory(prev => [...prev, { role: 'ai', content: "Error connecting to the City Brain. Is the backend running?" }]);
    } finally {
      setLoading(false);
    }
  };

//   const handleChat = async (e) => {
//     e.preventDefault();
//     if (!chatMessage.trim()) return;

//     const userMsg = chatMessage;
//     setChatMessage("");
//     setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    
    
//     setChatLoading(true);

//     try {
//       const response = await axios.post(`${API_URL}/chat`, {
//         city: cityName,
//         message: userMsg,
//         context_summary: data?.summary || "No context available."
//       });
//       setChatHistory(prev => [...prev, { role: 'ai', content: response.data.reply }]);
//     } catch (error) {
//       setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I lost connection to the neural network." }]);
//     } finally {
//       setChatLoading(false);
//     }
//   };

  // Helper to generate short tags for the map
  const getMarkerLabel = (marker) => {
    const cat = marker.category?.toLowerCase();
    
    // 1. If it is AQI, try to find the number in the description
    if (cat === 'air' || cat === 'pollution') {
      // Regex to find number in description (e.g. "AQI is 123")
      const match = marker.description?.match(/\d+/);
      return match ? `AQI ${match[0]}` : 'AQI';
    }
    
    // 2. Rainfall
    if (cat === 'rain' || cat === 'flood') return 'Rain';
    
    // 3. Water / Soil
    if (cat === 'water') return 'Water Lvl';
    if (cat === 'ecology') return 'Soil Health';
    
    // 4. General Issues (Capitalize first letter)
    return marker.category ? marker.category.charAt(0).toUpperCase() + marker.category.slice(1) : 'Report';
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage("");
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const response = await axios.post(`${API_URL}/chat`, {
        city: cityName,
        message: userMsg,
        gov_data: data?.gov_data || {},
        citizen_stats: data?.citizen_stats || {}
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: response.data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: "Sorry, I lost connection to the neural network." }]);
    } finally {
      setChatLoading(false);
    }
  };


  const getCategoryIcon = (cat) => {
    const c = cat?.toLowerCase(); // Safety check for casing
    switch(c) {
      case 'water': return <Droplets className="w-4 h-4" />;
      case 'energy': 
      case 'power': return <Zap className="w-4 h-4" />;
      case 'ecology': 
      case 'tree': return <Leaf className="w-4 h-4" />;
      case 'air': 
      case 'pollution': return <Wind className="w-4 h-4" />; // New Icon
      case 'rain': 
      case 'flood': return <CloudRain className="w-4 h-4" />; // New Icon
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
            <Loader2 className="relative w-12 h-12 animate-spin text-primary mb-4" />
        </div>
        <h2 className="text-xl font-semibold text-slate-700">Connecting to Satellite & Gov Sensors...</h2>
        <p className="text-slate-500">Analyzing {cityName} data streams</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative overflow-hidden flex flex-col">
      
      {/* --- Top Navigation Bar --- */}
      <div className="h-16 bg-white border-b flex items-center px-6 justify-between z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="font-bold text-lg">{cityName} Ecosystem Twin</h1>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Live System Active
            </p>
          </div>
        </div>
        <div className="flex gap-3">
           <div className="hidden md:flex gap-4 text-sm text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border">
             <span className="flex items-center gap-1 font-medium">
               <AlertTriangle className="w-4 h-4 text-orange-500"/> 
               AQI: {data?.gov_data?.aqi?.value || "N/A"}
             </span>
             <div className="w-px h-4 bg-slate-300"></div>
             <span className="flex items-center gap-1 font-medium">
               <Activity className="w-4 h-4 text-primary"/> 
               {data?.citizen_stats?.total_reports || 0} Reports
             </span>
           </div>
        </div>
      </div>

      {/* --- Main Layout --- */}
      <div className="flex-1 relative w-full overflow-hidden">
        
        {/* 1. The Map (Full Screen Background) */}
        <MapContainer 
          center={data?.city_center || [20.5937, 78.9629]} 
          zoom={13} 
          style={{ height: '100vh', width: '100%', zIndex: 0 }}
          zoomControl={false} // We can add custom controls if needed, keeping it clean for now
        >
          <ChangeView center={data?.city_center} />
          
          {/* CartoDB Light Tiles (Clean Look) */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          />

          {/* Map Markers */}
          {data?.map_markers?.map((marker, idx) => {
            
            // GENERATE THE LABEL HERE
            const labelText = getMarkerLabel(marker);
            
            return (
              <Marker 
                key={idx} 
                position={[marker.lat, marker.lng]}
                // PASS THE LABEL TO THE ICON CREATOR
                icon={createCustomIcon(
                  marker.sentiment === 'positive' ? '#10b981' : '#ef4444', 
                  labelText
                )}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`p-1.5 rounded-md ${marker.sentiment === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {getCategoryIcon(marker.category)}
                      </span>
                      <span className="font-bold text-sm">{marker.location_name}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{marker.description}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* 2. Floating Left Panel (System Stats) */}
        <div className="absolute top-4 left-4 w-80 z-[1000] space-y-4 hidden md:block pointer-events-none">
            
            {/* Government Data Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl pointer-events-auto">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary"/> Government Data
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* AQI */}
                    {data?.gov_data?.aqi && (
                      <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-orange-900">Air Quality Index</span>
                          <span className="text-lg font-bold text-orange-600">{data.gov_data.aqi.value}</span>
                        </div>
                        <p className="text-xs text-orange-700">{data.gov_data.aqi.pollutant} at {data.gov_data.aqi.station}</p>
                      </div>
                    )}
                    
                    {/* Rainfall */}
                    {data?.gov_data?.rainfall && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span className="text-xs font-semibold text-blue-900">Rainfall Data Available</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Power */}
                    {data?.gov_data?.power && (
                      <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-semibold text-yellow-900">Power Grid Active</span>
                        </div>
                      </div>
                    )}
                  
                    {!data?.gov_data?.aqi && !data?.gov_data?.rainfall && !data?.gov_data?.power && (
                      <p className="text-xs text-slate-500 text-center py-2">No government data available for this city</p>
                    )}
                </CardContent>
            </Card>

            {/* Citizen Reports Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl pointer-events-auto">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500"/> Citizen Reports
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">Total Reports</span>
                        <span className="text-2xl font-bold text-primary">{data?.citizen_stats?.total_reports || 0}</span>
                      </div>
                      
                      {data?.citizen_stats?.category_breakdown && Object.keys(data.citizen_stats.category_breakdown).length > 0 && (
                        <div className="mt-3 space-y-1">
                          <h4 className="text-xs font-bold uppercase text-slate-400">By Category</h4>
                          {Object.entries(data.citizen_stats.category_breakdown).map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between text-xs">
                              <span className="capitalize text-slate-600">{category}</span>
                              <span className="font-semibold text-slate-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Issues Feed */}
            {data?.recent_issues && data.recent_issues.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl pointer-events-auto">
                  <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                          <Leaf className="w-4 h-4 text-green-600"/> Recent Issues
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                      {data.recent_issues.map((issue, i) => (
                        <div key={i} className="text-xs p-2 bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition">
                          <div className="font-semibold text-slate-900 mb-1 capitalize">{issue.category}</div>
                          <div className="text-slate-600">{issue.description}</div>
                          <div className="text-slate-400 mt-1">{issue.location_name}</div>
                        </div>
                      ))}
                  </CardContent>
              </Card>
            )}
        
        </div>

        {/* Floating Right Panel (Chatbot) */}
        <div className="absolute top-4 right-4 w-96 z-[1000] h-[calc(100%-2rem)] flex flex-col pointer-events-none">
            <Card className="flex-1 bg-white/95 backdrop-blur-sm border-slate-200 shadow-xl flex flex-col overflow-hidden pointer-events-auto">
                <CardHeader className="py-3 border-b bg-slate-50/50 shrink-0">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Regenerative AI Assistant
                    </CardTitle>
                </CardHeader>
                
                {/* Chat History Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-br-none' 
                                : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {chatLoading && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin text-slate-400"/>
                                <span className="text-xs text-slate-400">Thinking...</span>
                            </div>
                        </div>
                    )}
                    {/* Invisible element to auto-scroll to */}
                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 border-t bg-white shrink-0">
                    <form onSubmit={handleChat} className="flex gap-2">
                        <input 
                            className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Ask about pollution, water..."
                            value={chatMessage}
                            onChange={(e) => setChatMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={chatLoading}
                            className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            </Card>
        </div>

      </div>
    </div>
  );
}