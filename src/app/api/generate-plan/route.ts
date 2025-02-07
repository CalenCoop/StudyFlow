import { NextResponse } from "next/server";
import OpenAI from "openai";
import { start } from "repl";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

interface AITask {
  task: string;
  duration: number;
  recurring?: boolean;
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

  const scheduledTasks: ScheduleTask[] = [];

  // Schedule recurring tasks first
  for (let day = 0; day < deadlineWeeks * 7; day++) {
    // Reset daily budget for each day
    dailyBudget = dailyMinutes;

    // Add recurring tasks
    tasks
      .filter((task) => task.recurring)
      .forEach((task) => {
        scheduledTasks.push({
          ...task,
          date: currentDay.toISOString().split("T")[0],
        });
        dailyBudget -= task.duration;
      });

    // Add non-recurring tasks (split into chunks if needed)
    tasks
      .filter((task) => !task.recurring)
      .forEach((task) => {
        let remainingDuration = task.duration;
        while (remainingDuration > 0) {
          const chunk = Math.min(remainingDuration, dailyBudget);
          if (chunk <= 0) break;

          scheduledTasks.push({
            task: `${task.task} (${chunk} mins)`,
            duration: chunk,
            date: currentDay.toISOString().split("T")[0],
          });

          remainingDuration -= chunk;
          dailyBudget -= chunk;

          // Move to next day if budget exhausted
          if (dailyBudget <= 0) {
            currentDay.setDate(currentDay.getDate() + 1);
            dailyBudget = dailyMinutes;
          }
        }
      });

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return scheduledTasks;
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
          content: `You are a study planner AI. Generate a structured study plan with tasks and varying durations in minutes. 
                Include:
                -daily recurring tasks (max 25 minutes total)
                - Unique weekly tasks with specific goals
                Return a JSON object with a 'tasks' array.
                Example: 
                {
                  "tasks": [
                    { "task": "Solve a LeetCode problem (Arrays)", "duration": 15, "recurring": true },
                    { "task": "Build a responsive navbar using Flexbox", "duration": 45, "recurring": false },
                    { "task": "Learn React useState hook", "duration": 30, "recurring": false }
                  ]
                }`,
        },
        {
          role: "user",
          content: `Create a ${deadline}-week plan for ${topic} with ${hoursPerDay} hours/day. 
            Recurring tasks (warmups, reviews) should take 15-30 mins/day. 
            Non-recurring tasks must fit in the remaining time (max ${
              hoursPerDay * 60 - 45
            } mins/day). 
            Return JSON: { "tasks": [...] }`,
        },
      ],
      response_format: { type: "json_object" },
    });

    // console.log("Raw OpenAI Response:", completion);
    // console.log("raw openai response");
    // console.dir(completion, { depth: null });
    //parse AI response
    const aiPlan = completion.choices[0].message.content;
    if (!aiPlan) throw new Error("No content in the OpenAI response");

    console.log("aiPlan", aiPlan);

    const plan = JSON.parse(aiPlan);
    if (!plan.tasks || !Array.isArray(plan.tasks)) {
      throw new Error("Invalid plan format from OpenAI");
    }

    const schedulePlan = scheduleTasks(
      plan.tasks,
      parseInt(hoursPerDay),
      parseInt(deadline)
    );
    // console.log("Scheduled Plan:", schedulePlan);
    return NextResponse.json(schedulePlan);
  } catch (error) {
    console.log("OpenAI API error", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
