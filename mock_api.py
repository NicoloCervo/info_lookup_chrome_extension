from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows all origins

@app.route('/info', methods=['POST'])
def get_info():
    data = request.json
    match = data.get('match', '')
    
    # Mock response based on the match
    if '@' in match:
        info = f"Email for {match.split('@')[0]}"
    elif match.count('-') == 2:
        info = "Social Security Number"
    else:
        info = "Unknown pattern"
    
    return jsonify({"info": info})

if __name__ == '__main__':
    app.run(debug=True, port=5001)