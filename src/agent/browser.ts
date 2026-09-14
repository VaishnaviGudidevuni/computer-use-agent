import { chromium, Browser, BrowserContext, Page } from "playwright";

export class BrowserSurface {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async start(): Promise<Page> {
    this.browser = await chromium.launch({
      headless: false,
    });

    this.context = await this.browser.newContext();

    this.page = await this.context.newPage();

   await this.page.goto("http://localhost:4000");

    return this.page;
  }

  getPage(): Page {
    if (!this.page) {
      throw new Error("Browser has not been started.");
    }

    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }
}