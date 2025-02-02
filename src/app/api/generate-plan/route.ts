import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export async function POST(request: Request) {
  try {
    //parse the req body
    const { topic, hoursPerDay, deadline } = await request.json();

    //Generate the study plan using GPT-40
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "system",
          content: `You are a study planner AI. Generate a structure study plan with subtasks and differing time allocations based on your judgement.`,
        },
        {
          role: "user",
          content: `Create a study plan for ${topic} to be completed in ${deadline} with ${hoursPerDay} hours per day.
            Split into subtopics with weighted and or differing time allocations per day. Prioritze fundimentals first. Return the response as a JSON array like: [{ "task": "Learn Flexbox", "duration": 60 }{ "task": "Practice Javascript methods", "duration": 20 }]`,
        },
      ],
      response_format: { type: "json_object" },
    });
    //Extract and parse the JSON response
    const content = completion.choices[0].message.content;
    const plan = JSON.parse(content || "{}");
    console.log(plan);
    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.log("OpenAI API error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}

// import OpenAI from "openai";

// const openai = new OpenAI({
//   apiKey: "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",
// });

// const completion = openai.chat.completions.create({
//   model: "gpt-4o-mini",
//   store: true,
//   messages: [
//     {"role": "user", "content": "write a haiku about ai"},
//   ],
// });

// completion.then((result) => console.log(result.choices[0].message));
