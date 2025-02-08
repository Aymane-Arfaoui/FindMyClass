import Index from '../index.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';
import { useRouter } from 'expo-router'

jest.mock('expo-router', ()=> ({useRouter: jest.fn()}))

describe('Index Component', () => {

    it('should render the text and button correctly',  async () => {
        render(<Index/>);
        expect(await screen.findByTestId("index-image")).toBeOnTheScreen();


    });

    it('should call the router after some time',  () => {
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);
        render(<Index/>);

        jest.useFakeTimers();
         jest.advanceTimersByTime(4200)
        expect(mock.push).toHaveBeenCalled();
         jest.clearAllMocks();

    });
    
});