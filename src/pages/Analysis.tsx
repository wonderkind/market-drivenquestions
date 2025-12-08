import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { AnalysisCard } from '@/components/AnalysisCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Job, AnalysisResult } from '@/types/job';
import { ArrowLeft, Brain, Car, GraduationCap, Award, Loader2, FileText } from 'lucide-react';

export default function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const jobs = (location.state as { jobs?: Job[] })?.jobs || [];

  useEffect(() => {
    if (jobs.length === 0) {
      navigate('/results');
    }
  }, [jobs, navigate]);

  const runAnalysis = async () => {
    if (jobs.length === 0) {
      toast({
        title: 'No jobs to analyze',
        description: 'Please go back and search for jobs first',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-jobs', {
        body: {
          jobs: jobs.map((job) => ({
            job_id: job.job_id,
            job_title: job.job_title,
            employer_name: job.employer_name,
            job_description: job.job_description,
          })),
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${data.jobCount} job listings`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze jobs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/results', { state: { jobs } })}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Job Analysis
          </h1>
          <p className="text-muted-foreground">
            Analyze {jobs.length} job listings to discover common requirements and prepare
            for interviews.
          </p>
        </div>

        {!analysis && !loading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ready to Analyze</CardTitle>
              <CardDescription>
                Our AI will analyze all {jobs.length} job descriptions to extract:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Car className="h-6 w-6 text-blue-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">License Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      Driving licenses and permits mentioned
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <GraduationCap className="h-6 w-6 text-green-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Qualifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Education levels and experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Award className="h-6 w-6 text-purple-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">Certifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Professional certifications required
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={runAnalysis} className="w-full gap-2" size="lg">
                <Brain className="h-5 w-5" />
                Start AI Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">Analyzing Job Listings</h3>
              <p className="text-muted-foreground">
                Our AI is reading through {jobs.length} job descriptions...
              </p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <div className="space-y-6">
            {analysis.summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{analysis.summary}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-1">
              <AnalysisCard
                title="License Questions"
                icon={<Car className="h-5 w-5 text-blue-500" />}
                questions={analysis.license?.questions || []}
                color="border-l-4 border-l-blue-500"
              />

              <AnalysisCard
                title="Qualification Questions"
                icon={<GraduationCap className="h-5 w-5 text-green-500" />}
                questions={analysis.qualification?.questions || []}
                color="border-l-4 border-l-green-500"
              />

              <AnalysisCard
                title="Certification Questions"
                icon={<Award className="h-5 w-5 text-purple-500" />}
                questions={analysis.certification?.questions || []}
                color="border-l-4 border-l-purple-500"
              />
            </div>

            <Button
              onClick={runAnalysis}
              variant="outline"
              className="w-full gap-2"
            >
              <Brain className="h-4 w-4" />
              Run Analysis Again
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
