import MapButtons from '../MapButtons.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';


describe('MapButtons Component', () => {

    it('should render correctly',  () => {
        render(<MapButtons onPress={jest.fn()}/>);
        expect(screen.getByTestId('map-buttons')).toBeOnTheScreen();


    });
    it('should render the text correctly',  () => {
        render(<MapButtons onPress={jest.fn()}/>);
        expect(screen.getByTestId('map-buttons')).toHaveTextContent('SGWLoyola');//concatenation of the locations



    });
    it('should trigger a function if pressed',  async () => {
        const mockFun = jest.fn();
        render(<MapButtons  onPress={() => mockFun()}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('SGW'));
        expect(mockFun).toBeCalled();


    });
});