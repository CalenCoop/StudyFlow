import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

interface AITask {
  task: string;
  duration: number;
}

interface ScheduleTask extends AITask {
  date: string;
}

//helper function to spread tasks across days
function scheduleTasks(
  tasks: AITask[],
  hoursPerDay: number,
  deadlineWeeks: number
): ScheduleTask[] {
  const startDate = new Date();
  const dailyMinutes = hoursPerDay * 60;
  let currentDay = new Date(startDate);
  let dailyBudget = dailyMinutes;
  return tasks?.map((task) => {
    //allocate task to current day if theres enough time
    if (dailyBudget >= task.duration) {
      dailyBudget -= task.duration;
    } else {
      currentDay.setDate(currentDay.getDate() + 1);
      dailyBudget = dailyMinutes - task.duration;
    }
    return {
      ...task,
      date: currentDay.toISOString().split("T")[0], //YYYY-MM-DD format
    };
  });
}

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
          content: "Generate a study plan with tasks and durations in minutes.",
        },
        {
          role: "user",
          content: `Create a ${deadline}-week plan for ${topic} with ${hoursPerDay} hours/day. Return JSON, for example JSON: { "tasks": [{"Learn Flexbox", "duration": 60 }] }`,
        },
      ],
      response_format: { type: "json_object" },
    });

    console.log("Raw OpenAI Response:", completion);
    //parse AI response
    const aiPlan = completion.choices[0].message.content;
    if (!aiPlan) throw new Error("No content in the OpenAI response");

    console.log("aiPlan", console.log(aiPlan));

    const plan = JSON.parse(aiPlan);
    if (!plan.tasks || !Array.isArray(plan.tasks)) {
      throw new Error("Invalid plan format from OpenAI");
    }

    const schedulePlan = scheduleTasks(
      plan.tasks,
      parseInt(hoursPerDay),
      parseInt(deadline)
    );
    console.log("Scheduled Plan:", schedulePlan);
    return NextResponse.json(schedulePlan);
  } catch (error) {
    console.log("OpenAI API error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
