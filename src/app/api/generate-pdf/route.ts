import { NextResponse, type NextRequest } from "next/server";
import puppeteer, { Browser } from "puppeteer-core";
import { z } from "zod";

// Schema for request payload
const requestSchema = z
  .object({
    url: z.string().url(),
  })
  .strict(); // Ensure it only has "url" property and no other else

export async function POST(req: NextRequest) {
  let browser: Browser | null = null;

  try {
    // parsing the request body
    const body = await req.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      const errorMessage =
        result.error.errors[0].message || "Invalid request body";

      // check if there's any key in the request body
      if (result.error.issues[0].code === "unrecognized_keys") {
        const unexpectedProps = result.error.issues[0]?.keys || [];
        return NextResponse.json(
          { message: `Unexpected property: ${unexpectedProps.join(", ")}` },
          { status: 400 }
        );
      }

      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }

    const { url } = result.data;

    // Get the Browserless token from environment variables
    const browserlessToken = process.env.BROWSERLESS_TOKEN;
    if (!browserlessToken) {
      return NextResponse.json(
        { message: "Browserless token is not configured" },
        { status: 500 }
      );
    }

    // Maximum time to wait for navigation (in milliseconds)
    const NAVIGATION_TIMEOUT = 30000;
    // Maximum time to wait for the entire PDF generation process (in milliseconds)
    const TOTAL_TIMEOUT = 60000;

    const response = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Set a timeout for the entire process
            const totalTimeout = setTimeout(() => {
              throw new Error(
                "PDF generation timed out after " + TOTAL_TIMEOUT + "ms"
              );
            }, TOTAL_TIMEOUT);

            // Connect to Browserless with explicit connection options
            browser = await puppeteer.connect({
              browserWSEndpoint: `wss://production-sfo.browserless.io?token=${browserlessToken}`,
              defaultViewport: { width: 1280, height: 1024 },
              protocolTimeout: 30000, // Connection timeout
            });

            // Create a new page with error handling
            const page = await browser.newPage();

            page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

            console.log(`Navigating to ${url}...`);

            // Navigate to the URL with a more robust approach
            try {
              await page.goto(url, {
                waitUntil: "domcontentloaded",
                timeout: NAVIGATION_TIMEOUT,
              });
            } catch (navError) {
              console.error("Navigation error:", navError);
              // Try to continue anyway if the page partially loaded
              if (!(await page.content()).includes("<html")) {
                throw navError;
              }
            }

            console.log("Page loaded, waiting for content...");

            // Wait for the page to be fully loaded
            await page
              .waitForFunction(() => document.readyState === "complete", {
                timeout: NAVIGATION_TIMEOUT,
              })
              .catch((err) => {
                console.warn(
                  "Warning: Page didn't reach 'complete' state:",
                  err.message
                );
                // Continue anyway
              });

            console.log("Checking for images...");

            // A more robust approach to wait for images
            // This runs directly in the browser context
            await page
              .evaluate(() => {
                return new Promise<void>((resolve) => {
                  // If there are no images or all images are already loaded, resolve immediately
                  const imgElements = Array.from(
                    document.querySelectorAll("img")
                  );

                  if (
                    imgElements.length === 0 ||
                    imgElements.every((img) => img.complete)
                  ) {
                    console.log("No images on the page, continuing anyway");
                    return resolve();
                  }

                  // Set a timeout to resolve anyway after 5 seconds
                  const timeout = setTimeout(() => {
                    console.log("Image loading timed out, continuing anyway");
                    resolve();
                  }, 5000);

                  // Count loaded images
                  let loadedImages = 0;
                  const totalImages = imgElements.length;

                  // Function to check if all images are loaded
                  const checkAllImagesLoaded = () => {
                    loadedImages++;
                    if (loadedImages === totalImages) {
                      console.log("All images loaded. Total: ", totalImages);
                      clearTimeout(timeout);
                      resolve();
                    }
                  };

                  // Add event listeners for each image
                  imgElements.forEach((img) => {
                    if (img.complete) {
                      checkAllImagesLoaded();
                    } else {
                      img.addEventListener("load", checkAllImagesLoaded, {
                        once: true,
                      });
                      img.addEventListener("error", checkAllImagesLoaded, {
                        once: true,
                      });
                    }
                  });
                });
              })
              .catch((err) => {
                console.warn(
                  "Warning: Image loading check failed:",
                  err.message
                );
                // Continue anyway
              });

            console.log("Generating PDF...");

            // Generate PDF with a timeout
            const pdfBuffer = await Promise.race([
              page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                  top: "20px",
                  right: "20px",
                  bottom: "20px",
                  left: "20px",
                },
              }),
              new Promise<never>((_, reject) => {
                setTimeout(
                  () => reject(new Error("PDF generation timed out")),
                  20000
                );
              }),
            ]);

            // Clear the total timeout
            clearTimeout(totalTimeout);

            // Stream the PDF data to the client
            controller.enqueue(pdfBuffer);
            controller.close();

            // Close the browser
            if (browser) {
              await browser
                .close()
                .catch((err) =>
                  console.warn("Browser close warning:", err.message)
                );
              browser = null;
            }
          } catch (error) {
            console.error("PDF generation error:", error);

            // Try to close the browser if it's still open
            if (browser! as Browser) {
              await browser!.close().catch(() => {});
              browser = null;
            }

            // Send error to client
            controller.error(error);
          }
        },
      }),
      {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="webpage.pdf"',
        },
      }
    );

    return response;
  } catch (error) {
    console.error("Error in PDF generation API:", error);

    // Try to close the browser if it's still open
    if (browser! as Browser) {
      await browser!.close().catch((err) => console.error(err));
    }

    return NextResponse.json(
      {
        message:
          "Failed to generate PDF: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}
