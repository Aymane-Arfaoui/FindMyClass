import MapButtons from '../MapButtons.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';


describe('MapButtons Component', () => {
    afterEach(jest.clearAllMocks)
    it('should render correctly',  () => {
        render(<MapButtons onPress={jest.fn()}/>);
        expect(screen.getByTestId('map-toggle-button')).toBeOnTheScreen();


    });
    it('should render the text correctly',  () => {
        render(<MapButtons onPress={jest.fn()}/>);
        expect(screen.getByTestId('map-toggle-button')).toHaveTextContent('LoyolaSGW');//concatenation of the locations



    });
    it('should call the onPress function SGW coordinates if SGW button is pressed',  async () => {
        const mockFun = jest.fn();
        const { unmount } = render(<MapButtons  onPress={mockFun}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('sgw-button'));
       // await waitFor(()=>{ expect(mockFun).toHaveBeenCalledWith([-73.5787, 45.4963]);});
        await waitFor(()=>{ expect(mockFun).toHaveBeenCalledWith([-73.5787, 45.4963]);});
        unmount();

    });
    it('should call the onPress function loyola coordinates if loyola button is pressed',  async () => {
        const mockFun = jest.fn();
        const { unmount } = render(<MapButtons  onPress={mockFun}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('loyola-button'));
        await waitFor(()=>{   expect(mockFun).toHaveBeenCalledWith([-73.6405, 45.4582]);});

        unmount();

    });
});