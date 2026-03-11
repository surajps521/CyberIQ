import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Filter, Calendar, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useNavigate } from "react-router-dom";

// We'll use a leaflet map with a manual heatmap canvas overlay
const crimeData = [
  { lat: 12.9716, lng: 77.5946, weight: 90, area: "Majestic", crimes: 142 },
  { lat: 12.9352, lng: 77.6245, weight: 85, area: "Jayanagar", crimes: 98 },
  { lat: 12.9166, lng: 77.6101, weight: 70, area: "BTM Layout", crimes: 87 },
  { lat: 12.9698, lng: 77.7500, weight: 60, area: "Whitefield", crimes: 65 },
  { lat: 12.9783, lng: 77.6408, weight: 80, area: "Indiranagar", crimes: 110 },
  { lat: 13.0358, lng: 77.5970, weight: 50, area: "Yeshwanthpur", crimes: 45 },
  { lat: 12.9063, lng: 77.5857, weight: 75, area: "Banashankari", crimes: 92 },
  { lat: 13.0072, lng: 77.5688, weight: 55, area: "Rajajinagar", crimes: 56 },
  { lat: 12.9141, lng: 77.6446, weight: 65, area: "HSR Layout", crimes: 78 },
  { lat: 12.9850, lng: 77.7081, weight: 45, area: "Marathahalli", crimes: 52 },
];

const HotspotMap = () => {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [district, setDistrict] = useState("all");
  const [crimeType, setCrimeType] = useState("all");
  const [timeRange, setTimeRange] = useState([0]);
  const [selectedArea, setSelectedArea] = useState<typeof crimeData[0] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const loadMap = async () => {
      const L = await import("leaflet");

      const map = L.map(mapRef.current!, {
        center: [12.9716, 77.5946],
        zoom: 12,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Add circle markers as heatmap substitute
      crimeData.forEach((point) => {
        const color = point.weight > 75 ? "#DC2626" : point.weight > 50 ? "#EAB308" : "#22C55E";
        const circle = L.circleMarker([point.lat, point.lng], {
          radius: point.weight / 4,
          fillColor: color,
          fillOpacity: 0.4,
          stroke: true,
          color: color,
          weight: 1,
          opacity: 0.6,
        }).addTo(map);

        circle.on("click", () => {
          setSelectedArea(point);
        });

        // Glow effect - larger translucent circle behind
        L.circleMarker([point.lat, point.lng], {
          radius: point.weight / 2.5,
          fillColor: color,
          fillOpacity: 0.1,
          stroke: false,
        }).addTo(map);
      });

      mapInstanceRef.current = map;
      setMapReady(true);
    };

    loadMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="h-screen flex bg-background relative">
      {/* Left filter panel */}
      <div className="w-72 border-r border-border bg-sidebar p-4 space-y-6 z-10 overflow-y-auto scrollbar-thin">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground h-8 w-8">
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-sm font-semibold">Crime Hotspot Map</h2>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Filter size={12} /> District
          </label>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="bg-secondary/50 border-border/50 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Districts</SelectItem>
              <SelectItem value="south">Bengaluru South</SelectItem>
              <SelectItem value="north">Bengaluru North</SelectItem>
              <SelectItem value="east">Bengaluru East</SelectItem>
              <SelectItem value="west">Bengaluru West</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground">Crime Type</label>
          <Select value={crimeType} onValueChange={setCrimeType}>
            <SelectTrigger className="bg-secondary/50 border-border/50 text-xs h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="theft">Theft</SelectItem>
              <SelectItem value="robbery">Robbery</SelectItem>
              <SelectItem value="assault">Assault</SelectItem>
              <SelectItem value="burglary">Burglary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Calendar size={12} /> Date Range
          </label>
          <Slider
            value={timeRange}
            onValueChange={setTimeRange}
            max={11}
            step={1}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground text-center">{months[timeRange[0]]} 2024</p>
        </div>

        <div className="glass-card p-3 space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legend</h4>
          <div className="space-y-1.5">
            {[
              { color: "bg-destructive", label: "High Crime (75+)" },
              { color: "bg-yellow-500", label: "Medium Crime (50-75)" },
              { color: "bg-green-500", label: "Low Crime (<50)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                <span className="text-[10px] text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</h4>
          {[
            { label: "Total Hotspots", value: "10" },
            { label: "Total Crimes", value: "825" },
            { label: "Highest", value: "Majestic (142)" },
          ].map((stat) => (
            <div key={stat.label} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-medium text-foreground">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Selected area popup */}
        {selectedArea && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] glass-card p-4 w-72"
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">{selectedArea.area}</h4>
              <button onClick={() => setSelectedArea(null)} className="text-muted-foreground hover:text-foreground text-xs">✕</button>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Crimes</span>
                <span className="font-bold text-destructive">{selectedArea.crimes}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Risk Score</span>
                <span className="font-bold text-accent">{selectedArea.weight}/100</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Status</span>
                <span className={`font-medium ${selectedArea.weight > 75 ? "text-destructive" : selectedArea.weight > 50 ? "text-yellow-400" : "text-green-400"}`}>
                  {selectedArea.weight > 75 ? "High Risk" : selectedArea.weight > 50 ? "Medium Risk" : "Low Risk"}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Timeline slider at bottom */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] glass-card px-6 py-3 w-96">
          <p className="text-[10px] text-muted-foreground text-center mb-2">Timeline: {months[timeRange[0]]} 2024</p>
          <Slider value={timeRange} onValueChange={setTimeRange} max={11} step={1} />
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted-foreground">Jan</span>
            <span className="text-[8px] text-muted-foreground">Dec</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotspotMap;
