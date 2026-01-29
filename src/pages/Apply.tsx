import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Phone, Building, GraduationCap, Calendar, IndianRupee, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InternshipDomain {
  id: string;
  course_name: string;
  description: string;
  price: number;
}

const branches = ["CSE", "IT", "ECE", "EEE", "ME", "CE", "Other"] as const;
const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"] as const;

const Apply = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [domain, setDomain] = useState<InternshipDomain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    collegeName: "",
    branch: "" as typeof branches[number] | "",
    year: "" as typeof years[number] | "",
    completionDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ email: session.user.email || "", id: session.user.id });
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      } else {
        setUser(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({ email: session.user.email || "", id: session.user.id });
        setFormData(prev => ({ ...prev, email: session.user.email || "" }));
      }
    });

    const fetchDomain = async () => {
      if (!certificateId) return;
      
      try {
        const { data, error } = await supabase
          .from("certificates")
          .select("id, course_name, description, price")
          .eq("id", certificateId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({
            title: "Domain not found",
            description: "The internship domain you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate("/certificates");
          return;
        }
        setDomain(data);
      } catch (error) {
        console.error("Error fetching domain:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDomain();

    return () => subscription.unsubscribe();
  }, [certificateId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.email || !formData.mobile || !formData.collegeName || !formData.branch || !formData.year) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d{10}$/.test(formData.mobile)) {
      toast({
        title: "Error",
        description: "Please enter a valid 10-digit mobile number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: studentData, error } = await supabase
        .from("students")
        .insert({
          user_id: user?.id || null,
          full_name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          college_name: formData.collegeName,
          branch: formData.branch as typeof branches[number],
          year: formData.year as typeof years[number],
          certificate_id: certificateId,
          internship_domain: domain?.course_name,
          completion_date: formData.completionDate,
          payment_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Registration Successful!",
        description: "Complete the assessment test to proceed.",
      });
      
      navigate(`/test/${studentData.id}`);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user ? { email: user.email } : null} />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/certificates")}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Domains
            </Button>
            <h1 className="font-display text-3xl font-bold text-primary-foreground mb-2">
              {domain?.course_name} Internship
            </h1>
            <p className="text-primary-foreground/80">
              Fill in your details to get your internship certificate
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-display">Student Registration</CardTitle>
                  <CardDescription>
                    Please fill in your accurate details. This information will appear on your certificate.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="pl-10"
                            readOnly={!!user}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="mobile"
                            placeholder="10-digit mobile number"
                            value={formData.mobile}
                            onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="college">College Name *</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="college"
                            placeholder="Enter your college name"
                            value={formData.collegeName}
                            onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="branch">Branch *</Label>
                        <Select
                          value={formData.branch}
                          onValueChange={(value: typeof branches[number]) => setFormData({ ...formData, branch: value })}
                        >
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-muted-foreground" />
                              <SelectValue placeholder="Select your branch" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem key={branch} value={branch}>
                                {branch}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="year">Year *</Label>
                        <Select
                          value={formData.year}
                          onValueChange={(value: typeof years[number]) => setFormData({ ...formData, year: value })}
                        >
                          <SelectTrigger className="w-full">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <SelectValue placeholder="Select your year" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {years.map((year) => (
                              <SelectItem key={year} value={year}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="completionDate">Internship Completion Date *</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="completionDate"
                          type="date"
                          value={formData.completionDate}
                          onChange={(e) => setFormData({ ...formData, completionDate: e.target.value })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Processing..." : "Start Assessment Test"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-2 sticky top-24">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Award className="w-5 h-5 text-accent" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-1">
                      {domain?.course_name} Internship
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {domain?.description}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Certificate Type</span>
                      <span>Internship Completion</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Verification</span>
                      <span>QR Code + Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Format</span>
                      <span>PDF Download</span>
                    </div>
                  </div>

                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <div className="flex items-center gap-1 text-2xl font-bold text-accent">
                        <IndianRupee className="w-5 h-5" />
                        <span>{domain?.price}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Apply;
