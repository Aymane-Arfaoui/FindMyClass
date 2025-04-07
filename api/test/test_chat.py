from api.app.chat import (
    is_navigation_query,
    extract_rooms,
    interpret_path,
    handle_follow_up,
    NavigationContext,
    is_task_query,
    handle_task_query,
    get_tasks_from_storage,
    SAMPLE_TASKS,
)
from unittest.mock import patch, MagicMock
import tempfile
import json
from pathlib import Path


# ------------------ Navigation Query Tests ------------------

def test_is_navigation_query():
    assert is_navigation_query("How do I get from H-102 to H-103?")
    assert is_navigation_query("Directions to H110")
    assert not is_navigation_query("What’s your name?")
    assert is_navigation_query("Time it takes from H-110 to H-120")


# ------------------ Room Extraction Tests ------------------

def test_extract_rooms_found():
    query = "How do I get from H-109 to H-205?"
    start, end = extract_rooms(query)
    assert start == "h1_109"
    assert end == "h2_205"


def test_extract_rooms_not_found():
    query = "Where’s the cafeteria?"
    start, end = extract_rooms(query)
    assert start is None
    assert end is None


# ------------------ Path Interpretation Tests ------------------

def test_interpret_path_success():
    path_info = {
        "path": ["h1_hw1", "h1_101", "h1_hw2"],
        "distance": 50
    }
    result = interpret_path(path_info)
    assert "Here's how to get to your destination:" in result
    assert "Total distance: 50.0 meters" in result


def test_interpret_path_with_error():
    result = interpret_path({"error": "No such path."})
    assert result == "No such path."


def test_interpret_path_no_path():
    result = interpret_path({"path": [], "distance": 0})
    assert result == "No path found between these rooms."


def test_interpret_path_hallway_to_hallway():
    path_info = {
        "path": ["h1_hw1", "h1_hw2"],
        "distance": 10
    }
    result = interpret_path(path_info)
    assert "Continue through the hallway" in result


def test_interpret_path_hallway_to_room():
    path_info = {
        "path": ["h1_hw1", "h1_110"],
        "distance": 20
    }
    result = interpret_path(path_info)
    assert "Look for room H-110 along the hallway" in result


def test_interpret_path_room_to_hallway():
    path_info = {
        "path": ["h1_110", "h1_hw2"],
        "distance": 15
    }
    result = interpret_path(path_info)
    assert "Exit room H-110 and enter the hallway" in result


def test_interpret_path_elevator_change():
    path_info = {
        "path": ["h1_elevator_up", "h2_elevator_up"],
        "distance": 30
    }
    result = interpret_path(path_info)
    assert "Take the elevator from floor 1 to floor 2" in result


def test_interpret_path_stairs_change():
    path_info = {
        "path": ["h1_stairs_up", "h2_stairs_up"],
        "distance": 30
    }
    result = interpret_path(path_info)
    assert "Take the stairs from floor 1 to floor 2" in result


def test_interpret_path_escalator_change():
    path_info = {
        "path": ["h1_escalator_up", "h2_escalator_up"],
        "distance": 30
    }
    result = interpret_path(path_info)
    assert "Take the escalator from floor 1 to floor 2" in result


def test_interpret_path_elevator_to_hallway():
    path_info = {
        "path": ["h1_elevator_up", "h1_hw1"],
        "distance": 10
    }
    result = interpret_path(path_info)
    assert "Exit the elevator and enter the hallway" in result


def test_interpret_path_escalator_to_room():
    path_info = {
        "path": ["h1_escalator_up", "h1_130"],
        "distance": 20
    }
    result = interpret_path(path_info)
    assert "Exit the escalator and go to room H-130" in result


# ------------------ Follow-Up Tests ------------------

def test_handle_follow_up_with_distance():
    context = NavigationContext()
    context.last_navigation = {"distance": 84}
    result = handle_follow_up("how long does it take", context)
    assert "84.0 meters" in result
    assert "minutes" in result


def test_handle_follow_up_no_context():
    context = NavigationContext()
    result = handle_follow_up("how long does it take", context)
    assert "I don't have any previous navigation information" in result


def test_handle_follow_up_unclear_query():
    context = NavigationContext()
    context.last_navigation = {"distance": 42}
    result = handle_follow_up("What should I do?", context)
    assert "not sure what you're asking" in result


# ------------------ Task Query Tests ------------------

def test_is_task_query_matches():
    assert is_task_query("Remind me about the project due date")
    assert is_task_query("Do I have any tasks today?")
    assert is_task_query("What's on my todo list?")
    assert not is_task_query("Where is H-110?")
    assert not is_task_query("Hello, how are you?")


@patch("api.app.chat.OpenAI")
def test_handle_task_query_success(mock_openai):
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content="You have a test at 5 PM"))
    ]
    mock_openai.return_value.chat.completions.create.return_value = mock_response

    tasks = [
        {
            "taskName": "Test 1",
            "startTime": "2025-04-04T17:00:00",
            "address": "Concordia",
            "notes": "Important"
        }
    ]
    result = handle_task_query("When is my test?", tasks)
    assert "You have a test" in result


def test_get_tasks_from_storage_found(tmp_path):
    data = [{"taskName": "Mock Task"}]
    storage_path = tmp_path / ".expo" / "async-storage"
    storage_path.mkdir(parents=True)
    task_file = storage_path / "tasks.json"
    task_file.write_text(json.dumps(data))

    with patch("os.getcwd", return_value=str(tmp_path)):
        tasks = get_tasks_from_storage()
        assert tasks == data


def test_get_tasks_from_storage_missing():
    with patch("os.getcwd", return_value=str(Path(tempfile.gettempdir()))):
        tasks = get_tasks_from_storage()
        assert isinstance(tasks, list)


@patch("api.app.chat.OpenAI")
def test_handle_task_query_openai_failure(mock_openai):
    mock_openai.return_value.chat.completions.create.side_effect = Exception("API error")
    result = handle_task_query("When is my test?", SAMPLE_TASKS)
    assert "error" in result.lower()


def test_get_tasks_from_storage_invalid_json(tmp_path):
    storage_path = tmp_path / ".expo" / "async-storage"
    storage_path.mkdir(parents=True)
    task_file = storage_path / "tasks.json"
    task_file.write_text("{invalid_json")

    with patch("os.getcwd", return_value=str(tmp_path)):
        tasks = get_tasks_from_storage()
        assert tasks == []


def test_is_task_query_keywords():
    assert is_task_query("Do I have any assignments?")
    assert is_task_query("Any task today?")
    assert is_task_query("Remind me about my deadline")
    assert not is_task_query("Where is H-110?")


def test_is_task_query():
    assert is_task_query("What's my next assignment?")
    assert is_task_query("Remind me to submit the project")
    assert not is_task_query("How do I get to H-110?")


def test_interpret_path_room_to_room():
    path_info = {
        "path": ["h1_110", "h1_120"],
        "distance": 12
    }
    result = interpret_path(path_info)
    assert "Go from room H-110 to room H-120" in result


@patch("api.app.chat.OpenAI")
def test_handle_task_query_empty_openai(mock_openai):
    mock_openai.return_value.chat.completions.create.return_value.choices = []
    result = handle_task_query("What tasks?", SAMPLE_TASKS)
    assert isinstance(result, str)


def test_get_tasks_from_storage_empty_file(tmp_path):
    storage_path = tmp_path / ".expo" / "async-storage"
    storage_path.mkdir(parents=True)
    task_file = storage_path / "tasks.json"
    task_file.write_text('')  # Empty content

    with patch("os.getcwd", return_value=str(tmp_path)):
        tasks = get_tasks_from_storage()
        assert tasks == []


