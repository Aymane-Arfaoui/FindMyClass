import { Platform } from 'react-native';
import { taskService } from './taskService';

class ChatService {
    getBaseUrl() {
        // Use localhost for iOS simulator and 10.0.2.2 for Android emulator
        const host = Platform.OS === 'ios' ? 'localhost' : '10.0.2.2';
        const url = `http://${host}:5001`;
        return url;
    }

    async processMessage(message) {
        try {
            // Determine which endpoint to use
            const isNavigationQuery = this.checkIfNavigationQuery(message);
            return isNavigationQuery ? 
                await this.processNavigationQuery(message) : 
                await this.processTaskQuery(message);
        } catch (error) {
            console.error('Error in processMessage:', error);
            return {
                content: "Sorry, I encountered an error while processing your message. Please try again."
            };
        }
    }
    
    async processNavigationQuery(message) {
        try {
            const url = `${this.getBaseUrl()}/chat/navigation`;
            
            const requestBody = {
                query: message
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                console.error(`Navigation request failed: ${response.status}`);
                throw new Error(`Server error: ${response.status}`);
            }
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse navigation response:', parseError);
                throw new Error('Invalid response format from server');
            }
            
            return data.response ? data : { content: "I need more information to provide directions." };
        } catch (error) {
            console.error('Error in processNavigationQuery:', error);
            return {
                content: "Sorry, I encountered an error while processing your navigation request. Please try again."
            };
        }
    }
    
    async processTaskQuery(message) {
        try {
            const tasks = await taskService.getAllTasks();
            const url = `${this.getBaseUrl()}/chat/tasks`;
            
            const requestBody = {
                query: message,
                tasks: tasks
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                console.error(`Task request failed: ${response.status}`);
                throw new Error(`Server error: ${response.status}`);
            }
            
            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error('Failed to parse task response:', parseError);
                throw new Error('Invalid response format from server');
            }
            
            return data.response ? data : { content: "I need more information to help with that." };
        } catch (error) {
            console.error('Error in processTaskQuery:', error);
            return {
                content: "Sorry, I encountered an error while processing your message. Please try again."
            };
        }
    }
    
    // Simple client-side check for navigation queries
    checkIfNavigationQuery(message) {
        const navigationKeywords = [
            "how do i get", "how to get", "where is", "directions to",
            "path to", "route to", "way to", "navigate to", "go from",
            "to", "from", "how long", "time", "distance"
        ];
        
        const messageLower = message.toLowerCase();
        
        // Check for room numbers (e.g., H-109, H109, etc.)
        const roomPattern = /h\s*[-]?\s*\d{3}/i;
        const hasRoomNumbers = roomPattern.test(messageLower);
        
        // Check for room numbers mentioned twice (likely a from/to query)
        const multipleRoomsMentioned = (messageLower.match(/h\s*[-]?\s*\d{3}/gi) || []).length >= 2;
        
        // Check for navigation keywords
        const hasNavigationKeywords = navigationKeywords.some(keyword => 
            messageLower.includes(keyword)
        );
        
        // Direct test for "How to go from H x to H y" pattern
        const directPattern = /how to go from h\s*\d{3} to h\s*\d{3}/i;
        const isDirectMatch = directPattern.test(messageLower);
        
        // If a query directly matches our pattern OR has multiple rooms with navigation keywords
        const result = isDirectMatch || multipleRoomsMentioned || (hasRoomNumbers && hasNavigationKeywords);
        
        return result;
    }
}

export const chatService = new ChatService(); 