"use client";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { StudyTask } from "../page";

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
}

export default function Calendar({ events }: { events: StudyTask[] }) {
  //convert study tasks to calendar events
  const calendarEvents: CalendarEvent[] = events?.map((task) => ({
    title: `${task.task} (${task.duration} mins)`,
    start: new Date(), //replace with actual dates from scheduling logic
    end: new Date(new Date().getTime() + task.duration * 60000), //convert minutes to milliseconds
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridWeek"
      events={calendarEvents}
      editable={true}
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridDay, dayGridWeek, dayGridMonth",
      }}
    />
  );
}
