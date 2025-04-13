from flask import Flask, render_template, jsonify
import pandas as pd
import os

app = Flask(__name__, static_folder='static')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/planets')
def get_planets():
    df = pd.read_csv('data_planets.csv')
    return df.to_json(orient='records')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)