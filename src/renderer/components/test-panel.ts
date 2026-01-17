// Panel para probar comandos MIDI

import { Mapping, MidiMessage, MidiControl } from '../../shared/types';
import { MappingFinder, FoundMapping } from '../utils/mapping-finder';
import { MappingEditor } from './mapping-editor';

interface TestEntry {
  id: string;
  hex: string;
  decimal: string;
  originMapping: FoundMapping | null;
  newMapping: Mapping | null;
  label: string;
}

export class TestPanel {
  private container: HTMLElement;
  private testMode: 'simulate' | 'real' = 'simulate';
  private mappings: Mapping[] = [];
  private mappingFinder: MappingFinder;
  private mappingEditor: MappingEditor;
  private entries: TestEntry[] = [];
  private entryCounter: number = 0;
  private sourceFileName: string | null = null;

  constructor(containerId: string, mappingEditor: MappingEditor) {
    this.container = document.getElementById(containerId)!;
    this.mappingFinder = new MappingFinder();
    this.mappingEditor = mappingEditor;
    this.render();
    this.setupMidiListener();
  }

  /**
   * Establece el archivo origen para filtrar los mapeos mostrados
   */
  setSourceFile(fileName: string | null): void {
    this.sourceFileName = fileName;
    this.mappingFinder.setSourceFile(fileName);
    // Limpiar entradas existentes para reflejar el nuevo filtro
    this.entries = [];
    this.renderTable();
  }

  private render() {
    this.container.innerHTML = `
      <div class="test-panel">
        <h3>Mappings</h3>
        <div class="test-mode-selector">
          <label>
            <input type="radio" name="test-mode" value="simulate" checked>
            Simulate
          </label>
          <label>
            <input type="radio" name="test-mode" value="real">
            Send to DJUCED
          </label>
        </div>
        <div class="test-table-container">
          <table class="test-table">
            <thead>
              <tr>
                <th>HEX / DEC</th>
                <th>Origin Mapping</th>
                <th>New Mapping</th>
                <th>Outputs</th>
                <th>Label</th>
              </tr>
            </thead>
            <tbody id="test-table-body">
            </tbody>
          </table>
        </div>
        <button id="clear-log-btn">Clear Table</button>
      </div>
    `;

    const modeRadios = this.container.querySelectorAll('input[name="test-mode"]');
    modeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.testMode = (e.target as HTMLInputElement).value as 'simulate' | 'real';
      });
    });

    const clearBtn = document.getElementById('clear-log-btn')!;
    clearBtn.addEventListener('click', () => this.clearTable());
  }

  private setupMidiListener() {
    (window as any).electronAPI.midi.onMessage((message: MidiMessage) => {
      this.handleMidiMessage(message);
    });
  }

  private async handleMidiMessage(message: MidiMessage) {
    // Buscar mapeo nuevo que coincida con el mensaje
    const newMapping = this.mappings.find(m => {
      const control = m.control;
      return control.input.channel === message.channel &&
             control.input.type === message.type &&
             (message.type === 'note' && control.input.note === message.note ||
              message.type === 'cc' && control.input.cc === message.cc);
    });

    // Buscar mapeo origen
    const originMappings = await this.mappingFinder.findMappings(message);
    const originMapping = originMappings.length > 0 ? originMappings[0] : null;

    // Convertir hex a decimal
    const hexParts = message.raw.split(' ').filter(p => p.trim());
    const decimalParts = hexParts.map(hex => {
      const dec = parseInt(hex, 16);
      return isNaN(dec) ? hex : dec.toString();
    });
    const decimal = decimalParts.join(' ');

    // Crear entrada
    const entryId = `entry-${this.entryCounter++}`;
    const entry: TestEntry = {
      id: entryId,
      hex: message.raw,
      decimal: decimal,
      originMapping: originMapping,
      newMapping: newMapping || null,
      label: this.loadLabel(message.raw) || ''
    };

    this.entries.unshift(entry);
    
    // Limitar a 100 entradas
    if (this.entries.length > 100) {
      this.entries = this.entries.slice(0, 100);
    }

    this.renderTable();

    // Si hay mapeo nuevo y el modo es real, enviar a DJUCED
    if (newMapping && this.testMode === 'real') {
      try {
        // Enviar todos los output messages si existen
        if (newMapping.control.outputs && newMapping.control.outputs.length > 0) {
          for (const output of newMapping.control.outputs) {
            await (window as any).electronAPI.midi.sendMessage(output);
          }
        }
      } catch (error) {
        console.error('Error enviando comando:', error);
      }
    }
  }

  private renderTable() {
    const tbody = document.getElementById('test-table-body')!;
    tbody.innerHTML = '';

    this.entries.forEach(entry => {
      const row = document.createElement('tr');
      row.className = entry.newMapping ? 'has-new-mapping' : 'no-mapping';
      
      // Columna 1: HEX / DEC
      const decCell = document.createElement('td');
      decCell.className = 'dec-cell';
      const decContainer = document.createElement('div');
      decContainer.className = 'dec-container';
      
      // Mostrar HEX y DEC
      const hexDecDiv = document.createElement('div');
      hexDecDiv.className = 'hex-dec-display';
      hexDecDiv.innerHTML = `
        <div class="hex-value"><strong>HEX:</strong> <code>${entry.hex}</code></div>
        <div class="dec-value"><strong>DEC:</strong> <code>${entry.decimal}</code></div>
      `;
      decContainer.appendChild(hexDecDiv);
      
      // Add Edit button if there's a new mapping
      if (entry.newMapping) {
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-mapping-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', () => {
          this.editNewMapping(entry.newMapping!);
        });
        decContainer.appendChild(editBtn);
      }
      
      decCell.appendChild(decContainer);
      row.appendChild(decCell);

      // Column 2: Origin Mapping
      const originCell = document.createElement('td');
      originCell.className = 'origin-mapping-cell';
      if (entry.originMapping) {
        const valueInfo = entry.originMapping.extractedValue 
          ? `<div class="mapping-value">Extracted value: <code>${entry.originMapping.extractedValue}</code></div>`
          : '';
        originCell.innerHTML = `
          <div class="mapping-info">
            <div class="mapping-name"><strong>${entry.originMapping.controlName}</strong></div>
            <div class="mapping-action">${entry.originMapping.action}</div>
            <div class="mapping-file">${entry.originMapping.file}</div>
            ${valueInfo}
          </div>
        `;
      } else {
        originCell.textContent = '-';
        originCell.className += ' no-mapping';
      }
      row.appendChild(originCell);

      // Column 3: New Mapping
      const newMappingCell = document.createElement('td');
      newMappingCell.className = 'new-mapping-cell';
      if (entry.newMapping) {
        const mappingInfoDiv = document.createElement('div');
        mappingInfoDiv.className = 'mapping-info';
        mappingInfoDiv.innerHTML = `
          <div class="mapping-name"><strong>${entry.newMapping.controlName}</strong></div>
          <div class="mapping-action">${entry.newMapping.action.action || 'No action'}</div>
          <div class="mapping-channel">Channel: ${entry.newMapping.action.channel}</div>
        `;
        
        newMappingCell.appendChild(mappingInfoDiv);
      } else {
        // If there's no new mapping, allow creating one
        const createBtn = document.createElement('button');
        createBtn.className = 'create-mapping-btn';
        createBtn.textContent = 'Create Mapping';
        createBtn.addEventListener('click', () => {
          this.createNewMapping(entry);
        });
        newMappingCell.appendChild(createBtn);
        newMappingCell.className += ' no-mapping';
      }
      row.appendChild(newMappingCell);

      // Columna 4: Outputs
      const outputsCell = document.createElement('td');
      outputsCell.className = 'outputs-cell';
      if (entry.newMapping && entry.newMapping.control.outputs && entry.newMapping.control.outputs.length > 0) {
        const outputsContainer = document.createElement('div');
        outputsContainer.className = 'outputs-list-inline';
        
        entry.newMapping.control.outputs.forEach((output, idx) => {
          const outputItem = document.createElement('div');
          outputItem.className = 'output-item-inline';
          outputItem.innerHTML = `
            <code class="output-hex-inline">${output.raw}</code>
            <span class="output-info-inline">Ch${output.channel} ${output.type === 'note' ? `N${output.note}` : `CC${output.cc}`} V${output.value}</span>
          `;
          outputsContainer.appendChild(outputItem);
        });
        
        outputsCell.appendChild(outputsContainer);
      } else {
        outputsCell.textContent = '-';
        outputsCell.className += ' no-outputs';
      }
      row.appendChild(outputsCell);

      // Column 5: Label
      const labelCell = document.createElement('td');
      labelCell.className = 'label-cell';
      const labelInput = document.createElement('input');
      labelInput.type = 'text';
      labelInput.className = 'label-input';
      labelInput.value = entry.label;
      labelInput.placeholder = 'Enter a label...';
      labelInput.addEventListener('change', () => {
        this.saveLabel(entry.hex, labelInput.value);
        entry.label = labelInput.value;
      });
      labelCell.appendChild(labelInput);
      row.appendChild(labelCell);

      tbody.appendChild(row);
    });
  }

  private clearTable() {
    this.entries = [];
    this.renderTable();
  }

  private saveLabel(hex: string, label: string) {
    try {
      const labels = this.loadAllLabels();
      if (label.trim()) {
        labels[hex] = label.trim();
      } else {
        delete labels[hex];
      }
      localStorage.setItem('midi-labels', JSON.stringify(labels));
    } catch (error) {
      console.error('Error guardando etiqueta:', error);
    }
  }

  private loadLabel(hex: string): string {
    try {
      const labels = this.loadAllLabels();
      return labels[hex] || '';
    } catch (error) {
      console.error('Error cargando etiqueta:', error);
      return '';
    }
  }

  private loadAllLabels(): Record<string, string> {
    try {
      const stored = localStorage.getItem('midi-labels');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  setMappings(mappings: Mapping[]) {
    this.mappings = mappings;
    // Actualizar la tabla para reflejar los cambios
    this.renderTable();
  }

  private editNewMapping(mapping: Mapping) {
    // Usar el editor de mapeos para editar
    this.mappingEditor.editMapping(mapping);
    
    // Los cambios se sincronizarán automáticamente a través del callback
    // que ya está configurado en app.ts
  }

  private createNewMapping(entry: TestEntry) {
    console.log('createNewMapping llamado para entry:', entry);
    
    // Create a MIDI control from the message
    const message = this.parseHexToMessage(entry.hex);
    if (!message) {
      console.error('Could not parse MIDI message:', entry.hex);
      alert('Could not parse MIDI message');
      return;
    }

    console.log('Mensaje parseado:', message);

    // Usar la etiqueta si existe, sino generar un nombre automático
    let controlName = entry.label && entry.label.trim() 
      ? entry.label.trim() 
      : this.generateControlName(message);

    console.log('Nombre del control:', controlName);

    // Detectar si es un intervalo incremental con rangos invertidos
    const isIncrementalInterval = this.detectIncrementalInterval(message, entry);

    const control: MidiControl = {
      name: controlName,
      input: message,
      type: message.value === 0 || message.value === 127 ? 'toggle' : 'interval',
      min: isIncrementalInterval ? '7f-40' : '0',
      max: isIncrementalInterval ? '1-3f' : '7f',
      incremental: isIncrementalInterval,
      stepsPerTurn: isIncrementalInterval ? 24 : undefined,
    };

    console.log('Control creado:', control);

    // Agregar el mapeo al editor
    this.mappingEditor.addMapping(control, controlName, entry.originMapping);
    
    console.log('Mapeo agregado al editor');
    
    // Actualizar la tabla después de un breve delay para que el mapeo se agregue
    setTimeout(() => {
      this.mappings = this.mappingEditor.getMappings();
      this.renderTable();
    }, 100);
  }

  /**
   * Detecta si un mensaje MIDI es un intervalo incremental con rangos invertidos
   * (de mayor a menor, típico de controles rotativos incrementales)
   */
  private detectIncrementalInterval(message: MidiMessage, entry: TestEntry): boolean {
    // Solo detectar para mensajes CC (Control Change)
    if (message.type !== 'cc') {
      return false;
    }

    // Buscar en el historial de entradas si hay múltiples mensajes del mismo control
    // que muestren un patrón de valores decrecientes (de mayor a menor)
    const sameControlEntries = this.entries.filter(e => {
      const eMsg = this.parseHexToMessage(e.hex);
      return eMsg && 
             eMsg.type === 'cc' && 
             eMsg.channel === message.channel && 
             eMsg.cc === message.cc;
    });

    // Si hay múltiples mensajes del mismo control, analizar el patrón
    if (sameControlEntries.length >= 2) {
      const values = sameControlEntries.map(e => {
        const m = this.parseHexToMessage(e.hex);
        return m ? m.value : -1;
      }).filter(v => v >= 0);

      // Detectar si los valores van de mayor a menor (patrón típico de incremental invertido)
      // Los controles incrementales suelen empezar en valores altos (7f-40) y bajar a valores bajos (1-3f)
      if (values.length >= 2) {
        const firstValue = values[0];
        const lastValue = values[values.length - 1];
        
        // If the first value is high (>= 64) and the last is low (<= 63), it's probably an inverted incremental
        if (firstValue >= 64 && lastValue <= 63) {
          console.log('Detected inverted incremental pattern: values go from', firstValue, 'to', lastValue);
          return true;
        }

        // Also detect if there's a general decreasing trend
        let decreasingCount = 0;
        for (let i = 1; i < values.length; i++) {
          if (values[i] < values[i - 1]) {
            decreasingCount++;
          }
        }
        // If more than 50% of transitions are decreasing, it's probably incremental
        if (decreasingCount > (values.length - 1) * 0.5 && firstValue > 63) {
          console.log('Detected inverted incremental pattern by decreasing trend');
          return true;
        }
      }
    }

    // Si el valor actual está en el rango típico de inicio de un control incremental (64-127)
    // y es un CC, podría ser un control incremental
    // Los controles incrementales suelen enviar valores en el rango 0x40-0x7F (64-127) para incrementos positivos
    // y 0x01-0x3F (1-63) para incrementos negativos
    if (message.value >= 64 && message.value <= 127) {
      // Esto es solo una heurística - el usuario puede ajustar manualmente después
      // Por ahora, no lo marcamos automáticamente como incremental para evitar falsos positivos
      return false;
    }

    return false;
  }

  private generateControlName(message: MidiMessage): string {
    if (message.type === 'note') {
      return `Note ${message.note} Ch${message.channel + 1}`;
    } else if (message.type === 'cc') {
      return `CC${message.cc} Ch${message.channel + 1}`;
    }
    return `Control ${message.raw}`;
  }

  private parseHexToMessage(hex: string): MidiMessage | null {
    try {
      const parts = hex.trim().split(/\s+/).filter(p => p.trim());
      if (parts.length < 3) return null;

      const status = parseInt(parts[0], 16);
      const data1 = parseInt(parts[1], 16);
      const data2 = parts.length > 2 ? parseInt(parts[2], 16) : 0;

      const channel = status & 0x0F;
      const messageType = (status >> 4) & 0x0F;

      if (messageType === 0x9 || messageType === 0x8) {
        // Note On/Off
        return {
          type: 'note',
          channel: channel,
          note: data1,
          value: messageType === 0x9 ? data2 : 0,
          raw: hex,
        };
      } else if (messageType === 0xB) {
        // Control Change
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
}
