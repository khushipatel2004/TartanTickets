import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EventBrowser from "./event-browser";
import { GET } from "./api/events/route";
import { events } from "@/lib/events";

describe("Story 1: Browse events", () => {
  it("lists upcoming events with their date, location, price, and seats remaining", () => {
    render(<EventBrowser events={events} />);

    expect(
      screen.getByRole("heading", { name: "What's happening" }),
    ).toBeInTheDocument();

    const afterglow = screen.getByRole("article", {
      name: "Fall Fest: Afterglow",
    });
    const afterglowCard = within(afterglow);
    expect(afterglowCard.getByText("Fri, Oct 23 · 8:00 PM")).toBeInTheDocument();
    expect(afterglowCard.getByText("Cohon University Center")).toBeInTheDocument();
    expect(afterglowCard.getByText("$12")).toBeInTheDocument();
    expect(afterglowCard.getByText("18 of 220 left")).toBeInTheDocument();

    const freeEvent = screen.getByRole("article", {
      name: "The Great Pumpkin Social",
    });
    expect(within(freeEvent).getByText("Free")).toBeInTheDocument();
  });

  it("shows Join waitlist instead of Get tickets when an event is sold out", () => {
    render(<EventBrowser events={events} />);

    const soldOutEvent = screen.getByRole("article", {
      name: "Printmaking After Hours",
    });
    const soldOutCard = within(soldOutEvent);

    expect(soldOutCard.getByText("Sold out")).toBeInTheDocument();
    expect(
      soldOutCard.getByRole("button", { name: /Join waitlist/ }),
    ).toBeInTheDocument();
    expect(
      soldOutCard.queryByRole("button", { name: /Get tickets/ }),
    ).not.toBeInTheDocument();
  });

  it("can filter the event list and offers a clear empty state", () => {
    render(<EventBrowser events={events} />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search events" }), {
      target: { value: "no matching event" },
    });

    expect(screen.getByRole("status")).toHaveTextContent("No events found");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(6);
  });

  it("serves the browseable events from the in-memory server list", async () => {
    const response = GET();
    const responseEvents = await response.json();

    expect(response.status).toBe(200);
    expect(responseEvents).toHaveLength(6);
    expect(responseEvents[0]).toMatchObject({
      title: "Fall Fest: Afterglow",
      location: "Cohon University Center",
      remaining: 18,
    });
  });

  it("offers name-only demo checkout without collecting a real payment", () => {
    render(<EventBrowser events={events} />);
    fireEvent.click(screen.getByRole("button", { name: /Get tickets/ }));

    expect(screen.getByLabelText("Your name")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Taylor Tartan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simulated payment" }));

    expect(
      screen.getByText(/Payment simulated for Taylor Tartan/),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument();
  });
});
