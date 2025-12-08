import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { AnalysisCard } from '@/components/AnalysisCard';
import { supabase } from '@/integrations/supabase/client';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useToast } from '@/hooks/use-toast';
import { Job, AnalysisResult, EnhancedJob, SearchParams, AnalysisMetrics } from '@/types/job';
import { ArrowLeft, Brain, Car, GraduationCap, Award, Loader2, FileText, Sparkles, AlertCircle, Plus, BarChart3 } from 'lucide-react';

export default function Analysis() {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [enhancedLoading, setEnhancedLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isEnhanced, setIsEnhanced] = useState(false);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [metrics, setMetrics] = useState<AnalysisMetrics | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { loadMoreJobs, getJobDetails } = useJobSearch();

  const state = location.state as { jobs?: Job[]; country?: string; searchParams?: SearchParams } | undefined;
  const initialJobs = state?.jobs || [];
  const country = state?.country || 'nl';
  const searchParams = state?.searchParams;

  useEffect(() => {
    if (initialJobs.length === 0) {
      navigate('/results');
    } else if (allJobs.length === 0) {
      setAllJobs(initialJobs);
    }
  }, [initialJobs, navigate, allJobs.length]);

  const countQuestions = (result: AnalysisResult) => ({
    license: result.license?.questions?.length || 0,
    qualification: result.qualification?.questions?.length || 0,
    certification: result.certification?.questions?.length || 0,
  });

  const runAnalysis = async (enhanced = false, enhancedJobs?: EnhancedJob[], jobsToUse?: Job[]) => {
    const jobs = jobsToUse || allJobs;
    
    if (jobs.length === 0 && !enhancedJobs) {
      toast({
        title: 'No jobs to analyze',
        description: 'Please go back and search for jobs first',
        variant: 'destructive',
      });
      return;
    }

    const previousQuestions = analysis ? countQuestions(analysis) : undefined;

    if (enhanced) {
      setEnhancedLoading(true);
    } else {
      setLoading(true);
    }
    setAnalysis(null);

    try {
      const jobsToAnalyze = enhancedJobs || jobs.map((job) => ({
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        job_description: job.job_description,
        job_highlights: job.job_highlights,
      }));

      const { data, error } = await supabase.functions.invoke('analyze-jobs', {
        body: {
          jobs: jobsToAnalyze,
          enhanced,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      setIsEnhanced(enhanced);
      
      const newQuestions = countQuestions(data.analysis);
      setMetrics({
        totalJobsAnalyzed: jobs.length,
        basicJobsCount: enhanced ? 0 : jobs.length,
        enhancedJobsCount: enhanced ? (enhancedJobs?.length || 0) : 0,
        questionsFound: newQuestions,
        previousQuestionsFound: previousQuestions,
      });

      toast({
        title: enhanced ? 'Enhanced Analysis Complete' : 'Analysis Complete',
        description: `Analyzed ${data.jobCount} job listings${enhanced ? ' with detailed requirements' : ''}`,
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
      setEnhancedLoading(false);
    }
  };

  const runEnhancedAnalysis = async () => {
    setEnhancedLoading(true);
    
    try {
      toast({
        title: 'Fetching job details...',
        description: `Getting detailed requirements for ${allJobs.length} jobs`,
      });

      const jobIds = allJobs.map(job => job.job_id);
      
      const { data, error } = await supabase.functions.invoke('get-job-details', {
        body: { jobIds, country },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      const enhancedJobs = data.jobs as EnhancedJob[];
      
      if (enhancedJobs.length === 0) {
        throw new Error('Could not fetch detailed job data');
      }

      toast({
        title: 'Running enhanced analysis...',
        description: `Processing ${enhancedJobs.length} jobs with structured requirements`,
      });

      await runAnalysis(true, enhancedJobs);
    } catch (error) {
      console.error('Enhanced analysis error:', error);
      toast({
        title: 'Enhanced Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to run enhanced analysis',
        variant: 'destructive',
      });
      setEnhancedLoading(false);
    }
  };

  const handleLoadMoreJobs = async () => {
    if (!searchParams) {
      toast({
        title: 'Cannot load more jobs',
        description: 'Search parameters not available',
        variant: 'destructive',
      });
      return;
    }

    setLoadingMore(true);
    
    try {
      const nextPage = currentPage + 1;
      const newJobs = await loadMoreJobs(nextPage);
      
      if (newJobs.length === 0) {
        toast({
          title: 'No more jobs',
          description: 'No additional jobs found for this search',
        });
        return;
      }

      const combinedJobs = [...allJobs, ...newJobs];
      setAllJobs(combinedJobs);
      setCurrentPage(nextPage);

      toast({
        title: `${newJobs.length} more jobs loaded`,
        description: `Now analyzing ${combinedJobs.length} total jobs`,
      });

      // Re-run analysis on combined dataset
      await runAnalysis(isEnhanced, undefined, combinedJobs);
    } catch (error) {
      console.error('Load more jobs error:', error);
      toast({
        title: 'Failed to load more jobs',
        description: error instanceof Error ? error.message : 'Could not fetch additional jobs',
        variant: 'destructive',
      });
    } finally {
      setLoadingMore(false);
    }
  };

  const MetricsCard = () => {
    if (!metrics) return null;

    const getDelta = (category: 'license' | 'qualification' | 'certification') => {
      if (!metrics.previousQuestionsFound) return null;
      const delta = metrics.questionsFound[category] - metrics.previousQuestionsFound[category];
      if (delta <= 0) return null;
      return delta;
    };

    return (
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analysis Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-foreground">{metrics.totalJobsAnalyzed}</div>
              <div className="text-sm text-muted-foreground">Jobs Analyzed</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-blue-500">
                {metrics.questionsFound.license}
                {getDelta('license') && (
                  <span className="text-sm text-green-500 ml-1">+{getDelta('license')}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">License Questions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-green-500">
                {metrics.questionsFound.qualification}
                {getDelta('qualification') && (
                  <span className="text-sm text-green-500 ml-1">+{getDelta('qualification')}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Qualification Questions</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-background">
              <div className="text-2xl font-bold text-purple-500">
                {metrics.questionsFound.certification}
                {getDelta('certification') && (
                  <span className="text-sm text-green-500 ml-1">+{getDelta('certification')}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Certification Questions</div>
            </div>
          </div>
          {isEnhanced && metrics.enhancedJobsCount > 0 && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Enhanced analysis processed {metrics.enhancedJobsCount} jobs with detailed structured requirements
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/results', { state: { jobs: allJobs, searchParams } })}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Results
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            AI Job Analysis
            {isEnhanced && (
              <span className="text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Enhanced
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Analyze {allJobs.length} job listings to discover common requirements and prepare
            for interviews.
          </p>
        </div>

        {!analysis && !loading && !enhancedLoading && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Ready to Analyze</CardTitle>
              <CardDescription>
                Our AI will analyze all {allJobs.length} job descriptions to extract:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Car className="h-6 w-6 text-blue-500 shrink-0" />
                  <div>
                    <h4 className="font-medium text-foreground">License Requirements</h4>
                    <p className="text-sm text-muted-foreground">
                      Government-issued licenses (Rijbewijs, BIG, ADR)
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
                      Industry certifications (VCA, BHV, Heftruck)
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={() => runAnalysis(false)} className="w-full gap-2" size="lg">
                <Brain className="h-5 w-5" />
                Start AI Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {(loading || enhancedLoading || loadingMore) && (
          <Card className="mb-8">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground">
                {loadingMore 
                  ? 'Loading More Jobs' 
                  : enhancedLoading 
                    ? 'Running Enhanced Analysis' 
                    : 'Analyzing Job Listings'
                }
              </h3>
              <p className="text-muted-foreground">
                {loadingMore
                  ? 'Fetching additional job listings to expand your analysis...'
                  : enhancedLoading 
                    ? 'Fetching detailed job requirements for more accurate results...'
                    : `Our AI is reading through ${allJobs.length} job descriptions...`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <div className="space-y-6">
            <MetricsCard />

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

            {/* Options for expanding analysis */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Enhanced Analysis Option */}
              {!isEnhanced && (
                <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Get More Detailed Insights
                    </CardTitle>
                    <CardDescription>
                      Fetch structured job requirements for more accurate categorization.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={runEnhancedAnalysis} 
                      variant="outline"
                      className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      disabled={enhancedLoading || loadingMore}
                    >
                      {enhancedLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Run Enhanced Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Load More Jobs Option */}
              {searchParams && (
                <Card className="border-dashed border-2 border-muted-foreground/30 bg-muted/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      Analyze More Jobs
                    </CardTitle>
                    <CardDescription>
                      Load 10 more job listings and re-run analysis on the expanded dataset.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleLoadMoreJobs} 
                      variant="outline"
                      className="w-full gap-2"
                      disabled={enhancedLoading || loadingMore}
                    >
                      {loadingMore ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Load More Jobs & Re-analyze
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <Button
              onClick={() => runAnalysis(isEnhanced)}
              variant="outline"
              className="w-full gap-2"
              disabled={loading || enhancedLoading || loadingMore}
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
