import Button from '../Button.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';


describe('Button Component', () => {

     it('should not render if loading and the Loading component should render instead',  () => {
         render(<Button loading={true} />);
         expect(screen.getByTestId('loading')).toBeOnTheScreen();
         expect(screen.queryByTestId('button')).toBeNull();


     });
    it('should render if not loading',  () => {
        render(<Button loading={false} title={'Test'}/>);
        expect(screen.getByTestId('button')).toBeOnTheScreen();


    });
    it('should render the text correctly',  () => {
        render(<Button loading={false} title={'Test'}></Button>);
        expect(screen.getByText('Test')).toBeOnTheScreen();


    });
    it('should trigger a function if pressed',  async () => {
        const mockFun = jest.fn();
        render(<Button  onPress={() => mockFun()}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('button'));
        expect(mockFun).toBeCalled();


    });
});