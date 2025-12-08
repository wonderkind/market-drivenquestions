import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, SavedQuestionsData } from '@/types/job';
import {
  ArrowLeft,
  Brain,
  Car,
  GraduationCap,
  Award,
  Globe,
  Languages,
  Calendar,
  Briefcase,
  Pencil,
  Check,
  X,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';

interface AnalysisQuestionLocal {
  question: string;
  mentions: number;
  certainty: string;
  relevantQuote?: string;
  quotes?: string[];
  sources: string[];
}

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
  fr: { label: 'France', flag: '🇫🇷' },
};

const languageLabels: Record<string, string> = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French',
};

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    category: 'license' | 'qualification' | 'certification';
    index: number;
  } | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && id) {
      fetchProfile();
    }
  }, [user, id]);

  const fetchProfile = async () => {
    if (!user || !id) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Type assertion for the JSON data
      const analysisData = data.analysis_data as unknown as SavedQuestionsData;
      setProfile({
        id: data.id,
        analysis_data: analysisData,
        created_at: data.created_at,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (
    category: 'license' | 'qualification' | 'certification',
    index: number,
    currentValue: string
  ) => {
    setEditingQuestion({ category, index });
    setEditValue(currentValue);
  };

  const handleSaveEdit = () => {
    if (!editingQuestion || !profile) return;

    const { category, index } = editingQuestion;
    const updatedProfile = { ...profile };
    const questions = updatedProfile.analysis_data.questions[category]?.questions;

    if (questions && questions[index]) {
      questions[index].question = editValue;
    }

    setProfile(updatedProfile);
    setEditingQuestion(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditValue('');
  };

  const handleDeleteQuestion = (
    category: 'license' | 'qualification' | 'certification',
    index: number
  ) => {
    if (!profile) return;

    const updatedProfile = { ...profile };
    const questions = updatedProfile.analysis_data.questions[category]?.questions;

    if (questions) {
      questions.splice(index, 1);
    }

    setProfile(updatedProfile);
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('analysis_results')
        .update({
          analysis_data: JSON.parse(JSON.stringify(profile.analysis_data)),
        })
        .eq('id', profile.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Saved!',
        description: 'Profile questions updated successfully',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const renderQuestionList = (
    category: 'license' | 'qualification' | 'certification',
    title: string,
    icon: React.ReactNode,
    borderColor: string
  ) => {
    const questions = profile?.analysis_data.questions[category]?.questions || [];

    return (
      <Card className={borderColor}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{questions.length} questions</CardDescription>
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No questions in this category</p>
          ) : (
            <div className="space-y-4">
              {questions.map((q: AnalysisQuestionLocal, index: number) => (
                <div key={index} className="p-4 rounded-lg bg-muted/50">
                  {editingQuestion?.category === category && editingQuestion?.index === index ? (
                    <div className="space-y-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">{q.question}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => handleStartEdit(category, index, q.question)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteQuestion(category, index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <p>
                          <span className="font-medium">Certainty:</span> {q.certainty} •{' '}
                          <span className="font-medium">Mentions:</span> {q.mentions}
                        </p>
                        {(q.relevantQuote || (q.quotes && q.quotes[0])) && (
                          <p className="mt-1 italic">"{q.relevantQuote || q.quotes?.[0]}"</p>
                        )}
                        {q.sources && q.sources.length > 0 && (
                          <p className="mt-1">Sources: {q.sources.join(', ')}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Profile not found</p>
        </main>
      </div>
    );
  }

  const { analysis_data } = profile;
  const countryInfo = countries[analysis_data.country] || {
    label: analysis_data.country.toUpperCase(),
    flag: '🌍',
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-6 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Profile Header */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Brain className="h-6 w-6 text-primary" />
              {analysis_data.profile}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-4 mt-2">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {countryInfo.flag} {countryInfo.label}
              </span>
              <span className="flex items-center gap-1">
                <Languages className="h-4 w-4" />
                {languageLabels[analysis_data.language] || analysis_data.language}
              </span>
              {analysis_data.jobsScrapedCount && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-4 w-4" />
                  {analysis_data.jobsScrapedCount} jobs analyzed
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Saved {new Date(analysis_data.savedAt).toLocaleDateString()}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Questions by Category */}
        <div className="space-y-6">
          {renderQuestionList(
            'license',
            'License Questions',
            <Car className="h-5 w-5 text-blue-500" />,
            'border-l-4 border-l-blue-500'
          )}

          {renderQuestionList(
            'qualification',
            'Qualification Questions',
            <GraduationCap className="h-5 w-5 text-green-500" />,
            'border-l-4 border-l-green-500'
          )}

          {renderQuestionList(
            'certification',
            'Certification Questions',
            <Award className="h-5 w-5 text-purple-500" />,
            'border-l-4 border-l-purple-500'
          )}
        </div>
      </main>
    </div>
  );
}
