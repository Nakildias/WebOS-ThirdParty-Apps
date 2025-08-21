import os
import json
from flask import jsonify, request, session

def main():
    """
    Handles backend actions for the GBA Emulator app, primarily listing ROM files.
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON payload"})

    action = data.get('action')

    # Use a default username if the session is not available for testing purposes
    username = session.get('username', 'nakildias')

    # The physical path on the server where the user's ROMs are stored
    # It's constructed relative to the application's root directory.
    rom_path = os.path.join(os.getcwd(), 'static', 'filesystem', 'home', username, 'roms', 'gba')

    # The public URL path that the browser will use to download the ROM files
    # Corrected to remove the leading '/static'
    rom_url_path = f'/filesystem/home/{username}/roms/gba'

    if action == 'list_roms':
        try:
            # Ensure the user's ROM directory exists; if not, create it.
            if not os.path.exists(rom_path):
                os.makedirs(rom_path)
                return jsonify({
                    "success": True,
                    "roms": [],
                    "rom_path": rom_url_path,
                    "message": "ROMs folder created. Please add your GBA ROMs."
                })

            # Find all files with valid GBA extensions (.gba, .gb)
            rom_files = [f for f in os.listdir(rom_path) if f.lower().endswith(('.gba', '.gb'))]

            return jsonify({
                "success": True,
                "roms": rom_files,
                "rom_path": rom_url_path
            })
        except Exception as e:
            # Return any errors that occur during file system access
            return jsonify({"success": False, "error": str(e)})

    # Return an error if the action is not recognized
    return jsonify({"success": False, "error": "Invalid action specified"})

# The convention is to have a 'response' variable in the global scope
# that holds the result of the script.
response = main()
