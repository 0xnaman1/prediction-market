// "use server";

import axios from "axios";

export async function validatePrompt(prompt: string): Promise<boolean> {
  try {
    const response = await axios.post(
      "/api/validate",
      {
        prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Add some debugging
    console.log("Validation response:", response.data);

    return response.data.isValid;
  } catch (error) {
    console.error("Error validating prompt:", error);
    return false;
  }
}
