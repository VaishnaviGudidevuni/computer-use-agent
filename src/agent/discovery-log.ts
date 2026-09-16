import fs from "fs";
import path from "path";

export type DiscoveryLogEntry = {
  step: number;
  observation: string;
  decision: unknown;
  action: string;
  timestamp: string;
};

export class DiscoveryLogger {
  private entries: DiscoveryLogEntry[] = [];

  add(entry: DiscoveryLogEntry): void {
    this.entries.push(entry);
  }

  save(): string {
    const evidenceDir = path.join(process.cwd(), "evidence");

    fs.mkdirSync(evidenceDir, {
      recursive: true,
    });

    const filePath = path.join(
      evidenceDir,
      "discovery-run.json",
    );

    fs.writeFileSync(
      filePath,
      JSON.stringify(this.entries, null, 2),
      "utf-8",
    );

    return filePath;
  }
}