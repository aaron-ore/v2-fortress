import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, BookOpen, MessageCircle, ExternalLink } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { Link } from "react-router-dom"; // Import Link

const HelpCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Mock FAQ data
  const faqs = [
    {
      id: "faq-1",
      question: "How do I add a new inventory item?",
      answer: "Navigate to the 'Inventory' page, then click the '+ Add New Item' button. Fill in the required details like item name, SKU, quantity, and location, then click 'Add Item'.",
    },
    {
      id: "faq-2",
      question: "Can I import my existing inventory from a CSV file?",
      answer: "Yes, on the 'Inventory' page, click the 'Actions' dropdown and select 'Import CSV'. You can upload your spreadsheet there. Make sure your CSV is formatted correctly.",
    },
    {
      id: "faq-3",
      question: "How do I track incoming shipments?",
      answer: "Incoming shipments are typically managed through Purchase Orders. You can create a PO, and once items are received, update the PO status to reflect the incoming stock.",
    },
    {
      id: "faq-4",
      question: "What is the 'Reorder Level' and how does it work?",
      answer: "The reorder level is the minimum quantity of an item you want to have in stock before you need to reorder. When an item's quantity drops to or below this level, it will appear in 'Low Stock Alerts' on your Dashboard.",
    },
    {
      id: "faq-5",
      question: "How can I generate reports on my sales and inventory?",
      answer: "Visit the 'Reports' page. Here you'll find various pre-built reports like 'Sales by Product Category', 'Inventory Value by Location', and 'Overall Stock Level Trend'. You can also export these reports to Excel.",
    },
  ];

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSearch = () => {
    showSuccess(`Searching help articles for: "${searchTerm}".`);
  };

  const handleContactSupport = () => {
    showSuccess("Opening live chat/contact form.");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Help Center & Knowledge Base</h1>
      <p className="text-muted-foreground">Find answers to common questions and get support for using Fortress.</p>

      {/* Search Bar */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4 flex flex-row items-center gap-4">
          <Search className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">Search Help Articles</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="e.g., 'add item', 'reorder', 'reports'"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          <Button onClick={handleSearch}>Search</Button>
        </CardContent>
      </Card>

      {/* Frequently Asked Questions */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4 flex flex-row items-center gap-4">
          <BookOpen className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* New: Getting Started section with link to Setup Instructions */}
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-foreground mb-2">Getting Started</h3>
            <p className="text-muted-foreground">
              If you're new to Fortress, check out our step-by-step setup guide:{" "}
              <Link to="/setup-instructions" className="text-primary hover:underline">
                Fortress Setup Guide
              </Link>
            </p>
          </div>
          {filteredFaqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <p className="text-center text-muted-foreground py-4">No matching FAQs found.</p>
          )}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card className="bg-card border-border rounded-lg shadow-sm p-6">
        <CardHeader className="pb-4 flex flex-row items-center gap-4">
          <MessageCircle className="h-6 w-6 text-primary" />
          <CardTitle className="text-xl font-semibold">Still Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            If you can't find what you're looking for, our support team is here to assist you.
          </p>
          <Button onClick={handleContactSupport}>
            <MessageCircle className="h-4 w-4 mr-2" /> Contact Support
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            For urgent issues, please check our{" "}
            <a href="https://status.fortressapp.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 inline-flex">
              System Status Page <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpCenter;