import io
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024 * 1024  # 64 MB upload limit


def read_spectra(content: str) -> pd.DataFrame:
    """Parse spectra files: skip everything before the BLOCKSIZE line,
    then skip that line + 1 more row, and read the rest as CSV."""
    lines = content.splitlines(keepends=True)
    start = None
    for i, line in enumerate(lines):
        if 'BLOCKSIZE' in line:
            start = i
            break
    if start is None:
        raise ValueError('BLOCKSIZE marker not found')
    # skip the BLOCKSIZE line + 1 additional header row => start + 2
    remaining = ''.join(lines[start + 2:])
    df = pd.read_csv(io.StringIO(remaining))
    df.columns = df.columns.str.strip()
    return df


def read_data(content: str) -> pd.DataFrame:
    """Semicolon-separated parser: skip 13 header rows."""
    df = pd.read_csv(io.StringIO(content), skiprows=13, sep=';').fillna(0)
    df.columns = df.columns.str.strip()
    return df


def read_csv(content: str) -> pd.DataFrame:
    """Plain comma-separated CSV (with header row)."""
    df = pd.read_csv(io.StringIO(content)).fillna(0)
    df.columns = df.columns.str.strip()
    return df


def read_tsv(content: str) -> pd.DataFrame:
    """Tab-separated file (with header row)."""
    df = pd.read_csv(io.StringIO(content), sep='\t').fillna(0)
    df.columns = df.columns.str.strip()
    return df


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify(error='No file provided'), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify(error='Empty filename'), 400

    content = f.read().decode('utf-8', errors='replace')

    # Auto-detect parser
    try:
        if 'BLOCKSIZE' in content:
            df = read_spectra(content)
        elif ';' in content.split('\n', 14)[13] if len(content.split('\n', 14)) > 13 else False:
            # Semicolon found on row 14 → legacy format with 13-row header
            df = read_data(content)
        elif '\t' in content.split('\n', 2)[0]:
            # Tab found in first line → tab-separated
            df = read_tsv(content)
        else:
            df = read_csv(content)
    except Exception as e:
        return jsonify(error=str(e)), 400

    # Clean up data: replace inf/-inf with NaN, then NaN with 0
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.fillna(0, inplace=True)

    # Convert to JSON-safe format
    columns = df.columns.tolist()
    data = {col: df[col].tolist() for col in columns}

    return jsonify(filename=f.filename, columns=columns, data=data)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
