import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, Users, Trophy, Calendar, Euro, BookOpen } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">EuroAssist.ai</h1>
          </div>
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Your AI Guide to
            <span className="text-primary block">European Universities</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Get instant, AI-powered answers about fees, rankings, scholarships, and admission requirements 
            for universities across Europe.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6"
            data-testid="button-get-started"
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center mb-12">
            Everything you need to know about European universities
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Euro className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Tuition & Costs</h4>
                <p className="text-muted-foreground">
                  Compare tuition fees and living costs across European universities and countries.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Rankings & Reputation</h4>
                <p className="text-muted-foreground">
                  Get the latest university rankings and program-specific reputation information.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Scholarships</h4>
                <p className="text-muted-foreground">
                  Discover scholarship opportunities and financial aid options for international students.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Admission Dates</h4>
                <p className="text-muted-foreground">
                  Stay updated on application deadlines and admission requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Student Life</h4>
                <p className="text-muted-foreground">
                  Learn about campus culture, student services, and life in different European cities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-2">Programs</h4>
                <p className="text-muted-foreground">
                  Explore academic programs, specializations, and degree options across Europe.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-3xl font-bold mb-4">Ready to explore European universities?</h3>
          <p className="text-muted-foreground mb-8">
            Join thousands of students who are using EuroAssist.ai to make informed decisions about their education.
          </p>
          <Button
            size="lg"
            onClick={() => window.location.href = "/api/login"}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-start-exploring"
          >
            Start Exploring Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">EuroAssist.ai</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Empowering students to make informed decisions about European higher education.
          </p>
        </div>
      </footer>
    </div>
  );
}
