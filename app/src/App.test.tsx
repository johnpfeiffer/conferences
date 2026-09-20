import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });

describe("multi-event app", () => {
  it("renders the requested event landing page with its source and session", () => {
    window.history.replaceState(null, "", "/events/aiewf");
    render(<App />);

    expect(screen.getByRole("heading", { name: "The engineering behind useful agents." })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official event site/i })).toHaveAttribute(
      "href",
      "https://ai.engineer/worldsfair/2026",
    );
    expect(screen.getByText("Building Closed-Loop Evals for a Multimodal Agent at Scale"))
      .toBeInTheDocument();
    expect(screen.queryByText("Panel: The State of Agents")).not.toBeInTheDocument();
  });

  it("renders a non-UNLOCK transcript reader from its event-scoped route", () => {
    window.history.replaceState(
      null,
      "",
      "/events/2026-08-12-workos-agent-night/talk/workos-state-of-agents",
    );
    render(<App />);

    expect(screen.getByRole("heading", { name: "Panel: The State of Agents" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: /Compare with original/i })).not.toBeChecked();
    expect(screen.getByRole("link", { name: /Back to WorkOS Agent Night/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watch video at 57:12" }))
      .toHaveAttribute("href", expect.stringContaining("t=3432s"));
  });
});
