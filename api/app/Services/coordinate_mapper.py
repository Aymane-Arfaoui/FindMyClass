import cv2
import json
import os
import tkinter as tk
from tkinter import simpledialog


coordinates = {}
current_room = None
clicked = False 
font = cv2.FONT_HERSHEY_SIMPLEX  

root = tk.Tk()
root.withdraw()  

def get_room_number():
    return simpledialog.askstring("Room Input", "Enter room number or 'done' to close):")

def click_event(event, x, y, flags, params):

    global coordinates, current_room, clicked, img

    if event in [cv2.EVENT_LBUTTONDOWN, cv2.EVENT_RBUTTONDOWN, cv2.EVENT_MBUTTONDOWN]:
        print(f'Click detected! Coordinates: ({x}, {y})')

        if current_room:
            coordinates[current_room] = [x, y]
            print(f'✓ Saved for room {current_room}: ({x}, {y})')

            cv2.putText(img, ".", (x, y), font, 1, (255, 0, 0), 2)  # Blue dot
            cv2.imshow("Floor Plan", img)

            clicked = True  
        else:
            print('⚠️ Please enter a room number first before clicking')

# Get absolute path to the image
current_dir = os.path.dirname(os.path.abspath(__file__))
image_path = os.path.join(current_dir, 'Hall-1.png')

img = cv2.imread(image_path)

if img is None:
    print(f"⚠️ Error: Image not found at {image_path}")
    exit()

# Show image in OpenCV window
cv2.namedWindow('Floor Plan', cv2.WINDOW_NORMAL)
cv2.imshow('Floor Plan', img)
cv2.setMouseCallback('Floor Plan', click_event)

print("\n=== Click Detection Mode ===")
print("✅ Image loaded successfully.")
print("1. A pop-up window will ask for a room number.")
print("2. Click anywhere on the image to mark the entrance.")
print("3. Repeat until you click 'Cancel' in the pop-up window.")

while True:
    current_room = get_room_number()  
    if current_room is None or current_room.lower() == 'done':  
        break
    print(f"→ Now click on the entrance location for room {current_room}")

    clicked = False  


    while not clicked:
        if cv2.getWindowProperty('Floor Plan', cv2.WND_PROP_VISIBLE) < 1:
            print("⚠️ Window was closed manually.")
            exit()
        cv2.waitKey(1)  


output_path = os.path.join(current_dir, 'coordinates.json')
with open(output_path, 'w') as f:
    json.dump(coordinates, f, indent=4)


marked_image_path = os.path.join(current_dir, 'marked_map.png')
cv2.imwrite(marked_image_path, img)

print("\n=== Results ===")
print(f"✅ Saved coordinates: {coordinates}")
print(f"📁 Output file: {output_path}")
print(f"🖼 Marked image saved: {marked_image_path}")

cv2.waitKey(0)
cv2.destroyAllWindows()