import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { SavedQuestionsData, AnalysisQuestion } from '@/types/job';
import { Car, GraduationCap, Award, Globe, Languages, Briefcase, Wrench, FileText, CheckCircle2 } from 'lucide-react';

interface ProfileData {
  id: string;
  analysis_data: SavedQuestionsData;
  created_at: string;
}

const countries: Record<string, { label: string; flag: string }> = {
  nl: { label: 'Netherlands', flag: '🇳🇱' },
  de: { label: 'Germany', flag: '🇩🇪' },
  be: { label: 'Belgium', flag: '🇧🇪' },
  gb: { label: 'United Kingdom', flag: '🇬🇧' },
  us: { label: 'United States', flag: '🇺🇸' },
  fr: { label: 'France', flag: '🇫🇷' }
};

const languageLabels: Record<string, string> = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French'
};

export default function ProfileExport() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    try {
      const response = await supabase.functions.invoke('get-profile-export', {
        body: { profileId: id }
      });
      
      if (response.error) throw response.error;
      
      if (!response.data || !response.data.profile) {
        setError('Profile not found or not available for export');
        return;
      }
      
      setProfile(response.data.profile);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const countQuestions = () => {
    if (!profile) return 0;
    const questions = profile.analysis_data.questions;
    return (
      (questions.license?.questions?.length || 0) +
      (questions.qualification?.questions?.length || 0) +
      (questions.certification?.questions?.length || 0) +
      (questions.operationele_fit?.questions?.length || 0)
    );
  };

  const renderQuestionList = (
    category: 'license' | 'qualification' | 'certification' | 'operationele_fit',
    title: string,
    icon: React.ReactNode,
    bgColor: string,
    borderColor: string
  ) => {
    const questions = profile?.analysis_data.questions[category]?.questions || [];
    
    if (questions.length === 0) return null;
    
    return (
      <Card className={`${borderColor} overflow-hidden`}>
        <CardHeader className={`${bgColor} py-4`}>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{questions.length} questions</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-3">
            {questions.map((q: AnalysisQuestion, index: number) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{q.question}</p>
                  {q.answerType && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">
                        {q.answerType === 'yes_no' && '✓ Yes/No'}
                        {q.answerType === 'multiple_choice' && '☰ Multiple Choice'}
                        {q.answerType === 'experience' && '📊 Experience Level'}
                        {q.answerType === 'text' && '✎ Open Answer'}
                      </Badge>
                      {q.options && q.options.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Options: {q.options.map(o => o.label).join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-12 w-64 bg-muted rounded mx-auto" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mx-auto mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Profile Not Available</CardTitle>
            <CardDescription>
              {error || 'This profile export link is invalid or has expired.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { analysis_data } = profile;
  const countryInfo = countries[analysis_data.country] || { label: analysis_data.country.toUpperCase(), flag: '🌍' };
  const totalQuestions = countQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 print:bg-white">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10 print:static print:bg-white">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Profile Questions</span>
            </div>
            <button 
              onClick={() => window.print()}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors print:hidden"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Profile Info */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              {analysis_data.profile}
            </h1>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-full">
                <Globe className="h-4 w-4" />
                {countryInfo.flag} {countryInfo.label}
              </span>
              <span className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-full">
                <Languages className="h-4 w-4" />
                {languageLabels[analysis_data.language] || analysis_data.language}
              </span>
              {analysis_data.jobsScrapedCount && (
                <span className="flex items-center gap-1.5 bg-card/80 px-3 py-1.5 rounded-full">
                  <Briefcase className="h-4 w-4" />
                  Based on {analysis_data.jobsScrapedCount} job postings
                </span>
              )}
            </div>

            <div className="mt-6 p-4 bg-card rounded-lg border border-border">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
                  <p className="text-sm text-muted-foreground">Screening Questions</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Questions by Category */}
        <div className="space-y-6">
          {renderQuestionList(
            'license',
            'License Requirements',
            <Car className="h-5 w-5 text-blue-600" />,
            'bg-blue-50 dark:bg-blue-950/30',
            'border-l-4 border-l-blue-500'
          )}
          
          {renderQuestionList(
            'certification',
            'Certification Requirements',
            <Award className="h-5 w-5 text-purple-600" />,
            'bg-purple-50 dark:bg-purple-950/30',
            'border-l-4 border-l-purple-500'
          )}
          
          {renderQuestionList(
            'qualification',
            'Qualification Requirements',
            <GraduationCap className="h-5 w-5 text-green-600" />,
            'bg-green-50 dark:bg-green-950/30',
            'border-l-4 border-l-green-500'
          )}
          
          {renderQuestionList(
            'operationele_fit',
            'Operational Fit',
            <Wrench className="h-5 w-5 text-amber-600" />,
            'bg-amber-50 dark:bg-amber-950/30',
            'border-l-4 border-l-amber-500'
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground print:mt-8">
          <p>Questions generated from market analysis</p>
          <p className="mt-1">
            Profile created: {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </footer>
      </main>
    </div>
  );
}
