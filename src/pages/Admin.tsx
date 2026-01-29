import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, LogOut, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  full_name: string;
  email: string;
  internship_domain: string;
  payment_status: string;
  transaction_id: string | null;
  rejection_reason: string | null;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const sessionStr = localStorage.getItem("admin_session");
    if (!sessionStr) navigate("/admin-login");
    fetchStudents();
  }, [navigate]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async () => {
    if (!selectedStudent) return;
    try {
      await supabase
        .from("students")
        .update({
          payment_status: "completed",
          payment_verified_at: new Date().toISOString(),
          rejection_reason: null,
        })
        .eq("id", selectedStudent.id);

      toast({ title: "Payment Approved" });
      setApproveOpen(false);
      fetchStudents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve payment", variant: "destructive" });
    }
  };

  const rejectPayment = async () => {
    if (!selectedStudent || !rejectionReason.trim()) {
      toast({ title: "Error", description: "Enter reason to reject", variant: "destructive" });
      return;
    }
    try {
      await supabase
        .from("students")
        .update({ payment_status: "failed", rejection_reason: rejectionReason })
        .eq("id", selectedStudent.id);

      toast({ title: "Payment Rejected" });
      setRejectOpen(false);
      setRejectionReason("");
      fetchStudents();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject payment", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-success text-success-foreground">Approved</Badge>;
      case "under_verification":
        return <Badge className="bg-warning/20 text-warning border-warning/30">Under Review</Badge>;
      case "failed":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button
          variant="destructive"
          onClick={() => {
            localStorage.removeItem("admin_session");
            navigate("/admin-login");
          }}
        >
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid gap-4">
          {students.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle>{s.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Email: {s.email}</p>
                <p>Domain: {s.internship_domain}</p>
                <p>Txn ID: {s.transaction_id || "N/A"}</p>
                <div className="mt-2">{getStatusBadge(s.payment_status)}</div>

                {/* ✅ Show Approve/Reject for under_verification */}
                {s.payment_status === "under_verification" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      className="bg-green-600"
                      onClick={() => {
                        setSelectedStudent(s);
                        setApproveOpen(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedStudent(s);
                        setRejectOpen(true);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment?</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={approvePayment}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="mt-2 mb-4">
            <input
              type="text"
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={rejectPayment}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
