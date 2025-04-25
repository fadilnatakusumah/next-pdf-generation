"use client";
import { Info } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [textValue, setTextValue] = useState("");
  const [previewURL, setPreviewURL] = useState(false);

  function generate() {
    if (textValue) {
      try {
        new URL(textValue);
        setPreviewURL(true);
      } catch (err) {
        if (err instanceof TypeError) {
          throw new Error(err.message);
        }
        throw new Error("Invalid URL");
      }
    }
  }

  function clearTextValue() {
    setTextValue("");
    setPreviewURL(false);
  }

  return (
    <main className="container mx-auto py-10 px-4 grid gap-6 md:gap-2 lg:grid-cols-2">
      <Card className="max-w-2xl h-fit">
        <CardHeader>
          <CardTitle>Webpage to PDF Converter</CardTitle>
          <CardDescription>Generate PDFs from any webpage URL</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              generate();
            }}
          >
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="url">URL</Label>
                <Input
                  value={textValue}
                  id="url"
                  placeholder="URL of a website"
                  onChange={({ target }) => setTextValue(target.value)}
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={clearTextValue} variant="outline">
            Clear
          </Button>
          <Button onClick={generate}>Fetch</Button>
        </CardFooter>
      </Card>
      <Card
        style={{ scrollbarWidth: "thin" }}
        className="shadow-md p-4 rounded-lg"
      >
        <div className="text-xl flex justify-between items-center mb-4 font-semibold">
          <div>Preview</div>
          <Button disabled={!previewURL} color="primary">
            Generate PDF
          </Button>
        </div>
        {previewURL ? (
          <iframe
            style={{ scrollbarWidth: "thin" }}
            src={textValue}
            className="w-full min-h-screen"
            title="preview"
          />
        ) : (
          <div className="flex justify-center items-center h-full gap-2 text-sm">
            <span>
              <Info size={16} />
            </span>
            <span>You have to fetch a URL first</span>
          </div>
        )}
      </Card>
    </main>
  );
}
