import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

Object.defineProperty(window, "scrollTo", { value: vi.fn(), writable: true });

describe("multi-event app", () => {
  it("keeps the original branded UNLOCK landing inside the multi-event archive", () => {
    window.history.replaceState(null, "", "/");
    render(<App />);

    expect(screen.getByRole("heading", { name: "The day AI met the wet lab." })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What do you want to unlock?" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "8 talks worth replaying." })).toBeInTheDocument();
    const header = screen.getByRole("banner");
    expect(within(header).getByText("AI × SCIENCE")).toBeInTheDocument();
    expect(within(header).queryByText("TRANSCRIPT ARCHIVE")).not.toBeInTheDocument();
    expect(within(header).getByText("Choose a conference")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Conference selector" })).toHaveValue("unlock2026");
    expect(screen.getByRole("option", { name: "UNLOCK 2026 · April 22, 2026" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WorkOS Agent Night · August 12, 2026" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Official site/i })).toHaveAttribute(
      "href",
      "https://www.unlockscience.ai/",
    );
  });

  it("renders the requested event landing page with its source and session", () => {
    window.history.replaceState(null, "", "/events/aiewf");
    render(<App />);

    const navigation = screen.getByRole("navigation", { name: "Conference navigation" });
    expect(within(navigation).getByText("Choose a conference")).toBeInTheDocument();
    expect(within(navigation).getByRole("combobox", { name: "Conference selector" })).toHaveValue("aiewf");
    expect(within(navigation).queryByRole("link", { name: "Source ↗" })).not.toBeInTheDocument();
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
