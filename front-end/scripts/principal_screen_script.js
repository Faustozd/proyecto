const { ipcRenderer } = require('electron');

// Evento para iniciar el escaneo
document.getElementById('startScanBtn').addEventListener('click', () => {
    // Actualizar el estado inicial del escaneo
    document.getElementById('scanStatus').textContent = 'Escaneando...';
    document.getElementById('scanLogs').textContent = '';  // Limpiar logs

    // Enviar el evento al proceso principal para iniciar el escaneo
    ipcRenderer.send('login-success', { target: 'localhost', startPort: 1, endPort: 1000 });
});

// Escuchar el evento de estado del escaneo
ipcRenderer.on('scan-status', (event, data) => {
    document.getElementById('scanStatus').textContent = data.status;
    if (data.message) {
        document.getElementById('scanLogs').textContent = data.message;
    }
});

// Escuchar el evento con los resultados del escaneo
ipcRenderer.on('scan-results', (event, results) => {
    console.log("Resultados recibidos:", results);
    
    let logsText = [
        "Puertos Abiertos: " + results.puertosAbiertos.labels.join(', '),
        "\nLogs de Escaneo:",
        ...results.logs
    ].join('\n');

    document.getElementById('scanLogs').textContent = logsText;

    // Guardar puertos abiertos para usar en cierre de puertos
    window.openPorts = results.puertosAbiertos.labels;
});

// Modificar el evento para cerrar puertos
document.getElementById('closePortsBtn').addEventListener('click', () => {
    if (!window.openPorts || window.openPorts.length === 0) {
        document.getElementById('scanStatus').textContent = 'No hay puertos para cerrar';
        return;
    }

    document.getElementById('scanStatus').textContent = 'Cerrando puertos innecesarios...';
    
    ipcRenderer.send('close-unnecessary-ports', { 
        target: 'localhost', 
        openPorts: window.openPorts 
    });
});

// Escuchar evento de puertos cerrados
ipcRenderer.on('ports-closed', (event, results) => {
    if (results.puertosCerrados && results.puertosCerrados.labels.length > 0) {
        const closedPortsText = results.puertosCerrados.labels.join(', ');
        document.getElementById('scanLogs').textContent += 
            `\n\nPuertos Cerrados: ${closedPortsText}`;
    } else {
        document.getElementById('scanLogs').textContent += 
            '\n\nNo se encontraron puertos innecesarios para cerrar.';
    }
});

// Evento para escanear archivo
document.getElementById('scanFileBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        document.getElementById('fileScanResult').textContent = 'Por favor, seleccione un archivo.';
        return;
    }

    document.getElementById('fileScanResult').textContent = 'Escaneando archivo...';

    // Enviar el archivo al proceso principal para escanear
    ipcRenderer.send('scan-file', file.path);
});

// Escuchar el resultado del análisis del archivo
ipcRenderer.on('file-scan-result', (event, result) => {
    if (result.error) {
        document.getElementById('fileScanResult').textContent = `Error: ${result.error}`;
    } else {
        const stats = result.stats;
        document.getElementById('fileScanResult').textContent = 
            `Malware detectado: ${stats.malicious || 0}\n` + 
            `Limpio: ${stats.undetected || 0}`;
    }
});
