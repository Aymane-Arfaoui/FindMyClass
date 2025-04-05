import { Platform } from 'react-native';
import { taskService } from './taskService';

class ChatService {
    getBaseUrl() {
        let host;
        if (Platform.OS === 'ios') {
            host = 'localhost';
        } else if (Platform.OS === 'android') {
            host = '10.0.2.2';
        } else {
            // Explicitly use 127.0.0.1 for web to avoid localhost resolution issues
            host = '127.0.0.1';
        }
        const url = `http://${host}:5001`;
        console.log(`Using base URL: ${url}`);
        return url;
    }

    async processMessage(message) {
        try {
            console.log(`Processing message: "${message}"`);
            
            // Determine which endpoint to use
            const isNavigationQuery = this.checkIfNavigationQuery(message);
            console.log(`Is navigation query: ${isNavigationQuery}`);
            
            if (isNavigationQuery) {
                return await this.processNavigationQuery(message);
            } else {
                return await this.processTaskQuery(message);
            }
        } catch (error) {
            console.error(`Error in processMessage: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your message. Please try again."
            };
        }
    }
    
    async processNavigationQuery(message) {
        try {
            // Use the navigation-specific endpoint
            const url = `${this.getBaseUrl()}/chat/navigation`;
            console.log(`Sending navigation request to: ${url}`);
            
            const requestBody = {
                query: message
            };
            
            console.log(`Navigation request body: ${JSON.stringify(requestBody, null, 2)}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                console.error(`Navigation response not ok: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(`Response text: ${text}`);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Navigation response: ${JSON.stringify(data, null, 2)}`);
            
            return data.response ? data : { content: "I need more information to provide directions." };
        } catch (error) {
            console.error(`Error in processNavigationQuery: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your navigation request. Please try again."
            };
        }
    }
    
    async processTaskQuery(message) {
        try {
            // Always include tasks for task queries
            const tasks = await taskService.getAllTasks();
            console.log(`Retrieved ${tasks.length} tasks`);
            
            // Use the tasks endpoint
            const url = `${this.getBaseUrl()}/chat/tasks`;
            console.log(`Sending task request to: ${url}`);
            
            const requestBody = {
                query: message,
                tasks: tasks
            };
            
            console.log(`Task request body: ${JSON.stringify(requestBody, null, 2)}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                console.error(`Task response not ok: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(`Response text: ${text}`);
                throw new Error(`Server error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Task response: ${JSON.stringify(data, null, 2)}`);
            
            return data.response ? data : { content: "I need more information to help with that." };
        } catch (error) {
            console.error(`Error in processTaskQuery: ${error.message}`, error);
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
        
        // Debug
        console.log(`Checking if navigation query: "${messageLower}"`);
        
        // Check for room numbers (e.g., H-109, H109, etc.)
        const roomPattern = /h\s*[-]?\s*\d{3}/i;
        const hasRoomNumbers = roomPattern.test(messageLower);
        console.log(`Has room numbers: ${hasRoomNumbers}`);
        
        // Check for room numbers mentioned twice (likely a from/to query)
        const multipleRoomsMentioned = (messageLower.match(/h\s*[-]?\s*\d{3}/gi) || []).length >= 2;
        console.log(`Multiple rooms mentioned: ${multipleRoomsMentioned}`);
        
        // Check for navigation keywords
        const hasNavigationKeywords = navigationKeywords.some(keyword => 
            messageLower.includes(keyword)
        );
        console.log(`Has navigation keywords: ${hasNavigationKeywords}`);
        
        // Direct test for "How to go from H x to H y" pattern
        const directPattern = /how to go from h\s*\d{3} to h\s*\d{3}/i;
        const isDirectMatch = directPattern.test(messageLower);
        console.log(`Is direct match: ${isDirectMatch}`);
        
        // If a query directly matches our pattern OR has multiple rooms with navigation keywords
        const result = isDirectMatch || multipleRoomsMentioned || (hasRoomNumbers && hasNavigationKeywords);
        console.log(`Final navigation query decision: ${result}`);
        
        return result;
    }
    async processRoutePlanning(tasks) {
        try {
            const url = `${this.getBaseUrl()}/chat/plan_route`;
            console.log(`Sending route planning request to: ${url}`);

            const requestBody = {
                tasks: tasks
            };

            console.log(`Route planning request body: ${JSON.stringify(requestBody, null, 2)}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error(`Route planning response not ok: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(`Response text: ${text}`);
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Route planning response: ${JSON.stringify(data, null, 2)}`);

            return data.response ? data : { content: "I need more information to plan your route." };
        } catch (error) {
            console.error(`Error in processRoutePlanning: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while planning your route. Please try again."
            };
        }
    }
}

export const chatService = new ChatService(); 