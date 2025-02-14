"use client";
import React from "react";
import { useState } from "react";
import Calendar from "./components/Calendar";

export interface StudyTask {
  task: string;
  duration: number;
  date: string;
  // start: string;
  // end:string;
}

export default function Home() {
  const [topic, setTopic] = React.useState("");
  const [hoursPerDay, setHoursPerDay] = React.useState(1);
  const [plan, setPlan] = React.useState<StudyTask[]>([]);
  const [daysPerWeek, setDaysPerWeek] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  function loadMore() {
    setPage((prev) => prev + 1);
  }
  React.useEffect(() => {
    if (page === 1) return;
    fetch(`api/generate-plan?page=${page}`)
      .then((res) => res.json())
      .then((data) => setPlan((prev) => [...prev, ...data.plan]));
  }, [page]);

  //make deadline work
  const [deadline, setDeadline] = React.useState(null);
  //create start Date variable

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({ topic, hoursPerDay, deadline: 4 }),
        //hardcoding deadline for now, change later
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate plan");
      }
      console.log("data", data);
      setPlan(data); //adjust based on the OpenAI response structure
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }
  // console.log("plan", plan);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">AI Study Planner</h1>
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="What would you like to learn?"
            className="border text-black p-2 flex-1 rounded "
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
          />
          <input
            type="number"
            placeholder="Hours/day"
            className="border p-2 w-24 rounded text-black"
            min="1"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(Number(e.target.value))}
            required
          />
          <input
            type="number"
            placeholder="Days/Week"
            min="1"
            max="7"
            className="border p-2 w-24 rounded text-black"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(Number(e.target.value))}
          />
          {/* <input type="text" /> */}
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={isLoading}
          >
            {isLoading ? "Generating..." : "Generate Plan"}
          </button>
          <button onClick={loadMore} className="mt-4 bg-gray-200 p-2 rounded">
            Load Next 2 Weeks
          </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
      </form>
      {/* Display the generated plan */}
      {plan && plan.length > 0 && (
        <div className="mb-8">
          {/* <h2 className="text-xl font-semibold mb-4"> Your Study Plan</h2>
          <ul className="list-disc pl-6">
            {plan.map((task, index) => (
              <li key={index} className="mb-2">
                {task.task} ({task.duration} minutes) -{" "}
                {new Date(task.date).toLocaleDateString()}
              </li>
            ))}
          </ul> */}
        </div>
      )}
      {/* Calendar Component */}
      <Calendar events={plan} />
    </div>
  );
}
