import { Shield } from "lucide-react";

const KSPLogo = ({ size = "default" }: { size?: "sm" | "default" | "lg" }) => {
  const sizes = {
    sm: "h-8 w-8",
    default: "h-12 w-12",
    lg: "h-16 w-16",
  };
  const textSizes = {
    sm: "text-lg",
    default: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} rounded-xl gradient-primary flex items-center justify-center glow-cyan`}>
        <Shield className="text-primary-foreground" size={size === "lg" ? 32 : size === "sm" ? 16 : 24} />
      </div>
      <div>
        <h1 className={`${textSizes[size]} font-bold tracking-tight`}>
          <span className="gradient-text">CrimeIQ</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Karnataka State Police</p>
      </div>
    </div>
  );
};

export default KSPLogo;
