// --- State ---
let fileData = null;   // { filename, columns, data }
let traces = [];       // [{ xCol, yCol }, ...]

// --- DOM refs ---
const xAxis     = document.getElementById('x-axis');
const yAxis     = document.getElementById('y-axis');
const fileInput = document.getElementById('file-input');
const addPlot   = document.getElementById('add-plot');
const autoscale = document.getElementById('autoscale');
const yMinInput = document.getElementById('y-min');
const yMaxInput = document.getElementById('y-max');
const btnClear  = document.getElementById('btn-clear');
const btnPlot   = document.getElementById('btn-plot');
const dropZone  = document.getElementById('drop-zone');
const chart     = document.getElementById('chart');
const overlay   = document.getElementById('drop-overlay');

// --- File upload ---
function uploadFile(file) {
    const form = new FormData();
    form.append('file', file);
    fetch('/upload', { method: 'POST', body: form })
        .then(r => {
            if (!r.ok) return r.json().then(j => { throw new Error(j.error); });
            return r.json();
        })
        .then(json => {
            fileData = json;
            traces = [];
            populateDropdowns();
        })
        .catch(err => alert('Upload error: ' + err.message));
}

function populateDropdowns() {
    xAxis.innerHTML = '';
    yAxis.innerHTML = '';
    fileData.columns.forEach(col => {
        xAxis.add(new Option(col, col));
        yAxis.add(new Option(col, col));
    });
    // Default indices: X=0, Y=2 (matching desktop app)
    xAxis.selectedIndex = 0;
    yAxis.selectedIndex = Math.min(2, fileData.columns.length - 1);
    onAxisChange();
}

// --- Axis change → mirrors SelectParameter() ---
function onAxisChange() {
    if (!fileData) return;
    const xCol = xAxis.value;
    const yCol = yAxis.value;
    if (xCol === yCol) return;

    if (!addPlot.checked) {
        // Replace all traces with just this one
        traces = [{ xCol: xCol, yCol: yCol }];
    } else {
        traces.push({ xCol: xCol, yCol: yCol });
    }
    updatePlot();
}

// --- Render plot → mirrors Update() ---
function updatePlot() {
    if (!fileData) {
        Plotly.purge(chart);
        return;
    }

    const plotTraces = traces.map(t => ({
        x: fileData.data[t.xCol],
        y: fileData.data[t.yCol],
        mode: 'lines',
        name: t.yCol
    }));

    const layout = {
        title: fileData.filename || '',
        xaxis: { title: xAxis.value },
        margin: { t: 40, r: 20, b: 50, l: 60 }
    };

    if (!autoscale.checked) {
        layout.yaxis = {
            range: [parseFloat(yMinInput.value), parseFloat(yMaxInput.value)]
        };
    }

    Plotly.newPlot(chart, plotTraces, layout, { responsive: true }).then(() => {
        if (autoscale.checked && chart.layout && chart.layout.yaxis) {
            const rng = chart.layout.yaxis.range;
            if (rng) {
                yMinInput.value = Math.floor(rng[0]);
                yMaxInput.value = Math.ceil(rng[1]);
            }
        }
    });
}

// --- Clear → mirrors clearPlot() ---
function clearPlot() {
    traces = [];
    updatePlot();
}

// --- rePlot → mirrors rePlot() (re-render without adding trace) ---
function rePlot() {
    updatePlot();
}

// --- Event listeners ---
fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) uploadFile(fileInput.files[0]);
});

xAxis.addEventListener('change', onAxisChange);
yAxis.addEventListener('change', onAxisChange);
btnClear.addEventListener('click', clearPlot);
btnPlot.addEventListener('click', rePlot);

// --- Drag and drop ---
dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    overlay.classList.add('visible');
});
dropZone.addEventListener('dragleave', e => {
    e.preventDefault();
    overlay.classList.remove('visible');
});
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    overlay.classList.remove('visible');
    if (e.dataTransfer.files.length > 0) {
        uploadFile(e.dataTransfer.files[0]);
    }
});

// Initial empty plot
Plotly.newPlot(chart, [], {
    title: 'WebPlot',
    margin: { t: 40, r: 20, b: 50, l: 60 }
}, { responsive: true });
