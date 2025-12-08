import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Brain, Briefcase, ArrowRight, Sparkles } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Job Analysis</span>
          </div>
          
          <h1 className="text-4xl font-bold text-foreground mb-4 md:text-5xl lg:text-6xl">
            Prepare for Your
            <span className="text-primary block">Dream Job</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Create job profiles, analyze requirements with AI, and get tailored
            interview questions for licenses, qualifications, and certifications.
          </p>

          <Button 
            size="lg" 
            onClick={handleGetStarted}
            disabled={loading}
            className="gap-2 text-lg px-8 py-6"
          >
            Get Started
            <ArrowRight className="h-5 w-5" />
          </Button>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-16 border-t border-border">
          <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                1. Create Profile
              </h3>
              <p className="text-muted-foreground">
                Enter your ONET-SOC profile and let AI generate localized job titles
                for your target country.
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
