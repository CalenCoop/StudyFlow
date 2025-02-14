"use client";
import { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    const testBusyTimes = async () => {
      try {
        const response = await fetch("/api/fetch-busy-times", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startDate: new Date().toISOString(),
            endDate: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          }),
        });

        const data = await response.json();
        console.log("Busy times:", data);
      } catch (error) {
        console.error("Test failed:", error);
      }
    };

    testBusyTimes();
  }, []);

  return <div>Check browser console and server logs for results</div>;
}
