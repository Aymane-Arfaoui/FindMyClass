import {render, screen} from "@testing-library/react-native";
import Calendar from "@/components/Calendar";

describe('Calendar Component', () => {
    it('should render correctly', () => {
        render(<Calendar events={[]}/>);
        expect(screen.getByTestId('calendar')).toBeOnTheScreen();

    });

});