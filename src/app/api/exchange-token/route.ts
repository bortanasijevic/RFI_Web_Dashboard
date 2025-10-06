import { NextResponse } from "next/server";
import { writeFileSync } from "fs";
import { join } from "path";

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

const CLIENT_ID = process.env.PROCORE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PROCORE_CLIENT_SECRET || "";
const REDIRECT_URI = "http://localhost:8080/callback";

export async function POST(req: Request): Promise<Response> {
  try {
    const { code } = await req.json();
    
    if (!code) {
      return NextResponse.json({ success: false, error: "No authorization code provided" });
    }

    // Exchange code for tokens
    const response = await fetch("https://login.procore.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ 
        success: false, 
        error: `Failed to exchange code: ${error}` 
      });
    }

    const data = await response.json();
    
    // Create new tokens object
    const newTokens = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      obtained_at: Math.floor(Date.now() / 1000)
    };

    // Save tokens to the API Script directory
    const tokensPath = join(process.cwd(), "..", "RFI_Python_Data_Extraction", "tokens.json");
    writeFileSync(tokensPath, JSON.stringify(newTokens, null, 2));

    return NextResponse.json({ 
      success: true, 
      message: "Tokens refreshed successfully",
      expires_at: new Date((data.created_at + data.expires_in) * 1000).toLocaleString()
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
}
