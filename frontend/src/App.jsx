 import { useState } from 'react';
import Dashboard from './Dashboard';
import { ArrowRight, Building2, Globe, Activity, MapPin, Users, Zap, TrendingUp, Camera, Map, Brain, Database } from 'lucide-react';
import { TypewriterEffectSmooth } from './components/ui/Typewriter'; // Ensure this path is correct

function App() {
  const [city, setCity] = useState(null);
  const [inputCity, setInputCity] = useState("");

  // Corrected the words array
  const words = [
    {
      text: "Living",
      className: "text-green-500 text-4xl sm:text-5xl md:text-6xl",
    },
    {
      text: "adaptive",
      className: "text-green-500 text-4xl sm:text-5xl md:text-6xl",
    },
     
  ];

  const handleStart = (e) => {
    e.preventDefault();
    if (inputCity.trim()) {
      setCity(inputCity);
    }
  };

  if (city) {
    // Assuming Dashboard component exists and is imported correctly
    return <Dashboard cityName={city} onBack={() => setCity(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col items-center justify-center p-4 py-20">
      <div className="max-w-6xl w-full text-center space-y-12">

        {/* Hero Badge */}
        <div className="inline-flex items-center px-4 py-2 rounded-full border-2 border-primary/20 bg-primary/5 backdrop-blur-sm text-base font-semibold text-primary">
          <Activity className="w-5 h-5 mr-2" />
          Regenerative City OS v1.0
        </div>

        {/* Hero Title */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {/* Removed the unnecessary span wrapper for the TypewriterEffect */}
          Perceive Cities as <br />
          <TypewriterEffectSmooth words={words} className="my-4 justify-center" />
        </h1>

        <p className="text-2xl md:text-3xl text-slate-600 max-w-3xl mx-auto font-light leading-relaxed">
          An AI-driven digital mind that maps energy flows, climate stress, and urban metabolism to guide regenerative decisions.
        </p>

        {/* Search Input */}
        <form onSubmit={handleStart} className="relative max-w-2xl mx-auto mt-12">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition duration-1000 animate-pulse"></div>
            <div className="relative flex shadow-2xl">
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder="Enter city name (e.g., Bangalore)..."
                className="block w-full p-6 pl-8 text-xl text-slate-900 bg-white border-2 border-transparent rounded-l-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary focus:outline-none font-medium placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="px-10 py-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white text-lg font-bold rounded-r-2xl hover:from-slate-800 hover:to-slate-700 transition-all flex items-center shadow-xl hover:shadow-2xl"
              >
                Explore <ArrowRight className="ml-3 w-6 h-6" />
              </button>
            </div>
          </div>
        </form>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left max-w-5xl mx-auto">
          <FeatureCard
            icon={<Globe className="w-8 h-8 text-blue-500" />}
            title="Planetary Health"
            desc="Real-time climate and pollution mapping powered by satellite data and ground sensors."
          />
          <FeatureCard
            icon={<Building2 className="w-8 h-8 text-purple-500" />}
            title="Urban Metabolism"
            desc="Track water, energy, and waste flows through comprehensive infrastructure monitoring."
          />
          <FeatureCard
            icon={<Activity className="w-8 h-8 text-primary" />}
            title="Citizen Pulse"
            desc="Integrate citizen reports with AI analysis for grassroots urban intelligence."
          />
        </div>

        {/* Stats Section */}
        <div className="mt-32 pt-16 border-t-2 border-slate-200">
          <h3 className="text-lg font-bold text-slate-500 uppercase tracking-widest mb-12">Platform Impact</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto">
            <StatCard number="47" label="Cities Monitored" icon={<MapPin className="w-5 h-5" />} />
            <StatCard number="12.5K" label="Active Citizens" icon={<Users className="w-5 h-5" />} />
            <StatCard number="89%" label="Data Accuracy" icon={<TrendingUp className="w-5 h-5" />} />
            <StatCard number="24/7" label="Live Monitoring" icon={<Zap className="w-5 h-5" />} />
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32 pt-16 border-t-2 border-slate-200">
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">How It Works</h3>
          <p className="text-xl text-slate-600 mb-16 max-w-3xl mx-auto leading-relaxed">
            Our platform transforms citizen engagement into actionable urban intelligence through a powerful partnership ecosystem.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-left max-w-6xl mx-auto">
            <ProcessCard
              number="1"
              icon={<Camera className="w-7 h-7" />}
              title="Citizens Report"
              desc="Using our partner mobile app, citizens snap photos of civic issues—potholes, garbage, broken infrastructure—with GPS location automatically captured."
            />
            <ProcessCard
              number="2"
              icon={<Database className="w-7 h-7" />}
              title="Data Aggregation"
              desc="Reports are securely stored in Firebase and merged with government sensor data (air quality, water levels, energy grids) for comprehensive coverage."
            />
            <ProcessCard
              number="3"
              icon={<Brain className="w-7 h-7" />}
              title="AI Analysis"
              desc="Google Gemini AI processes thousands of reports, identifies patterns, prioritizes critical issues, and generates intelligent insights for city planners."
            />
            <ProcessCard
              number="4"
              icon={<Map className="w-7 h-7" />}
              title="Live Mapping"
              desc="Issues are visualized on an interactive map with real-time updates, enabling authorities and citizens to track resolutions and urban health metrics."
            />
          </div>
        </div>

        {/* Partnership Info */}
        <div className="mt-24 p-10 bg-gradient-to-br from-primary/10 via-emerald-50/50 to-teal-50/30 rounded-3xl border-2 border-primary/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <h4 className="text-2xl font-bold text-slate-900 mb-3">Powered by Citizen Engagement</h4>
              <p className="text-lg text-slate-600 leading-relaxed">
                Our partner mobile app empowers every citizen to become a city sensor. With just a camera click, residents report civic issues,
                upload geo-tagged photos, and contribute to building smarter, more responsive cities. Together, we're creating a real-time
                digital twin of urban infrastructure.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessCard({ number, icon, title, desc }) {
  return (
    <div className="relative p-8 bg-white rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-primary to-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-xl group-hover:scale-110 transition-transform">
        {number}
      </div>
      <div className="mb-6 text-primary group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-base text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatCard({ number, label, icon }) {
  return (
    <div className="text-center group hover:scale-105 transition-transform">
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className="text-5xl md:text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">{number}</span>
        <span className="text-primary group-hover:scale-110 transition-transform">{icon}</span>
      </div>
      <p className="text-base font-medium text-slate-600">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 bg-white rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-300 group">
      <div className="mb-6 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-base text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

export default App;