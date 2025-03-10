import {render, screen, userEvent, waitFor} from "@testing-library/react-native";
import AppNavigationPannel from "@/components/AppNavigationPannel";
import {usePathname, useRouter} from "expo-router";
import Welcome from "@/app/Welcome";

describe('AppNavigationPannel Component', () => {

    it('should render all buttons correctly',  () => {
        const {unmount}=render(<AppNavigationPannel/>);
        expect(screen.getByTestId('navigation-panel')).toBeOnTheScreen();
        expect(screen.getByTestId('button-navigate-to-home')).toBeOnTheScreen();
        expect(screen.getByTestId('button-navigate-to-homemap')).toBeOnTheScreen();
        expect(screen.getByTestId('button-navigate-to-user')).toBeOnTheScreen();
        unmount();

    });
    it('should reroute to /home if home button is pressed',  async () => {
        const mock = {push: jest.fn()};
        useRouter.mockReturnValue(mock);
        usePathname.mockReturnValue("/home");
        const {unmount}=render(<AppNavigationPannel/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('button-navigate-to-home'));
        await waitFor(() => {
            expect(mock.push).toHaveBeenCalledWith('/home');
        });

        unmount();
    });
    it('should reroute to /homemap if home button is pressed',  async () => {
        const mock = {push: jest.fn()};
        useRouter.mockReturnValue(mock);
        usePathname.mockReturnValue("/homemap");
        const {unmount}= render(<AppNavigationPannel/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('button-navigate-to-homemap'));
        await waitFor(() => {
            expect(mock.push).toHaveBeenCalledWith('/homemap');
        });
        unmount();

    });
    it('should reroute to /home if home button is pressed',  async () => {
        const mock = {push: jest.fn()};
        useRouter.mockReturnValue(mock);
        usePathname.mockReturnValue("/user");
        const {unmount}=render(<AppNavigationPannel/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('button-navigate-to-user'));
        await waitFor(() => {
            expect(mock.push).toHaveBeenCalledWith('/user');
        });
        unmount();

    });
});