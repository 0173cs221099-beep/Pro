import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

interface StudentData {
  id: string;
  full_name: string;
  internship_domain: string;
  certificate_id: string;
  test_passed: boolean;
}

const Test = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  useEffect(() => {
    const fetchData = async () => {
      if (!studentId) return;

      try {
        // Fetch student data
        const { data: student, error: studentError } = await supabase
          .from("students")
          .select("id, full_name, internship_domain, certificate_id, test_passed")
          .eq("id", studentId)
          .maybeSingle();

        if (studentError) throw studentError;
        if (!student) {
          toast({ title: "Student not found", variant: "destructive" });
          navigate("/certificates");
          return;
        }

        if (student.test_passed) {
          navigate(`/payment/${studentId}`);
          return;
        }

        setStudentData(student);

        // Fetch questions for this certificate
        const { data: questionsData, error: questionsError } = await supabase
          .from("mcq_questions")
          .select("*")
          .eq("certificate_id", student.certificate_id)
          .limit(10);

        if (questionsError) throw questionsError;
        
        // Shuffle questions
        const shuffled = (questionsData || []).sort(() => Math.random() - 0.5);
        setQuestions(shuffled.slice(0, 10));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId, navigate, toast]);

  // Timer
  useEffect(() => {
    if (testResult || isLoading) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [testResult, isLoading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Calculate score
      let correctAnswers = 0;
      questions.forEach((q) => {
        if (answers[q.id] === q.correct_option) {
          correctAnswers++;
        }
      });

      const score = correctAnswers;
      const passed = score >= 5; // 50% passing

      // Save test attempt
      await supabase.from("test_attempts").insert({
        student_id: studentId,
        score,
        total_questions: questions.length,
        passed,
        answers,
      });

      // Update student test_passed status
      if (passed) {
        await supabase
          .from("students")
          .update({ test_passed: true })
          .eq("id", studentId);
      }

      setTestResult({ score, passed });
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading test...</div>
      </div>
    );
  }

  if (testResult) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 pt-16 bg-muted/30 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4 border-2">
            <CardContent className="pt-8 text-center">
              {testResult.passed ? (
                <>
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    Congratulations!
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    You scored {testResult.score}/{questions.length} and passed the test!
                  </p>
                  <Button variant="hero" onClick={() => navigate(`/payment/${studentId}`)}>
                    Proceed to Payment
                  </Button>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-destructive" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                    Test Not Passed
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    You scored {testResult.score}/{questions.length}. You need at least 5/10 to pass.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => navigate("/certificates")}>
                      Back to Domains
                    </Button>
                    <Button variant="hero" onClick={() => window.location.reload()}>
                      Retry Test
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 bg-muted/30">
        <div className="bg-hero-gradient py-8">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/certificates")}
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Test
            </Button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-primary-foreground">
                  {studentData?.internship_domain} Assessment
                </h1>
                <p className="text-primary-foreground/80">
                  Answer 10 questions to proceed
                </p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 60 ? "bg-destructive/20 text-destructive" : "bg-primary-foreground/10 text-primary-foreground"
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Object.keys(answers).length} answered</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question Card */}
            <Card className="border-2 mb-6">
              <CardHeader>
                <CardTitle className="font-display text-lg leading-relaxed">
                  {currentQ?.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQ?.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQ?.id, value)}
                  className="space-y-3"
                >
                  {["A", "B", "C", "D"].map((option) => {
                    const optionKey = `option_${option.toLowerCase()}` as keyof Question;
                    return (
                      <div
                        key={option}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors cursor-pointer ${
                          answers[currentQ?.id] === option
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        }`}
                        onClick={() => handleAnswer(currentQ?.id, option)}
                      >
                        <RadioGroupItem value={option} id={`option-${option}`} />
                        <Label htmlFor={`option-${option}`} className="flex-1 cursor-pointer">
                          <span className="font-semibold mr-2">{option}.</span>
                          {currentQ?.[optionKey]}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>

              {currentQuestion < questions.length - 1 ? (
                <Button
                  variant="hero"
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={isSubmitting || Object.keys(answers).length < questions.length}
                >
                  {isSubmitting ? "Submitting..." : "Submit Test"}
                </Button>
              )}
            </div>

            {/* Question Navigator */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Quick Navigation</p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                      currentQuestion === index
                        ? "bg-accent text-accent-foreground"
                        : answers[q.id]
                        ? "bg-success/20 text-success"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {Object.keys(answers).length < questions.length && (
              <div className="mt-4 flex items-center gap-2 text-warning text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Answer all questions before submitting</span>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Test;
