import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextAuth]/route";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { startDate, endDate } = await request.json();

  //Fetch busy intervals from Google Calendar API
  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/freeBusy",
    {
      headers: { Authorization: `Bearer ${session.accessToken}` },
      body: JSON.stringify({
        timeMin: startDate,
        timeMax: endDate,
        items: [{ id: "primary" }],
      }),
    }
  );
  const data = await response.json();
  console.log("busy times", data);
  return NextResponse.json(data.calendars.primary.busy);
}
