import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Globe, Calendar, Sparkles, X, Pencil, Check } from "lucide-react";
import { SearchParams } from "@/types/job";

interface SearchFormProps {
  onSearch: (params: SearchParams) => void;
  onTranslateProfile: (profile: string, country: string, language: string) => Promise<string[] | null>;
  loading: boolean;
  translating: boolean;
}

const countries = [
  { value: "nl", label: "Netherlands" },
  { value: "de", label: "Germany" },
  { value: "be", label: "Belgium" },
  { value: "gb", label: "United Kingdom" },
  { value: "us", label: "United States" },
  { value: "fr", label: "France" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "nl", label: "Dutch" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
];

const dateOptions = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "3days", label: "Last 3 Days" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function SearchForm({ onSearch, onTranslateProfile, loading, translating }: SearchFormProps) {
  const [profile, setProfile] = useState("");
  const [jobTitles, setJobTitles] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("nl");
  const [language, setLanguage] = useState("en");
  const [datePosted, setDatePosted] = useState("all");
  const [step, setStep] = useState<"profile" | "review">("profile");

  const handleGenerateTitles = async () => {
    if (!profile.trim()) return;

    const titles = await onTranslateProfile(profile, country, language);
    if (titles && titles.length > 0) {
      setJobTitles(titles);
      setStep("review");
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
      setJobTitles((prev) => prev.map((title, i) => (i === editingIndex ? editValue.trim() : title)));
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobTitles.length === 0) return;

    onSearch({
      jobTitles,
      location,
      country,
      language,
      date_posted: datePosted,
    });
  };

  const handleBack = () => {
    setStep("profile");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Search Jobs
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === "profile" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile">ONET-SOC Profile</Label>
              <div className="relative">
                <Sparkles className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="profile"
                  placeholder="e.g. Stockers and order filler, Laborers and freight movers"
                  value={profile}
                  onChange={(e) => setProfile(e.target.value)}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Enter an occupational profile and AI will generate relevant job titles
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
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

            <Button onClick={handleGenerateTitles} className="w-full" disabled={translating || !profile.trim()}>
              {translating ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Generating Job Titles...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Get Job Titles
                </>
              )}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Job Titles</Label>
                <Button variant="ghost" size="sm" onClick={handleBack} type="button">
                  ← Change Profile
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Edit or remove titles before searching. Based on: "{profile}"
              </p>
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
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSaveEdit();
                            }
                            if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                        />
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit}>
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
                      <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
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
              {jobTitles.length === 0 && (
                <p className="text-sm text-destructive">Add at least one job title to search</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    placeholder="e.g. Amsterdam"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="datePosted">Date Posted</Label>
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

            <Button type="submit" className="w-full" disabled={loading || jobTitles.length === 0}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Jobs
                </>
              )}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
