import React from "react";
import { render, fireEvent, waitFor,screen } from "@testing-library/react-native";
import EventList  from "../EventList";
import EditTasks from "@/components/EditTasks";

// Mock EditTasks component
jest.mock('@/components/EditTasks', () => ({
    __esModule: true,
    default: jest.fn(() => null),
}));

describe("EventList", () => {
    const mockEvents = [
        {
            id: 1,
            summary: "Event 1",
            description: "Description of event 1",
            location: "Location 1",
            start: { dateTime: "2025-03-31T10:00:00" },
            end: { dateTime: "2025-03-31T11:00:00" },
            itemType: "event",
            calendarName: "Main",
        },
        {
            id: 2,
            summary: "Task 1",
            description: "Description of task 1",
            location: "Task Location",
            start: { dateTime: "2025-03-31T10:00:00Z" },
            end: { dateTime: "2025-03-31T11:00:00Z" },
            itemType: "task",
            calendarName: "Work",
        },
    ];
    const mockOnUpdate = jest.fn();
    const mockOnSelectForRoute = jest.fn();
    const mockResetSelectionFlag = false;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders the list of events", async () => {


        render(
            <EventList
                events={mockEvents}
                onUpdate={mockOnUpdate}
                onSelectForRoute={mockOnSelectForRoute}
                resetSelectionFlag={mockResetSelectionFlag}
            />
        );

        expect(screen.getByText("Event 1")).toBeTruthy();
        expect(screen.getByText("Task 1")).toBeTruthy();
        expect(screen.getByText("Location 1")).toBeTruthy();
        expect(screen.getByText("Task Location")).toBeTruthy();
    });

    it("handles selecting an event for route", async () => {


       render(
            <EventList
                events={[mockEvents[0]]}
                onUpdate={mockOnUpdate}
                isPlanRouteMode={true}
                onSelectForRoute={mockOnSelectForRoute}
                resetSelectionFlag={mockResetSelectionFlag}
            />
        );

        fireEvent.press( screen.getByTestId("select-event-button"));

        await waitFor(() => {
            expect(mockOnSelectForRoute).toHaveBeenCalledWith({
                "1": ["Event 1", "Location 1", "2025-03-31", "10:00 AM"],
            });
        });
    });

    it("displays a message when no events are available", () => {
       render(
            <EventList
                events={[]}
                onUpdate={mockOnUpdate}
                onSelectForRoute={mockOnSelectForRoute}
                resetSelectionFlag={mockResetSelectionFlag}
            />
        );

        expect(screen.getByText("No events scheduled for this day")).toBeTruthy();
    });

    it("handles editing a task", async () => {

        render(
            <EventList
                events={[mockEvents[1]]}
                onUpdate={mockOnUpdate}
                onSelectForRoute={mockOnSelectForRoute}
                resetSelectionFlag={mockResetSelectionFlag}
            />
        );


        fireEvent.press(screen.getByTestId("edit-button"));

        await waitFor(() => {
            expect(EditTasks).toHaveBeenCalledWith(
                expect.objectContaining({
                    taskData: {
                        id: 2,
                        taskName: "Task 1",
                        notes: "Description of task 1",
                        address: "Task Location",
                        date: expect.any(Date),
                        startTime: expect.any(Date),
                        endTime: expect.any(Date),
                        allDayEvent: false,
                    },
                }),
                {}
            );
        });
    });
});
