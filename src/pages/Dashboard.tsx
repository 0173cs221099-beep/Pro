import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Award, CreditCard, Download, ArrowRight, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";

interface StudentApplication {
  id: string;
  full_name: string;
  payment_status: string;
  certificate_number: string | null;
  internship_domain: string | null;
  completion_date: string | null;
  created_at: string;
  test_passed: boolean;
  certificates: {
    course_name: string;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser({ email: session.user.email || "", id: session.user.id });
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
        return;
      }
      setUser({ email: session.user.email || "", id: session.user.id });
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchApplications = async () => {
      try {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            full_name,
            payment_status,
            certificate_number,
            internship_domain,
            completion_date,
            created_at,
            test_passed,
            certificates (
              course_name
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setApplications((data || []) as unknown as StudentApplication[]);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  const getStatusBadge = (paymentStatus: string, certificateNumber: string | null, testPassed?: boolean) => {
    if (paymentStatus === "under_verification") {
      return <Badge className="bg-warning/20 text-warning border-warning/30">Under Review</Badge>;
    }
    if (paymentStatus === "failed") {
      return <Badge variant="destructive">Payment Rejected</Badge>;
    }
    if (paymentStatus !== "completed") {
      if (testPassed === false) {
        return <Badge variant="outline">Test Pending</Badge>;
      }
      return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">Payment Pending</Badge>;
    }
    if (certificateNumber) {
      return <Badge className="bg-success text-success-foreground">Certified</Badge>;
    }
    return <Badge variant="secondary">Processing</Badge>;
  };

  const getActionButton = (app: StudentApplication) => {
    if (app.payment_status === "under_verification") {
      return (
        <Button variant="outline" size="sm" disabled>
          <Clock className="w-4 h-4 mr-2" />
          Under Review
        </Button>
      );
    }
    if (app.payment_status === "failed") {
      return (
        <Link to={`/payment/${app.id}`}>
          <Button variant="hero" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Retry Payment
          </Button>
        </Link>
      );
    }
    if (app.payment_status !== "completed") {
      // Check if test is passed
      const testPassed = (app as any).test_passed;
      if (!testPassed) {
        return (
          <Link to={`/test/${app.id}`}>
            <Button variant="hero" size="sm">
              <ArrowRight className="w-4 h-4 mr-2" />
              Take Test
            </Button>
          </Link>
        );
      }
      return (
        <Link to={`/payment/${app.id}`}>
          <Button variant="hero" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Pay Now
          </Button>
        </Link>
      );
    }
    if (app.certificate_number) {
      return (
        <Link to={`/certificate/${app.id}`}>
          <Button variant="success" size="sm">
            <Download className="w-4 h-4 mr-2" />
            View Certificate
          </Button>
        </Link>
      );
    }
    return (
      <Button variant="outline" size="sm" disabled>
        <Clock className="w-4 h-4 mr-2" />
        Processing
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const certifiedCount = applications.filter(a => a.certificate_number).length;
  const pendingCount = applications.filter(a => a.payment_status !== "completed").length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header user={user ? { email: user.email } : null} />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <h1 className="font-display text-3xl font-bold text-primary-foreground mb-2">
              Student Dashboard
            </h1>
            <p className="text-primary-foreground/80">
              Welcome back! Manage your internship certificates here.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Award className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{applications.length}</p>
                    <p className="text-sm text-muted-foreground">Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{certifiedCount}</p>
                    <p className="text-sm text-muted-foreground">Certified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-sm text-muted-foreground">Pending Payment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display">My Certificates</CardTitle>
                <CardDescription>Track your internship certificate applications</CardDescription>
              </div>
              <Link to="/certificates">
                <Button variant="hero" size="sm">
                  <Award className="w-4 h-4 mr-2" />
                  New Certificate
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {applications.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">No certificates yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your internship certificate journey today!
                  </p>
                  <Link to="/certificates">
                    <Button variant="hero">
                      Browse Internship Domains
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border hover:border-accent/30 transition-colors gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{app.internship_domain || app.certificates.course_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Applied on {new Date(app.created_at).toLocaleDateString()}
                          </p>
                          {app.completion_date && (
                            <p className="text-sm text-muted-foreground">
                              Completed: {new Date(app.completion_date).toLocaleDateString()}
                            </p>
                          )}
                          {app.certificate_number && (
                            <p className="text-xs font-mono text-accent">
                              ID: {app.certificate_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-16 md:ml-0">
                        {getStatusBadge(app.payment_status, app.certificate_number, app.test_passed)}
                        {getActionButton(app)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
