import { NextResponse } from "next/server";

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

export async function GET(): Promise<Response> {
  // Redirect to a simple HTML page for token refresh
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Refresh Tokens - RFI Dashboard</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .step {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .code {
            background: #e9ecef;
            padding: 10px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
        }
        button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover { background: #0056b3; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 Refresh Tokens</h1>
        
        <div class="step">
            <h3>Why do I need to do this?</h3>
            <p>Procore invalidates refresh tokens overnight for security. This is <strong>normal and expected</strong> - not a bug in your code!</p>
        </div>

        <div class="step">
            <h3>Step 1: Get Authorization Code</h3>
            <p>Click the button below to open Procore login:</p>
            <button onclick="openProcoreLogin()">🌐 Open Procore Login</button>
            <p>After signing in, you'll be redirected to a URL like:</p>
            <div class="code">http://localhost:8080/callback?code=YOUR_CODE_HERE</div>
            <p>Copy the code part (everything after <code>code=</code>)</p>
        </div>

        <div class="step">
            <h3>Step 2: Enter Code</h3>
            <input type="text" id="authCode" placeholder="Paste your authorization code here" style="width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px;">
            <br>
            <button onclick="refreshTokens()">🔄 Refresh Tokens</button>
        </div>

        <div id="result"></div>

        <div class="step">
            <h3>Step 3: Test Dashboard</h3>
            <p>Once tokens are refreshed, go back to your dashboard and try the "Run Exporter & Refresh" button again.</p>
            <button onclick="window.close()">✅ Close This Window</button>
        </div>
    </div>

    <script>
        function openProcoreLogin() {
            const clientId = '${process.env.PROCORE_CLIENT_ID || ""}';
            const url = 'https://login.procore.com/oauth/authorize?response_type=code&client_id=' + clientId + '&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback';
            window.open(url, '_blank');
        }

        async function refreshTokens() {
            const code = document.getElementById('authCode').value.trim();
            if (!code) {
                showResult('Please enter an authorization code', 'error');
                return;
            }

            showResult('🔄 Exchanging code for tokens...', 'warning');

            try {
                const response = await fetch('/api/exchange-token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: code })
                });

                const result = await response.json();

                if (result.success) {
                    showResult('✅ SUCCESS! Tokens refreshed. You can now use your dashboard normally.', 'success');
                } else {
                    showResult('❌ ERROR: ' + (result.error || 'Failed to refresh tokens'), 'error');
                }
            } catch (error) {
                showResult('❌ ERROR: ' + error.message, 'error');
            }
        }

        function showResult(message, type) {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<div class="' + type + '">' + message + '</div>';
        }
    </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
