import Index from '../index.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';
import { useRouter } from 'expo-router'

jest.mock('expo-router', ()=> ({useRouter: jest.fn()}))

describe('Index Component', () => {

    it('should render the text and button correctly',  () => {
        render(<Index/>);
        expect(screen.getByText("ConUMaps")).toBeOnTheScreen();


    });

    it('should call the router after some time',  () => {
        const mock={push:jest.fn()};
        useRouter.mockReturnValue(mock);
        render(<Index/>);

        jest.useFakeTimers();
         jest.advanceTimersByTime(3000)
        expect(mock.push).toHaveBeenCalled();
         jest.clearAllMocks();

    });
});