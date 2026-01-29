import { CheckCircle, Award, Zap, Shield, Download, QrCode } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Get your certificate immediately after payment - no waiting, no delays.",
  },
  {
    icon: Shield,
    title: "AICTE Approved",
    description: "Officially recognized certificates that add value to your resume and career.",
  },
  {
    icon: QrCode,
    title: "QR Verification",
    description: "Each certificate has a unique QR code for instant authenticity verification.",
  },
  {
    icon: Download,
    title: "PDF Download",
    description: "Download your professional certificate as a high-quality PDF document.",
  },
  {
    icon: Award,
    title: "Professional Design",
    description: "Elegant certificate design with your details, logos, and official signatures.",
  },
  {
    icon: CheckCircle,
    title: "Affordable Price",
    description: "Get certified for just ₹110 - invest in your career without breaking the bank.",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose CertifyPro?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We make internship certification simple, affordable, and credible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex gap-4 p-6 rounded-xl bg-card border border-border hover:border-accent/30 transition-colors card-hover"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <benefit.icon className="w-6 h-6 text-accent" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
