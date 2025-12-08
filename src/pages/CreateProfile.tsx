import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { JobList } from '@/components/JobList';
import { AnalysisCard } from '@/components/AnalysisCard';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Job, AnalysisResult, EnhancedJob } from '@/types/job';
import {
  Search,
  MapPin,
  Globe,
  Calendar,
  Sparkles,
  X,
  Pencil,
  Check,
  ArrowLeft,
  Brain,
  Car,
  GraduationCap,
  Award,
  Loader2,
  Save,
} from 'lucide-react';

const countries = [
  { value: 'nl', label: 'Netherlands', flag: '🇳🇱' },
  { value: 'de', label: 'Germany', flag: '🇩🇪' },
  { value: 'be', label: 'Belgium', flag: '🇧🇪' },
  { value: 'gb', label: 'United Kingdom', flag: '🇬🇧' },
  { value: 'us', label: 'United States', flag: '🇺🇸' },
  { value: 'fr', label: 'France', flag: '🇫🇷' },
];

const languages = [
  { value: 'en', label: 'English' },
  { value: 'nl', label: 'Dutch' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
];

const dateOptions = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: '3days', label: 'Last 3 Days' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

interface LocationState {
  profile?: string;
  country?: string;
  language?: string;
}

export default function CreateProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { searchJobs, translateProfile, loading, translating } = useJobSearch();

  const state = location.state as LocationState | undefined;

  // Form state
  const [profile, setProfile] = useState(state?.profile || '');
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [country, setCountry] = useState(state?.country || 'nl');
  const [language, setLanguage] = useState(state?.language || 'en');
  const [datePosted, setDatePosted] = useState('all');
  const [step, setStep] = useState<'profile' | 'review' | 'results' | 'analysis'>('profile');

  // Results state
  const [jobs, setJobs] = useState<Job[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleGenerateTitles = async () => {
    if (!profile.trim()) return;

    const titles = await translateProfile({ profile, country, language });
    if (titles && titles.length > 0) {
      setJobTitles(titles);
      setStep('review');
    }
  };

  const handleRemoveTitle = (index: number) => {
    setJobTitles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(jobTitles[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      setJobTitles((prev) =>
        prev.map((title, i) => (i === editingIndex ? editValue.trim() : title))
      );
    }
    setEditingIndex(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jobTitles.length === 0) return;

    const searchResults = await searchJobs({
      query: jobTitles.join(', '),
      location: locationValue,
      country,
      language,
      date_posted: datePosted,
    });

    setJobs(searchResults);
    setStep('results');
  };

  const handleAnalyze = async () => {
    if (jobs.length === 0) return;

    setAnalyzing(true);
    setStep('analysis');

    try {
      const jobsToAnalyze = jobs.map((job) => ({
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        job_description: job.job_description,
        job_highlights: job.job_highlights,
      }));

      const { data, error } = await supabase.functions.invoke('analyze-jobs', {
        body: {
          jobs: jobsToAnalyze,
          enhanced: false,
          language,
          country,
          jobTitle: profile,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

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
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysis || !user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save questions',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await supabase.from('analysis_results').insert({
        user_id: user.id,
        analysis_data: JSON.parse(
          JSON.stringify({
            questions: analysis,
            profile,
            country,
            language,
            jobsScrapedCount: jobs.length,
            savedAt: new Date().toISOString(),
          })
        ),
      });

      toast({
        title: 'Profile saved!',
        description: `Saved questions for "${profile}" to your dashboard`,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not save questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Profile</h1>
          <p className="text-muted-foreground">
            Search for jobs, analyze requirements, and save interview questions.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Profile', 'Review', 'Results', 'Analysis'].map((label, index) => {
            const stepMap = ['profile', 'review', 'results', 'analysis'];
            const currentIndex = stepMap.indexOf(step);
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;

            return (
              <div key={label} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {label}
                </span>
                {index < 3 && <div className="w-8 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Profile Input */}
        {step === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Enter ONET-SOC Profile
              </CardTitle>
              <CardDescription>
                Enter an occupational profile and AI will generate relevant job titles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile">Profile Name</Label>
                <Input
                  id="profile"
                  placeholder="e.g. Stockers and order filler, Laborers and freight movers"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.flag} {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((l) => (
                        <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateTitles}
                className="w-full"
                disabled={translating || !profile.trim()}
              >
                {translating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Job Titles...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Job Titles
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Review Titles */}
        {step === 'review' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Review & Search
              </CardTitle>
              <CardDescription>
                Edit or remove titles before searching. Profile: "{profile}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Label>Generated Job Titles</Label>
                  <div className="flex flex-wrap gap-2">
                    {jobTitles.map((title, index) => (
                      <div key={index} className="flex items-center">
                        {editingIndex === index ? (
                          <div className="flex items-center gap-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-48"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                                if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleSaveEdit}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1.5 text-sm"
                          >
                            {title}
                            <button
                              type="button"
                              onClick={() => handleStartEdit(index)}
                              className="ml-1 hover:text-primary"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveTitle(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location (Optional)</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        placeholder="e.g. Amsterdam"
                        value={locationValue}
                        onChange={(e) => setLocationValue(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger>
                        <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.flag} {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date Posted</Label>
                    <Select value={datePosted} onValueChange={setDatePosted}>
                      <SelectTrigger>
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateOptions.map((d) => (
                          <SelectItem key={d.value} value={d.value}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('profile')}
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || jobTitles.length === 0}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Search Jobs
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results */}
        {step === 'results' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  Found {jobs.length} jobs for "{profile}"
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
                    ← Modify Search
                  </Button>
                  <Button
                    onClick={handleAnalyze}
                    className="flex-1 gap-2"
                    disabled={jobs.length === 0}
                  >
                    <Brain className="h-4 w-4" />
                    Analyze {jobs.length} Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {jobs.map((job) => (
                <Card key={job.job_id}>
                  <CardContent className="p-4">
                    <h4 className="font-medium text-foreground">{job.job_title}</h4>
                    <p className="text-sm text-muted-foreground">{job.employer_name} • {job.job_location}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Analysis */}
        {step === 'analysis' && (
          <div className="space-y-6">
            {analyzing ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Analyzing Job Listings</h3>
                  <p className="text-muted-foreground">
                    Our AI is reading through {jobs.length} job descriptions...
                  </p>
                </CardContent>
              </Card>
            ) : analysis ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      Analysis Complete
                    </CardTitle>
                    <CardDescription>
                      Analyzed {jobs.length} jobs for "{profile}"
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={() => setStep('results')} className="flex-1">
                        ← Back to Results
                      </Button>
                      <Button onClick={handleSave} className="flex-1 gap-2" disabled={saving}>
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {analysis.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{analysis.summary}</p>
                    </CardContent>
                  </Card>
                )}

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
              </>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}
