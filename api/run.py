from app import create_app

app = create_app()

if __name__ == "__main__":
    # app.run(debug=True,ssl_context='adhoc')
    app.run(debug=True, port=5001)