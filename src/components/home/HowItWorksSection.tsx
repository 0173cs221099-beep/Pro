import { ClipboardList, FileCheck, CreditCard, Award, Download } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Register",
    description: "Fill your details - Name, College, and select your Internship Domain.",
  },
  {
    icon: FileCheck,
    step: "02",
    title: "Take Test",
    description: "Complete a 10-question MCQ assessment (50% passing score required).",
  },
  {
    icon: CreditCard,
    step: "03",
    title: "Pay via UPI",
    description: "Pay ₹110 via UPI and upload your payment screenshot for verification.",
  },
  {
    icon: Award,
    step: "04",
    title: "Get Certified",
    description: "Once verified, receive your AICTE approved certificate instantly.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get your internship certificate in just 4 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent" />
                </div>
              )}
              
              <div className="text-center relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-accent/10 mb-6 relative">
                  <step.icon className="w-8 h-8 text-accent" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                
                <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
