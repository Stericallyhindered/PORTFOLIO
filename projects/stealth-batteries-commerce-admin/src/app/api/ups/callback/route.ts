import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const scope = searchParams.get('scope')

  // Display the code and scope in a simple HTML page
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>UPS OAuth Callback</title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.6;
          }
          code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <h1>Authorization Successful</h1>
        <p>Authorization code: <code>${code}</code></p>
        <p>Scope: <code>${scope}</code></p>
        <p>You can now close this window and use this code to complete the authentication process.</p>
      </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
