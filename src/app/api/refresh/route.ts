import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";

// Load shared credentials from the Python project's .env in development
if (!process.env.VERCEL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv").config({
      path: "/Users/bortanasijevic/Desktop/RFI_Python_Data_Extraction/.env",
    });
  } catch {
    // ignore if dotenv isn't available
  }
}

export async function POST(req: Request): Promise<Response> {
  // Check if we're in production (Vercel) or development (local)
  if (process.env.VERCEL) {
    // Vercel deployment - refresh not available
    return NextResponse.json(
      { 
        ok: false, 
        error: "Refresh functionality not available in demo version. Data updates automatically every hour." 
      },
      { status: 501 }
    );
  }

  // Local development - full refresh functionality
  const headerKey = process.env.REFRESH_KEY || "";
  const sentKey = req.headers.get("x-refresh-key") || "";
  if (headerKey && sentKey !== headerKey) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Resolve paths
  const home = process.env.HOME || os.homedir();
  const scriptDir = (process.env.API_SCRIPT_DIR || `${home}/Desktop/RFI_Python_Data_Extraction`).replace("~", home);
  const py = process.env.PYTHON_BIN || "python3";
  const scriptName = process.env.EXPORTER_FILE || "pull_rfis_rest_final_patched.py";

  return new Promise<Response>((resolve) => {
    const child = spawn(py, [scriptName], {
      cwd: path.resolve(scriptDir),
      env: process.env,
    });

    let out = "";
    let err = "";

    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (err += d.toString()));

    child.on("close", (code) => {
      if (code === 0) {
        // If Python script succeeded, start background deployment
        try {
          // Create a timestamp file for the shared demo
          const timestampPath = path.join(process.cwd(), "data", "last_refresh.json");
          const timestamp = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          
          require("fs").writeFileSync(timestampPath, JSON.stringify({ 
            lastRefresh: timestamp 
          }));
          
          out += "\n--- Starting background deployment to shared demo ---\n";
          out += "✅ Local refresh complete! Starting git commit and Vercel deployment...\n";
          
          // Start background deployment (don't wait for it)
          setImmediate(() => {
            const { spawn } = require("node:child_process");
            
            console.log("🚀 Starting background deployment...");
            
            // Run git add (include notes file)
            const gitAdd = spawn("git", ["add", "data/rfis_final.json", "data/last_refresh.json", "data/notes.json"], {
              cwd: process.cwd(),
              stdio: "pipe"
            });
            
            gitAdd.on("close", (addCode) => {
              if (addCode === 0) {
                console.log("✅ Git add successful");
                
                // Run git commit
                const gitCommit = spawn("git", ["commit", "-m", "Auto-update demo data from refresh button"], {
                  cwd: process.cwd(),
                  stdio: "pipe"
                });
                
                gitCommit.on("close", (commitCode) => {
                  if (commitCode === 0) {
                    console.log("✅ Git commit successful");
                    
                    // Run git push
                    const gitPush = spawn("git", ["push", "origin", "main"], {
                      cwd: process.cwd(),
                      stdio: "pipe"
                    });
                    
                    gitPush.on("close", (pushCode) => {
                      if (pushCode === 0) {
                        console.log("✅ Git push successful");
                        
                        // Run vercel deploy
                        const vercelDeploy = spawn("vercel", ["--prod", "--yes"], {
                          cwd: process.cwd(),
                          stdio: "pipe"
                        });
                        
                        vercelDeploy.on("close", (deployCode) => {
                          if (deployCode === 0) {
                            console.log("🎉 Shared demo updated successfully!");
                          } else {
                            console.log("⚠️ Vercel deployment failed - this is normal if Vercel token is expired");
                            console.log("📝 Data has been committed to GitHub. Vercel should auto-deploy in 2-3 minutes.");
                          }
                        });
                        
                        vercelDeploy.on("error", (error) => {
                          console.log("⚠️ Vercel deployment error:", error.message);
                          console.log("📝 Data has been committed to GitHub. Vercel should auto-deploy in 2-3 minutes.");
                        });
                      } else {
                        console.log("⚠️ Git push failed");
                      }
                    });
                  } else {
                    console.log("ℹ️ Git commit skipped (no changes)");
                  }
                });
              } else {
                console.log("⚠️ Git add failed");
              }
            });
          });
          
        } catch (deployError) {
          out += `⚠️ Background deployment setup error: ${deployError}`;
        }
      }
      
      resolve(
        NextResponse.json(
          { ok: code === 0, code, stdout: out, stderr: err },
          { status: code === 0 ? 200 : 500 }
        )
      );
    });
  });
}
