"use client";
import { motion } from "framer-motion";
import { Info, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
    },
  });

  const { getValues } = form;

  function generate() {
    if (getValues("url")) {
      const tempUrl = getValues("url");
      setShowPreview(false);
      try {
        form.setValue("url", "");
        setTimeout(() => {
          setShowPreview(true);
          form.setValue("url", tempUrl);
        }, 0);
      } catch (err) {
        console.error(err);
      }
    }
  }

  function clearTextValue() {
    setShowPreview(false);
    setError("");
    form.reset();
  }

  const downloadPDF = useCallback(async () => {
    setLoading(true);
    const url = getValues("url");

    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url }),
      });

      // Read the entire stream into a Blob
      const blob = await res.blob();

      // Create an object URL and click a hidden <a> to download it
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "webpage.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      setLoading(false);
      toast.success("PDF generated successfully!", { richColors: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        style={{
          scrollbarWidth: "thin",
          maxHeight: showPreview ? "0 !important" : "unset",
          overflow: "hidden",
          transition: "max-height 0.5s ease",
        }}
        className="shadow-md p-4 rounded-lg"
      >
        <div className="text-xl flex justify-between items-center font-semibold">
          <div>Preview</div>
          <Button
            disabled={!showPreview || isLoading}
            onClick={downloadPDF}
            color="primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              "Generate PDF"
            )}
          </Button>
        </div>

        {error &&
          !error.includes("NetworkError") && ( // TODO: weird error response from ReadableStream, check it out later
            <div className="text-red-500 text-sm">{error}</div>
          )}

        {showPreview ? (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "650px" }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="w-full overflow-hidden"
          >
            <iframe
              style={{
                border: "none",
                width: "100%",
                height: "100%",
              }}
              src={form.getValues("url")}
              className="w-full mt-4"
              data-testid="preview-iframe"
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-full gap-2 text-sm"
          >
            <span>
              <Info size={16} />
            </span>
            <span>You have to fetch a URL first</span>
          </motion.div>
        )}
      </Card>
    </main>
  );
}
