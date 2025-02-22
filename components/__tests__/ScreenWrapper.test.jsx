import {render, screen} from "@testing-library/react-native";
import ScreenWrapper from "@/components/ScreenWrapper.jsx";

describe('Screen Wrapper Component', () => {
    it('should render correctly', () => {
        render(<ScreenWrapper/>);
        expect(screen.getByTestId('screen-wrapper')).toBeOnTheScreen();

    });
    it('should render children', async () => {

        render(<ScreenWrapper><h1>Test</h1></ScreenWrapper>);
        expect(screen.getByTestId('screen-wrapper')).toHaveTextContent('Test');

    });

});