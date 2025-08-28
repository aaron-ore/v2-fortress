import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Brain, FileText, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/lib/supabaseClient";

const AISummaryTool: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [summary, setSummary] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      showError("Please enter some text to summarize.");
      return;
    }

    setIsLoading(true);
    setSummary(""); // Clear previous summary

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showError("You must be logged in to use the AI Summary tool.");
        setIsLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('summarize-report', {
        body: JSON.stringify({ textToSummarize: inputText }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data && response.data.summary) {
        setSummary(response.data.summary);
        showSuccess("Summary generated successfully!");
      } else {
        showError("Failed to get a summary from the AI. Please try again.");
      }
    } catch (error: any) {
      console.error("Error calling Edge Function:", error);
      showError(`Error generating summary: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Leverage AI to quickly generate concise summaries of your reports, notes, or any text.
      </p>

      <Card className="bg-card border-border rounded-lg shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Text Input
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inputText">Enter Text to Summarize</Label>
            <Textarea
              id="inputText"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste your report, notes, or any text here for AI summarization..."
              rows={10}
              className="min-h-[200px]"
            />
          </div>
          <Button onClick={handleSummarize} disabled={isLoading || !inputText.trim()} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating Summary...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" /> Generate Summary
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card className="bg-card border-border rounded-lg shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Brain className="h-6 w-6 text-accent" /> AI Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/20 p-4 rounded-md border border-border">
              <p className="text-foreground whitespace-pre-wrap">{summary}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border rounded-lg shadow-sm p-6 mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Architectural Notes & Future Refactoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-sm">
          <p>
            This `AISummaryTool` component uses a Supabase Edge Function to interact with the Google Gemini 1.5 Pro API.
            The API key is securely stored as a Supabase Secret (`GEMINI_API_KEY`).
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **Edge Function (`summarize-report`):** Acts as a secure backend for frontend requests,
              handling the API key and making the call to Gemini. This prevents exposing the API key client-side.
            </li>
            <li>
              **Gemini 1.5 Pro:** Chosen for its high-quality abstractive summarization capabilities and free tier.
            </li>
            <li>
              **Prompt Engineering:** A basic prompt is used to guide the summarization. This can be refined for better results.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              UI state management: Ensure `isLoading` and `summary` states update correctly.
            </li>
            <li>
              Error handling: Verify `showError` is called for empty input, API errors, etc.
            </li>
            <li>
              Integration testing (manual/e2e): Verify the full flow from input to displayed summary via the Edge Function.
            </li>
          </ul>
          <p>
            **Next Steps for Improvement:**
            Consider adding options for summary length, tone, or specific focus areas.
            Integrate with existing reports (e.g., select a report from a dropdown to summarize its content).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AISummaryTool;