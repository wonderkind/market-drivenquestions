import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { AnalysisCard } from '@/components/AnalysisCard';
import { useJobSearch } from '@/hooks/useJobSearch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Job, AnalysisResult } from '@/types/job';
import { Search, MapPin, Globe, Calendar, Sparkles, X, Pencil, Check, ArrowLeft, Brain, Car, GraduationCap, Award, Loader2, Save, Briefcase, Building, Clock, ExternalLink, Languages, Zap, Navigation } from 'lucide-react';
const countries = [{
  value: 'nl',
  label: 'Netherlands',
  flag: '🇳🇱'
}, {
  value: 'de',
  label: 'Germany',
  flag: '🇩🇪'
}, {
  value: 'be',
  label: 'Belgium',
  flag: '🇧🇪'
}, {
  value: 'gb',
  label: 'United Kingdom',
  flag: '🇬🇧'
}, {
  value: 'us',
  label: 'United States',
  flag: '🇺🇸'
}, {
  value: 'fr',
  label: 'France',
  flag: '🇫🇷'
}];
const languages = [{
  value: 'en',
  label: 'English'
}, {
  value: 'nl',
  label: 'Dutch'
}, {
  value: 'de',
  label: 'German'
}, {
  value: 'fr',
  label: 'French'
}];
const dateOptions = [{
  value: 'all',
  label: 'All Time'
}, {
  value: 'today',
  label: 'Today'
}, {
  value: '3days',
  label: 'Last 3 Days'
}, {
  value: 'week',
  label: 'This Week'
}, {
  value: 'month',
  label: 'This Month'
}];
interface LocationState {
  profile?: string;
  country?: string;
  language?: string;
  profileId?: string;
}
export default function CreateProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const {
    searchJobs,
    translateProfile,
    getJobDetails,
    loading,
    translating
  } = useJobSearch();
  const state = location.state as LocationState | undefined;
  const isReanalyseMode = !!state?.profileId;
  const hasPrefilledData = !!(state?.profile || state?.country || state?.language);

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
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const getCountryInfo = (code: string) => countries.find(c => c.value === code) || {
    value: code,
    label: code.toUpperCase(),
    flag: '🌍'
  };
  const getLanguageLabel = (code: string) => languages.find(l => l.value === code)?.label || code.toUpperCase();
  const handleGenerateTitles = async () => {
    if (!profile.trim()) return;
    const titles = await translateProfile({
      profile,
      country,
      language
    });
    if (titles && titles.length > 0) {
      setJobTitles(titles);
      setStep('review');
    }
  };
  const handleRemoveTitle = (index: number) => {
    setJobTitles(prev => prev.filter((_, i) => i !== index));
  };
  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(jobTitles[index]);
  };
  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      setJobTitles(prev => prev.map((title, i) => i === editingIndex ? editValue.trim() : title));
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
      jobTitles,
      location: locationValue,
      country,
      language,
      date_posted: datePosted
    });
    setJobs(searchResults);
    setStep('results');
  };
  const handleEnhanceWithDetails = async () => {
    if (jobs.length === 0) return;
    setEnhancing(true);
    try {
      const jobIds = jobs.map(job => job.job_id);
      const enhancedJobs = await getJobDetails(jobIds, country);
      if (enhancedJobs.length > 0) {
        // Merge enhanced data back into jobs
        setJobs(prevJobs => prevJobs.map(job => {
          const enhanced = enhancedJobs.find(e => e.job_id === job.job_id);
          if (enhanced) {
            return {
              ...job,
              job_highlights: enhanced.job_highlights
            };
          }
          return job;
        }));
        setEnhanced(true);
        toast({
          title: 'Jobs Enhanced',
          description: `Fetched detailed highlights for ${enhancedJobs.length} jobs`
        });
      }
    } catch (error) {
      console.error('Enhance error:', error);
      toast({
        title: 'Enhancement Failed',
        description: 'Failed to fetch enhanced job details',
        variant: 'destructive'
      });
    } finally {
      setEnhancing(false);
    }
  };
  const handleAnalyze = async () => {
    if (jobs.length === 0) return;
    setAnalyzing(true);
    setStep('analysis');
    try {
      const jobsToAnalyze = jobs.map(job => ({
        job_id: job.job_id,
        job_title: job.job_title,
        employer_name: job.employer_name,
        job_description: job.job_description,
        job_highlights: job.job_highlights
      }));
      const {
        data,
        error
      } = await supabase.functions.invoke('analyze-jobs', {
        body: {
          jobs: jobsToAnalyze,
          enhanced: enhanced,
          language,
          country,
          jobTitle: profile
        }
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: `Analyzed ${data.jobCount} job listings${enhanced ? ' with enhanced data' : ''}`
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze jobs',
        variant: 'destructive'
      });
    } finally {
      setAnalyzing(false);
    }
  };
  const handleAnswerChange = (category: 'license' | 'qualification' | 'certification', index: number, answer: string | string[] | number | boolean) => {
    if (!analysis) return;
    const updatedAnalysis = {
      ...analysis
    };
    const questions = updatedAnalysis[category]?.questions;
    if (questions && questions[index]) {
      questions[index].userAnswer = answer;
    }
    setAnalysis(updatedAnalysis);
  };
  const handleSave = async () => {
    if (!analysis || !user) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save questions',
        variant: 'destructive'
      });
      return;
    }
    setSaving(true);
    try {
      const analysisData = JSON.parse(JSON.stringify({
        questions: analysis,
        profile,
        country,
        language,
        jobsScrapedCount: jobs.length,
        savedAt: new Date().toISOString()
      }));
      if (isReanalyseMode && state?.profileId) {
        // Update existing profile
        const {
          error
        } = await supabase.from('analysis_results').update({
          analysis_data: analysisData
        }).eq('id', state.profileId).eq('user_id', user.id);
        if (error) throw error;
        toast({
          title: 'Profile updated!',
          description: `Updated questions for "${profile}"`
        });
      } else {
        // Insert new profile
        const {
          error
        } = await supabase.from('analysis_results').insert({
          user_id: user.id,
          analysis_data: analysisData
        });
        if (error) throw error;
        toast({
          title: 'Profile saved!',
          description: `Saved questions for "${profile}" to your dashboard`
        });
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Save error:', error);

      // Check for unique constraint violation (duplicate profile)
      if (error?.code === '23505') {
        toast({
          title: 'Profile already exists',
          description: `A profile for "${profile}" in ${getCountryInfo(country).label} (${getLanguageLabel(language)}) already exists. Use "Re-analyse" from the dashboard to update it.`,
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Failed to save',
          description: 'Could not save questions. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setSaving(false);
    }
  };
  const countryInfo = getCountryInfo(country);
  return <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        

        {/* Pre-filled Context Banner */}
        {hasPrefilledData && step === 'profile' && <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Pre-filled from Dashboard</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {state?.profile && <Badge variant="secondary" className="gap-1 text-primary-foreground">
                    <Briefcase className="h-3 w-3" />
                    {state.profile}
                  </Badge>}
                {state?.country && <Badge variant="secondary" className="gap-1 text-primary-foreground">
                    <Globe className="h-3 w-3" />
                    {getCountryInfo(state.country).flag} {getCountryInfo(state.country).label}
                  </Badge>}
                {state?.language && <Badge variant="secondary" className="gap-1 text-primary-foreground">
                    <Languages className="h-3 w-3" />
                    {getLanguageLabel(state.language)}
                  </Badge>}
              </div>
            </CardContent>
          </Card>}

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {['Profile', 'Review', 'Results', 'Analysis'].map((label, index) => {
          const stepMap = ['profile', 'review', 'results', 'analysis'];
          const currentIndex = stepMap.indexOf(step);
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          return <div key={label} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {index + 1}
                </div>
                <span className={`text-sm ${isActive ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {label}
                </span>
                {index < 3 && <div className="w-8 h-px bg-border" />}
              </div>;
        })}
        </div>

        {/* Step 1: Profile Input */}
        {step === 'profile' && <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">Search relevant jobs in your ONET-SOC Profile<Sparkles className="h-5 w-5 text-primary" />
                ​
              </CardTitle>
              <CardDescription className="mx-0 my-[10px]">
                Enter an occupational profile and AI will generate relevant job titles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile">Profile Name</Label>
                <Input id="profile" placeholder="e.g. Stockers and order filler, Laborers and freight movers" value={profile} onChange={e => setProfile(e.target.value)} />
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
                      {countries.map(c => <SelectItem key={c.value} value={c.value}>
                          {c.flag} {c.label}
                        </SelectItem>)}
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
                      {languages.map(l => <SelectItem key={l.value} value={l.value}>
                          {l.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleGenerateTitles} disabled={translating || !profile.trim()} className="w-full">
                {translating ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Job Titles...
                  </> : <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Get best job titles
                  </>}
              </Button>
            </CardContent>
          </Card>}

        {/* Step 2: Review Titles - AI Style */}
        {step === 'review' && <div className="space-y-6">
            {/* AI Generated Titles Card */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <span>AI Generated Job Titles</span>
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-3 w-3" />
                    Powered by AI
                  </span>
                  Based on profile: "{profile}"
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                <div className="flex flex-wrap gap-3">
                  {jobTitles.map((title, index) => <div key={index} className="group">
                      {editingIndex === index ? <div className="flex items-center gap-1 p-1 rounded-lg bg-background border border-primary/30">
                          <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-8 w-48 border-0 focus-visible:ring-0" autoFocus onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveEdit();
                    }
                    if (e.key === 'Escape') {
                      handleCancelEdit();
                    }
                  }} />
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={handleSaveEdit}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div> : <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200">
                          <Sparkles className="h-4 w-4 text-primary/60" />
                          <span className="font-medium text-foreground">{title}</span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={() => handleStartEdit(index)} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-primary">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => handleRemoveTitle(index)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>}
                    </div>)}
                </div>
                {jobTitles.length === 0 && <p className="text-sm text-destructive">Add at least one job title to search</p>}
              </CardContent>
            </Card>

            {/* Search Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Search Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location (Optional)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input id="location" placeholder="e.g. Amsterdam" value={locationValue} onChange={e => setLocationValue(e.target.value)} className="pl-9" />
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
                          {countries.map(c => <SelectItem key={c.value} value={c.value}>
                              {c.flag} {c.label}
                            </SelectItem>)}
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
                          {dateOptions.map(d => <SelectItem key={d.value} value={d.value}>
                              {d.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setStep('profile')} className="flex-1">
                      ← Back
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading || jobTitles.length === 0}>
                      {loading ? <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Searching...
                        </> : <>
                          <Search className="mr-2 h-4 w-4" />
                          Search Jobs
                        </>}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>}

        {/* Step 3: Results */}
        {step === 'results' && <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" />
                  Search Results
                  {enhanced && <Badge variant="secondary" className="ml-2 gap-1">
                      <Zap className="h-3 w-3" />
                      Enhanced
                    </Badge>}
                </CardTitle>
                <CardDescription>
                  Found {jobs.length} jobs for "{profile}" in {countryInfo.flag} {countryInfo.label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!enhanced && jobs.length > 0 && <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-start gap-3">
                      <Zap className="h-5 w-5 text-primary mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground mb-1">Enhance with Job Details</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Fetch detailed qualifications and responsibilities for more accurate analysis
                        </p>
                        <Button onClick={handleEnhanceWithDetails} variant="outline" size="sm" disabled={enhancing} className="gap-2">
                          {enhancing ? <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enhancing...
                            </> : <>
                              <Zap className="h-4 w-4" />
                              Enhance {jobs.length} Jobs
                            </>}
                        </Button>
                      </div>
                    </div>
                  </div>}
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setStep('review')} className="flex-1">
                    ← Modify Search
                  </Button>
                  <Button onClick={handleAnalyze} className="flex-1 gap-2" disabled={jobs.length === 0 || enhancing}>
                    <Navigation className="h-4 w-4" />
                    Analyze {jobs.length} Jobs
                  </Button>
                </div>
              </CardContent>
            </Card>

            {jobs.length === 0 ? <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search terms or selecting a different country
                  </p>
                  <Button variant="outline" onClick={() => setStep('review')}>
                    Modify Search
                  </Button>
                </CardContent>
              </Card> : <div className="space-y-4">
                {jobs.map(job => <Card key={job.job_id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          {job.employer_logo ? <img src={job.employer_logo} alt={job.employer_name} className="w-12 h-12 rounded-lg object-contain bg-muted p-1" /> : <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                              <Building className="h-6 w-6 text-muted-foreground" />
                            </div>}
                          <div>
                            <h4 className="font-medium text-foreground">{job.job_title}</h4>
                            <p className="text-sm text-muted-foreground">{job.employer_name}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {job.job_location}
                              </span>
                              {job.job_employment_type && <Badge variant="secondary" className="text-xs text-primary-foreground">
                                  {job.job_employment_type}
                                </Badge>}
                              {job.job_posted_at && <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {job.job_posted_at}
                                </span>}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" asChild>
                          <a href={job.job_apply_link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      {job.job_description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                          {job.job_description.slice(0, 200)}...
                        </p>}
                    </CardContent>
                  </Card>)}
              </div>}
          </div>}

        {/* Step 4: Analysis */}
        {step === 'analysis' && <div className="space-y-6">
            {analyzing ? <Card>
                <CardContent className="py-12 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground">Analyzing Job Listings</h3>
                  <p className="text-muted-foreground">
                    Our AI is reading through {jobs.length} job descriptions...
                  </p>
                </CardContent>
              </Card> : analysis ? <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-primary" />
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
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isReanalyseMode ? 'Update Profile' : 'Save Profile'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {analysis.summary && <Card>
                    <CardHeader>
                      <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{analysis.summary}</p>
                    </CardContent>
                  </Card>}

                <AnalysisCard title="License Questions" icon={<Car className="h-5 w-5 text-blue-500" />} questions={analysis.license?.questions || []} color="border-l-4 border-l-blue-500" onAnswerChange={(idx, val) => handleAnswerChange('license', idx, val)} />

                <AnalysisCard title="Qualification Questions" icon={<GraduationCap className="h-5 w-5 text-green-500" />} questions={analysis.qualification?.questions || []} color="border-l-4 border-l-green-500" onAnswerChange={(idx, val) => handleAnswerChange('qualification', idx, val)} />

                <AnalysisCard title="Certification Questions" icon={<Award className="h-5 w-5 text-purple-500" />} questions={analysis.certification?.questions || []} color="border-l-4 border-l-purple-500" onAnswerChange={(idx, val) => handleAnswerChange('certification', idx, val)} />
              </> : null}
          </div>}
      </main>
    </div>;
}