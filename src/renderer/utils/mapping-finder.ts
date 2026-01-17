// Busca mapeos por mensaje MIDI en archivos .djm de referencia

import { MidiMessage, Mapping } from '../../shared/types';
import { DjmParser } from './djm-parser';

export interface FoundMapping {
  file: string;
  controlName: string;
  action: string;
  channel: string;
  value: string;
  extractedValue?: string; // Valor extraído del mensaje cuando hay {value} en el mapeo
}

export class MappingFinder {
  private parser: DjmParser;
  private cache: Map<string, FoundMapping[]> = new Map();
  private sourceFileName: string | null = null; // Archivo origen seleccionado

  constructor() {
    this.parser = new DjmParser();
  }

  /**
   * Establece el archivo origen para filtrar las búsquedas
   */
  setSourceFile(fileName: string | null): void {
    this.sourceFileName = fileName;
    // Limpiar caché cuando cambia el archivo origen
    this.clearCache();
  }

  /**
   * Busca mapeos que coincidan con un mensaje MIDI
   * Si hay un archivo origen establecido, solo busca en ese archivo
   */
  async findMappings(message: MidiMessage): Promise<FoundMapping[]> {
    // Incluir el archivo origen en la clave de caché para evitar conflictos
    const cacheKey = this.getMessageKey(message) + (this.sourceFileName ? `-${this.sourceFileName}` : '');
    
    // Si ya está en caché, devolverlo
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const found: FoundMapping[] = [];
    
    try {
      const todosPath = 'todos';
      
      // Si hay un archivo origen establecido, solo buscar en ese archivo
      if (this.sourceFileName) {
        try {
          const filePath = `${todosPath}/${this.sourceFileName}`;
          const content = await (window as any).electronAPI.fs.readFile(filePath);
          const djmFile = await this.parser.parseFile(filePath, content);
          
          // Buscar en los mapeos
          for (const mapping of djmFile.mappings) {
            const control = mapping.control;
            
            // Comparar mensaje MIDI con soporte para {value}
            const matchResult = this.messagesMatchWithValue(message, control.input.raw);
            if (matchResult.match) {
              found.push({
                file: this.sourceFileName,
                controlName: mapping.controlName,
                action: mapping.action.action,
                channel: mapping.action.channel,
                value: mapping.action.value,
                extractedValue: matchResult.extractedValue,
              });
            }
          }
        } catch (error) {
          console.error(`Error procesando archivo origen ${this.sourceFileName}:`, error);
        }
      } else {
        // Si no hay archivo origen, buscar en todos los archivos (comportamiento original)
        const files = await (window as any).electronAPI.fs.readDir(todosPath);
        
        for (const file of files) {
          if (file.endsWith('.djm')) {
            try {
              const content = await (window as any).electronAPI.fs.readFile(`${todosPath}/${file}`);
              const djmFile = await this.parser.parseFile(`${todosPath}/${file}`, content);
              
              // Buscar en los mapeos
              for (const mapping of djmFile.mappings) {
                const control = mapping.control;
                
                // Comparar mensaje MIDI con soporte para {value}
                const matchResult = this.messagesMatchWithValue(message, control.input.raw);
                if (matchResult.match) {
                  found.push({
                    file: file,
                    controlName: mapping.controlName,
                    action: mapping.action.action,
                    channel: mapping.action.channel,
                    value: mapping.action.value,
                    extractedValue: matchResult.extractedValue,
                  });
                }
              }
            } catch (error) {
              console.error(`Error procesando ${file}:`, error);
            }
          }
        }
      }
      
      // Guardar en caché
      this.cache.set(cacheKey, found);
    } catch (error) {
      console.error('Error buscando mapeos:', error);
    }
    
    return found;
  }

  /**
   * Compara dos mensajes MIDI para ver si coinciden
   * Si el mensaje del mapeo tiene {value}, extrae el valor del mensaje recibido
   */
  private messagesMatch(msg1: MidiMessage, msg2: MidiMessage): boolean {
    // Comparar canal y tipo
    if (msg1.channel !== msg2.channel || msg1.type !== msg2.type) {
      return false;
    }
    
    // Comparar según el tipo
    if (msg1.type === 'note' && msg2.type === 'note') {
      return msg1.note === msg2.note;
    } else if (msg1.type === 'cc' && msg2.type === 'cc') {
      return msg1.cc === msg2.cc;
    }
    
    return false;
  }

  /**
   * Compara mensajes MIDI considerando {value} como placeholder
   * Retorna el valor extraído si hay coincidencia, null si no hay coincidencia
   */
  private messagesMatchWithValue(msg1: MidiMessage, msg2Raw: string): { match: boolean; extractedValue?: string } {
    // Comparar canal y tipo primero
    const msg2Parts = msg2Raw.trim().split(/\s+/);
    if (msg2Parts.length < 2) {
      return { match: false };
    }

    // Parsear el mensaje del mapeo (puede tener {value})
    let msg2Status: number;
    try {
      msg2Status = parseInt(msg2Parts[0], 16);
      if (isNaN(msg2Status)) {
        return { match: false };
      }
    } catch {
      return { match: false };
    }

    const msg2Channel = msg2Status & 0x0F;
    const msg2Type = (msg2Status >> 4) & 0x0F;

    // Comparar canal y tipo
    if (msg1.channel !== msg2Channel) {
      return { match: false };
    }

    // Comparar tipo de mensaje
    const msg1TypeNum = msg1.type === 'note' ? 0x9 : msg1.type === 'cc' ? 0xB : 0;
    if (msg1TypeNum !== msg2Type) {
      return { match: false };
    }

    // Comparar segundo byte (note o cc)
    if (msg2Parts.length < 2) {
      return { match: false };
    }

    let msg2Data1: number;
    try {
      msg2Data1 = parseInt(msg2Parts[1], 16);
      if (isNaN(msg2Data1)) {
        return { match: false };
      }
    } catch {
      return { match: false };
    }

    if (msg1.type === 'note' && msg1.note !== msg2Data1) {
      return { match: false };
    } else if (msg1.type === 'cc' && msg1.cc !== msg2Data1) {
      return { match: false };
    }

    // Si llegamos aquí, los primeros dos bytes coinciden
    // Ahora verificar el tercer byte (valor)
    if (msg2Parts.length >= 3) {
      const msg2ValuePart = msg2Parts[2].toUpperCase();
      
      // Si el mapeo tiene {value} (case-insensitive), extraer el valor del mensaje recibido
      if (msg2ValuePart === '{VALUE}') {
        // El mapeo espera un valor, así que el mensaje debe tener un tercer byte
        const msg1Parts = msg1.raw.trim().split(/\s+/);
        if (msg1Parts.length >= 3) {
          const extractedValue = msg1Parts[2].toUpperCase();
          return { match: true, extractedValue };
        }
        // Si el mapeo tiene {value} pero el mensaje no tiene tercer byte, no coincide
        return { match: false };
      } else {
        // Comparar valores exactos
        const msg1Parts = msg1.raw.trim().split(/\s+/);
        if (msg1Parts.length >= 3) {
          const msg1Value = msg1Parts[2].toUpperCase();
          if (msg1Value === msg2ValuePart) {
            return { match: true };
          }
        }
        // Si el mapeo tiene un valor específico pero el mensaje no tiene tercer byte, no coincide
        return { match: false };
      }
    }

    // Si el mapeo no tiene tercer byte, cualquier mensaje con los primeros dos bytes coincide
    // (el valor no importa para este mapeo)
    return { match: true };
  }

  /**
   * Genera una clave única para un mensaje MIDI
   */
  private getMessageKey(message: MidiMessage): string {
    if (message.type === 'note') {
      return `${message.type}-${message.channel}-${message.note}`;
    } else if (message.type === 'cc') {
      return `${message.type}-${message.channel}-${message.cc}`;
    }
    return `${message.type}-${message.channel}-${message.raw}`;
  }

  /**
   * Limpia la caché
   */
  clearCache(): void {
    this.cache.clear();
  }
}
