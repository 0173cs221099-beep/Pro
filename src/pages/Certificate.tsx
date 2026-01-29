import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Download, Share2, CheckCircle, ArrowLeft } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CertificateData {
  id: string;
  full_name: string;
  college_name: string;
  internship_domain: string;
  certificate_number: string;
  certificate_issued_at: string;
  completion_date: string;
  payment_status: string;
}

const Certificate = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const verificationUrl = `${window.location.origin}/verify?id=${certificateData?.certificate_number}`;

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!studentId) return;

      try {
        const { data, error } = await supabase
          .from("students")
          .select(`
            id,
            full_name,
            college_name,
            internship_domain,
            certificate_number,
            certificate_issued_at,
            completion_date,
            payment_status
          `)
          .eq("id", studentId)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          toast({ title: "Certificate not found", variant: "destructive" });
          navigate("/");
          return;
        }

        if (data.payment_status !== "completed") {
          toast({ title: "Payment required", variant: "destructive" });
          navigate(`/payment/${studentId}`);
          return;
        }

        setCertificateData(data as CertificateData);
      } catch (error) {
        console.error("Error:", error);
        toast({ title: "Error loading certificate", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [studentId, navigate, toast]);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${certificateData?.certificate_number}.pdf`);
      
      toast({
        title: "Certificate Downloaded!",
        description: "Your certificate has been saved as PDF.",
      });
    } catch (error) {
      console.error("Error downloading:", error);
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading certificate...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />
      <main className="flex-1 pt-16">
        <div className="bg-success-gradient py-12">
          <div className="container mx-auto px-4 text-center">
            <CheckCircle className="w-16 h-16 text-success-foreground mx-auto mb-4" />
            <h1 className="font-display text-3xl font-bold text-success-foreground mb-2">
              Certificate Generated!
            </h1>
            <p className="text-success-foreground/80">
              Your internship certificate is ready to download
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Button variant="hero" size="lg" onClick={handleDownload} disabled={isDownloading}>
              <Download className="w-5 h-5 mr-2" />
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <Link to="/">
              <Button variant="outline" size="lg">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          {/* Certificate Preview */}
          <div className="overflow-x-auto pb-8">
            <div 
              ref={certificateRef}
              className="min-w-[1000px] mx-auto bg-white shadow-2xl"
              style={{ aspectRatio: "1.414/1", maxWidth: "1000px" }}
            >
              {/* Certificate Design */}
              <div className="relative w-full h-full p-8">
                {/* Border */}
                <div className="absolute inset-4 border-4 border-primary rounded-lg" />
                <div className="absolute inset-6 border-2 border-accent/30 rounded-lg" />
                
                {/* Content */}
                <div className="relative h-full flex flex-col items-center justify-between py-8 px-12">
                  {/* Header */}
                  <div className="text-center w-full">
                    {/* Certificate ID at top right */}
                    <div className="absolute top-12 right-16 text-right">
                      <p className="text-xs text-muted-foreground">Certificate ID</p>
                      <p className="font-mono font-bold text-primary text-sm">
                        {certificateData?.certificate_number}
                      </p>
                    </div>
                    
                    {/* Logos */}
                    <div className="flex items-center justify-center gap-8 mb-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-1">
                          <span className="text-primary-foreground font-bold text-xl">CP</span>
                        </div>
                        <p className="text-xs text-muted-foreground">CertifyPro</p>
                      </div>
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-1">
                          <span className="text-accent font-bold text-sm">AICTE</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-primary mb-2 tracking-wide">
                      CERTIFICATE
                    </h1>
                    <h2 className="font-display text-2xl text-primary/80 mb-1">
                      OF INTERNSHIP COMPLETION
                    </h2>
                    <div className="w-32 h-1 bg-accent mx-auto mt-4" />
                  </div>

                  {/* Main Content */}
                  <div className="text-center flex-1 flex flex-col justify-center py-8">
                    <p className="text-lg text-muted-foreground mb-4">
                      This is to certify that
                    </p>
                    <h3 className="font-display text-4xl font-bold text-primary mb-4 border-b-2 border-accent pb-2 inline-block mx-auto px-8">
                      {certificateData?.full_name}
                    </h3>
                    <p className="text-lg text-muted-foreground mb-4">
                      from <span className="font-semibold text-foreground">{certificateData?.college_name}</span>
                    </p>
                    <p className="text-lg text-muted-foreground mb-2">
                      has successfully completed the internship program in
                    </p>
                    <h4 className="font-display text-2xl font-bold text-accent mb-6">
                      {certificateData?.internship_domain}
                    </h4>
                    <p className="text-muted-foreground">
                      Completed on: <span className="font-semibold">{formatDate(certificateData?.completion_date || certificateData?.certificate_issued_at || "")}</span>
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="w-full">
                    <div className="flex items-end justify-between">
                      {/* QR Code */}
                      <div className="text-center">
                        <QRCodeSVG 
                          value={verificationUrl}
                          size={80}
                          level="M"
                          className="mx-auto mb-2"
                        />
                        <p className="text-xs text-muted-foreground">Scan to Verify</p>
                      </div>
                      
                      {/* Signature */}
                      <div className="text-center">
                        <div className="w-40 border-b-2 border-primary mb-2" />
                        <p className="font-semibold text-primary">Managing Director</p>
                        <p className="text-xs text-muted-foreground">CertifyPro</p>
                      </div>
                      
                      {/* Issue Date */}
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Issue Date</p>
                        <p className="font-semibold text-primary">
                          {formatDate(certificateData?.certificate_issued_at || "")}
                        </p>
                      </div>
                    </div>
                    
                    {/* Website */}
                    <div className="text-center mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Verify at: <span className="text-accent font-medium">certifypro.com/verify</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Info */}
          <div className="max-w-xl mx-auto text-center p-6 bg-card rounded-xl border border-border">
            <h3 className="font-display font-semibold mb-2">Certificate Verification</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This certificate can be verified by scanning the QR code or visiting our verification page.
            </p>
            <Link to="/verify">
              <Button variant="outline" size="sm">
                Go to Verification Page
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Certificate;
