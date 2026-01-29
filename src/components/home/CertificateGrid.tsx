import { Link } from "react-router-dom";
import { ArrowRight, IndianRupee, Code, Terminal, BarChart, Brain, Smartphone, Cloud, Shield, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface InternshipDomain {
  id: string;
  course_name: string;
  description: string;
  icon: string;
  price: number;
}

interface CertificateGridProps {
  domains: InternshipDomain[];
  isLoading?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  terminal: Terminal,
  "bar-chart": BarChart,
  brain: Brain,
  smartphone: Smartphone,
  cloud: Cloud,
  shield: Shield,
  palette: Palette,
};

const CertificateGrid = ({ domains, isLoading }: CertificateGridProps) => {
  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="space-y-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Available Internship Domains
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Select your internship domain and receive your AICTE approved certificate instantly after payment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((domain, index) => {
            const IconComponent = iconMap[domain.icon] || Code;
            
            return (
              <Card 
                key={domain.id} 
                className="card-hover group border-2 border-transparent hover:border-accent/20 bg-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                    <IconComponent className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {domain.course_name}
                  </h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
                    {domain.description}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-1 text-foreground font-bold">
                    <IndianRupee className="w-4 h-4" />
                    <span className="text-lg">{domain.price}</span>
                  </div>
                  <Link to={`/apply/${domain.id}`}>
                    <Button variant="accentOutline" size="sm" className="group/btn">
                      Apply Now
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CertificateGrid;
