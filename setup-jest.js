const {goBack} = require("expo-router/build/global-state/routing");
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock') );

//mocking the useRouter
jest.mock('expo-router',
    ()=> (
        {
            useRouter: jest.fn(),
            useSegments:jest.fn(),
            Stack:jest.fn(),
            usePathname:jest.fn(),
        }
    ));
jest.mock('expo-font');

jest.mock('react-native-vector-icons/FontAwesome', () => 'Icon');
jest.mock('@react-navigation/native', () => ({
    useNavigation: ()=>({
        navigate:jest.fn(),
        goBack:jest.fn()
    }),
    useRoute: jest.fn(),
}));

