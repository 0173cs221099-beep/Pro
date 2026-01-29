import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CertificateGrid from "@/components/home/CertificateGrid";
import { supabase } from "@/integrations/supabase/client";

interface InternshipDomain {
  id: string;
  course_name: string;
  description: string;
  icon: string;
  price: number;
}

const Certificates = () => {
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

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user} />
      <main className="flex-1 pt-16">
        <div className="bg-hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Internship Domains
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Choose your internship domain and get your AICTE approved certificate
            </p>
          </div>
        </div>
        <CertificateGrid domains={domains} isLoading={isLoading} />
      </main>
      <Footer />
    </div>
  );
};

export default Certificates;
