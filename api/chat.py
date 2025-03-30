import os
from openai import OpenAI
from dotenv import load_dotenv

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize OpenAI client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    print("Welcome to the Concordia Indoor Navigation Assistant!")
    print("I can help you find your way around Concordia's buildings, especially the EV, H, and MB buildings.")
    print("Type 'exit' to quit")
    print("Type 'help' for available commands")
    
    while True:
        try:
            # Get user input
            user_input = input("\nYou: ").strip()
            
            # Check for exit command
            if user_input.lower() == 'exit':
                print("Goodbye! Good luck with your studies at Concordia!")
                break
                
            # Check for help command
            if user_input.lower() == 'help':
                print("\nAvailable commands:")
                print("- help: Show this help message")
                print("- exit: Exit the program")
                print("- You can ask me about:")
                print("  * Finding specific rooms (e.g., 'Where is MB 1.338?')")
                print("  * Building layouts (e.g., 'What's on the 9th floor of EV?')")
                print("  * Navigation tips (e.g., 'How do I get from EV to H building?')")
                print("  * Accessibility information (e.g., 'Are there elevators in the MB building?')")
                continue
            
            # Get response from OpenAI
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": """You are a helpful Concordia University indoor navigation assistant. 
                    You have knowledge about Concordia's buildings, especially the EV, H, and MB buildings.
                    You can help students find their way around campus, locate specific rooms, and provide navigation tips.
                    Be friendly and specific in your responses, and mention relevant building codes and room numbers when applicable."""},
                    {"role": "user", "content": user_input}
                ]
            )
            
            # Print response
            print("\nConcordia Assistant:", response.choices[0].message.content)
            
        except KeyboardInterrupt:
            print("\nGoodbye! Good luck with your studies at Concordia!")
            break
        except Exception as e:
            print(f"\nError: {str(e)}")

if __name__ == "__main__":
    main() 