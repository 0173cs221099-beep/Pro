import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, CheckCircle, XCircle, Award, Calendar, User, GraduationCap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VerificationResult {
  full_name: string;
  college_name: string;
  internship_domain: string;
  certificate_number: string;
  certificate_issued_at: string;
  payment_status: string;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const [certificateId, setCertificateId] = useState(searchParams.get("id") || "");
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    if (idFromUrl) {
      setCertificateId(idFromUrl);
      handleVerify(null, idFromUrl);
    }
  }, [searchParams]);

  const handleVerify = async (e: React.FormEvent | null, idToVerify?: string) => {
    if (e) e.preventDefault();
    
    const searchId = idToVerify || certificateId;
    
    if (!searchId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a certificate ID",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setResult(null);
    setNotFound(false);

    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          full_name,
          college_name,
          internship_domain,
          certificate_number,
          certificate_issued_at,
          payment_status
        `)
        .eq("certificate_number", searchId.toUpperCase().trim())
        .eq("payment_status", "completed")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setResult(data as VerificationResult);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error verifying:", error);
      toast({
        title: "Verification failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="bg-hero-gradient py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Verify Certificate
            </h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">
              Enter the certificate ID to verify its authenticity
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            {/* Search Form */}
            <Card className="border-2 -mt-8 relative z-10 mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleVerify} className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Enter Certificate ID (e.g., CERT-20260127-A1B2C3D4)"
                      value={certificateId}
                      onChange={(e) => setCertificateId(e.target.value)}
                      className="pl-10 h-12"
                    />
                  </div>
                  <Button type="submit" variant="hero" size="lg" disabled={isSearching}>
                    {isSearching ? "Searching..." : "Verify"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Result - Found */}
            {result && (
              <Card className="border-2 border-success/30 bg-success/5 animate-fade-in">
                <CardHeader className="text-center border-b border-success/20">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <CardTitle className="font-display text-xl text-success">
                    Certificate Verified ✓
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <User className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Student Name</p>
                        <p className="font-semibold">{result.full_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <Award className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Internship Domain</p>
                        <p className="font-semibold">{result.internship_domain}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <GraduationCap className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">College</p>
                        <p className="font-semibold">{result.college_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                      <Calendar className="w-5 h-5 text-accent mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Issued Date</p>
                        <p className="font-semibold">
                          {new Date(result.certificate_issued_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-background rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Certificate ID</p>
                    <p className="font-mono font-bold text-lg text-accent">
                      {result.certificate_number}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 p-3 bg-success/10 rounded-lg">
                    <Shield className="w-5 h-5 text-success" />
                    <span className="text-success font-medium">Payment Verified</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result - Not Found */}
            {notFound && (
              <Card className="border-2 border-destructive/30 bg-destructive/5 animate-fade-in">
                <CardContent className="pt-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-destructive mb-2">
                    Certificate Not Found
                  </h3>
                  <p className="text-muted-foreground">
                    No valid certificate exists with the ID you entered. 
                    Please check the ID and try again.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Verify;
