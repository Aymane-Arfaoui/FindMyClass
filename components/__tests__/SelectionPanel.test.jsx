import SectionPanel from '../SectionPanel.jsx';
import {render, screen, waitFor,userEvent} from '@testing-library/react-native';


describe('SectionPanel Component', () => {

    it('should not render if selectedSection is false',  async () => {
        render(<SectionPanel selectedSection={false}/>);
        await waitFor(() => {
            expect(screen.queryByTestId('section-panel')).toBeNull();
        });

    });
    it('should render if selectedSection is true',  async () => {
        render(<SectionPanel selectedSection={true} />);
        await waitFor(() => {
            expect(screen.getByTestId('section-panel')).toBeOnTheScreen();
        });


    });
    it('should trigger a function if pressed',  async () => {
        const mockFun = jest.fn();
        render(<SectionPanel  selectedSection={true} onClose={() => mockFun()}/>);
        const user = userEvent.setup();
        await user.press(screen.getByTestId('close-section-button'));
        await waitFor(() => {
            expect(mockFun).toHaveBeenCalled();
        });


    });

});