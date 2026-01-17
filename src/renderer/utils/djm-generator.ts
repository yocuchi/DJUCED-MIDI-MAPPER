// Genera archivos .djm con el formato correcto

import { DjmFile, MidiControl, Mapping } from '../../shared/types';

export class DjmGenerator {
  /**
   * Genera un archivo .djm desde un objeto DjmFile
   */
  async generateFile(djm: DjmFile, outputPath: string): Promise<void> {
    const xml = this.buildXML(djm);
    const xmlString = this.formatXML(xml);
    
    if ((window as any).electronAPI?.fs?.writeFile) {
      await (window as any).electronAPI.fs.writeFile(outputPath, xmlString);
    } else {
      throw new Error('File system API no disponible');
    }
  }

  /**
   * Construye la estructura XML completa
   */
  private buildXML(djm: DjmFile): any {
    const xml: any = {
      midi: {
        $: {
          name: djm.name,
          'map-name': djm.mapName,
          description: djm.description,
          version: djm.version,
        },
      },
    };

    if (djm.sysex) {
      xml.midi.$.sysex = djm.sysex;
    }

    // Agregar picture (placeholder - usar el mismo del archivo de ejemplo si está disponible)
    xml.midi.picture = '';

    // Agregar help-url
    xml.midi['help-url'] = { $: { url: '' } };

    // Agregar soundcard
    xml.midi.soundcard = {
      $: {
        master: 'true',
        cue2mix: 'true',
        channels: '4',
        gain: 'true',
        volume: 'true',
        headphones: 'true',
      },
    };

    // Agregar decks
    xml.midi.decks = {
      $: {
        MIXER: 'true',
        mode: '2H',
        REC: 'false',
        FX: 'false',
      },
      deck: [
        { $: { load: '', ID: '1', type: 'player' } },
        { $: { load: '', ID: '2', type: 'player' } },
        { $: { cells: '4', load: '', ID: '3', type: 'sampler' } },
        { $: { cells: '4', load: '', ID: '4', type: 'sampler' } },
      ],
    };

    // Agregar colors-list
    xml.midi['colors-list'] = {};

    // Agregar onexit
    xml.midi.onexit = 'B07F7E';

    // Agregar midi-device con controles
    xml.midi['midi-device'] = {
      control: djm.controls.map(control => this.buildControl(control)),
    };

    // Agregar midi-map con mapeos
    xml.midi['midi-map'] = {
      map: djm.mappings.map(mapping => this.buildMapping(mapping)),
    };

    return xml;
  }

  /**
   * Construye un elemento control
   */
  private buildControl(control: MidiControl): any {
    const controlXml: any = {
      $: { name: control.name },
      input: {
        $: { message: control.input.raw },
      },
    };

    if (control.min) controlXml.input.$.min = control.min;
    if (control.max) controlXml.input.$.max = control.max;
    if (control.type) controlXml.input.$.type = control.type;
    if (control.stepsPerTurn) controlXml.input.$['steps-per-turn'] = control.stepsPerTurn.toString();
    if (control.incremental) controlXml.input.$.incremental = 'yes';

    // Agregar todos los output messages (puede haber múltiples)
    if (control.outputs && control.outputs.length > 0) {
      controlXml.output = control.outputs.map(output => {
        const outputXml: any = {
          $: { message: output.raw },
        };
        if (control.min) outputXml.$.min = control.min;
        if (control.max) outputXml.$.max = control.max;
        if (control.type) outputXml.$.type = control.type;
        return outputXml;
      });
    }

    return controlXml;
  }

  /**
   * Construye un elemento map
   */
  private buildMapping(mapping: Mapping): any {
    let actionStr = `chann=${mapping.action.channel}  action=${mapping.action.action} value="${mapping.action.value}"`;
    
    if (mapping.action.condition1) {
      actionStr += ` condition1="${mapping.action.condition1}"`;
    }
    if (mapping.action.condition2) {
      actionStr += ` condition2="${mapping.action.condition2}"`;
    }
    if (mapping.action.takeover) {
      actionStr += ` takeover="${mapping.action.takeover}"`;
    }
    if (mapping.action.temporary) {
      actionStr += ' temporary';
    }

    return {
      $: {
        name: mapping.controlName,
        action: actionStr,
      },
    };
  }

  /**
   * Formatea el XML manualmente
   */
  private formatXML(xml: any): string {
    let result = '<?xml version="1.0" encoding="UTF-8"?>\n';
    result += '<!DOCTYPE MidiML>\n';
    result += this.objectToXML(xml.midi, 'midi', 0);
    return result;
  }

  /**
   * Convierte un objeto a XML
   */
  private objectToXML(obj: any, tagName: string, indent: number): string {
    const indentStr = ' '.repeat(indent);
    let xml = `${indentStr}<${tagName}`;

    // Agregar atributos
    if (obj.$) {
      for (const [key, value] of Object.entries(obj.$)) {
        xml += ` ${key}="${this.escapeXml(String(value))}"`;
      }
    }

    // Verificar si tiene hijos o contenido
    const keys = Object.keys(obj).filter(k => k !== '$');
    const hasChildren = keys.some(key => {
      const val = obj[key];
      return Array.isArray(val) || (typeof val === 'object' && val !== null && !(val instanceof String));
    });
    
    // Verificar si es un elemento de texto simple (como picture, onexit)
    // Estos elementos no tienen atributos $ y solo contienen texto
    const isTextElement = keys.length === 0 && !obj.$ && typeof obj === 'string';
    const isEmpty = keys.length === 0 && !obj.$ && typeof obj !== 'string';

    if (hasChildren) {
      xml += '>\n';
      
      // Procesar hijos
      for (const key of keys) {
        const value = obj[key];
        
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              xml += `${indentStr} <${key}>${this.escapeXml(item)}</${key}>\n`;
            } else {
              xml += this.objectToXML(item, key, indent + 1);
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          xml += this.objectToXML(value, key, indent + 1);
        } else if (typeof value === 'string') {
          xml += `${indentStr} <${key}>${this.escapeXml(value)}</${key}>\n`;
        }
      }
      
      xml += `${indentStr}</${tagName}>\n`;
    } else if (isTextElement) {
      // Elemento con solo texto (como picture)
      xml += `>${this.escapeXml(String(obj))}</${tagName}>\n`;
    } else if (isEmpty) {
      // Elemento vacío sin atributos
      xml += '/>\n';
    } else {
      // Solo atributos, sin contenido
      xml += '/>\n';
    }

    return xml;
  }

  /**
   * Escapa caracteres especiales en XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
