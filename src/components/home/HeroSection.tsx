import { Link } from "react-router-dom";
import { ArrowRight, Award, CheckCircle, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient opacity-95" />
      
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl animate-pulse-slow" />
      
      <div className="container mx-auto px-4 relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-primary-foreground">
              AICTE Approved Internship Certificates
            </span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Certificate of <br />
            <span className="text-accent">Internship Completion</span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Get your verified internship certificate with QR code verification. 
            Simple registration, instant certificate generation after payment.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Link to="/certificates">
              <Button variant="hero" size="xl" className="group">
                Get Your Certificate
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/verify">
              <Button variant="outline" size="xl" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                Verify Certificate
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="font-display text-2xl font-bold text-primary-foreground">10K+</span>
              </div>
              <p className="text-sm text-primary-foreground/60">Certificates Issued</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="w-5 h-5 text-accent" />
                <span className="font-display text-2xl font-bold text-primary-foreground">8+</span>
              </div>
              <p className="text-sm text-primary-foreground/60">Domains Available</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span className="font-display text-2xl font-bold text-primary-foreground">100%</span>
              </div>
              <p className="text-sm text-primary-foreground/60">Verified</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
