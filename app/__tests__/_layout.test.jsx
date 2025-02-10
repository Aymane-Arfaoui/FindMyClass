import RootLayout from '../_layout.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import {Stack,useRouter, useSegments} from 'expo-router';
import react from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

//mocking the useRouter
jest.mock('expo-router',
    ()=> (
        {
            useRouter: jest.fn(),
            useSegments:jest.fn(),
            Stack:jest.fn()
        }
));
describe('Layout Component', () => {
    afterEach(
        ()=> {AsyncStorage.clear();}
    );

    it('should reroute to /home if user exists and (auth) is not present in the route segment',  async () => {
        const user=JSON.stringify({name:"asd"});
        await AsyncStorage.setItem('@user',user);
        //returning the segment that should be there if the user is authenticated
        useSegments.mockReturnValue(["/"]);
        const replace = jest.fn();
        useRouter.mockReturnValue({replace: replace});
        render(<RootLayout/>);
       await waitFor(()=>{expect(replace).toHaveBeenCalledWith('/home');});

    });

    it('should reroute to "/" if user doesnt exist and (auth) is present in the route segment',  async () => {
        useSegments.mockReturnValue(["(auth)"]);
        const replace = jest.fn();
        useRouter.mockReturnValue({replace: replace});
        render(<RootLayout/>);
        await waitFor(()=>{expect(replace).toHaveBeenCalledWith('/');});

    });



});