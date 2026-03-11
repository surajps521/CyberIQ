import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import KSPLogo from "@/components/KSPLogo";
import AnimatedGrid from "@/components/AnimatedGrid";

const Login = () => {
  const navigate = useNavigate();
  const [badgeId, setBadgeId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      navigate("/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <AnimatedGrid />
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/10" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="glass-card p-8 space-y-8">
          <div className="flex justify-center">
            <KSPLogo size="lg" />
          </div>

          <div className="text-center space-y-1">
            <p className="text-muted-foreground text-sm">Secure Intelligence Access Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Badge ID</label>
              <Input
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder="Enter your Badge ID"
                className="bg-secondary/50 border-border/50 focus:border-accent h-11"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-secondary/50 border-border/50 focus:border-accent h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Role</label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-secondary/50 border-border/50 focus:border-accent h-11">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="constable">Constable</SelectItem>
                  <SelectItem value="inspector">Inspector</SelectItem>
                  <SelectItem value="commissioner">Commissioner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 gradient-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all glow-cyan"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Shield size={18} />
                  Secure Login
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground/60">
            Authorized personnel only. All access is monitored and logged.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
