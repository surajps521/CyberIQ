import { motion } from "framer-motion";
import { Download, ChevronLeft, TrendingUp, Users, AlertTriangle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from "recharts";

const districtData = [
  { district: "BLR South", cases: 342 },
  { district: "BLR North", cases: 287 },
  { district: "BLR East", cases: 198 },
  { district: "BLR West", cases: 245 },
  { district: "Mysuru", cases: 156 },
  { district: "Hubli", cases: 134 },
  { district: "Mangalore", cases: 112 },
];

const trendData = [
  { month: "Jan", cases: 120 }, { month: "Feb", cases: 145 }, { month: "Mar", cases: 132 },
  { month: "Apr", cases: 165 }, { month: "May", cases: 178 }, { month: "Jun", cases: 152 },
  { month: "Jul", cases: 190 }, { month: "Aug", cases: 175 }, { month: "Sep", cases: 168 },
  { month: "Oct", cases: 195 }, { month: "Nov", cases: 210 }, { month: "Dec", cases: 188 },
];

const crimeTypeData = [
  { name: "Theft", value: 35, color: "#06B6D4" },
  { name: "Robbery", value: 22, color: "#1E3A8A" },
  { name: "Assault", value: 18, color: "#DC2626" },
  { name: "Burglary", value: 15, color: "#EAB308" },
  { name: "Fraud", value: 10, color: "#8B5CF6" },
];

const unsolvedCases = [
  { fir: "KSP/BLR/2024/4521", type: "Murder", location: "Majestic", date: "2024-03-15", status: "Active" },
  { fir: "KSP/BLR/2024/4498", type: "Kidnapping", location: "Whitefield", date: "2024-03-10", status: "Active" },
  { fir: "KSP/MYS/2024/2201", type: "Armed Robbery", location: "Mysuru", date: "2024-03-08", status: "Active" },
  { fir: "KSP/BLR/2024/4455", type: "Murder", location: "Jayanagar", date: "2024-03-05", status: "Cold" },
  { fir: "KSP/BLR/2024/4420", type: "Drug Trafficking", location: "Shivajinagar", date: "2024-03-01", status: "Active" },
  { fir: "KSP/HBL/2024/1102", type: "Extortion", location: "Hubli", date: "2024-02-28", status: "Active" },
  { fir: "KSP/BLR/2024/4380", type: "Murder", location: "BTM Layout", date: "2024-02-25", status: "Cold" },
  { fir: "KSP/MNG/2024/0892", type: "Kidnapping", location: "Mangalore", date: "2024-02-20", status: "Active" },
  { fir: "KSP/BLR/2024/4301", type: "Armed Robbery", location: "HSR Layout", date: "2024-02-15", status: "Active" },
  { fir: "KSP/BLR/2024/4275", type: "Murder", location: "Indiranagar", date: "2024-02-10", status: "Cold" },
];

const kpis = [
  { label: "Total FIRs", value: "12,847", icon: TrendingUp, change: "+12%", color: "text-accent" },
  { label: "Solved Cases", value: "8,642", icon: Users, change: "67.3%", color: "text-green-400" },
  { label: "Active Criminals", value: "3,421", icon: AlertTriangle, change: "+5%", color: "text-destructive" },
  { label: "High Risk Zones", value: "24", icon: MapPin, change: "-3", color: "text-yellow-400" },
];

const Analytics = () => {
  const navigate = useNavigate();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="min-h-screen bg-background p-6 overflow-y-auto scrollbar-thin">
      <motion.div variants={container} initial="hidden" animate="show" className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={item} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            <h1 className="text-xl font-bold">Analytics Dashboard</h1>
          </div>
          <Button className="gradient-primary text-primary-foreground hover:opacity-90 text-xs gap-2">
            <Download size={14} /> Export PDF
          </Button>
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="glass-card-hover p-5">
              <div className="flex items-center justify-between mb-3">
                <kpi.icon size={20} className={kpi.color} />
                <span className={`text-xs font-medium ${kpi.color}`}>{kpi.change}</span>
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Row 1: Bar + Line charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={item} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Crime by District</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="district" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
                <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
                <Tooltip contentStyle={{ background: "hsl(222 41% 11%)", border: "1px solid hsl(222 30% 22%)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="cases" fill="hsl(187 94% 43%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={item} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                <XAxis dataKey="month" tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
                <YAxis tick={{ fill: "hsl(215 20% 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(222 30% 18%)" }} />
                <Tooltip contentStyle={{ background: "hsl(222 41% 11%)", border: "1px solid hsl(222 30% 22%)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="cases" stroke="hsl(187 94% 43%)" strokeWidth={2} dot={{ fill: "hsl(187 94% 43%)", r: 3 }} activeDot={{ r: 5, fill: "hsl(187 94% 43%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Row 2: Donut + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div variants={item} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Crime Types Distribution</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={crimeTypeData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value">
                    {crimeTypeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(222 41% 11%)", border: "1px solid hsl(222 30% 22%)", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {crimeTypeData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[10px] text-muted-foreground">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={item} className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4">Top 10 Unsolved Cases</h3>
            <div className="overflow-auto scrollbar-thin">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">FIR</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Location</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {unsolvedCases.map((c) => (
                    <tr key={c.fir} className="border-b border-border/30 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <td className="py-2 px-2 font-mono text-accent">{c.fir.split("/").pop()}</td>
                      <td className="py-2 px-2">{c.type}</td>
                      <td className="py-2 px-2 text-muted-foreground">{c.location}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                          c.status === "Active" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Analytics;
