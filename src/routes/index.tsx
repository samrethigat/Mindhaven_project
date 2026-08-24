import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import heroImage from "@/assets/hero.jpg";
import {
  Bot,
  CalendarHeart,
  LineChart,
  MessageCircleHeart,
  Moon,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MindHaven — Digital Mental Health Support for Students" },
      {
        name: "description",
        content:
          "MindHaven gives students an AI friend, mood and sleep tracking, psychological assessment and instant access to counsellors — with automatic emergency support.",
      },
      { property: "og:title", content: "MindHaven — Digital Mental Health Support for Students" },
      {
        property: "og:description",
        content:
          "An AI companion, psychological assessment, counsellor appointments and 24/7 emergency escalation for students in higher education.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Bot,
    title: "Mira, your AI friend",
    body: "A companion that jokes, listens, remembers your story and knows when to get serious.",
  },
  {
    icon: Sparkles,
    title: "40-question assessment",
    body: "Stress, anxiety, depression, sleep, loneliness, self-esteem, academic pressure and risk.",
  },
  {
    icon: LineChart,
    title: "Mood & stress graphs",
    body: "Daily check-ins turn into trends you and your counsellor can actually act on.",
  },
  {
    icon: Moon,
    title: "Sleep tracker",
    body: "Log hours and quality, and see how rest shapes the way you feel.",
  },
  {
    icon: ShieldAlert,
    title: "Emergency escalation",
    body: "High-risk signals notify your parent, best friend, emergency contact and a counsellor.",
  },
  {
    icon: Video,
    title: "Video & voice sessions",
    body: "One-click consultations with camera, mic, screen sharing and recording.",
  },
  {
    icon: CalendarHeart,
    title: "Appointments",
    body: "Find nearby counsellors, book a slot and track every session in one place.",
  },
  {
    icon: Stethoscope,
    title: "Counsellor workspace",
    body: "Patient list, medical notes, prescriptions, analytics and emergency alerts.",
  },
];

const STATS = [
  { value: "1 in 3", label: "students report high distress" },
  { value: "24/7", label: "AI companion availability" },
  { value: "< 60s", label: "to reach emergency support" },
  { value: "9", label: "psychological domains assessed" },
];

const TESTIMONIALS = [
  {
    quote:
      "I opened the app at 2am when I could not sleep. Mira kept me company until I calmed down, then helped me book a session.",
    name: "Ananya R.",
    role: "3rd year, B.Tech",
  },
  {
    quote:
      "The weekly graphs made it obvious that my mood crashed around exams. My counsellor and I finally had data to work with.",
    name: "Karthik S.",
    role: "2nd year, B.Sc",
  },
  {
    quote:
      "As a counsellor, the emergency alerts with location and a ready report save me the first fifteen minutes of every crisis.",
    name: "Dr. Meera Iyer",
    role: "Clinical Psychologist",
  },
];

const FAQS = [
  {
    q: "Is my data private?",
    a: "Your journal, chats and assessments are visible only to you. A counsellor can see your history only after you have an appointment with them. Emergency contacts are alerted only when a high-risk situation is detected.",
  },
  {
    q: "Is MindHaven a replacement for therapy?",
    a: "No. Mira is a supportive companion and a triage layer. Every moderate or severe signal routes you to a licensed counsellor for a real session.",
  },
  {
    q: "What happens in an emergency?",
    a: "The system combines your chat, facial expression, voice tone, typing behaviour and questionnaire score. At Level 3 it notifies your trusted contacts, finds the nearest available counsellor, books an urgent consultation, shares your location and generates a report.",
  },
  {
    q: "Who can join as a counsellor?",
    a: "Licensed psychologists and psychiatrists can register with their qualification, experience, clinic details and license number.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#faq" className="transition-colors hover:text-foreground">FAQ</a>
            <a href="#contact" className="transition-colors hover:text-foreground">Contact</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ portal: "counsellor" }}>Counsellor</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth" search={{ portal: "student" }}>Student login</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden" style={{ backgroundImage: "var(--gradient-hero)" }}>
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
            <div>
              <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" /> Built for higher education
              </span>
              <h1 className="font-display mt-5 text-4xl leading-tight font-extrabold tracking-tight md:text-6xl">
                Someone in your corner,
                <span className="text-gradient"> every single day.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
                MindHaven blends an AI friend, psychological assessment, mood science and licensed
                counsellors into one calm space — and steps in automatically when things get heavy.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ portal: "student" }}>Get started free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth" search={{ portal: "counsellor" }}>Join as counsellor</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                If you are in immediate danger, please contact your local emergency number right away.
              </p>
            </div>
            <div className="animate-float relative">
              <img
                src={heroImage}
                alt="Calm blue abstract waves representing emotional wellbeing"
                width={1600}
                height={1200}
                className="rounded-3xl shadow-[var(--shadow-soft)]"
              />
              <Card className="glass absolute -bottom-6 left-4 w-64 border-0 p-4">
                <div className="flex items-center gap-3">
                  <MessageCircleHeart className="size-8 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mira</p>
                    <p className="text-xs text-muted-foreground">
                      “Rough day? Let's fix that with one song and one deep breath. 🎧”
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Everything a struggling student needs
          </h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            From a light dip in mood to a genuine crisis, MindHaven adapts its response to the level
            of risk it detects.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <Card key={f.title} className="glass border-0 p-5 transition-transform hover:-translate-y-1">
                <f.icon className="size-6 text-primary" />
                <h3 className="font-display mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="how" className="bg-brand-soft/60 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Three levels of care
            </h2>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  level: "Level 1",
                  title: "Temporary sadness",
                  body: "Mira lifts your mood with music, memes, jokes, motivational stories, breathing and meditation, and nudges you to reach out to a friend.",
                },
                {
                  level: "Level 2",
                  title: "Moderate depression",
                  body: "If you go quiet, Mira starts a voice conversation, keeps it alive, encourages positive thinking and helps you book a counsellor nearby.",
                },
                {
                  level: "Level 3",
                  title: "Severe depression",
                  body: "Face, voice, chat and questionnaire signals combine. Trusted contacts and a counsellor are notified, an urgent consultation is booked and your location is shared.",
                },
              ].map((l, i) => (
                <Card key={l.level} className="border-0 bg-card p-6 shadow-[var(--shadow-soft)]">
                  <span className="text-xs font-semibold tracking-widest text-primary uppercase">
                    {l.level}
                  </span>
                  <h3 className="font-display mt-2 text-xl font-semibold">{l.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground">{l.body}</p>
                  <div className="mt-5 h-1.5 rounded-full bg-muted">
                    <div
                      className="gradient-primary h-1.5 rounded-full"
                      style={{ width: `${(i + 1) * 33}%` }}
                    />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="glass rounded-2xl p-6 text-center">
                <p className="font-display text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">Voices from campus</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="border-0 bg-card p-6 shadow-[var(--shadow-soft)]">
                <p className="text-sm leading-relaxed">“{t.quote}”</p>
                <p className="mt-5 text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold tracking-tight">Frequently asked</h2>
          <Accordion type="single" collapsible className="mt-6">
            {FAQS.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="contact" className="mx-auto max-w-6xl px-4 pb-20">
          <Card className="gradient-primary border-0 p-10 text-primary-foreground">
            <h2 className="font-display text-3xl font-bold">You do not have to carry it alone.</h2>
            <p className="mt-3 max-w-xl opacity-90">
              Create your student account in under two minutes. Questions? Write to
              support@mindhaven.app and a human will reply.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6">
              <Link to="/auth" search={{ portal: "student" }}>Create my account</Link>
            </Button>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} MindHaven. Built for student wellbeing.</p>
        </div>
      </footer>
    </div>
  );
}
