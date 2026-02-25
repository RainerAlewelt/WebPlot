#!/bin/bash
# Run this script with sudo:  sudo bash setup.sh
set -e

echo "=== Installing system dependencies ==="
apt install -y libapache2-mod-wsgi-py3
a2enmod wsgi

echo "=== Creating /var/www/webplot ==="
mkdir -p /var/www/webplot/{templates,static/css,static/js}

echo "=== Copying application files ==="
SRCDIR="$(cd "$(dirname "$0")" && pwd)"
cp "$SRCDIR/app.py"                    /var/www/webplot/app.py
cp "$SRCDIR/wsgi.py"                   /var/www/webplot/wsgi.py
cp "$SRCDIR/templates/index.html"      /var/www/webplot/templates/index.html
cp "$SRCDIR/static/js/app.js"          /var/www/webplot/static/js/app.js
cp "$SRCDIR/static/css/style.css"      /var/www/webplot/static/css/style.css

echo "=== Creating Python virtual environment ==="
python3 -m venv /var/www/webplot/venv
/var/www/webplot/venv/bin/pip install --quiet flask pandas numpy

echo "=== Configuring Apache ==="
cp "$SRCDIR/webplot.conf" /etc/apache2/sites-available/webplot.conf
a2dissite 000-default.conf 2>/dev/null || true
a2ensite webplot.conf

echo "=== Setting permissions ==="
chown -R www-data:www-data /var/www/webplot

echo "=== Restarting Apache ==="
systemctl restart apache2

echo ""
echo "Done! Open http://localhost/ in your browser."
