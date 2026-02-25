# WebPlot

Web-based interactive spectra and CSV plotter built with Flask and Plotly.js, served via Apache2 with mod_wsgi.

## Features

- Upload files via button or drag-and-drop
- Interactive charts with zoom, pan, and hover tooltips (Plotly.js)
- Multi-trace overlay — select different Y columns to compare signals
- Manual or autoscaled Y-axis range
- Supported file formats:
  - Spectra files (with `BLOCKSIZE` header marker)
  - Semicolon-separated CSV (13-row header)
  - Comma-separated CSV
  - Tab-separated files

## Quick Start (Development)

```bash
cd webplot
python3 -m venv venv
venv/bin/pip install flask pandas numpy
venv/bin/python app.py
```

Open http://localhost:5000/

## Deployment (Apache2)

Run the setup script as root:

```bash
sudo bash setup.sh
```

This will:
1. Install `libapache2-mod-wsgi-py3`
2. Copy files to `/var/www/webplot/`
3. Create a Python virtual environment with dependencies
4. Configure and enable the Apache virtual host
5. Restart Apache

The app will be available at http://localhost/

## Project Structure

```
webplot/
├── app.py              # Flask backend (file parsing + routes)
├── wsgi.py             # WSGI entry point for Apache
├── setup.sh            # Automated deployment script
├── webplot.conf        # Apache virtual host config
├── templates/
│   └── index.html      # Single-page UI
└── static/
    ├── css/style.css   # Styling
    └── js/app.js       # Client-side plotting logic
```

## Usage

1. Open the app in a browser
2. Click **Open** or drag a file onto the chart area
3. Select X and Y columns from the dropdowns
4. Check **Add plot** to overlay multiple traces
5. Uncheck **Autoscale** and set Y min/max for manual range, then click **Plot**
6. Click **Clear** to remove all traces
