import { NextResponse } from "next/server";
import OpenAI from "openai";
import { start } from "repl";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

interface AITask {
  task: string;
  duration: number;
  recurring?: boolean;
}

interface AIDailySchedule {
  [day: string]: Array<{
    task: string;
    duration: number;
  }>;
}

interface ScheduleTask extends AITask {
  date: string;
}

function mapScheduleToDates(
  aiSchedule: AIDailySchedule,
  deadlineWeeks: number,
  daysPerWeek: number
): ScheduleTask[] {
  const startDate = new Date();
  const scheduledTasks: ScheduleTask[] = [];
  let currentDate = new Date(startDate);

  // Get ordered day names from AI response
  const daysInOrder = Object.keys(aiSchedule);

  for (let week = 0; week < deadlineWeeks; week++) {
    daysInOrder.forEach((dayName) => {
      // Skip weekends if needed
      if (daysPerWeek < 7) {
        // Skip Saturday (6) and Sunday (0)
        while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      const tasks = Array.isArray(aiSchedule[dayName])
        ? aiSchedule[dayName]
        : [];
      tasks.forEach((task) => {
        if (typeof task === "object" && task.duration) {
          scheduledTasks.push({
            task: task.task,
            duration: task.duration,
            date: currentDate.toISOString().split("T")[0],
          });
        }
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    });
  }

  return scheduledTasks;
}

export async function POST(request: Request) {
  try {
    //parse the req body
    const { topic, hoursPerDay, deadline, daysPerWeek } = await request.json();

    //Generate the study plan using GPT-40
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "system",
          content: `Create a ${deadline}-week study plan for ${topic} with ${hoursPerDay} hours/day, ${daysPerWeek} days/week.
          Return JSON with a "schedule" object containing daily plans. Each day should have:
          - 1-3 focused tasks
          - Total duration exactly ${hoursPerDay * 60} minutes
          Example response:
          {
            "schedule": {
              "Monday": [
                { "task": "Warm-up exercises", "duration": 15 },
                { "task": "Sight reading practice", "duration": 45 }
              ],
              "Wednesday": [
                { "task": "Scale practice", "duration": 30 },
                { "task": "Piece rehearsal", "duration": 30 }
              ]
            }
          }`,
        },
      ],
      response_format: { type: "json_object" },
    });

    // console.log("Raw OpenAI Response:", completion);
    // console.log("raw openai response");
    // console.dir(completion, { depth: null });

    //parse AI response

    const aiResponse = JSON.parse(
      completion.choices[0].message.content || "{}"
    );
    // Validate response structure
    if (!aiResponse?.schedule || typeof aiResponse.schedule !== "object") {
      console.error("Invalid schedule format:", aiResponse);
      throw new Error("AI returned an invalid schedule format");
    }

    // Validate at least one day exists
    const scheduleDays = Object.keys(aiResponse.schedule);
    if (scheduleDays.length === 0) {
      throw new Error("AI returned an empty schedule");
    }

    const schedulePlan = mapScheduleToDates(
      aiResponse.schedule,
      parseInt(deadline),
      parseInt(daysPerWeek)
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
