import { BrowserSurface } from "./browser";

async function main() {
  const surface = new BrowserSurface();

  await surface.start();

  console.log("Banking application opened successfully.");

  await new Promise((resolve) => setTimeout(resolve, 5000));

  await surface.close();

  console.log("Browser closed.");
}

main().catch((error) => {
  console.error("Test failed:", error);
});