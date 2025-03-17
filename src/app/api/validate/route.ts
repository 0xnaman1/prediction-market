import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await axios.post("https://drop.vivek.ink/validate", body, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Error validating prompt", isValid: false },
      { status: 500 }
    );
  }
}
