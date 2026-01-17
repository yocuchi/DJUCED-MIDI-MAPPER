// Componente para probar outputs MIDI y colores

import { MidiMessage } from '../../shared/types';

export class OutputTester {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="output-tester">
        <h3>Probador de Outputs y Colores</h3>
        <p class="output-tester-description">
          Envía mensajes MIDI directamente a tu controladora para probar outputs y colores.
        </p>

        <!-- Sección de mensaje manual -->
        <div class="output-section">
          <h4>Mensaje MIDI Manual</h4>
          <div class="message-input-group">
            <label for="midi-hex-input">Mensaje HEX:</label>
            <div class="input-with-button">
              <input 
                type="text" 
                id="midi-hex-input" 
                class="midi-hex-input" 
                placeholder="Ej: 90 00 7f (Note On, Canal 0, Nota 0, Velocidad 127)"
                value="90 00 7f"
              />
              <button id="send-hex-btn" class="btn-send">Enviar</button>
            </div>
            <div class="message-info">
              <div class="info-item">
                <span class="info-label">Formato:</span>
                <span class="info-value">Status Data1 Data2 (hexadecimal)</span>
              </div>
              <div class="info-item">
                <span class="info-label">Ejemplos:</span>
                <span class="info-value">
                  <code>90 00 7f</code> (Note On), 
                  <code>B0 01 40</code> (CC), 
                  <code>80 00 00</code> (Note Off)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de colores para pads -->
        <div class="output-section">
          <h4>Probador de Colores para Pads</h4>
          <p class="section-description">
            Selecciona un pad y un color. El formato es <code>96 XX YY</code> donde XX es el pad (00-7F) y YY es el color.
          </p>
          <div class="pad-color-config">
            <div class="config-group">
              <label for="pad-number">Número de Pad (XX):</label>
              <input type="text" id="pad-number" class="hex-input" placeholder="00" value="00" maxlength="2">
              <span class="input-hint">Hex (00-7F)</span>
            </div>
            <div class="config-group">
              <label for="color-value">Color (YY):</label>
              <input type="text" id="color-value" class="hex-input" placeholder="7F" value="7F" maxlength="2">
              <span class="input-hint">Hex (ver tabla)</span>
            </div>
          </div>
          <div class="pad-message-preview">
            <div class="message-preview-label">Mensaje:</div>
            <code id="pad-message-preview" class="message-preview-code">96 00 7F</code>
            <button id="send-pad-color-btn" class="btn-primary">Enviar Color al Pad</button>
          </div>
        </div>

        <!-- Sección de colores predefinidos -->
        <div class="output-section">
          <h4>Colores Predefinidos (según tabla)</h4>
          <p class="section-description">
            Haz clic en un color para actualizar el valor DATA2 del mensaje. El formato es <code>96 XX YY</code>.
          </p>
          <div class="color-presets">
            <button class="color-preset-btn" data-color="00" data-name="No light" style="background: rgb(0,0,0); border: 1px solid #666;">No light</button>
            <button class="color-preset-btn" data-color="02" data-name="Blue low" style="background: rgb(0,0,128);">Blue low</button>
            <button class="color-preset-btn" data-color="03" data-name="Blue" style="background: rgb(0,0,255);">Blue</button>
            <button class="color-preset-btn" data-color="10" data-name="Green low" style="background: rgb(0,128,0);">Green low</button>
            <button class="color-preset-btn" data-color="12" data-name="Cyan low" style="background: rgb(0,128,128);">Cyan low</button>
            <button class="color-preset-btn" data-color="1C" data-name="Green" style="background: rgb(0,255,0);">Green</button>
            <button class="color-preset-btn" data-color="1F" data-name="Cyan" style="background: rgb(0,255,255);">Cyan</button>
            <button class="color-preset-btn" data-color="30" data-name="Lime low" style="background: rgb(128,255,0);">Lime low</button>
            <button class="color-preset-btn" data-color="40" data-name="Red low" style="background: rgb(128,0,0);">Red low</button>
            <button class="color-preset-btn" data-color="42" data-name="Fuchsia low" style="background: rgb(128,0,128);">Fuchsia low</button>
            <button class="color-preset-btn" data-color="4C" data-name="Orange low" style="background: rgb(255,128,0);">Orange low</button>
            <button class="color-preset-btn" data-color="50" data-name="Yellow low" style="background: rgb(255,255,0); opacity: 0.6;">Yellow low</button>
            <button class="color-preset-btn" data-color="52" data-name="White low" style="background: rgb(192,192,192);">White low</button>
            <button class="color-preset-btn" data-color="5C" data-name="Lime" style="background: rgb(128,255,128);">Lime</button>
            <button class="color-preset-btn" data-color="60" data-name="Red" style="background: rgb(255,0,0);">Red</button>
            <button class="color-preset-btn" data-color="63" data-name="Fuchsia" style="background: rgb(255,0,255);">Fuchsia</button>
            <button class="color-preset-btn" data-color="74" data-name="Orange" style="background: rgb(255,128,0);">Orange</button>
            <button class="color-preset-btn" data-color="7C" data-name="Yellow" style="background: rgb(255,255,0);">Yellow</button>
            <button class="color-preset-btn" data-color="7F" data-name="White" style="background: rgb(255,255,255); border: 1px solid #666;">White</button>
          </div>
        </div>

        <!-- Sección de mensajes rápidos -->
        <div class="output-section">
          <h4>Mensajes Rápidos</h4>
          <div class="quick-messages">
            <button class="quick-msg-btn" data-hex="90 00 7f">Note On (Ch0, N0, V127)</button>
            <button class="quick-msg-btn" data-hex="80 00 00">Note Off (Ch0, N0)</button>
            <button class="quick-msg-btn" data-hex="B0 00 7f">CC 0 (Ch0, V127)</button>
            <button class="quick-msg-btn" data-hex="B0 01 40">CC 1 (Ch0, V64)</button>
            <button class="quick-msg-btn" data-hex="90 00 00">Note On Off (Ch0, N0, V0)</button>
            <button class="quick-msg-btn" data-hex="B0 07 7f">CC 7 Volume (Ch0, V127)</button>
          </div>
        </div>

        <!-- Historial de mensajes enviados -->
        <div class="output-section">
          <h4>Historial de Mensajes Enviados</h4>
          <div class="message-history">
            <div id="message-history-list" class="message-history-list"></div>
            <button id="clear-history-btn" class="btn-secondary">Limpiar Historial</button>
          </div>
        </div>
      </div>
    `;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Enviar mensaje HEX manual
    const sendHexBtn = document.getElementById('send-hex-btn')!;
    const hexInput = document.getElementById('midi-hex-input') as HTMLInputElement;
    
    sendHexBtn.addEventListener('click', () => this.sendHexMessage());
    hexInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendHexMessage();
      }
    });

    // Controles de pad y color
    const padNumber = document.getElementById('pad-number') as HTMLInputElement;
    const colorValue = document.getElementById('color-value') as HTMLInputElement;

    [padNumber, colorValue].forEach(input => {
      input.addEventListener('input', () => this.updatePadMessagePreview());
      input.addEventListener('keypress', (e) => {
        // Solo permitir caracteres hexadecimales
        const char = e.key.toLowerCase();
        if (!/[0-9a-f]/.test(char) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
          e.preventDefault();
        }
      });
    });

    // Botón enviar color al pad
    document.getElementById('send-pad-color-btn')!.addEventListener('click', () => this.sendPadColor());

    // Colores predefinidos - actualizar el valor DATA2
    document.querySelectorAll('.color-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const colorHex = btn.getAttribute('data-color') || '00';
        const colorName = btn.getAttribute('data-name') || 'Color';
        this.setColorValue(colorHex, colorName);
      });
    });

    // Mensajes rápidos
    document.querySelectorAll('.quick-msg-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const hex = btn.getAttribute('data-hex') || '';
        hexInput.value = hex;
        this.sendHexMessage();
      });
    });

    // Limpiar historial
    document.getElementById('clear-history-btn')!.addEventListener('click', () => this.clearHistory());

    // Inicializar preview
    this.updatePadMessagePreview();
  }

  private updatePadMessagePreview() {
    const padNumber = (document.getElementById('pad-number') as HTMLInputElement).value.trim().padStart(2, '0').toUpperCase();
    const colorValue = (document.getElementById('color-value') as HTMLInputElement).value.trim().padStart(2, '0').toUpperCase();
    
    // Validar que sean valores hex válidos
    const padNum = parseInt(padNumber, 16);
    const colorVal = parseInt(colorValue, 16);
    
    if (isNaN(padNum) || padNum < 0 || padNum > 0x7F) {
      return;
    }
    if (isNaN(colorVal) || colorVal < 0 || colorVal > 0xFF) {
      return;
    }

    const message = `96 ${padNumber} ${colorValue}`;
    document.getElementById('pad-message-preview')!.textContent = message;
  }

  private setColorValue(colorHex: string, colorName: string) {
    // Actualizar el campo de color
    const colorInput = document.getElementById('color-value') as HTMLInputElement;
    colorInput.value = colorHex.toUpperCase();
    
    // Actualizar el preview del mensaje
    this.updatePadMessagePreview();
    
    // También actualizar el mensaje manual si está en formato 96 XX YY
    const hexInput = document.getElementById('midi-hex-input') as HTMLInputElement;
    const currentValue = hexInput.value.trim();
    const parts = currentValue.split(/\s+/);
    
    // Si el mensaje actual es formato 96 XX YY, actualizar YY
    if (parts.length === 3 && parts[0].toUpperCase() === '96') {
      parts[2] = colorHex.toUpperCase();
      hexInput.value = parts.join(' ');
    }
  }

  private async sendHexMessage() {
    const hexInput = document.getElementById('midi-hex-input') as HTMLInputElement;
    const hex = hexInput.value.trim();

    if (!hex) {
      alert('Por favor, ingresa un mensaje HEX');
      return;
    }

    try {
      const message = this.parseHexToMessage(hex);
      if (!message) {
        alert('Mensaje HEX inválido. Formato esperado: "Status Data1 Data2" (ej: "90 00 7f")');
        return;
      }

      await this.sendMessage(message, hex);
      this.addToHistory(hex, 'Mensaje manual');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert(`Error enviando mensaje: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async sendPadColor() {
    const padNumber = (document.getElementById('pad-number') as HTMLInputElement).value.trim();
    const colorValue = (document.getElementById('color-value') as HTMLInputElement).value.trim();

    if (!padNumber || !colorValue) {
      alert('Por favor, ingresa un número de pad y un color válidos');
      return;
    }

    const padNum = parseInt(padNumber, 16);
    const colorVal = parseInt(colorValue, 16);

    if (isNaN(padNum) || padNum < 0 || padNum > 0x7F) {
      alert('El número de pad debe estar entre 00 y 7F (hex)');
      return;
    }

    if (isNaN(colorVal) || colorVal < 0 || colorVal > 0xFF) {
      alert('El valor de color debe estar entre 00 y FF (hex)');
      return;
    }

    const padHex = padNum.toString(16).padStart(2, '0').toUpperCase();
    const colorHex = colorVal.toString(16).padStart(2, '0').toUpperCase();
    const messageHex = `96 ${padHex} ${colorHex}`;

    try {
      const message = this.parseHexToMessage(messageHex);
      if (!message) {
        alert('Error parseando mensaje MIDI');
        return;
      }

      await this.sendMessage(message, messageHex);
      this.addToHistory(messageHex, `Pad ${padHex} - Color ${colorHex}`);
    } catch (error) {
      console.error('Error enviando color al pad:', error);
      alert(`Error enviando color: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async sendMessage(message: MidiMessage, displayHex: string) {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.midi) {
      throw new Error('La API MIDI de Electron no está disponible');
    }

    const isOutputOpen = await electronAPI.midi.isOutputOpen();
    if (!isOutputOpen) {
      throw new Error('No hay dispositivo MIDI de salida conectado. Por favor, conecta un dispositivo de salida en la sección "Dispositivos MIDI".');
    }

    await electronAPI.midi.sendMessage(message);
  }

  private parseHexToMessage(hex: string): MidiMessage | null {
    try {
      const parts = hex.trim().split(/\s+/).filter(p => p.trim());
      if (parts.length < 2) return null;

      const status = parseInt(parts[0], 16);
      const data1 = parseInt(parts[1], 16);
      const data2 = parts.length > 2 ? parseInt(parts[2], 16) : 0;

      if (isNaN(status) || isNaN(data1) || isNaN(data2)) {
        return null;
      }

      const channel = status & 0x0F;
      const messageType = (status >> 4) & 0x0F;

      if (messageType === 0x9 || messageType === 0x8) {
        return {
          type: 'note',
          channel: channel,
          note: data1,
          value: messageType === 0x9 ? data2 : 0,
          raw: hex,
        };
      } else if (messageType === 0xB) {
        return {
          type: 'cc',
          channel: channel,
          cc: data1,
          value: data2,
          raw: hex,
        };
      }

      return null;
    } catch (error) {
      console.error('Error parseando mensaje MIDI:', error);
      return null;
    }
  }

  private addToHistory(hex: string, description: string) {
    const historyList = document.getElementById('message-history-list')!;
    const entry = document.createElement('div');
    entry.className = 'history-entry';
    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `
      <div class="history-time">${time}</div>
      <div class="history-hex"><code>${hex}</code></div>
      <div class="history-desc">${description}</div>
    `;
    historyList.insertBefore(entry, historyList.firstChild);

    // Limitar a 50 entradas
    while (historyList.children.length > 50) {
      historyList.removeChild(historyList.lastChild!);
    }
  }

  private clearHistory() {
    const historyList = document.getElementById('message-history-list')!;
    historyList.innerHTML = '';
  }
}
