import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { SearchForm } from '@/components/SearchForm';
import { useJobSearch } from '@/hooks/useJobSearch';
import { Brain, Briefcase, Heart, Search } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { searchJobs, translateProfile, loading, translating } = useJobSearch();

  const handleSearch = async (params: Parameters<typeof searchJobs>[0]) => {
    const jobs = await searchJobs(params);
    navigate('/results', { state: { jobs, searchParams: params } });
  };

  const handleTranslateProfile = async (profile: string, country: string, language: string) => {
    return await translateProfile({ profile, country, language });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4 md:text-5xl">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Search thousands of job listings and get AI-powered insights to prepare
            for your interviews.
          </p>

          <div className="max-w-3xl mx-auto">
            <SearchForm 
              onSearch={handleSearch} 
              onTranslateProfile={handleTranslateProfile}
              loading={loading} 
              translating={translating}
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                1. Search Jobs
              </h3>
              <p className="text-muted-foreground">
                Enter your desired job title, location, and preferences to find
                relevant opportunities.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                2. AI Analysis
              </h3>
              <p className="text-muted-foreground">
                Our AI analyzes job descriptions to extract common requirements
                for licenses, qualifications, and certifications.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                3. Prepare & Apply
              </h3>
              <p className="text-muted-foreground">
                Use the suggested interview questions to prepare, then apply
                directly to your favorite positions.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <p className="text-muted-foreground">Jobs Available</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">AI</div>
              <p className="text-muted-foreground">Powered Analysis</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">3</div>
              <p className="text-muted-foreground">Question Categories</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} JobSearch Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
