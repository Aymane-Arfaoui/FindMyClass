import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { formatDateToLocalDate } from '@/helpers/utils';

class ChatService {
    constructor() {
        this.lastRouteTasks = null;
    }

    getBaseUrl() {
        let host;
        if (Platform.OS === 'ios') {
            host = 'localhost';
        } else if (Platform.OS === 'android') {
            host = '10.0.2.2';
        } else {
            host = '127.0.0.1';
        }
        const url = `http://${host}:5001`;
        console.log(`Using base URL: ${url}`);
        return url;
    }

    async processMessage(query, date = formatDateToLocalDate(new Date()), displayedTasks = []) {
        console.log(`Processing message: "${query}"`);

        const isNavigation = this.isNavigationQuery(query);
        const isFeedback = this.isFeedbackQuery(query);
        console.log(`Is navigation query: ${isNavigation}, Is feedback query: ${isFeedback}`);

        try {
            if (isNavigation) {
                return await this.processNavigationQuery(query);
            }
            if (isFeedback) {
                return await this.processFeedbackQuery(query);
            }
            return await this.processTaskQuery(query, date, displayedTasks);
        } catch (error) {
            console.error(`Error in processMessage: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your request. Please try again."
            };
        }
    }

    isNavigationQuery(query) {
        const navigationKeywords = [
            "how do i get", "how to get", "where is", "directions to",
            "path to", "route to", "way to", "navigate to", "go from",
            "to", "from", "how long", "time", "distance"
        ];
        const queryLower = query.toLowerCase();

        console.log(`Checking if navigation query: "${queryLower}"`);

        const roomPattern = /h\s*[-_ ]?\s*\d{3}/i;
        const hasRoomNumbers = queryLower.match(roomPattern) !== null;
        const multipleRooms = (queryLower.match(roomPattern) || []).length >= 2;

        console.log(`Has room numbers: ${hasRoomNumbers}`);
        console.log(`Multiple rooms mentioned: ${multipleRooms}`);

        const hasNavKeywords = navigationKeywords.some(keyword => queryLower.includes(keyword));
        console.log(`Has navigation keywords: ${hasNavKeywords}`);

        const directPattern = /how to go from h\s*\d{3} to h\s*\d{3}/i;
        const isDirectMatch = directPattern.test(queryLower);
        console.log(`Is direct match: ${isDirectMatch}`);

        const isNavQuery = isDirectMatch || multipleRooms || (hasRoomNumbers && hasNavKeywords);
        console.log(`Final navigation query decision: ${isNavQuery}`);

        return isNavQuery;
    }

    isFeedbackQuery(query) {
        const feedbackKeywords = [
            "avoid outdoor", "skip outdoor", "include outdoor", "use outdoor",
            "fix", "change", "adjust", "update", "modify", "better", "different"
        ];
        const queryLower = query.toLowerCase();
        return feedbackKeywords.some(keyword => queryLower.includes(keyword));
    }

    async getTasks(date, displayedTasks = []) {
        try {
            const tasks = await AsyncStorage.getItem('tasks');
            if (!tasks) {
                console.log('No tasks found in AsyncStorage');
                return [];
            }
            const parsedTasks = JSON.parse(tasks);
            console.log(`Loaded ${parsedTasks.length} tasks from AsyncStorage:`, parsedTasks);
            const filteredTasks = parsedTasks.filter(task => {
                const taskDate = formatDateToLocalDate(task.date);
                return taskDate === date;
            });

            const tasksToLog = filteredTasks.filter(task => {
                return !displayedTasks.some(displayedTask => displayedTask.id === task.id);
            });

            console.log(`Filtered ${filteredTasks.length} tasks for date ${date}, excluding displayed tasks:`, tasksToLog);
            return filteredTasks;
        } catch (error) {
            console.error('Error retrieving tasks:', error);
            return [];
        }
    }

    async processNavigationQuery(query) {
        try {
            const url = `${this.getBaseUrl()}/chat/navigation`;
            console.log(`Sending navigation request to: ${url}`);

            const requestBody = { query };
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

            return data.response ? data : { content: "I need more information to navigate." };
        } catch (error) {
            console.error(`Error in processNavigationQuery: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your navigation request. Please try again."
            };
        }
    }

    async processTaskQuery(query, date, displayedTasks) {
        try {
            const url = `${this.getBaseUrl()}/chat/tasks`;
            console.log(`Sending task request to: ${url}`);

            const tasks = await this.getTasks(date, displayedTasks);

            const requestBody = {
                query,
                tasks
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

            return data.response ? data : { content: "I need more information to answer your task query." };
        } catch (error) {
            console.error(`Error in processTaskQuery: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your task request. Please try again."
            };
        }
    }

    async processFeedbackQuery(query) {
        try {
            const url = `${this.getBaseUrl()}/chat/feedback`;
            console.log(`Sending feedback request to: ${url}`);

            const requestBody = {
                query,
                tasks: this.lastRouteTasks || []
            };
            console.log(`Feedback request body: ${JSON.stringify(requestBody, null, 2)}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                console.error(`Feedback response not ok: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.error(`Response text: ${text}`);
                throw new Error(`Server error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`Feedback response: ${JSON.stringify(data, null, 2)}`);

            return data.response ? data : { content: "I need more information to process your feedback." };
        } catch (error) {
            console.error(`Error in processFeedbackQuery: ${error.message}`, error);
            return {
                content: "Sorry, I encountered an error while processing your feedback. Please try again."
            };
        }
    }

    async processRoutePlanning(tasks) {
        try {
            const url = `${this.getBaseUrl()}/chat/plan_route`;
            console.log(`Sending route planning request to: ${url}`);

            const requestBody = { tasks };
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

            this.lastRouteTasks = tasks;

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