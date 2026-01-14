import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AnalysisResult, SavedQuestionsData, AnalysisQuestion, AnswerType, AnswerOption, ExperienceConfig, PotentialQuestions } from '@/types/job';
import { QuestionAnswer } from '@/components/QuestionAnswer';
import { PotentialQuestionItem } from '@/components/PotentialQuestionItem';
import { ArrowLeft, Car, GraduationCap, Award, Globe, Languages, Calendar, Briefcase, Pencil, Check, X, Trash2, Save, Loader2, Database, Wrench, AlertTriangle, Minus, RefreshCw, Share2, Link, Copy } from 'lucide-react';
import { DeleteProfileDialog } from '@/components/DeleteProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AnalysisQuestionLocal {
  question: string;
  mentions: number;
  certainty: string;
  relevantQuote?: string;
  quotes?: string[];
  sources: string[];
  answerType?: AnswerType;
  options?: AnswerOption[];
  experienceConfig?: ExperienceConfig;
  userAnswer?: string | string[] | number | boolean;
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
  fr: { label: 'France', flag: '🇫🇷' }
};

const languageLabels: Record<string, string> = {
  en: 'English',
  nl: 'Dutch',
  de: 'German',
  fr: 'French'
};

export default function ProfileDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [potentialQuestions, setPotentialQuestions] = useState<PotentialQuestions | null>(null);
  const [relevanceThresholds, setRelevanceThresholds] = useState<{
    license: number;
    certification: number;
    qualification: number;
    operationele_fit: number;
  } | null>(null);
  const [totalJobsAnalyzed, setTotalJobsAnalyzed] = useState<number>(0);
const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<{
    category: 'license' | 'qualification' | 'certification' | 'operationele_fit';
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

      const analysisData = data.analysis_data as unknown as SavedQuestionsData;
      setProfile({
        id: data.id,
        analysis_data: analysisData,
        created_at: data.created_at
      });
      
      // Load potential questions data
      setPotentialQuestions(analysisData.potentialQuestions || null);
      setRelevanceThresholds(analysisData.relevanceThresholds || null);
      setTotalJobsAnalyzed(analysisData.totalJobsAnalyzed || analysisData.jobsScrapedCount || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (category: 'license' | 'qualification' | 'certification' | 'operationele_fit', index: number, currentValue: string) => {
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

  const handleDeleteQuestion = (category: 'license' | 'qualification' | 'certification' | 'operationele_fit', index: number) => {
    if (!profile) return;
    const updatedProfile = { ...profile };
    const questions = updatedProfile.analysis_data.questions[category]?.questions;
    if (questions) {
      questions.splice(index, 1);
    }
    setProfile(updatedProfile);
  };

  const handleRemoveToPotential = (category: 'license' | 'qualification' | 'certification' | 'operationele_fit', index: number) => {
    if (!profile) return;
    
    const questionToRemove = profile.analysis_data.questions[category]?.questions?.[index];
    if (!questionToRemove) return;
    
    // Remove from profile questions
    const updatedProfile = { ...profile };
    const questions = updatedProfile.analysis_data.questions[category]?.questions;
    if (questions) {
      questions.splice(index, 1);
    }
    setProfile(updatedProfile);
    
    // Add to potential questions
    setPotentialQuestions(prev => ({
      license: prev?.license || [],
      qualification: prev?.qualification || [],
      certification: prev?.certification || [],
      operationele_fit: prev?.operationele_fit || [],
      [category]: [...(prev?.[category] || []), questionToRemove as AnalysisQuestion]
    }));
    
    toast({
      title: 'Question moved',
      description: 'Question moved to potential relevant questions'
    });
  };

  const handleAddPotentialQuestion = (category: 'license' | 'qualification' | 'certification' | 'operationele_fit', question: AnalysisQuestion) => {
    if (!profile || !potentialQuestions) return;
    
    // Add to profile questions
    const updatedProfile = { ...profile };
    if (!updatedProfile.analysis_data.questions[category]) {
      updatedProfile.analysis_data.questions[category] = { questions: [] };
    }
    updatedProfile.analysis_data.questions[category].questions.push(question);
    setProfile(updatedProfile);
    
    // Remove from potential questions
    setPotentialQuestions(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [category]: prev[category].filter(q => q.question !== question.question)
      };
    });
    
    toast({
      title: 'Question added',
      description: `Added "${question.question.slice(0, 40)}..." to profile`
    });
  };

  const handleAnswerChange = (category: 'license' | 'qualification' | 'certification' | 'operationele_fit', index: number, answer: string | string[] | number | boolean) => {
    if (!profile) return;
    const updatedProfile = { ...profile };
    const questions = updatedProfile.analysis_data.questions[category]?.questions;
    if (questions && questions[index]) {
      questions[index].userAnswer = answer;
    }
    setProfile(updatedProfile);
  };

  const handleSave = async () => {
    if (!profile || !user) return;
    setSaving(true);
    try {
      // Update profile with potential questions data
      const updatedAnalysisData = {
        ...profile.analysis_data,
        potentialQuestions,
        relevanceThresholds,
        totalJobsAnalyzed
      };
      
      const { error } = await supabase
        .from('analysis_results')
        .update({
          analysis_data: JSON.parse(JSON.stringify(updatedAnalysisData))
        })
        .eq('id', profile.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      toast({
        title: 'Saved!',
        description: 'Profile questions updated successfully'
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to save',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!profile || !user) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('analysis_results')
        .delete()
        .eq('id', profile.id)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Profile deleted',
        description: `Deleted "${profile.analysis_data?.profile}" profile`,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: 'Could not delete profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleRegenerate = () => {
    if (!profile) return;
    navigate('/create-profile', {
      state: {
        profile: profile.analysis_data.profile,
        country: profile.analysis_data.country,
        language: profile.analysis_data.language,
        profileId: profile.id,
        regenerateMode: true,
      },
    });
  };

  const countTotalQuestions = () => {
    if (!profile) return 0;
    const questions = profile.analysis_data.questions;
    return (
      (questions.license?.questions?.length || 0) +
      (questions.qualification?.questions?.length || 0) +
      (questions.certification?.questions?.length || 0) +
      (questions.operationele_fit?.questions?.length || 0)
    );
  };

  const isProfileComplete = countTotalQuestions() > 0;

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/share/${profile?.id}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast({
        title: 'Link copied!',
        description: 'Share link copied to clipboard',
      });
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the link manually',
        variant: 'destructive',
      });
    }
  };

  const handleOpenExport = () => {
    window.open(getShareUrl(), '_blank');
  };

  const renderQuestionList = (
    category: 'license' | 'qualification' | 'certification' | 'operationele_fit',
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
                            className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            onClick={() => handleRemoveToPotential(category, index)}
                            title="Move to potential questions"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteQuestion(category, index)}
                            title="Delete permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Answer Input */}
                      {q.answerType && (
                        <QuestionAnswer
                          answerType={q.answerType}
                          options={q.options}
                          experienceConfig={q.experienceConfig}
                          value={q.userAnswer}
                          onChange={(val) => handleAnswerChange(category, index, val)}
                        />
                      )}
                      
                      <div className="mt-3 text-sm text-muted-foreground">
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

  const hasPotentialQuestions = potentialQuestions && (
    (potentialQuestions.license?.length || 0) > 0 ||
    (potentialQuestions.qualification?.length || 0) > 0 ||
    (potentialQuestions.certification?.length || 0) > 0 ||
    (potentialQuestions.operationele_fit?.length || 0) > 0
  );

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
  const countryInfo = countries[analysis_data.country] || { label: analysis_data.country.toUpperCase(), flag: '🌍' };

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
              <Database className="h-6 w-6 text-primary" />
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
<CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            <Button onClick={handleRegenerate} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
            
            {/* Export/Share Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  disabled={!isProfileComplete}
                  title={!isProfileComplete ? 'Add questions to enable export' : 'Share profile questions'}
                >
                  <Share2 className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleOpenExport} className="gap-2">
                  <Link className="h-4 w-4" />
                  Open Live Preview
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Share Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              onClick={() => setDeleteDialogOpen(true)} 
              variant="outline" 
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
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

          {renderQuestionList(
            'operationele_fit',
            'Operationele Fit Questions',
            <Wrench className="h-5 w-5 text-orange-500" />,
            'border-l-4 border-l-orange-500'
          )}

          {/* Potential Questions Section */}
          {hasPotentialQuestions && (
            <Card className="border-dashed border-amber-400/50 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  Potential Relevant Questions
                </CardTitle>
                <CardDescription>
                  These questions are not part of the profile but can be added if you believe they are relevant.
                  They didn't meet the automatic inclusion threshold during analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* License potential questions */}
                {potentialQuestions?.license && potentialQuestions.license.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                      <Car className="h-4 w-4" />
                      License
                    </div>
                    {potentialQuestions.license.map((q, idx) => (
                      <PotentialQuestionItem
                        key={`license-${idx}`}
                        question={q}
                        onAdd={() => handleAddPotentialQuestion('license', q)}
                        threshold={relevanceThresholds?.license || 0}
                        totalJobs={totalJobsAnalyzed}
                      />
                    ))}
                  </div>
                )}

                {/* Qualification potential questions */}
                {potentialQuestions?.qualification && potentialQuestions.qualification.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <GraduationCap className="h-4 w-4" />
                      Qualification
                    </div>
                    {potentialQuestions.qualification.map((q, idx) => (
                      <PotentialQuestionItem
                        key={`qual-${idx}`}
                        question={q}
                        onAdd={() => handleAddPotentialQuestion('qualification', q)}
                        threshold={relevanceThresholds?.qualification || 0}
                        totalJobs={totalJobsAnalyzed}
                      />
                    ))}
                  </div>
                )}

                {/* Certification potential questions */}
                {potentialQuestions?.certification && potentialQuestions.certification.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-600">
                      <Award className="h-4 w-4" />
                      Certification
                    </div>
                    {potentialQuestions.certification.map((q, idx) => (
                      <PotentialQuestionItem
                        key={`cert-${idx}`}
                        question={q}
                        onAdd={() => handleAddPotentialQuestion('certification', q)}
                        threshold={relevanceThresholds?.certification || 0}
                        totalJobs={totalJobsAnalyzed}
                      />
                    ))}
                  </div>
                )}

                {/* Operationele Fit potential questions */}
                {potentialQuestions?.operationele_fit && potentialQuestions.operationele_fit.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-orange-600">
                      <Wrench className="h-4 w-4" />
                      Operationele Fit
                    </div>
                    {potentialQuestions.operationele_fit.map((q, idx) => (
                      <PotentialQuestionItem
                        key={`opfit-${idx}`}
                        question={q}
                        onAdd={() => handleAddPotentialQuestion('operationele_fit', q)}
                        threshold={relevanceThresholds?.operationele_fit || 0}
                        totalJobs={totalJobsAnalyzed}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DeleteProfileDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          profileName={profile?.analysis_data?.profile || ''}
          countryLabel={`${countryInfo.flag} ${countryInfo.label}`}
          questionsCount={
            (profile?.analysis_data?.questions?.license?.questions?.length || 0) +
            (profile?.analysis_data?.questions?.qualification?.questions?.length || 0) +
            (profile?.analysis_data?.questions?.certification?.questions?.length || 0) +
            (profile?.analysis_data?.questions?.operationele_fit?.questions?.length || 0)
          }
          onConfirm={handleDelete}
          isDeleting={deleting}
        />
      </main>
    </div>
  );
}
