"use client";
import { Info } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  url: z.string().url("Please enter a valid URL").min(1, "URL is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const [previewURL, setPreviewURL] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const { getValues } = form;

  function generate() {
    if (getValues("url")) {
      try {
        setPreviewURL(true);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function clearTextValue() {
    setPreviewURL(false);
    form.reset();
  }

  return (
    <main className="container mx-auto py-10 px-4 md:px-0 grid gap-6 md:gap-2 lg:grid-cols-2">
      <Card className="max-w-2xl h-fit">
        <CardHeader>
          <CardTitle>Webpage to PDF Converter</CardTitle>
          <CardDescription>Generate PDFs from any webpage URL</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(generate)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            id="url"
                            placeholder="URL of a website"
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button onClick={clearTextValue} variant="outline">
            Clear
          </Button>
          <Button onClick={form.handleSubmit(generate)}>Fetch</Button>
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
            src={form.getValues("url")}
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
