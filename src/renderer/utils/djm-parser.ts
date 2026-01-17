// Parsea archivos .djm existentes

import { DjmFile, MidiControl, Mapping, MidiMessage } from '../../shared/types';

export class DjmParser {
  /**
   * Parsea un archivo .djm
   */
  async parseFile(filePath: string, content?: string): Promise<DjmFile> {
    const fileContent = content || await this.readFile(filePath);
    
    // Validar que el archivo no esté vacío
    if (!fileContent || fileContent.trim().length === 0) {
      throw new Error('El archivo está vacío');
    }
    
    const xml = await this.parseXML(fileContent);
    
    // Validar estructura básica
    if (!xml.midi || !Array.isArray(xml.midi) || xml.midi.length === 0) {
      throw new Error('El archivo no tiene la estructura MIDI esperada');
    }
    
    const midi = xml.midi[0]?.$ || {};
    const controls: MidiControl[] = [];
    const mappings: Mapping[] = [];

    // Parsear controles MIDI
    if (xml.midi[0]?.['midi-device']?.[0]?.control) {
      for (const controlXml of xml.midi[0]['midi-device'][0].control) {
        const control = this.parseControl(controlXml);
        if (control) {
          controls.push(control);
        }
      }
    }

    // Parsear mapeos
    if (xml.midi[0]?.['midi-map']?.[0]?.map) {
      for (const mapXml of xml.midi[0]['midi-map'][0].map) {
        const mapping = this.parseMapping(mapXml, controls);
        if (mapping) {
          mappings.push(mapping);
        }
      }
    }

    // Log para depuración
    console.log(`Parser: ${controls.length} controles, ${mappings.length} mapeos encontrados`);
    
    if (controls.length === 0) {
      console.warn('Advertencia: No se encontraron controles MIDI en el archivo');
    }
    
    if (mappings.length === 0) {
      console.warn('Advertencia: No se encontraron mapeos en el archivo');
    }

    return {
      name: midi.name || '',
      mapName: midi['map-name'] || '',
      description: midi.description || '',
      version: midi.version || '01',
      sysex: midi.sysex,
      controls,
      mappings,
    };
  }

  /**
   * Parsea un control MIDI
   */
  private parseControl(controlXml: any): MidiControl | null {
    try {
      if (!controlXml || !controlXml.$) {
        console.warn('Control sin atributos:', controlXml);
        return null;
      }
      
      const name = controlXml.$.name;
      if (!name) {
        console.warn('Control sin nombre:', controlXml);
        return null;
      }

      const input = controlXml.input?.[0]?.$;
      const outputs = controlXml.output || [];

      if (!input || !input.message) {
        console.warn(`Control "${name}" sin mensaje de entrada válido:`, input);
        return null;
      }

      let inputMsg: MidiMessage;
      try {
        inputMsg = this.parseMessage(input.message);
      } catch (error: any) {
        console.warn(`Error parseando mensaje de entrada para control "${name}":`, error?.message || error);
        return null;
      }

      // Parsear todos los output messages (puede haber múltiples)
      const outputMessages: MidiMessage[] = [];
      if (Array.isArray(outputs)) {
        for (const output of outputs) {
          if (output?.$?.message) {
            try {
              const outputMsg = this.parseMessage(output.$.message);
              outputMessages.push(outputMsg);
            } catch (error: any) {
              console.warn(`Error parseando mensaje de salida para control "${name}":`, error?.message || error);
              // Continuar con el siguiente output
            }
          }
        }
      }

      return {
        name,
        input: inputMsg,
        outputs: outputMessages.length > 0 ? outputMessages : undefined,
        type: input.type || 'toggle',
        min: input.min,
        max: input.max,
        stepsPerTurn: input['steps-per-turn'] ? parseInt(input['steps-per-turn']) : undefined,
        incremental: input.incremental === 'yes',
      };
    } catch (error: any) {
      console.error('Error inesperado parseando control:', error);
      return null;
    }
  }

  /**
   * Parsea un mensaje MIDI desde formato hexadecimal
   */
  private parseMessage(messageHex: string): MidiMessage {
    if (!messageHex || typeof messageHex !== 'string') {
      throw new Error(`Mensaje MIDI inválido: debe ser una cadena, se recibió ${typeof messageHex}`);
    }
    
    const trimmed = messageHex.trim();
    if (trimmed.length === 0) {
      throw new Error(`Mensaje MIDI vacío`);
    }
    
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      throw new Error(`Formato de mensaje MIDI inválido: se esperaban al menos 2 bytes, se encontraron ${parts.length} en "${messageHex}"`);
    }

    let status: number;
    try {
      status = parseInt(parts[0], 16);
      if (isNaN(status)) {
        throw new Error(`No se pudo parsear el byte de estado como hexadecimal: "${parts[0]}"`);
      }
    } catch (error: any) {
      throw new Error(`Error parseando byte de estado: ${error?.message || error} en "${messageHex}"`);
    }
    
    const channel = status & 0x0F;
    const type = (status >> 4) & 0x0F;

    let note: number | undefined;
    let cc: number | undefined;
    let value = 0;

    if (parts.length >= 2) {
      let data1: number;
      try {
        data1 = parseInt(parts[1], 16);
        if (isNaN(data1)) {
          throw new Error(`No se pudo parsear el primer byte de datos como hexadecimal: "${parts[1]}"`);
        }
      } catch (error: any) {
        throw new Error(`Error parseando primer byte de datos: ${error?.message || error} en "${messageHex}"`);
      }
      
      if (type === 0x9 || type === 0x8) {
        // Note On/Off
        note = data1;
        if (parts.length >= 3) {
          try {
            value = parseInt(parts[2], 16);
            if (isNaN(value)) {
              value = 0;
            }
          } catch {
            value = 0;
          }
        }
      } else if (type === 0xB) {
        // Control Change
        cc = data1;
        if (parts.length >= 3) {
          try {
            value = parseInt(parts[2], 16);
            if (isNaN(value)) {
              value = 0;
            }
          } catch {
            value = 0;
          }
        }
      }
    }

    return {
      channel,
      type: type === 0x9 || type === 0x8 ? 'note' : type === 0xB ? 'cc' : 'sysex',
      note,
      cc,
      value,
      raw: messageHex,
    };
  }

  /**
   * Parsea un mapeo
   */
  private parseMapping(mapXml: any, controls: MidiControl[]): Mapping | null {
    const name = mapXml.$.name;
    const actionStr = mapXml.$.action;
    
    if (!name || !actionStr) {
      console.warn('Mapeo sin nombre o acción:', mapXml);
      return null;
    }

    const control = controls.find(c => c.name === name);
    if (!control) {
      console.warn(`Control no encontrado para mapeo "${name}". Controles disponibles:`, controls.map(c => c.name));
      return null;
    }

    const action = this.parseAction(actionStr);

    return {
      controlName: name,
      control,
      action,
    };
  }

  /**
   * Parsea una cadena de acción DJUCED
   */
  private parseAction(actionStr: string): any {
    const action: any = {
      channel: 'default',
      action: '',
      value: 'auto',
    };

    // Parsear channel
    const channelMatch = actionStr.match(/chann=(\w+)/);
    if (channelMatch) {
      action.channel = channelMatch[1];
    }

    // Parsear action
    const actionMatch = actionStr.match(/action=([^\s]+)/);
    if (actionMatch) {
      action.action = actionMatch[1];
    }

    // Parsear value
    const valueMatch = actionStr.match(/value="([^"]+)"/);
    if (valueMatch) {
      action.value = valueMatch[1];
    }

    // Parsear condition1
    const cond1Match = actionStr.match(/condition1="([^"]+)"/);
    if (cond1Match) {
      action.condition1 = cond1Match[1];
    }

    // Parsear condition2
    const cond2Match = actionStr.match(/condition2="([^"]+)"/);
    if (cond2Match) {
      action.condition2 = cond2Match[1];
    }

    // Parsear takeover
    const takeoverMatch = actionStr.match(/takeover="([^"]+)"/);
    if (takeoverMatch) {
      action.takeover = takeoverMatch[1];
    }

    // Verificar si es temporary
    if (actionStr.includes('temporary')) {
      action.temporary = true;
    }

    return action;
  }

  /**
   * Lee un archivo usando la API de Electron
   */
  private async readFile(filePath: string): Promise<string> {
    if ((window as any).electronAPI?.fs?.readFile) {
      return await (window as any).electronAPI.fs.readFile(filePath);
    }
    throw new Error('File system API no disponible');
  }

  /**
   * Parsea XML de forma asíncrona
   */
  private parseXML(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // Usar DOMParser del navegador
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        
        // Verificar errores de parsing
        const parserError = xmlDoc.querySelector('parsererror');
        if (parserError) {
          const errorText = parserError.textContent || 'Error desconocido al parsear XML';
          console.error('Error de parsing XML:', errorText);
          reject(new Error(`Error parseando XML: ${errorText.substring(0, 200)}`));
          return;
        }
        
        if (xmlDoc.documentElement.nodeName === 'parsererror') {
          const errorText = xmlDoc.documentElement.textContent || 'Error desconocido';
          console.error('Error de parsing XML (documentElement):', errorText);
          reject(new Error(`Error parseando XML: ${errorText.substring(0, 200)}`));
          return;
        }

        // Verificar que el documento tenga la estructura esperada
        if (!xmlDoc.documentElement) {
          reject(new Error('El documento XML no tiene elemento raíz'));
          return;
        }
        
        if (xmlDoc.documentElement.nodeName !== 'midi') {
          reject(new Error(`Formato de archivo inválido. Se esperaba elemento 'midi', se encontró '${xmlDoc.documentElement.nodeName}'`));
          return;
        }

        // Convertir a objeto simple
        // El elemento raíz es <midi>, así que lo envolvemos en un objeto con la clave 'midi'
        const midiElement = this.xmlToObject(xmlDoc.documentElement);
        const result = { midi: [midiElement] };
        resolve(result);
      } catch (error: any) {
        console.error('Excepción al parsear XML:', error);
        reject(new Error(`Error inesperado al parsear XML: ${error?.message || error?.toString() || 'Error desconocido'}`));
      }
    });
  }

  /**
   * Convierte un elemento XML a objeto
   */
  private xmlToObject(node: Element): any {
    const obj: any = {};
    
    if (node.attributes.length > 0) {
      obj.$ = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj.$[attr.name] = attr.value;
      }
    }

    const children = Array.from(node.children);
    if (children.length > 0) {
      children.forEach(child => {
        const childObj = this.xmlToObject(child);
        const name = child.nodeName;
        
        if (!obj[name]) {
          obj[name] = [];
        }
        obj[name].push(childObj);
      });
    } else if (node.textContent && node.textContent.trim()) {
      return node.textContent.trim();
    }

    return Object.keys(obj).length > 0 ? obj : node.textContent?.trim() || '';
  }
}
