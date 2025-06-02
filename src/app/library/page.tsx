// app/library/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast as sonnerToast } from "sonner";
import { format } from "date-fns"; // For formatting timestamps

// Make sure this interface matches the one in app/page.tsx
interface WritingEntry {
  id: string;
  timestamp: string;
  prompt: string;
  constraint: string;
  userText: string;
  feedback: string;
}

export default function LibraryPage() {
  const [libraryEntries, setLibraryEntries] = useState<WritingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEntries = localStorage.getItem("writingTutorLibrary");
        if (storedEntries) {
          // Sort entries by timestamp in descending order (newest first)
          const parsedEntries: WritingEntry[] = JSON.parse(storedEntries);
          const sortedEntries = parsedEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setLibraryEntries(sortedEntries);
        }
      } catch (error) {
        console.error("Failed to load library entries from localStorage:", error);
        sonnerToast.error("Failed to load your writing library.", {
          description: "There was an issue retrieving your saved entries.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-background text-foreground py-8 px-4">
        <p className="text-lg text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground flex flex-col items-center py-8 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-center mb-10 text-primary drop-shadow-lg">
        Your Library
      </h1>

      <div className="w-full max-w-3xl space-y-4">
        {libraryEntries.length === 0 ? (
          <Card className="text-center p-8 border-dashed border-2 border-border text-muted-foreground">
            <CardTitle className="text-2xl mb-2">No Entries Yet!</CardTitle>
            <CardDescription>Start completing challenges to build your writing library.</CardDescription>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {libraryEntries.map((entry) => (
              <Card key={entry.id} className="mb-4 shadow-md border-border">
                <AccordionItem value={entry.id}>
                  <AccordionTrigger className="flex justify-between items-center px-6 py-4 bg-muted/20 hover:bg-muted/30 transition-colors rounded-t-lg">
                    <span className="font-semibold text-lg text-foreground truncate max-w-[80%]">
                      {format(new Date(entry.timestamp), "MMM dd, yyyy - HH:mm")}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        (Words: {entry.userText.trim().split(/\s+/).filter(Boolean).length})
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 bg-card text-foreground rounded-b-lg border-t border-border">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-bold text-primary mb-1">Prompt:</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{entry.prompt}</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-primary mb-1">Constraint:</h3>
                        <p className="text-muted-foreground text-sm italic leading-relaxed">{entry.constraint}</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary mb-1">Your Response:</h3>
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap border p-3 rounded-md bg-muted/10 border-dashed border-border">{entry.userText}</p>
                      </div>
                      <div>
                        <h3 className="font-bold text-secondary mb-1">AI Feedback:</h3>
                        <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap border p-3 rounded-md bg-muted/10 border-dashed border-border">{entry.feedback}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Card>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}