"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Generates a JSON array of EditorElement objects for a page builder.
 *
 * @param userInstruction – a plain-text description of the element(s) to create
 * @returns the model’s raw JSON (fenced with ---) or an error object
 */
export async function generateEditorElement(userInstruction: string) {
  const systemPrompt = `
You are a formatter that returns **only** a JSON array of \`EditorElement\` objects, nothing else.

---
## OUTPUT SPEC
* Return exactly ONE top-level JSON array.
* Fence the JSON with \`---\` on the line **before** and the line **after** (no back-ticks).
* Do **not** include comments or explanatory text.

## JSON SCHEMA (implicit)
type EditorElement = {
  id: string;                 // UUID v4
  name: string;
  type: "link" | "section" | "video" | "text" | "container" | "contactForm" | "2Col" | null;
  styles: {
    textAlign?:            "left"|"center"|"right"|"justify";
    fontFamily?:           "DM Sans";
    color?:                string;
    fontWeight?:           string;
    fontSize?:             string;
    height?:               string;
    width?:                string;
    marginTop?:            string;
    marginBottom?:         string;
    marginLeft?:           string;
    marginRight?:          string;
    paddingTop?:           string;
    paddingBottom?:        string;
    paddingLeft?:          string;
    paddingRight?:         string;
    opacity?:              string;
    borderRadius?:         string;
    backgroundColor?:      string;
    backgroundImage?:      string;
    backgroundSize?:       string;
    justifyContent?:       string;
    alignItems?:           string;
    display?:              string;
    flexDirection?:        string;
  };
  content:
    | EditorElement[]
    | { href?: string; innerText?: string; src?: string };
};

## RULES
1. Use **only** the keys listed above; omit undefined keys.
2. All CSS values and literals are strings.
3. \`id\` **must** be unique UUID-v4 per element.
4. If a style is omitted, assume
   { "textAlign": "left", "opacity": "100%", "backgroundRepeat": "no-repeat", "objectFit": "cover" }.
5. Depth ≤ 4 levels and ≤ 12 total elements unless the user prompt requests more.
6. Never wrap the JSON in back-ticks or markdown.
7. The type of the element is always one of the following:
    \`link\`, \`section\`, \`video\`, \`text\`, \`container\`, \`contactForm\`, \`2Col\`.
8. The \`content\` of a \`link\` element is an object with \`href\` and \`innerText\`.
9. The \`content\` of a \`video\` element is an object with \`src\` and \`innerText\`.
10. The \`content\` of a \`text\` element is a string.
11. The \`content\` of a \`container\` element is an array of \`EditorElement\` objects.
12. The Name of the element shoud always be the same as the type of the element.
## TASK
Using the user instruction that follows, think step-by-step, then output the JSON array.

---`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userInstruction },
      ],
    });
    console.log("AI response:", completion.choices[0]?.message?.content);

    return completion.choices[0]?.message?.content;
  } catch (error: any) {
    console.error("generateEditorElement:", error);
    return { error: error.message };
  }
}
