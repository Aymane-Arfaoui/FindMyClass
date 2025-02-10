import LiveLocationButton from '../LiveLocationButton.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';
import { getUserLocation } from '@/services/userService';
jest.mock('@/services/userService', ()=> ({getUserLocation: jest.fn()}));
jest.mock("expo-font");
describe('LiveLocationButton Component', () => {
    beforeEach(()=>{
           getUserLocation.mockReturnValue({lat: 1, lng: 1});
        }
    );
    it('should render correctly',  () => {
        render(<LiveLocationButton />);
        expect(screen.getByTestId('live-location-button')).toBeOnTheScreen();
    });

    it('should trigger a function if pressed',  async () => {
        const mockFun = jest.fn();
        render(<LiveLocationButton  onPress={() => mockFun()}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('live-location-button'));
        expect(mockFun).toBeCalled();


    });
});