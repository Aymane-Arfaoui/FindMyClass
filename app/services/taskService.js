import AsyncStorage from '@react-native-async-storage/async-storage';

class TaskService {
    async getAllTasks() {
        try {
            const tasksJson = await AsyncStorage.getItem('tasks');
            if (!tasksJson) return [];
            
            const tasks = JSON.parse(tasksJson);
            return tasks.map(task => ({
                id: task.id,
                taskName: task.summary || task.taskName,
                notes: task.description || task.notes || 'No additional details',
                date: task.date || (task.start?.date || task.start?.dateTime),
                address: task.location || task.address || 'No location available',
                startTime: task.startTime || task.start?.dateTime,
                endTime: task.endTime || task.end?.dateTime,
                allDayEvent: task.allDayEvent || (task.start?.date && task.end?.date)
            }));
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return [];
        }
    }

    async getTaskByName(taskName) {
        const tasks = await this.getAllTasks();
        return tasks.find(task => 
            task.name.toLowerCase().includes(taskName.toLowerCase())
        );
    }

    async searchTasks(query) {
        const tasks = await this.getAllTasks();
        return tasks.filter(task => 
            task.name.toLowerCase().includes(query.toLowerCase()) ||
            task.description?.toLowerCase().includes(query.toLowerCase())
        );
    }

    async addTask(task) {
        try {
            const tasks = await this.getAllTasks();
            const newTask = {
                id: task.id || Date.now().toString(),
                taskName: task.name,
                notes: task.description || 'No additional details',
                date: task.dueDate,
                address: task.location || 'No location available',
                startTime: task.startTime,
                endTime: task.endTime,
                allDayEvent: task.isAllDay || false
            };
            tasks.push(newTask);
            await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
            return newTask;
        } catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        try {
            const tasks = await this.getAllTasks();
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...updates };
                await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
                return tasks[index];
            }
            throw new Error('Task not found');
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            const tasks = await this.getAllTasks();
            const filteredTasks = tasks.filter(t => t.id !== taskId);
            await AsyncStorage.setItem('tasks', JSON.stringify(filteredTasks));
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    // For CLI mode
    async saveToFile(tasks) {
        try {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', '.expo', 'async-storage', 'tasks.json');
            
            // Create directories if they don't exist
            fs.mkdirSync(path.join(__dirname, '..', '.expo', 'async-storage'), { recursive: true });
            
            // Write tasks to file
            fs.writeFileSync(filePath, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks to file:', error);
            return false;
        }
    }
}

export const taskService = new TaskService(); 