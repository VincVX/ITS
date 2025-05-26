// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast as sonnerToast } from "sonner";
// We will move ThemeToggle to a new navigation component
// import { ThemeToggle } from "@/components/theme-toggle"; // REMOVE THIS LINE

// Define an interface for Challenge to improve type safety
interface Challenge {
  prompt: string;
  constraint: string;
}

// Define the interface for a saved writing entry
interface WritingEntry {
  id: string; // Unique ID for each entry (e.g., timestamp or UUID)
  timestamp: string; // When the entry was saved (e.g., ISO string)
  prompt: string;
  constraint: string;
  userText: string;
  feedback: string;
}


export default function WritingTutorPage() {
  // Initialize challenge state by attempting to load from localStorage
  const [challenge, setChallenge] = useState<Challenge | null>(() => {
    if (typeof window !== 'undefined') { // Check if window is defined (client-side)
      const storedChallenge = localStorage.getItem("currentWritingChallenge");
      return storedChallenge ? JSON.parse(storedChallenge) : null;
    }
    return null; // Default to null on server-side render
  });

  const [userText, setUserText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // New state for library entries
  const [libraryEntries, setLibraryEntries] = useState<WritingEntry[]>([]);

  // Effect to load library entries from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEntries = localStorage.getItem("writingTutorLibrary");
        if (storedEntries) {
          setLibraryEntries(JSON.parse(storedEntries));
        }
      } catch (error) {
        console.error("Failed to load library entries from localStorage:", error);
        sonnerToast.error("Failed to load your writing library.", {
          description: "Some past entries might not be visible.",
        });
      }
    }
  }, []);

  // Effect to save library entries to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && libraryEntries.length > 0) { // Only save if there are entries
      try {
        localStorage.setItem("writingTutorLibrary", JSON.stringify(libraryEntries));
      } catch (error) {
        console.error("Failed to save library entries to localStorage:", error);
        sonnerToast.error("Failed to save your writing library.", {
          description: "Your new entry might not be saved.",
        });
      }
    }
  }, [libraryEntries]);


  // --- Start: Logic for Word Count ---
  useEffect(() => {
    const words = userText.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  }, [userText]);
  // --- End: Logic for Word Count ---


  // --- Start: Logic for Writing Streaks (Remains the same as before) ---
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  useEffect(() => {
    try {
      const storedDays = localStorage.getItem("completedWritingDays");
      if (storedDays) {
        const parsedDays: string[] = JSON.parse(storedDays);
        setCompletedDays(parsedDays);
      }
    } catch (error) { /* ... handle error ... */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("completedWritingDays", JSON.stringify(completedDays));
      calculateStreaks(completedDays);
    } catch (error) { /* ... handle error ... */ }
  }, [completedDays]);

  const getTodayDate = () => { /* ... */ return new Date().toISOString().split('T')[0]; };

  const addCompletedDay = () => {
    const today = getTodayDate();
    if (!completedDays.includes(today)) {
      setCompletedDays(prevDays => [...prevDays, today].sort());
    }
  };

  const calculateStreaks = (days: string[]) => {
    if (days.length === 0) {
      setCurrentStreak(0);
      setLongestStreak(0);
      return;
    }

    const sortedDays = [...days].sort();
    let current = 0;
    let longest = 0;
    const today = new Date(getTodayDate());

    for (let i = 0; i < sortedDays.length; i++) {
      const day = new Date(sortedDays[i]);
      if (i === 0) {
        current = 1;
      } else {
        const prevDay = new Date(sortedDays[i - 1]);
        const diffTime = Math.abs(day.getTime() - prevDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          current++;
        } else if (diffDays > 1) {
          current = 1;
        }
      }
      longest = Math.max(longest, current);
    }

    let finalCurrentStreak = 0;
    if (sortedDays.includes(getTodayDate())) {
      finalCurrentStreak = current;
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const yesterdayDate = yesterday.toISOString().split('T')[0];
      if (sortedDays.includes(yesterdayDate)) {
        let tempCurrent = 0;
        for (let i = sortedDays.length - 1; i >= 0; i--) {
            const day = new Date(sortedDays[i]);
            const prevDay = new Date(sortedDays[i - 1] || '1970-01-01');
            const diffTime = Math.abs(day.getTime() - prevDay.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (i === sortedDays.length - 1 && sortedDays[i] === yesterdayDate) {
                tempCurrent = 1;
            } else if (i < sortedDays.length -1 && diffDays === 1) {
                tempCurrent++;
            } else if (i < sortedDays.length -1 && diffDays > 1) {
                break;
            }
        }
        finalCurrentStreak = tempCurrent;
      }
    }
    setCurrentStreak(finalCurrentStreak);
    setLongestStreak(longest);
  };
  // --- End: Logic for Writing Streaks ---

  // --- Start: Challenge Caching Logic ---
  const fetchChallenge = async () => {
    setIsLoadingPrompt(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/generate-challenge");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      const data: Challenge = await response.json();
      setChallenge(data);
      setUserText("");
      localStorage.setItem("currentWritingChallenge", JSON.stringify(data));
      sonnerToast.success("New challenge loaded!", {
        description: "Time to get writing!",
      });
    } catch (e: any) {
      sonnerToast.error(`Failed to fetch challenge: ${e.message}`, {
        description: "Please try again in a moment.",
      });
    } finally {
      setIsLoadingPrompt(false);
    }
  };
  // --- End: Challenge Caching Logic ---


  const submitForFeedback = async () => {
    if (!challenge || !userText.trim()) {
      sonnerToast.info("Please get a challenge and write something.", {
        description: "Your masterpiece awaits!",
      });
      return;
    }
    setIsEvaluating(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/evaluate-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: challenge.prompt,
          constraint: challenge.constraint,
          userText: userText,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setFeedback(data.feedback_text);
      sonnerToast.success("Feedback received!", {
        description: "Insights to polish your prose!",
      });
      addCompletedDay(); // Mark day as completed

      // --- NEW: Save the entry to the library ---
      if (challenge && data.feedback_text) {
        const newEntry: WritingEntry = {
          id: Date.now().toString(), // Simple unique ID
          timestamp: new Date().toISOString(),
          prompt: challenge.prompt,
          constraint: challenge.constraint,
          userText: userText,
          feedback: data.feedback_text,
        };
        setLibraryEntries(prevEntries => [newEntry, ...prevEntries]); // Add new entry to the beginning
      }
      // --- END NEW ---

    } catch (e: any) {
      sonnerToast.error(`Failed to get feedback: ${e.message}`, {
        description: "Something went wrong during evaluation.",
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-card to-background opacity-20 -z-10"></div>

      {/* Theme Toggle moved to Navigation Component */}
      {/* <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div> */}

      <h1
        className="
          text-4xl sm:text-4xl font-bold text-center mb-10
          bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500
          text-transparent bg-clip-text
          drop-shadow-lg animate-fade-in-up
        "
      >
        AI Writing Tutor
      </h1>

      <div className="w-full max-w-3xl space-y-8">
        {/* Dashboard Section */}
        <Card className="shadow-lg border-border animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-accent">Your Writing Progress</CardTitle>
            <CardDescription className="text-muted-foreground">Track your journey to writing mastery.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="flex flex-col items-center p-4 bg-muted/20 border-border">
              <CardTitle className="text-2xl text-primary">{completedDays.length}</CardTitle>
              <CardDescription className="text-center">Total Challenges Completed</CardDescription>
            </Card>
            <Card className="flex flex-col items-center p-4 bg-muted/20 border-border">
              <CardTitle className="text-2xl text-primary">{currentStreak}</CardTitle>
              <CardDescription className="text-center">Current Streak (Days)</CardDescription>
            </Card>
            <Card className="flex flex-col items-center p-4 bg-muted/20 border-border">
              <CardTitle className="text-2xl text-primary">{longestStreak}</CardTitle>
              <CardDescription className="text-center">Longest Streak (Days)</CardDescription>
            </Card>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-border animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-primary">Your Writing Challenge</CardTitle>
            <CardDescription className="text-muted-foreground">Craft your response based on the prompt and constraint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingPrompt && <Progress value={50} className="w-full h-2 bg-primary animate-pulse" />}
            {challenge ? (
              <div className="space-y-3">
                <p className="font-semibold text-foreground">Prompt:</p>
                <p className="text-muted-foreground text-base">{challenge.prompt}</p>
                <p className="font-semibold mt-4 text-foreground">Constraint:</p>
                <p className="text-sm text-muted-foreground italic">{challenge.constraint}</p>
              </div>
            ) : (
              !isLoadingPrompt && <p className="text-muted-foreground text-center">Click "Get New Challenge" to start your writing journey.</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              onClick={fetchChallenge}
              disabled={isLoadingPrompt}
              className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              {isLoadingPrompt ? "Loading..." : "Get New Challenge"}
            </Button>
          </CardFooter>
        </Card>

        {/* Textarea and Word Counter */}
        <div className="relative">
          <Textarea
            placeholder="Unleash your creativity here..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            rows={10}
            disabled={!challenge || isLoadingPrompt || isEvaluating}
            className="bg-card text-foreground border-border placeholder:text-muted-foreground focus:border-primary focus-visible:ring-primary shadow-md transition-all duration-300 ease-in-out pr-20"
          />
          <div className="absolute bottom-2 right-2 text-sm text-muted-foreground bg-card/70 px-2 py-1 rounded-md">
            {wordCount} words
          </div>
        </div>


        <Button
          onClick={submitForFeedback}
          disabled={!challenge || !userText.trim() || isEvaluating || isLoadingPrompt}
          className="w-full px-6 py-3 rounded-full bg-gray-800 text-secondary-foreground hover:bg-secondary/90 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg text-lg font-semibold"
        >
          {isEvaluating ? (
            <span className="flex items-center">
              <svg className="animate-spin h-5 w-5 mr-3 text-secondary-foreground" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Evaluating...
            </span>
          ) : (
            "Submit for Feedback"
          )}
        </Button>

        {isEvaluating && (
          <Progress value={50} className="w-full h-2 bg-secondary animate-pulse mt-4" />
        )}

        {feedback && (
          <Card className="mt-8 shadow-lg border-border animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-secondary">Feedback</CardTitle>
              <CardDescription className="text-muted-foreground">Insights from your AI tutor.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{feedback}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}