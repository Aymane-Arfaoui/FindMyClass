import { taskService } from './taskService';

class ChatService {
    async processMessage(message) {
        try {
            // Check if message is about tasks
            if (message.toLowerCase().includes('task') || 
                message.toLowerCase().includes('todo') ||
                message.toLowerCase().includes('to do')) {
                
                // Get tasks from AsyncStorage
                const tasks = await taskService.getAllTasks();
                
                // Send to backend with tasks context
                const response = await fetch('http://localhost:5000/api/chat/tasks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: message,
                        tasks: tasks
                    })
                });
                
                const data = await response.json();
                if (data.error) {
                    throw new Error(data.error);
                }
                
                return {
                    type: 'text',
                    content: data.response
                };
            }

            // Default response for non-task queries
            return {
                type: 'text',
                content: "I can help you manage your tasks! Try asking me about your tasks or deadlines."
            };
        } catch (error) {
            console.error('Chat service error:', error);
            return {
                type: 'text',
                content: "I encountered an error while processing your request. Please try again."
            };
        }
    }
}

export const chatService = new ChatService(); 