// Componente para seleccionar dispositivo MIDI

export class DeviceSelector {
  private container: HTMLElement;
  private inputSelect!: HTMLSelectElement;
  private outputSelect!: HTMLSelectElement;
  private connectBtn!: HTMLButtonElement;
  private statusDiv!: HTMLElement;
  private onConnectCallback?: (inputPort: number, outputPort: number) => void;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="device-selector">
        <h3>Dispositivos MIDI</h3>
        <div class="device-row">
          <label>Entrada:</label>
          <select id="input-device-select"></select>
        </div>
        <div class="device-row">
          <label>Salida:</label>
          <select id="output-device-select"></select>
        </div>
        <button id="connect-device-btn">Conectar</button>
        <div id="device-status" class="status"></div>
      </div>
    `;

    this.inputSelect = document.getElementById('input-device-select') as HTMLSelectElement;
    this.outputSelect = document.getElementById('output-device-select') as HTMLSelectElement;
    this.connectBtn = document.getElementById('connect-device-btn') as HTMLButtonElement;
    this.statusDiv = document.getElementById('device-status')!;

    this.connectBtn.addEventListener('click', () => this.handleConnect());
    this.loadDevices();
  }

  async loadDevices() {
    try {
      const inputDevices = await (window as any).electronAPI.midi.getInputDevices();
      const outputDevices = await (window as any).electronAPI.midi.getOutputDevices();

      this.inputSelect.innerHTML = '<option value="-1">Seleccionar...</option>';
      inputDevices.forEach((device: any, index: number) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = device.name;
        this.inputSelect.appendChild(option);
      });

      this.outputSelect.innerHTML = '<option value="-1">Seleccionar...</option>';
      outputDevices.forEach((device: any, index: number) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = device.name;
        this.outputSelect.appendChild(option);
      });

      // Si solo hay un dispositivo MIDI de entrada, conectarlo automáticamente
      if (inputDevices.length === 1) {
        this.inputSelect.value = '0';
        // Intentar encontrar un dispositivo de salida con el mismo nombre
        const inputDeviceName = inputDevices[0].name;
        const matchingOutputIndex = outputDevices.findIndex((device: any) => 
          device.name === inputDeviceName || device.name.includes(inputDeviceName) || inputDeviceName.includes(device.name)
        );
        if (matchingOutputIndex !== -1) {
          this.outputSelect.value = matchingOutputIndex.toString();
        }
        // Conectar automáticamente después de un pequeño delay para asegurar que la UI esté lista
        setTimeout(() => {
          this.handleConnect();
        }, 100);
      }
    } catch (error) {
      this.showStatus('Error cargando dispositivos', 'error');
      console.error(error);
    }
  }

  private async handleConnect() {
    const inputPort = parseInt(this.inputSelect.value);
    const outputPort = parseInt(this.outputSelect.value);

    if (inputPort === -1) {
      this.showStatus('Selecciona un dispositivo de entrada', 'error');
      return;
    }

    try {
      const inputSuccess = await (window as any).electronAPI.midi.openInput(inputPort);
      let outputSuccess = true;
      
      if (outputPort !== -1) {
        outputSuccess = await (window as any).electronAPI.midi.openOutput(outputPort);
      }

      if (inputSuccess && outputSuccess) {
        this.showStatus('Dispositivos conectados', 'success');
        this.connectBtn.textContent = 'Desconectar';
        this.connectBtn.onclick = () => this.handleDisconnect();
        
        if (this.onConnectCallback) {
          this.onConnectCallback(inputPort, outputPort);
        }
      } else {
        this.showStatus('Error conectando dispositivos', 'error');
      }
    } catch (error) {
      this.showStatus('Error conectando dispositivos', 'error');
      console.error(error);
    }
  }

  private async handleDisconnect() {
    await (window as any).electronAPI.midi.closeInput();
    await (window as any).electronAPI.midi.closeOutput();
    
    this.showStatus('Dispositivos desconectados', 'info');
    this.connectBtn.textContent = 'Conectar';
    this.connectBtn.onclick = () => this.handleConnect();
  }

  private showStatus(message: string, type: 'success' | 'error' | 'info') {
    this.statusDiv.textContent = message;
    this.statusDiv.className = `status ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        this.statusDiv.textContent = '';
        this.statusDiv.className = 'status';
      }, 3000);
    }
  }

  onConnect(callback: (inputPort: number, outputPort: number) => void) {
    this.onConnectCallback = callback;
  }
}
