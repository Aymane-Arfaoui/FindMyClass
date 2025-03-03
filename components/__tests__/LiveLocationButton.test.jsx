import LiveLocationButton from '../LiveLocationButton.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';
import { getUserLocation } from '@/services/userService';
jest.mock('@/services/userService', ()=> ({getUserLocation: jest.fn()}));
describe('LiveLocationButton Component', () => {
    beforeEach(()=>{
           getUserLocation.mockReturnValue({lat: 1, lng: 1});
        }
    );
    it('should render correctly',  () => {
        const { unmount } = render(<LiveLocationButton />);
        expect(screen.getByTestId('live-location-button')).toBeOnTheScreen();
        unmount();
    });

    it('should trigger a function if pressed',  async () => {
        const mockFun = jest.fn();
        const { unmount } =render(<LiveLocationButton  onPress={() => mockFun()}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('live-location-button'));
        expect(mockFun).toBeCalled();

        unmount();
    });
});