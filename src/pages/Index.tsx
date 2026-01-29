import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CertificateGrid from "@/components/home/CertificateGrid";
import BenefitsSection from "@/components/home/BenefitsSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { supabase } from "@/integrations/supabase/client";

interface InternshipDomain {
  id: string;
  course_name: string;
  description: string;
  icon: string;
  price: number;
}

const Index = () => {
  const [domains, setDomains] = useState<InternshipDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user?.email ? { email: session.user.email } : null);
    });

    const fetchDomains = async () => {
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("id, course_name, description, icon, price")
          .eq("is_active", true);

        if (error) throw error;
        setDomains(data || []);
      } catch (error) {
        console.error("Error fetching domains:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomains();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 pt-16">
        <HeroSection />
        <CertificateGrid domains={domains} isLoading={isLoading} />
        <HowItWorksSection />
        <BenefitsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
