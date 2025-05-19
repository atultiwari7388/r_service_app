"use-client";
import { useEffect, useState } from "react";

export const SwitchTheme = () => {
  const [theme, setTheme] = useState("emerald");

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "emerald" ? "dark" : "emerald";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  // Set initial theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "emerald"; // Default to emerald
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  return (
    <section>
      <label className="flex items-center cursor-pointer">
        <div className="relative">
          <input
            type="checkbox"
            className="hidden"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <div className="block bg-gray-600 w-10 h-6 rounded-full"></div>
          <div
            className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
              theme === "dark" ? "transform translate-x-full bg-gray-900" : ""
            }`}
          ></div>
        </div>
      </label>
    </section>
  );
};
