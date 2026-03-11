import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Filter, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import KSPLogo from "@/components/KSPLogo";

interface GraphNode {
  id: string;
  label: string;
  type: "criminal" | "case" | "location" | "vehicle";
  x: number;
  y: number;
  vx: number;
  vy: number;
  details: Record<string, string>;
}

interface GraphEdge {
  source: string;
  target: string;
}

const nodeColors: Record<string, string> = {
  criminal: "#DC2626",
  case: "#1E3A8A",
  location: "#F97316",
  vehicle: "#EAB308",
};

const generateMockData = () => {
  const nodes: GraphNode[] = [
    { id: "c1", label: "Rajesh Yadav", type: "criminal", x: 400, y: 300, vx: 0, vy: 0, details: { aliases: "Raja, RY", status: "Wanted", cases: "5" } },
    { id: "c2", label: "Suresh Kumar", type: "criminal", x: 300, y: 200, vx: 0, vy: 0, details: { aliases: "SK", status: "Arrested", cases: "3" } },
    { id: "c3", label: "Vikram Singh", type: "criminal", x: 500, y: 150, vx: 0, vy: 0, details: { aliases: "Vicky", status: "Absconding", cases: "7" } },
    { id: "c4", label: "Deepak Nair", type: "criminal", x: 600, y: 400, vx: 0, vy: 0, details: { aliases: "DK", status: "On Bail", cases: "2" } },
    { id: "cs1", label: "FIR-4521", type: "case", x: 350, y: 400, vx: 0, vy: 0, details: { type: "Chain Snatching", date: "2024-03-15", status: "Open" } },
    { id: "cs2", label: "FIR-4498", type: "case", x: 500, y: 350, vx: 0, vy: 0, details: { type: "Robbery", date: "2024-02-28", status: "Open" } },
    { id: "cs3", label: "FIR-4102", type: "case", x: 200, y: 350, vx: 0, vy: 0, details: { type: "Drug Trafficking", date: "2024-01-10", status: "Closed" } },
    { id: "l1", label: "Jayanagar", type: "location", x: 250, y: 100, vx: 0, vy: 0, details: { district: "Bengaluru South", zone: "Urban" } },
    { id: "l2", label: "BTM Layout", type: "location", x: 550, y: 250, vx: 0, vy: 0, details: { district: "Bengaluru South", zone: "Urban" } },
    { id: "v1", label: "KA-01-AB-1234", type: "vehicle", x: 450, y: 450, vx: 0, vy: 0, details: { type: "Two-wheeler", make: "Pulsar 150", stolen: "Yes" } },
    { id: "v2", label: "KA-05-CD-5678", type: "vehicle", x: 150, y: 250, vx: 0, vy: 0, details: { type: "Car", make: "Swift", stolen: "No" } },
  ];
  const edges: GraphEdge[] = [
    { source: "c1", target: "cs1" }, { source: "c1", target: "cs2" }, { source: "c2", target: "cs1" },
    { source: "c3", target: "cs2" }, { source: "c3", target: "cs3" }, { source: "c4", target: "cs2" },
    { source: "c1", target: "l1" }, { source: "c2", target: "l2" }, { source: "c3", target: "l2" },
    { source: "cs1", target: "v1" }, { source: "c2", target: "v2" }, { source: "c1", target: "c2" },
    { source: "c3", target: "c4" },
  ];
  return { nodes, edges };
};

const NetworkGraph = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data] = useState(generateMockData);
  const nodesRef = useRef(data.nodes.map((n) => ({ ...n })));
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const nodes = nodesRef.current;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(pan.x + w / 2, pan.y + h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);

    // Force simulation step
    const centerX = w / 2, centerY = h / 2;
    for (const node of nodes) {
      node.vx *= 0.9; node.vy *= 0.9;
      // Center gravity
      node.vx += (centerX - node.x) * 0.0005;
      node.vy += (centerY - node.y) * 0.0005;
    }
    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = 2000 / (dist * dist);
        nodes[i].vx -= (dx / dist) * force;
        nodes[i].vy -= (dy / dist) * force;
        nodes[j].vx += (dx / dist) * force;
        nodes[j].vy += (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const edge of data.edges) {
      const s = nodes.find((n) => n.id === edge.source);
      const t = nodes.find((n) => n.id === edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x, dy = t.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = (dist - 120) * 0.003;
      s.vx += (dx / dist) * force;
      s.vy += (dy / dist) * force;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    }
    for (const node of nodes) {
      node.x += node.vx;
      node.y += node.vy;
    }

    // Draw edges
    for (const edge of data.edges) {
      const s = nodes.find((n) => n.id === edge.source);
      const t = nodes.find((n) => n.id === edge.target);
      if (!s || !t) continue;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
      ctx.lineWidth = 1;
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    // Draw nodes
    const filtered = filterType === "all" ? nodes : nodes.filter((n) => n.type === filterType);
    for (const node of nodes) {
      const isVisible = filtered.includes(node);
      const isHighlighted = searchTerm && node.label.toLowerCase().includes(searchTerm.toLowerCase());
      const radius = isHighlighted ? 18 : 12;
      const alpha = isVisible ? 1 : 0.15;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = `${nodeColors[node.type]}${Math.round(alpha * 0.2 * 255).toString(16).padStart(2, "0")}`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = nodeColors[node.type] + Math.round(alpha * 255).toString(16).padStart(2, "0");
      ctx.fill();

      if (isHighlighted) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = nodeColors[node.type];
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
      ctx.font = "10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + radius + 14);
    }

    ctx.restore();
    animationRef.current = requestAnimationFrame(draw);
  }, [data, filterType, searchTerm, zoom, pan]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    const mx = (e.clientX - rect.left - pan.x - w / 2) / zoom + w / 2;
    const my = (e.clientY - rect.top - pan.y - h / 2) / zoom + h / 2;

    const clicked = nodesRef.current.find((n) => {
      const dx = n.x - mx, dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) < 16;
    });
    setSelectedNode(clicked || null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setPan({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const handleMouseUp = () => { isDragging.current = false; };

  return (
    <div className="h-screen flex flex-col bg-background relative">
      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="glass-card text-xs text-muted-foreground hover:text-foreground">
            ← Back
          </Button>
          {/* Legend */}
          <div className="glass-card px-3 py-2 flex items-center gap-4">
            {Object.entries(nodeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[10px] capitalize text-muted-foreground">{type}s</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="glass-card flex items-center px-2">
            <Search size={14} className="text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search nodes..."
              className="border-0 bg-transparent focus-visible:ring-0 text-xs w-40"
            />
          </div>
          <div className="glass-card flex items-center gap-1 px-1">
            {["all", "criminal", "case", "location", "vehicle"].map((t) => (
              <Button
                key={t}
                variant="ghost"
                size="sm"
                onClick={() => setFilterType(t)}
                className={`text-[10px] h-7 px-2 capitalize ${filterType === t ? "text-accent bg-accent/10" : "text-muted-foreground"}`}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 z-10 glass-card flex flex-col gap-1 p-1">
        <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(z + 0.2, 3))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ZoomIn size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.3))} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <ZoomOut size={16} />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <Maximize2 size={16} />
        </Button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-grab active:cursor-grabbing"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Selected node popup */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 glass-card p-4 w-80"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: nodeColors[selectedNode.type] }} />
              <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
            </div>
            <span className="text-[10px] capitalize px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{selectedNode.type}</span>
          </div>
          <div className="space-y-1">
            {Object.entries(selectedNode.details).map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs">
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default NetworkGraph;
