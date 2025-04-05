import { NextResponse } from "next/server";
import { OpenAI } from "openai"


export async function GET() {
  return NextResponse.json({ message: "Hello from the API!" });
}

export async function POST(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body = await request.json();
    return NextResponse.json({
      message: "Data received!",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: body,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse request body" },
      { status: 400 },
    );
  }
}
