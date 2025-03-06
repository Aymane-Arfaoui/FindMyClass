import {render, screen} from "@testing-library/react-native";
import Calendar from "@/components/Calendar";

let events=[
    {
        "summary": "test1",
        "location": "test1",
        "description": "test1",
        "start": {
            "dateTime": "2025-02-10T10:00:00-05:00",
            "timeZone": "America/New_York"
        },
        "end": {
            "dateTime": "2025-02-10T11:00:00-05:00",
            "timeZone": "America/New_York"
        }
    },
    {
        "summary": "test2",
        "location": "test2",
        "description": "test2",
        "start": {
            "dateTime": "2025-02-11T10:00:00-05:00",
            "timeZone": "America/New_York"
        },
        "end": {
            "dateTime": "2025-02-11T11:00:00-05:00",
            "timeZone": "America/New_York"
        }
    }

];
describe('Calendar Component', () => {
    it('should render correctly', () => {
        render(<Calendar events={events}/>);
        expect(screen.getByTestId('calendar')).toBeOnTheScreen();

    });


});