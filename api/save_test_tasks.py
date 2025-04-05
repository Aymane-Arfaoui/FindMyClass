#!/usr/bin/env python3
"""
Utility script to save test tasks to disk for CLI testing
"""
import json
import os
import sys
from pathlib import Path

# Sample tasks matching what we see in the app
BASE_TASKS = [
    {
        "id": "task1",
        "taskName": "Test 1",
        "startTime": "2025-04-04T17:33:00",
        "address": "Concordia University, Boulevard De Maisonneuve Ouest, Montreal, QC, Canada",
        "notes": "No additional details"
    },
    {
        "id": "task2",
        "taskName": "Test 2", 
        "startTime": "2025-04-04T17:35:00",
        "address": "Concordia University, Boulevard De Maisonneuve Ouest, Montreal, QC, Canada",
        "notes": "This is a test"
    }
]

def get_app_tasks():
    """Try to read tasks from app AsyncStorage"""
    # Look in the app directory for tasks.json
    app_dir = Path(os.getcwd()).parent / 'app'
    
    # Possible locations for AsyncStorage tasks
    possible_paths = [
        app_dir / 'AsyncStorage' / 'tasks.json',
        app_dir / '.expo' / 'AsyncStorage' / 'tasks.json',
        app_dir / '.expo' / 'async-storage' / 'tasks.json',
        app_dir / 'local-storage' / 'tasks.json'
    ]
    
    for path in possible_paths:
        if path.exists():
            try:
                with open(path, 'r') as f:
                    print(f"Reading app tasks from: {path}")
                    return json.load(f)
            except json.JSONDecodeError:
                print(f"Invalid JSON in {path}")
            except Exception as e:
                print(f"Error reading {path}: {e}")
    
    return []

def save_tasks():
    """Save test tasks to multiple locations where they might be found"""
    # Try to read tasks from the app first
    app_tasks = get_app_tasks()
    
    # Merge with base tasks if we found any
    if app_tasks:
        # Create a map of existing task IDs to avoid duplicates
        task_map = {task['id']: task for task in BASE_TASKS}
        
        # Add app tasks, overwriting duplicates
        for task in app_tasks:
            task_id = task.get('id') or task.get('taskName')
            if task_id:
                task_map[task_id] = task
        
        # Convert back to list
        tasks = list(task_map.values())
        print(f"Combined {len(BASE_TASKS)} base tasks with {len(app_tasks)} app tasks, resulting in {len(tasks)} total tasks")
    else:
        tasks = BASE_TASKS
        print(f"Using {len(tasks)} base tasks")
    
    # Add the new tasks from the screenshot
    new_tasks = [
        {
            "id": "task3",
            "taskName": "SOEN 345 LAB",
            "startTime": "2025-04-04T17:45:00",
            "address": "Sir George Williams Campus",
            "notes": "No additional details"
        },
        {
            "id": "task4",
            "taskName": "Test 3",
            "startTime": "2025-04-04T18:06:00",
            "address": "Varennes Pizzeria, Route Marie-Victorin, Varennes, QC, Canada",
            "notes": "No additional details"
        }
    ]
    
    # Add or update new tasks
    for new_task in new_tasks:
        task_id = new_task['id']
        existing = False
        for i, task in enumerate(tasks):
            if task.get('id') == task_id or task.get('taskName') == new_task['taskName']:
                tasks[i] = new_task
                existing = True
                break
        if not existing:
            tasks.append(new_task)
    
    print(f"Added new tasks from screenshot, final count: {len(tasks)}")
    
    # Possible paths where tasks might be stored/read from
    paths = [
        Path(os.getcwd()) / '.expo' / 'async-storage',
        Path(os.getcwd()).parent / 'app' / '.expo' / 'async-storage',
        Path(os.getcwd()).parent / '.expo' / 'async-storage',
    ]
    
    # Try to save to each path
    successes = 0
    for base_path in paths:
        try:
            # Create directory if it doesn't exist
            os.makedirs(base_path, exist_ok=True)
            
            # Save tasks file
            file_path = base_path / 'tasks.json'
            with open(file_path, 'w') as f:
                json.dump(tasks, f, indent=2)
            
            print(f"Successfully saved tasks to: {file_path}")
            successes += 1
        except Exception as e:
            print(f"Failed to save to {base_path}: {e}")
    
    print(f"Saved tasks to {successes} locations")
    return successes > 0

if __name__ == "__main__":
    save_tasks() 