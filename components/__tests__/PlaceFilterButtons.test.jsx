import React from "react";
import {render, fireEvent, waitFor, screen, userEvent} from "@testing-library/react-native";
import PlaceFilterButtons from "../PlaceFilterButtons"; // Adjust this path according to your folder structure
import { Ionicons } from "@expo/vector-icons";
import { Animated } from "react-native";

// Mock Ionicons and Animated
jest.mock("@expo/vector-icons", () => ({
    Ionicons: jest.fn(() => null),
}));



describe("PlaceFilterButtons", () => {
    let onSelectCategoryMock;
    jest.useFakeTimers()
    beforeEach(() => {
        onSelectCategoryMock = jest.fn();
    });

    it("should render correctly", () => {
        render(<PlaceFilterButtons onSelectCategory={onSelectCategoryMock} />);

        expect(screen.getByTestId("toggle-button")).toBeOnTheScreen();
    });

    it("should toggle expanded state on button press", async () => {
       render(<PlaceFilterButtons onSelectCategory={onSelectCategoryMock} />);

        //not expanded
        let buttonWrapper = screen.queryByTestId("buttons-wrapper");
        expect(buttonWrapper).toBeFalsy();

        const user=userEvent.setup();
        await user.press(screen.getByTestId("toggle-button"));

        // expanded
        await waitFor(() => {
            buttonWrapper = screen.getByTestId("buttons-wrapper");
            expect(buttonWrapper).toBeOnTheScreen();
        });
    });

    it("should call onSelectCategory with the correct category", async () => {
        render(<PlaceFilterButtons onSelectCategory={onSelectCategoryMock} />);

        const user = userEvent.setup();
        await user.press(screen.getByTestId("toggle-button"));

        const restaurantButton = screen.getByText("Restaurants");

        await user.press(restaurantButton);
        expect(onSelectCategoryMock).toHaveBeenCalledWith("restaurant");

    });



});
