import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.PIPEDRIVE_API_TOKEN;

    if (!apiKey) {
      return NextResponse.json({ error: "PIPEDRIVE_API_TOKEN not configured" }, { status: 500 });
    }

    const response = await fetch(`https://api.pipedrive.com/v1/pipelines?api_token=${apiKey}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "RTSE-Data-Plumbing/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Authentication failed",
            message: "Invalid personal API key. Please check your PIPEDRIVE_API_TOKEN.",
            details: errorText,
          },
          { status: 401 },
        );
      }
      throw new Error(`Pipedrive API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch pipelines",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
