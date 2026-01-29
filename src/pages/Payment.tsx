import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, IndianRupee, Shield, Clock, Upload, Copy, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentData {
  id: string;
  full_name: string;
  email: string;
  college_name: string;
  internship_domain: string;
  certificate_id: string;
  payment_status: string;
  test_passed: boolean;
  transaction_id: string | null;
  rejection_reason: string | null;
  certificates: {
    course_name: string;
    price: number;
  };
}

const Payment = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;

      try {
        // Fetch student data
        const { data: student, error } = await supabase
          .from("students")
          .select(`
            id,
            full_name,
            email,
            college_name,
            internship_domain,
            certificate_id,
            payment_status,
            test_passed,
            transaction_id,
            rejection_reason,
            certificates (
              course_name,
              price
            )
          `)
          .eq("id", studentId)
          .maybeSingle();

        if (error) throw error;
        if (!student) {
          toast({ title: "Application not found", variant: "destructive" });
          navigate("/certificates");
          return;
        }

        // Redirect if not passed test
        if (!student.test_passed) {
          navigate(`/test/${studentId}`);
          return;
        }

        // Redirect if already completed
        if (student.payment_status === "completed") {
          navigate(`/certificate/${studentId}`);
          return;
        }

        setStudentData(student as unknown as StudentData);
        if (student.transaction_id) {
          setTransactionId(student.transaction_id);
        }

        // Fetch UPI ID
        const { data: settings } = await supabase
          .from("platform_settings")
          .select("setting_value")
          .eq("setting_key", "upi_id")
          .maybeSingle();

        if (settings) {
          setUpiId(settings.setting_value);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId, navigate, toast]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "UPI ID Copied!" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      setScreenshotFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter your transaction ID",
        variant: "destructive",
      });
      return;
    }

    if (!screenshotFile) {
      toast({
        title: "Screenshot Required",
        description: "Please upload payment screenshot",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user for folder structure
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || "anonymous";

      // Upload screenshot
      const fileExt = screenshotFile.name.split(".").pop();
      const fileName = `${userId}/${studentId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, screenshotFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(fileName);

      // Update student record
      const { error: updateError } = await supabase
        .from("students")
        .update({
          transaction_id: transactionId,
          payment_screenshot_url: urlData.publicUrl,
          payment_status: "under_verification",
          rejection_reason: null,
        })
        .eq("id", studentId);

      if (updateError) throw updateError;

      toast({
        title: "Payment Submitted!",
        description: "Your payment is under verification. You'll be notified once approved.",
      });

      // Refresh to show status
      setStudentData((prev) =>
        prev ? { ...prev, payment_status: "under_verification", transaction_id: transactionId } : null
      );
    } catch (error: any) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment",
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

  const isUnderVerification = studentData?.payment_status === "under_verification";
  const isRejected = studentData?.payment_status === "failed";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="bg-hero-gradient py-12">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-display text-3xl font-bold text-primary-foreground mb-2">
              Complete Payment
            </h1>
            <p className="text-primary-foreground/80">
              Pay via UPI and submit your transaction details
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Status Card */}
            {isUnderVerification && (
              <Card className="border-2 border-warning/30 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Payment Under Verification</h3>
                      <p className="text-sm text-muted-foreground">
                        Your payment is being reviewed. You'll be notified once approved.
                      </p>
                      <p className="text-xs font-mono text-accent mt-1">
                        Transaction ID: {studentData?.transaction_id}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isRejected && (
              <Card className="border-2 border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Payment Rejected</h3>
                      <p className="text-sm text-muted-foreground">
                        Reason: {studentData?.rejection_reason || "Please try again with correct details"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="border-2">
              <CardHeader className="text-center border-b border-border">
                <CardTitle className="font-display text-2xl">Payment Summary</CardTitle>
                <CardDescription>Review your order before payment</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student Name</span>
                    <span className="font-medium">{studentData?.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">{studentData?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Internship Domain</span>
                    <span className="font-medium">{studentData?.internship_domain}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 bg-accent/10 rounded-lg">
                  <span className="font-semibold text-lg">Total Amount</span>
                  <div className="flex items-center gap-1 text-3xl font-bold text-accent">
                    <IndianRupee className="w-6 h-6" />
                    <span>{studentData?.certificates?.price}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {!isUnderVerification && (
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="font-display">Pay via UPI</CardTitle>
                  <CardDescription>
                    Send payment to the UPI ID below and submit transaction details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* UPI ID */}
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <div className="flex gap-2">
                      <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg font-semibold text-center">
                        {upiId || "Loading..."}
                      </div>
                      <Button variant="outline" onClick={copyUpiId}>
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID / UTR Number *</Label>
                    <Input
                      id="transactionId"
                      placeholder="Enter your transaction ID"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                    />
                  </div>

                  {/* Screenshot Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="screenshot">Payment Screenshot *</Label>
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        screenshotFile ? "border-success bg-success/5" : "border-border hover:border-accent/50"
                      }`}
                    >
                      <input
                        type="file"
                        id="screenshot"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <label htmlFor="screenshot" className="cursor-pointer">
                        {screenshotFile ? (
                          <div className="flex items-center justify-center gap-2 text-success">
                            <CheckCircle className="w-5 h-5" />
                            <span>{screenshotFile.name}</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                            <p className="text-sm text-muted-foreground">
                              Click to upload payment screenshot
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 py-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-success" />
                      <span>Secure Payment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-accent" />
                      <span>Verified within 24hrs</span>
                    </div>
                  </div>

                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !transactionId || !screenshotFile}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Payment for Verification"
                    )}
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    By submitting, you confirm that you have made the payment to the above UPI ID.
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

export default Payment;
