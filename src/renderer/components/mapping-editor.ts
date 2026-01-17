// Editor visual de mapeos

import { Mapping, MidiControl, MidiMessage, DjucedAction, ActionInfo } from '../../shared/types';
import { ActionExtractor } from '../utils/action-extractor';
import { DjmParser } from '../utils/djm-parser';
import { FoundMapping } from '../utils/mapping-finder';

interface OutputMessageInfo {
  raw: string;
  description: string;
  controlName: string;
  action?: string;
}

export class MappingEditor {
  private container: HTMLElement;
  private mappings: Mapping[] = [];
  private actions: ActionInfo[] = [];
  private actionExtractor: ActionExtractor;
  private onMappingChangeCallback?: (mappings: Mapping[]) => void;
  private availableOutputs: OutputMessageInfo[] = [];

  /**
   * Escapa caracteres especiales XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Formatea un mensaje MIDI para mostrarlo de manera legible
   */
  private formatMidiMessageForDisplay(control: MidiControl): string {
    const input = control.input;
    let display = input.raw;
    
    // Agregar información adicional si está disponible
    const parts: string[] = [];
    
    if (input.type === 'note' && input.note !== undefined) {
      parts.push(`Note ${input.note}`);
    } else if (input.type === 'cc' && input.cc !== undefined) {
      parts.push(`CC ${input.cc}`);
    } else if (input.type === 'sysex') {
      parts.push('SysEx');
    }
    
    if (input.channel) {
      parts.push(`Ch ${input.channel}`);
    }
    
    if (input.value !== undefined) {
      parts.push(`Val ${input.value}`);
    }
    
    if (parts.length > 0) {
      display += ` (${parts.join(', ')})`;
    }
    
    return display;
  }

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.actionExtractor = new ActionExtractor();
    this.render();
    this.loadActions();
    this.loadAvailableOutputs();
  }

  private async loadActions() {
    try {
      // Cargar acciones desde archivos de referencia
      // Intentar cargar desde la carpeta todos relativa al workspace
      const todosPath = 'todos';
      
      try {
        const files = await (window as any).electronAPI.fs.readDir(todosPath);
        
        for (const file of files) {
          if (file.endsWith('.djm')) {
            try {
              const content = await (window as any).electronAPI.fs.readFile(`${todosPath}/${file}`);
              await this.actionExtractor.extractFromFile(`${todosPath}/${file}`, content);
            } catch (error) {
              console.error(`Error procesando ${file}:`, error);
            }
          }
        }
        
        this.actions = this.actionExtractor.getAllActions();
        
        // Mostrar estadísticas de extracción
        const stats = this.actionExtractor.getStats();
        console.log(`📊 Acciones disponibles para mapeo: ${stats.total} acciones únicas`);
      } catch (error) {
        console.warn('No se pudo cargar desde todos/, usando acciones por defecto:', error);
        this.actions = this.getDefaultActions();
      }
      
      if (this.actions.length === 0) {
        this.actions = this.getDefaultActions();
      }
      
      this.updateActionSelect();
    } catch (error) {
      console.error('Error cargando acciones:', error);
      // Usar acciones por defecto si falla
      this.actions = this.getDefaultActions();
      this.updateActionSelect();
    }
  }

  private getDefaultActions(): ActionInfo[] {
    return [
      { action: 'play_pause', examples: [], categories: ['playback'] },
      { action: 'cue_stop', examples: [], categories: ['cue'] },
      { action: 'stop', examples: [], categories: ['playback'] },
      { action: 'pitch', examples: [], categories: ['pitch'] },
      { action: 'pitch_bend', examples: [], categories: ['pitch'] },
      { action: 'level', examples: [], categories: ['volume'] },
      { action: 'gain', examples: [], categories: ['volume'] },
      { action: 'high', examples: [], categories: ['eq'] },
      { action: 'bass', examples: [], categories: ['eq'] },
      { action: 'medium', examples: [], categories: ['eq'] },
      { action: 'loop_toggle', examples: [], categories: ['loop'] },
      { action: 'loop_in_move', examples: [], categories: ['loop'] },
      { action: 'loop_out_move', examples: [], categories: ['loop'] },
      { action: 'hot_cue', examples: [], categories: ['cue'] },
      { action: 'toggle_effect', examples: [], categories: ['effects'] },
      { action: 'set_pass_filter_amount', examples: [], categories: ['filter'] },
      { action: 'scratch', examples: [], categories: ['scratch'] },
      { action: 'sync', examples: [], categories: ['sync'] },
      { action: 'crossfader', examples: [], categories: ['mixer'] },
      { action: 'browser_load_deck', examples: [], categories: ['browser'] },
    ];
  }

  /**
   * Carga todos los output messages disponibles desde los archivos .djm y mapeos existentes
   */
  private async loadAvailableOutputs() {
    const outputsMap = new Map<string, OutputMessageInfo>();
    
    // Cargar desde archivos .djm en la carpeta todos
    try {
      const todosPath = 'todos';
      const files = await (window as any).electronAPI.fs.readDir(todosPath);
      
      for (const file of files) {
        if (file.endsWith('.djm')) {
          try {
            const content = await (window as any).electronAPI.fs.readFile(`${todosPath}/${file}`);
            const parser = new DjmParser();
            const djmFile = await parser.parseFile(`${todosPath}/${file}`, content);
            
            // Extraer outputs de todos los mapeos
            for (const mapping of djmFile.mappings) {
              if (mapping.control.outputs && mapping.control.outputs.length > 0) {
                for (const output of mapping.control.outputs) {
                  const key = output.raw.toLowerCase();
                  if (!outputsMap.has(key)) {
                    outputsMap.set(key, {
                      raw: output.raw,
                      description: `${mapping.controlName}${mapping.action.action ? ` (${mapping.action.action})` : ''}`,
                      controlName: mapping.controlName,
                      action: mapping.action.action,
                    });
                  }
                }
              }
            }
          } catch (error) {
            console.error(`Error procesando ${file} para outputs:`, error);
          }
        }
      }
    } catch (error) {
      console.warn('No se pudieron cargar outputs desde archivos .djm:', error);
    }
    
    // Agregar outputs de los mapeos actuales
    for (const mapping of this.mappings) {
      if (mapping.control.outputs && mapping.control.outputs.length > 0) {
        for (const output of mapping.control.outputs) {
          const key = output.raw.toLowerCase();
          if (!outputsMap.has(key)) {
            outputsMap.set(key, {
              raw: output.raw,
              description: `${mapping.controlName}${mapping.action.action ? ` (${mapping.action.action})` : ''}`,
              controlName: mapping.controlName,
              action: mapping.action.action,
            });
          }
        }
      }
    }
    
    this.availableOutputs = Array.from(outputsMap.values()).sort((a, b) => 
      a.controlName.localeCompare(b.controlName)
    );
    
    console.log(`📦 ${this.availableOutputs.length} output messages disponibles para selección`);
  }

  private render() {
    this.container.innerHTML = `
      <div class="mapping-editor">
        <h3>Mapeos</h3>
        <div id="mappings-list" class="mappings-list"></div>
        <button id="add-mapping-btn" class="add-btn">Agregar Mapeo</button>
      </div>
    `;

    const addBtn = document.getElementById('add-mapping-btn')!;
    addBtn.addEventListener('click', () => this.showAddMappingDialog());
  }

  private updateActionSelect() {
    // Se actualizará cuando se muestre el diálogo
  }

  addMapping(control: MidiControl, controlName: string, originMapping?: FoundMapping | null) {
    // Si hay un mapeo origen con valor extraído, usarlo
    let initialValue = 'auto';
    let initialAction = '';
    let initialChannel = 'default';
    
    if (originMapping) {
      // Si hay un valor extraído (de un mapeo con {value}), usarlo
      if (originMapping.extractedValue) {
        initialValue = originMapping.extractedValue;
      } else if (originMapping.value && originMapping.value !== 'auto') {
        initialValue = originMapping.value;
      }
      
      if (originMapping.action) {
        initialAction = originMapping.action;
      }
      
      if (originMapping.channel) {
        initialChannel = originMapping.channel;
      }
    }
    
    const mapping: Mapping = {
      controlName,
      control,
      action: {
        channel: initialChannel,
        action: initialAction,
        value: initialValue,
      },
    };

    this.mappings.push(mapping);
    this.renderMappings();
    // Actualizar outputs disponibles
    this.loadAvailableOutputs();
    // Pequeño delay para que la UI se actualice
    setTimeout(() => {
      this.showEditDialog(mapping);
    }, 100);
  }

  private renderMappings() {
    const list = document.getElementById('mappings-list')!;
    list.innerHTML = '';

    if (this.mappings.length === 0) {
      list.innerHTML = '<div class="empty-state">No hay mapeos. Agrega uno para comenzar.</div>';
      return;
    }

    this.mappings.forEach((mapping, index) => {
      const item = document.createElement('div');
      item.className = 'mapping-item';
      const actionStatus = mapping.action.action 
        ? `<span class="status-badge status-assigned">${mapping.action.action}</span>`
        : '<span class="status-badge status-pending">Sin asignar</span>';
      
      item.innerHTML = `
        <div class="mapping-header">
          <div class="mapping-title">
            <strong>${mapping.displayName || mapping.controlName}</strong>
            ${mapping.displayName ? `<small class="control-name-hint">(${mapping.controlName})</small>` : ''}
            ${actionStatus}
          </div>
          <div class="mapping-actions">
            <button class="test-btn" data-index="${index}" title="Probar input y output">Probar</button>
            <button class="edit-btn" data-index="${index}">Editar</button>
            <button class="delete-btn" data-index="${index}">Eliminar</button>
          </div>
        </div>
        <div class="mapping-details">
          <div class="mapping-name-field">
            <label><strong>Nombre del mapeo:</strong></label>
            <input type="text" class="mapping-display-name-input" 
                   value="${mapping.displayName || mapping.controlName}" 
                   placeholder="${mapping.controlName}"
                   data-index="${index}"
                   title="Edita el nombre personalizado para este mapeo">
            <small class="form-hint">Nombre personalizado para identificar este mapeo (opcional)</small>
          </div>
          <div><strong>MIDI Input:</strong> <code>${mapping.control.input.raw}</code></div>
          ${mapping.control.outputs && mapping.control.outputs.length > 0 ? `
            <div><strong>MIDI Output${mapping.control.outputs.length > 1 ? 's' : ''}:</strong> 
              ${mapping.control.outputs.map((out, idx) => `<code>${out.raw}</code>${idx < mapping.control.outputs!.length - 1 ? ', ' : ''}`).join('')}
            </div>
          ` : '<div><strong>MIDI Output:</strong> <span class="hint-text">Sin output</span></div>'}
          <div><strong>Tipo:</strong> ${mapping.control.type}</div>
          ${mapping.action.action ? `
            <div><strong>Canal:</strong> ${mapping.action.channel}</div>
            <div><strong>Valor:</strong> ${mapping.action.value}</div>
          ` : '<div class="hint-text">Haz clic en "Editar" para asignar una acción DJUCED</div>'}
        </div>
      `;

      item.querySelector(`.test-btn[data-index="${index}"]`)!.addEventListener('click', () => {
        this.testMapping(mapping);
      });

      item.querySelector(`.edit-btn[data-index="${index}"]`)!.addEventListener('click', () => {
        this.showEditDialog(mapping);
      });

      item.querySelector(`.delete-btn[data-index="${index}"]`)!.addEventListener('click', () => {
        this.deleteMapping(index);
      });

      // Agregar listener para el campo de nombre editable
      const nameInput = item.querySelector(`.mapping-display-name-input[data-index="${index}"]`) as HTMLInputElement;
      if (nameInput) {
        nameInput.addEventListener('change', (e) => {
          const newName = (e.target as HTMLInputElement).value.trim();
          if (newName && newName !== mapping.controlName) {
            mapping.displayName = newName;
          } else {
            mapping.displayName = undefined;
          }
          // Notificar cambio
          if (this.onMappingChangeCallback) {
            this.onMappingChangeCallback(this.mappings);
          }
        });
        
        nameInput.addEventListener('blur', (e) => {
          const newName = (e.target as HTMLInputElement).value.trim();
          if (newName && newName !== mapping.controlName) {
            mapping.displayName = newName;
          } else {
            mapping.displayName = undefined;
            (e.target as HTMLInputElement).value = mapping.controlName;
          }
          // Notificar cambio
          if (this.onMappingChangeCallback) {
            this.onMappingChangeCallback(this.mappings);
          }
        });
      }

      list.appendChild(item);
    });

    if (this.onMappingChangeCallback) {
      this.onMappingChangeCallback(this.mappings);
    }
  }

  private showAddMappingDialog() {
    // Diálogo para crear un mapeo manualmente
    const messageHex = prompt('Ingresa el mensaje MIDI en formato hexadecimal (ej: 90 03 7f):');
    if (!messageHex || !messageHex.trim()) return;

    const parsedMessage = this.parseMidiMessage(messageHex.trim());
    if (!parsedMessage) {
      alert('Mensaje MIDI inválido. Formato esperado: "90 03 7f" (status data1 data2)');
      return;
    }

    const controlName = prompt('Nombre del control:');
    if (!controlName) return;

    // Preguntar si es un intervalo incremental con rangos invertidos
    let isIncremental = false;
    if (parsedMessage.type === 'cc' && parsedMessage.value !== 0 && parsedMessage.value !== 127) {
      const incrementalResponse = confirm(
        '¿Es un control rotativo incremental (que se mueve de mayor a menor)?\n\n' +
        'Los controles incrementales típicamente:\n' +
        '- Son knobs/jog wheels rotativos\n' +
        '- Envían valores que van de 7f-40 (127-64) hacia 1-3f (1-63)\n' +
        '- Tienen min="7f-40" y max="1-3f" en lugar de min="0" y max="7f"\n\n' +
        'Haz clic en "Aceptar" si es incremental, o "Cancelar" si es un intervalo normal.'
      );
      isIncremental = incrementalResponse;
    }

    const control: MidiControl = {
      name: controlName,
      input: parsedMessage,
      type: parsedMessage.value === 0 || parsedMessage.value === 127 ? 'toggle' : 'interval',
      min: isIncremental ? '7f-40' : '0',
      max: isIncremental ? '1-3f' : '7f',
      incremental: isIncremental,
      stepsPerTurn: isIncremental ? 24 : undefined,
    };

    this.addMapping(control, controlName);
  }

  private showEditDialog(mapping: Mapping) {
    // Agrupar acciones por categoría para mejor organización
    const groupedActions: { [key: string]: ActionInfo[] } = {};
    this.actions.forEach(action => {
      const category = action.categories[0] || 'other';
      if (!groupedActions[category]) {
        groupedActions[category] = [];
      }
      groupedActions[category].push(action);
    });

    const categoryNames: { [key: string]: string } = {
      'playback': 'Reproducción',
      'cue': 'Cue Points',
      'loop': 'Loops',
      'effects': 'Efectos',
      'filter': 'Filtros',
      'pitch': 'Pitch',
      'volume': 'Volumen',
      'eq': 'EQ',
      'browser': 'Navegador',
      'sync': 'Sincronización',
      'scratch': 'Scratch',
      'mixer': 'Mezclador',
      'samples': 'Samples',
      'stems': 'Stems',
      'beatjump': 'Beat Jump',
      'quantize': 'Quantize',
      'slip': 'Slip',
      'condition': 'Conditions',
      'track': 'Track',
      'energy': 'Energy',
      'assistant': 'Assistant',
      'selection': 'Selection',
      'master': 'Master',
      'special': 'Special',
      'other': 'Otros',
    };

    // Calcular el valor formateado antes de usarlo en el template string
    const formattedMidiInput = this.formatMidiMessageForDisplay(mapping.control);

    const dialog = document.createElement('div');
    dialog.className = 'dialog-overlay';
    dialog.innerHTML = `
      <div class="dialog dialog-large">
        <h3>Editar Mapeo: ${mapping.displayName || mapping.controlName}</h3>
        <div class="mapping-info">
          <div class="info-item"><strong>MIDI Input:</strong> <code>${formattedMidiInput}</code></div>
          <div class="info-item"><strong>Tipo:</strong> ${mapping.control.type}</div>
        </div>
        
        <div class="form-group">
          <label>Nombre del Mapeo:</label>
          <input type="text" id="mapping-display-name-input" 
                 value="${mapping.displayName || mapping.controlName}" 
                 placeholder="${mapping.controlName}">
          <small class="form-hint">Nombre personalizado para identificar este mapeo (opcional). Si está vacío, se usará el nombre del control.</small>
        </div>
        
        <div class="form-group">
          <label>Output Messages (Mensajes de Salida):</label>
          <div id="output-messages-container" class="output-messages-container">
            ${(mapping.control.outputs || []).map((output, index) => `
              <div class="output-message-item" data-index="${index}">
                <input type="text" class="output-message-input" value="${output.raw}" 
                       placeholder="Ej: 90 03 7f" data-index="${index}">
                <button type="button" class="play-output-btn" data-index="${index}" title="Probar este output">▶</button>
                <button type="button" class="remove-output-btn" data-index="${index}">Eliminar</button>
              </div>
            `).join('')}
            <button type="button" id="add-output-btn" class="add-output-btn">+ Agregar Output</button>
          </div>
          <small class="form-hint">Los output messages se envían al controlador para actualizar LEDs e indicadores. 
          Déjalo vacío si el control no tiene retroalimentación visual.</small>
        </div>
        <div class="form-group">
          <label>Acción DJUCED:</label>
          <div class="action-select-wrapper">
            <select id="action-select" class="action-select">
              <option value="">Seleccionar acción...</option>
              ${Object.keys(groupedActions).sort().map(category => `
                <optgroup label="${categoryNames[category] || category}">
                  ${groupedActions[category].map(a => 
                    `<option value="${a.action}" ${mapping.action.action === a.action ? 'selected' : ''}>${a.action}</option>`
                  ).join('')}
                </optgroup>
              `).join('')}
            </select>
            <div id="action-description" class="action-description"></div>
          </div>
        </div>
        <div class="form-group">
          <label>Canal:</label>
          <select id="channel-select">
            <option value="default" ${mapping.action.channel === 'default' ? 'selected' : ''}>Default</option>
            <option value="1" ${mapping.action.channel === '1' ? 'selected' : ''}>Canal 1</option>
            <option value="2" ${mapping.action.channel === '2' ? 'selected' : ''}>Canal 2</option>
            <option value="3" ${mapping.action.channel === '3' ? 'selected' : ''}>Canal 3</option>
            <option value="4" ${mapping.action.channel === '4' ? 'selected' : ''}>Canal 4</option>
          </select>
        </div>
        <div class="form-group">
          <label>Valor:</label>
          <input type="text" id="value-input" value="${mapping.action.value}" placeholder="auto, 0, 1, etc.">
          <small class="form-hint">Normalmente "auto". Usa valores específicos (0, 1, etc.) solo si es necesario.</small>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="temporary-check" ${mapping.action.temporary ? 'checked' : ''}>
            Temporary (acción temporal)
          </label>
        </div>
        
        <div class="form-group">
          <label><strong>Código DJM Generado (Editable):</strong></label>
          <div class="djm-code-preview">
            <div class="code-section">
              <div class="code-section-header">
                <strong>Control (midi-device):</strong>
              </div>
              <textarea id="control-code-preview" class="code-editor" rows="6" spellcheck="false"></textarea>
            </div>
            <div class="code-section">
              <div class="code-section-header">
                <strong>Map (midi-map):</strong>
              </div>
              <textarea id="map-code-preview" class="code-editor" rows="3" spellcheck="false"></textarea>
            </div>
          </div>
          <small class="form-hint">Puedes editar el código XML directamente. Los cambios se aplicarán al guardar.</small>
        </div>
        
        <div class="dialog-actions">
          <button id="save-mapping-btn" class="btn-primary">Guardar</button>
          <button id="cancel-mapping-btn" class="btn-secondary">Cancelar</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    // Referencias a los elementos de edición XML
    const controlCodeEditor = dialog.querySelector('#control-code-preview') as HTMLTextAreaElement;
    const mapCodeEditor = dialog.querySelector('#map-code-preview') as HTMLTextAreaElement;

    // Función para generar el código XML del control
    const generateControlCode = (): string => {
      const displayNameInput = dialog.querySelector('#mapping-display-name-input') as HTMLInputElement;
      const controlName = displayNameInput.value.trim() || mapping.controlName;
      
      const outputInputs = dialog.querySelectorAll('.output-message-input') as NodeListOf<HTMLInputElement>;
      const outputs: string[] = [];
      for (const input of Array.from(outputInputs)) {
        const value = input.value.trim();
        if (value) {
          outputs.push(value);
        }
      }

      let code = `  <control name="${this.escapeXml(controlName)}">\n`;
      code += `   <input message="${mapping.control.input.raw}"`;
      if (mapping.control.min) code += ` min="${mapping.control.min}"`;
      if (mapping.control.max) code += ` max="${mapping.control.max}"`;
      if (mapping.control.type) code += ` type="${mapping.control.type}"`;
      if (mapping.control.stepsPerTurn) code += ` steps-per-turn="${mapping.control.stepsPerTurn}"`;
      if (mapping.control.incremental) code += ` incremental="yes"`;
      code += `/>\n`;
      
      if (outputs.length > 0) {
        for (const output of outputs) {
          code += `   <output message="${output}"`;
          if (mapping.control.min) code += ` min="${mapping.control.min}"`;
          if (mapping.control.max) code += ` max="${mapping.control.max}"`;
          if (mapping.control.type) code += ` type="${mapping.control.type}"`;
          code += `/>\n`;
        }
      }
      
      code += `  </control>`;
      return code;
    };

    // Función para generar el código XML del map
    const generateMapCode = (): string => {
      const displayNameInput = dialog.querySelector('#mapping-display-name-input') as HTMLInputElement;
      const actionSelect = dialog.querySelector('#action-select') as HTMLSelectElement;
      const channelSelect = dialog.querySelector('#channel-select') as HTMLSelectElement;
      const valueInput = dialog.querySelector('#value-input') as HTMLInputElement;
      const temporaryCheck = dialog.querySelector('#temporary-check') as HTMLInputElement;
      
      const controlName = displayNameInput.value.trim() || mapping.controlName;
      const action = actionSelect.value;
      const channel = channelSelect.value;
      const value = valueInput.value || 'auto';
      const temporary = temporaryCheck.checked;

      if (!action) {
        return `  <map name="${this.escapeXml(controlName)}" action="(sin acción asignada)"/>`;
      }

      let actionStr = `chann=${channel}  action=${action} value="${value}"`;
      if (temporary) {
        actionStr += ' temporary';
      }

      return `  <map name="${this.escapeXml(controlName)}" action="${this.escapeXml(actionStr)}"/>`;
    };

    // Función para actualizar las vistas previas
    const updatePreviews = () => {
      // Solo actualizar si el usuario no está editando manualmente
      if (!controlCodeEditor.dataset.manualEdit) {
        controlCodeEditor.value = generateControlCode();
      }
      if (!mapCodeEditor.dataset.manualEdit) {
        mapCodeEditor.value = generateMapCode();
      }
    };
    
    // Marcar cuando el usuario edita manualmente
    controlCodeEditor.addEventListener('input', () => {
      controlCodeEditor.dataset.manualEdit = 'true';
    });
    
    mapCodeEditor.addEventListener('input', () => {
      mapCodeEditor.dataset.manualEdit = 'true';
    });
    
    // Botones para sincronizar desde los campos del formulario
    const addSyncButtons = () => {
      const controlHeader = dialog.querySelector('.code-section:first-child .code-section-header') as HTMLElement;
      const mapHeader = dialog.querySelector('.code-section:last-child .code-section-header') as HTMLElement;
      
      if (!controlHeader.querySelector('.sync-xml-btn')) {
        const syncControlBtn = document.createElement('button');
        syncControlBtn.className = 'sync-xml-btn';
        syncControlBtn.textContent = '↻ Sincronizar';
        syncControlBtn.title = 'Actualizar desde los campos del formulario';
        syncControlBtn.addEventListener('click', () => {
          controlCodeEditor.dataset.manualEdit = 'false';
          controlCodeEditor.value = generateControlCode();
        });
        controlHeader.appendChild(syncControlBtn);
      }
      
      if (!mapHeader.querySelector('.sync-xml-btn')) {
        const syncMapBtn = document.createElement('button');
        syncMapBtn.className = 'sync-xml-btn';
        syncMapBtn.textContent = '↻ Sincronizar';
        syncMapBtn.title = 'Actualizar desde los campos del formulario';
        syncMapBtn.addEventListener('click', () => {
          mapCodeEditor.dataset.manualEdit = 'false';
          mapCodeEditor.value = generateMapCode();
        });
        mapHeader.appendChild(syncMapBtn);
      }
    };
    
    addSyncButtons();

    // Inicializar vistas previas
    // Si hay XML personalizado guardado, usarlo; si no, generar desde los campos
    if ((mapping as any).customControlXml) {
      controlCodeEditor.value = (mapping as any).customControlXml;
      controlCodeEditor.dataset.manualEdit = 'true';
    } else {
      controlCodeEditor.value = generateControlCode();
    }
    
    if ((mapping as any).customMapXml) {
      mapCodeEditor.value = (mapping as any).customMapXml;
      mapCodeEditor.dataset.manualEdit = 'true';
    } else {
      mapCodeEditor.value = generateMapCode();
    }

    // Mostrar descripción cuando se selecciona una acción
    const actionSelect = dialog.querySelector('#action-select') as HTMLSelectElement;
    const actionDescription = dialog.querySelector('#action-description') as HTMLElement;
    
    actionSelect.addEventListener('change', () => {
      const selectedAction = this.actions.find(a => a.action === actionSelect.value);
      if (selectedAction) {
        actionDescription.innerHTML = `
          <div class="action-info">
            <strong>Categorías:</strong> ${selectedAction.categories.join(', ')}
            ${selectedAction.examples.length > 0 ? `
              <div style="margin-top: 8px;">
                <strong>Ejemplos:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${selectedAction.examples.slice(0, 3).map(ex => `<li><code>${ex}</code></li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `;
      } else {
        actionDescription.innerHTML = '';
      }
      updatePreviews();
    });

    // Inicializar descripción si ya hay una acción seleccionada
    if (mapping.action.action) {
      actionSelect.dispatchEvent(new Event('change'));
    }

    // Agregar listeners para actualizar vistas previas en tiempo real
    const displayNameInput = dialog.querySelector('#mapping-display-name-input') as HTMLInputElement;
    const channelSelect = dialog.querySelector('#channel-select') as HTMLSelectElement;
    const valueInput = dialog.querySelector('#value-input') as HTMLInputElement;
    const temporaryCheck = dialog.querySelector('#temporary-check') as HTMLInputElement;

    displayNameInput.addEventListener('input', updatePreviews);
    channelSelect.addEventListener('change', updatePreviews);
    valueInput.addEventListener('input', updatePreviews);
    temporaryCheck.addEventListener('change', updatePreviews);

    // Manejar agregar output message
    const addOutputBtn = dialog.querySelector('#add-output-btn')!;
    addOutputBtn.addEventListener('click', () => {
      const container = dialog.querySelector('#output-messages-container')!;
      const index = container.querySelectorAll('.output-message-item').length;
      const newItem = document.createElement('div');
      newItem.className = 'output-message-item';
      newItem.setAttribute('data-index', index.toString());
      newItem.innerHTML = `
        <input type="text" class="output-message-input" value="" 
               placeholder="Ej: 90 03 7f" data-index="${index}">
        <button type="button" class="play-output-btn" data-index="${index}" title="Probar este output">▶</button>
        <button type="button" class="remove-output-btn" data-index="${index}">Eliminar</button>
      `;
      container.insertBefore(newItem, addOutputBtn);
      
      // Agregar listener al botón play
      newItem.querySelector('.play-output-btn')!.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const item = target.closest('.output-message-item');
        if (item) {
          const input = item.querySelector('.output-message-input') as HTMLInputElement;
          const outputHex = input.value.trim();
          if (outputHex) {
            await this.testOutputMessage(outputHex, target as HTMLButtonElement);
          } else {
            alert('Por favor, ingresa un mensaje MIDI válido antes de probar');
          }
        }
      });
      
      // Agregar listener al botón eliminar
      newItem.querySelector('.remove-output-btn')!.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const item = target.closest('.output-message-item');
        if (item) {
          item.remove();
          updatePreviews();
        }
      });

      // Agregar listener al input para actualizar vista previa
      const newInput = newItem.querySelector('.output-message-input') as HTMLInputElement;
      newInput.addEventListener('input', updatePreviews);
      
      // Actualizar vista previa después de agregar el nuevo item
      updatePreviews();
    });

    // Manejar botones de play para outputs existentes
    dialog.querySelectorAll('.play-output-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const target = e.target as HTMLElement;
        const item = target.closest('.output-message-item');
        if (item) {
          const input = item.querySelector('.output-message-input') as HTMLInputElement;
          const outputHex = input.value.trim();
          if (outputHex) {
            await this.testOutputMessage(outputHex, target as HTMLButtonElement);
          } else {
            alert('Por favor, ingresa un mensaje MIDI válido antes de probar');
          }
        }
      });
    });

    // Manejar eliminar output messages
    dialog.querySelectorAll('.remove-output-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const item = target.closest('.output-message-item');
        if (item) {
          item.remove();
          updatePreviews();
        }
      });
    });

    // Agregar listeners a los inputs de output existentes
    dialog.querySelectorAll('.output-message-input').forEach(input => {
      input.addEventListener('input', updatePreviews);
    });

    dialog.querySelector('#save-mapping-btn')!.addEventListener('click', () => {
      const channelSelect = dialog.querySelector('#channel-select') as HTMLSelectElement;
      const valueInput = dialog.querySelector('#value-input') as HTMLInputElement;
      const temporaryCheck = dialog.querySelector('#temporary-check') as HTMLInputElement;
      const displayNameInput = dialog.querySelector('#mapping-display-name-input') as HTMLInputElement;

      // Si el usuario editó el XML manualmente, mostrar advertencia pero permitir continuar
      const xmlWasEdited = controlCodeEditor.dataset.manualEdit === 'true' || mapCodeEditor.dataset.manualEdit === 'true';
      
      if (xmlWasEdited) {
        // El XML editado manualmente se guardará en el mapeo para referencia
        // pero los campos del formulario tienen prioridad
        console.log('XML editado manualmente detectado. Los campos del formulario tienen prioridad.');
      }

      // Guardar nombre personalizado
      const displayName = displayNameInput.value.trim();
      if (displayName && displayName !== mapping.controlName) {
        mapping.displayName = displayName;
      } else {
        mapping.displayName = undefined;
      }

      mapping.action.action = actionSelect.value;
      mapping.action.channel = channelSelect.value;
      mapping.action.value = valueInput.value || 'auto';
      mapping.action.temporary = temporaryCheck.checked;
      
      // Guardar el XML editado manualmente si existe (para referencia futura)
      if (controlCodeEditor.dataset.manualEdit === 'true') {
        (mapping as any).customControlXml = controlCodeEditor.value.trim();
      }
      if (mapCodeEditor.dataset.manualEdit === 'true') {
        (mapping as any).customMapXml = mapCodeEditor.value.trim();
      }

      // Guardar output messages
      const outputInputs = dialog.querySelectorAll('.output-message-input') as NodeListOf<HTMLInputElement>;
      const outputs: MidiMessage[] = [];
      
      for (const input of Array.from(outputInputs)) {
        const value = input.value.trim();
        if (value) {
          try {
            // Intentar parsear el mensaje MIDI
            const parsed = this.parseMidiMessage(value);
            if (parsed) {
              outputs.push(parsed);
            } else {
              console.warn(`Output message inválido: ${value}`);
            }
          } catch (error) {
            console.warn(`Error parseando output message "${value}":`, error);
          }
        }
      }

      // Actualizar outputs del control
      if (outputs.length > 0) {
        mapping.control.outputs = outputs;
      } else {
        mapping.control.outputs = undefined;
      }

      // Actualizar outputs disponibles
      this.loadAvailableOutputs();
      
      this.renderMappings();
      document.body.removeChild(dialog);
    });

    dialog.querySelector('#cancel-mapping-btn')!.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
      }
    });
  }

  private async showOutputSelectorDialog(parentDialog: HTMLElement, mapping: Mapping) {
    // Recargar outputs disponibles antes de mostrar el selector
    await this.loadAvailableOutputs();
    
    const selectorDialog = document.createElement('div');
    selectorDialog.className = 'dialog-overlay';
    selectorDialog.style.zIndex = '2000';
    selectorDialog.innerHTML = `
      <div class="dialog dialog-medium">
        <h3>Seleccionar Output Predefinido</h3>
        <div class="output-selector-container">
          <div class="output-search">
            <input type="text" id="output-search-input" placeholder="Buscar por código, nombre o acción..." 
                   class="output-search-input">
          </div>
          <div id="output-selector-list" class="output-selector-list">
            ${this.availableOutputs.length > 0 ? 
              this.availableOutputs.map((output, index) => `
                <div class="output-selector-item" data-index="${index}" data-raw="${output.raw}">
                  <div class="output-selector-code">
                    <code>${output.raw}</code>
                  </div>
                  <div class="output-selector-info">
                    <div class="output-selector-name">${output.controlName}</div>
                    ${output.action ? `<div class="output-selector-action">Acción: ${output.action}</div>` : ''}
                  </div>
                  <button type="button" class="output-selector-add-btn" data-raw="${output.raw}">+</button>
                </div>
              `).join('') 
              : '<div class="empty-state">No hay outputs predefinidos disponibles. Carga algunos archivos .djm primero.</div>'
            }
          </div>
        </div>
        <div class="dialog-actions">
          <button id="close-output-selector-btn" class="btn-secondary">Cerrar</button>
        </div>
      </div>
    `;

    document.body.appendChild(selectorDialog);

    // Funcionalidad de búsqueda
    const searchInput = selectorDialog.querySelector('#output-search-input') as HTMLInputElement;
    const selectorList = selectorDialog.querySelector('#output-selector-list')!;
    
    searchInput.addEventListener('input', (e) => {
      const searchTerm = (e.target as HTMLInputElement).value.toLowerCase();
      const items = selectorList.querySelectorAll('.output-selector-item');
      
      items.forEach(item => {
        const raw = item.getAttribute('data-raw') || '';
        const name = item.querySelector('.output-selector-name')?.textContent || '';
        const action = item.querySelector('.output-selector-action')?.textContent || '';
        const searchable = `${raw} ${name} ${action}`.toLowerCase();
        
        if (searchable.includes(searchTerm)) {
          (item as HTMLElement).style.display = '';
        } else {
          (item as HTMLElement).style.display = 'none';
        }
      });
    });

    // Agregar output seleccionado
    selectorDialog.querySelectorAll('.output-selector-add-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const raw = target.getAttribute('data-raw') || '';
        
        if (raw) {
          // Verificar si ya existe este output
          const container = parentDialog.querySelector('#output-messages-container')!;
          const existingInputs = container.querySelectorAll('.output-message-input') as NodeListOf<HTMLInputElement>;
          const alreadyExists = Array.from(existingInputs).some(input => input.value.trim().toLowerCase() === raw.toLowerCase());
          
          if (alreadyExists) {
            alert('Este output ya está agregado');
            return;
          }
          
          // Agregar el output
          const parsed = this.parseMidiMessage(raw);
          if (parsed) {
            const index = container.querySelectorAll('.output-message-item').length;
            const newItem = document.createElement('div');
            newItem.className = 'output-message-item';
            newItem.setAttribute('data-index', index.toString());
            newItem.innerHTML = `
              <input type="text" class="output-message-input" value="${raw}" 
                     placeholder="Ej: 90 03 7f" data-index="${index}">
              <button type="button" class="remove-output-btn" data-index="${index}">Eliminar</button>
            `;
            
            const addBtn = container.querySelector('#add-output-btn');
            container.insertBefore(newItem, addBtn);
            
            // Agregar listener al botón eliminar
            newItem.querySelector('.remove-output-btn')!.addEventListener('click', (e) => {
              const target = e.target as HTMLElement;
              const item = target.closest('.output-message-item');
              if (item) {
                item.remove();
              }
            });
            
            // Cerrar el selector después de agregar
            document.body.removeChild(selectorDialog);
          } else {
            alert('Error: No se pudo parsear el mensaje MIDI');
          }
        }
      });
    });

    // Cerrar selector
    selectorDialog.querySelector('#close-output-selector-btn')!.addEventListener('click', () => {
      document.body.removeChild(selectorDialog);
    });

    selectorDialog.addEventListener('click', (e) => {
      if (e.target === selectorDialog) {
        document.body.removeChild(selectorDialog);
      }
    });
  }

  private deleteMapping(index: number) {
    if (confirm('¿Eliminar este mapeo?')) {
      this.mappings.splice(index, 1);
      this.renderMappings();
    }
  }

  /**
   * Prueba un mensaje de output individual
   */
  private async testOutputMessage(outputHex: string, button?: HTMLButtonElement) {
    console.log('[testOutputMessage] INICIO - outputHex:', outputHex);
    try {
      console.log('[testOutputMessage] Paso 1: Verificando API de Electron...');
      // Verificar que la API de Electron está disponible
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI) {
        throw new Error('La API de Electron no está disponible. Por favor, reinicia la aplicación.');
      }
      if (!electronAPI.midi) {
        throw new Error('La API MIDI de Electron no está disponible. Por favor, reinicia la aplicación.');
      }
      if (typeof electronAPI.midi.isOutputOpen !== 'function') {
        throw new Error('La función isOutputOpen no está disponible. Por favor, reinicia la aplicación.');
      }

      console.log('[testOutputMessage] Paso 2: Verificando dispositivo de salida...');
      // Verificar que hay un dispositivo de salida abierto
      const isOutputOpen = await electronAPI.midi.isOutputOpen();
      console.log('[testOutputMessage] isOutputOpen:', isOutputOpen);
      if (!isOutputOpen) {
        console.warn('[testOutputMessage] No hay dispositivo de salida abierto');
        alert('⚠️ No hay dispositivo MIDI de salida conectado.\n\nPor favor, conecta un dispositivo de salida en la sección "Dispositivos MIDI" para poder probar los outputs.');
        return;
      }

      console.log('[testOutputMessage] Paso 2: Parseando mensaje MIDI...');
      // Parsear el mensaje MIDI
      const message = this.parseMidiMessage(outputHex);
      console.log('[testOutputMessage] Mensaje parseado:', message);
      if (!message) {
        console.error('[testOutputMessage] Mensaje MIDI inválido');
        alert('❌ Mensaje MIDI inválido. Formato esperado: "90 03 7f" (status data1 data2)');
        return;
      }

      // Enviar el mensaje
      console.log('[testOutputMessage] Paso 3: Enviando mensaje MIDI...', message.raw);
      console.log('[testOutputMessage] Detalles del mensaje:', {
        type: message.type,
        channel: message.channel,
        note: message.note,
        cc: message.cc,
        value: message.value,
        raw: message.raw
      });
      
      const sendStartTime = Date.now();
      console.log('[testOutputMessage] Llamando a electronAPI.midi.sendMessage...');
      await electronAPI.midi.sendMessage(message);
      const sendEndTime = Date.now();
      console.log(`[testOutputMessage] Mensaje enviado exitosamente en ${sendEndTime - sendStartTime}ms`);

      // Mostrar feedback visual
      console.log('[testOutputMessage] Paso 4: Mostrando feedback visual...');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '✓';
        button.style.backgroundColor = '#4CAF50';
        button.disabled = true;
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.backgroundColor = '';
          button.disabled = false;
        }, 1500);
      }
      console.log('[testOutputMessage] FIN - Éxito');
    } catch (error) {
      console.error('[testOutputMessage] ERROR CAPTURADO:', error);
      console.error('[testOutputMessage] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      alert(`Error al probar el output: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Prueba un mapeo enviando el input y los outputs a DJUCED
   */
  private async testMapping(mapping: Mapping) {
    try {
      // Verificar que la API de Electron está disponible
      const electronAPI = (window as any).electronAPI;
      if (!electronAPI || !electronAPI.midi) {
        throw new Error('La API MIDI de Electron no está disponible. Por favor, reinicia la aplicación.');
      }
      if (typeof electronAPI.midi.isOutputOpen !== 'function') {
        throw new Error('La función isOutputOpen no está disponible. Por favor, reinicia la aplicación.');
      }

      // Verificar que hay un dispositivo de salida abierto
      const isOutputOpen = await electronAPI.midi.isOutputOpen();
      if (!isOutputOpen) {
        alert('⚠️ No hay dispositivo MIDI de salida conectado.\n\nPor favor, conecta un dispositivo de salida en la sección "Dispositivos MIDI" para poder probar los mapeos.');
        return;
      }

      // 1. Probar INPUT: Enviar el mensaje de input al dispositivo de salida
      // Esto simula que el controlador envió el mensaje y DJUCED debería reaccionar
      console.log('🧪 Probando INPUT:', mapping.control.input.raw);
      await electronAPI.midi.sendMessage(mapping.control.input);
      
      // Pequeño delay para que DJUCED procese el mensaje
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. Probar OUTPUT: Enviar los mensajes de output (si existen)
      // Estos actualizan los LEDs del controlador
      if (mapping.control.outputs && mapping.control.outputs.length > 0) {
        console.log('🧪 Probando OUTPUT:', mapping.control.outputs.length, 'mensaje(s)');
        for (const output of mapping.control.outputs) {
          await electronAPI.midi.sendMessage(output);
          // Pequeño delay entre mensajes
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else {
        console.log('ℹ️ No hay mensajes de output para este mapeo');
      }

      // Mostrar feedback visual
      const testBtn = document.querySelector(`.test-btn[data-index="${this.mappings.indexOf(mapping)}"]`) as HTMLButtonElement;
      if (testBtn) {
        const originalText = testBtn.textContent;
        testBtn.textContent = '✓ Enviado';
        testBtn.style.backgroundColor = '#4CAF50';
        testBtn.disabled = true;
        
        setTimeout(() => {
          testBtn.textContent = originalText;
          testBtn.style.backgroundColor = '';
          testBtn.disabled = false;
        }, 2000);
      }

    } catch (error) {
      console.error('Error probando mapeo:', error);
      alert(`Error al probar el mapeo: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  getMappings(): Mapping[] {
    return this.mappings;
  }

  setMappings(mappings: Mapping[]) {
    this.mappings = mappings;
    this.renderMappings();
    // Actualizar outputs disponibles cuando se cargan nuevos mapeos
    this.loadAvailableOutputs();
  }

  onMappingChange(callback: (mappings: Mapping[]) => void) {
    this.onMappingChangeCallback = callback;
  }

  // Método público para editar un mapeo (usado desde TestPanel)
  editMapping(mapping: Mapping) {
    this.showEditDialog(mapping);
  }

  // Método público para obtener las acciones disponibles
  getActions(): ActionInfo[] {
    return this.actions;
  }

  /**
   * Parsea un mensaje MIDI desde formato hexadecimal
   */
  private parseMidiMessage(messageHex: string): MidiMessage | null {
    console.log('[parseMidiMessage] INICIO - messageHex:', messageHex);
    try {
      if (!messageHex || typeof messageHex !== 'string') {
        console.warn('[parseMidiMessage] messageHex inválido o no es string');
        return null;
      }
      
      const trimmed = messageHex.trim();
      console.log('[parseMidiMessage] trimmed:', trimmed);
      if (trimmed.length === 0) {
        console.warn('[parseMidiMessage] trimmed está vacío');
        return null;
      }
      
      const parts = trimmed.split(/\s+/);
      console.log('[parseMidiMessage] parts:', parts);
      if (parts.length < 2) {
        console.warn('[parseMidiMessage] parts.length < 2');
        return null;
      }

      const status = parseInt(parts[0], 16);
      console.log('[parseMidiMessage] status (hex):', parts[0], 'status (dec):', status);
      if (isNaN(status)) {
        console.warn('[parseMidiMessage] status es NaN');
        return null;
      }

      const channel = (status & 0x0F) + 1;
      const typeByte = status & 0xF0;
      console.log('[parseMidiMessage] channel:', channel, 'typeByte:', typeByte.toString(16));
      
      let type: 'note' | 'cc' | 'sysex';
      let note: number | undefined;
      let cc: number | undefined;
      let value: number;

      if (typeByte === 0x90 || typeByte === 0x80) {
        // Note On/Off
        console.log('[parseMidiMessage] Tipo: NOTE');
        type = 'note';
        note = parseInt(parts[1], 16);
        value = parts.length > 2 ? parseInt(parts[2], 16) : (typeByte === 0x90 ? 127 : 0);
        console.log('[parseMidiMessage] note:', note, 'value:', value);
      } else if (typeByte === 0xB0) {
        // Control Change
        console.log('[parseMidiMessage] Tipo: CC');
        type = 'cc';
        cc = parseInt(parts[1], 16);
        value = parts.length > 2 ? parseInt(parts[2], 16) : 0;
        console.log('[parseMidiMessage] cc:', cc, 'value:', value);
      } else if (status === 0xF0) {
        // System Exclusive
        console.log('[parseMidiMessage] Tipo: SYSEX');
        type = 'sysex';
        value = 0;
      } else {
        console.warn('[parseMidiMessage] Tipo desconocido, typeByte:', typeByte.toString(16));
        return null;
      }

      const result = {
        channel,
        type,
        note,
        cc,
        value: isNaN(value) ? 0 : value,
        raw: trimmed,
      };
      console.log('[parseMidiMessage] FIN - Resultado:', JSON.stringify(result));
      return result;
    } catch (error) {
      console.error('[parseMidiMessage] ERROR:', error);
      console.error('[parseMidiMessage] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return null;
    }
  }
}
