# WebOS - Gemini Folder/static/third-party/apps/test.app/backend.py

# This is an example of a backend script for a third-party app.
# It has access to the 'user' object and other variables passed from app.py

def main():
    if user:
        message = f"Hello, {user.username}! Your user ID is {user.id}."
        if user.is_admin:
            message += " You are an administrator."
        else:
            message += " You are a standard user."
        # The script must return a Flask Response object.
        # The easiest way is to use jsonify.
        return jsonify({"success": True, "message": message})
    else:
        return jsonify({"success": False, "error": "User not found."}), 404

# The convention is to have a 'response' variable in the global scope
# that holds the result of the script.
response = main()
