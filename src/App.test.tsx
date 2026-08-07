import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the planner heading and programme navigation", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Field Notes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Planner views" }),
    ).toBeInTheDocument();
  });
});
