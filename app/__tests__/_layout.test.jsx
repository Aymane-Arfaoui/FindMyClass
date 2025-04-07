import {useAuth} from "@/context/auth";

jest.useFakeTimers()
import RootLayout from '../_layout.jsx';
import {render, screen, waitFor, userEvent, act} from '@testing-library/react-native';
import {Stack,useRouter, useSegments} from 'expo-router';
import react from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

describe('Layout Component', () => {
    afterEach(()=> {
        jest.clearAllMocks();
        AsyncStorage.clear();
    }
    );

    it('should reroute to "/" if user doesnt exist and (auth) is present in the route segment',  async () => {
        useSegments.mockReturnValue(["(auth)"]);
        const replace = jest.fn();
        useRouter.mockReturnValueOnce({replace: replace});
        render(<RootLayout/>);
        await waitFor(()=>{expect(replace).toHaveBeenCalledWith('/');});

    });



});