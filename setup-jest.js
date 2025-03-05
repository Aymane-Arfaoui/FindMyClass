jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

//mocking the useRouter
jest.mock('expo-router',
    ()=> (
        {
            useRouter: jest.fn(),
            useSegments:jest.fn(),
            Stack:jest.fn(),
            usePathname:jest.fn()
        }
    ));
jest.mock('expo-font');



