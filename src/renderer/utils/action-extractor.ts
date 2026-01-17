// Extrae todas las acciones únicas de los archivos .djm de referencia

import { DjucedAction, ActionInfo } from '../../shared/types';

export class ActionExtractor {
  private actions: Map<string, ActionInfo> = new Map();

  /**
   * Extrae todas las acciones de un archivo .djm
   */
  async extractFromFile(filePath: string, content?: string): Promise<void> {
    try {
      const fileContent = content || await this.readFile(filePath);
      
      // Método principal: Extracción directa con regex (más confiable y rápido)
      // Buscar todos los atributos action= en el XML dentro de elementos <map>
      // Patrón: <map ... action="chann=... action=nombre_accion ..."
      const actionRegex = /action=([a-zA-Z0-9_/]+)/g;
      const invalidActions = new Set(['chann', 'value', 'condition', 'action', 'takeover', 'temporary']);
      let match;
      let extractedCount = 0;
      const seenInFile = new Set<string>();
      
      while ((match = actionRegex.exec(fileContent)) !== null) {
        const actionName = match[1];
        
        // Filtrar palabras clave inválidas y duplicados en este archivo
        if (!invalidActions.has(actionName) && !seenInFile.has(actionName)) {
          // Buscar el contexto completo del atributo action para el ejemplo
          const startPos = Math.max(0, match.index - 200);
          const endPos = Math.min(fileContent.length, match.index + 200);
          const context = fileContent.substring(startPos, endPos);
          
          // Intentar encontrar el atributo action completo
          const fullActionMatch = context.match(/action="([^"]+)"/);
          const fullAction = fullActionMatch ? fullActionMatch[1] : match[0];
          
          this.addAction(actionName, fullAction);
          seenInFile.add(actionName);
          extractedCount++;
        }
      }
      
      if (extractedCount > 0) {
        console.log(`✓ ${filePath}: ${extractedCount} acciones únicas extraídas`);
      } else {
        console.warn(`⚠ ${filePath}: No se extrajeron acciones`);
      }
    } catch (error) {
      console.error(`Error procesando ${filePath}:`, error);
    }
  }

  /**
   * Extrae acciones de todos los archivos en un directorio
   */
  async extractFromDirectory(dirPath: string): Promise<void> {
    try {
      const files = await this.readDirectory(dirPath);
      
      for (const file of files) {
        if (file.endsWith('.djm')) {
          const filePath = `${dirPath}/${file}`;
          await this.extractFromFile(filePath);
        }
      }
    } catch (error) {
      console.error('Error extrayendo acciones del directorio:', error);
    }
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
   * Lee un directorio usando la API de Electron
   */
  private async readDirectory(dirPath: string): Promise<string[]> {
    if ((window as any).electronAPI?.fs?.readDir) {
      return await (window as any).electronAPI.fs.readDir(dirPath);
    }
    throw new Error('File system API no disponible');
  }

  /**
   * Agrega una acción a la base de datos
   */
  private addAction(actionName: string, fullAction: string): void {
    if (!this.actions.has(actionName)) {
      this.actions.set(actionName, {
        action: actionName,
        examples: [],
        categories: this.categorizeAction(actionName),
      });
    }
    
    const actionInfo = this.actions.get(actionName)!;
    if (!actionInfo.examples.includes(fullAction)) {
      actionInfo.examples.push(fullAction);
    }
  }

  /**
   * Categoriza una acción basándose en su nombre
   */
  private categorizeAction(actionName: string): string[] {
    const categories: string[] = [];
    const lowerName = actionName.toLowerCase();
    
    // Reproducción
    if (lowerName.includes('play') || lowerName.includes('pause') || lowerName.includes('stop') || lowerName.includes('seek')) {
      categories.push('playback');
    }
    
    // Cue Points
    if (lowerName.includes('cue') || lowerName.includes('hot_cue') || lowerName.includes('delete_cue')) {
      categories.push('cue');
    }
    
    // Loops
    if (lowerName.includes('loop')) {
      categories.push('loop');
    }
    
    // Efectos
    if (lowerName.includes('effect') || lowerName.includes('fx') || lowerName.includes('browse_effect') || lowerName.includes('bank_wetness') || lowerName.includes('set_effect')) {
      categories.push('effects');
    }
    
    // Filtros
    if (lowerName.includes('filter') || lowerName.includes('pass_filter')) {
      categories.push('filter');
    }
    
    // Pitch
    if (lowerName.includes('pitch') || lowerName.includes('bend') || lowerName.includes('speed') || lowerName.includes('keylock')) {
      categories.push('pitch');
    }
    
    // Volumen
    if (lowerName.includes('volume') || lowerName.includes('level') || lowerName.includes('gain')) {
      categories.push('volume');
    }
    
    // EQ
    if (lowerName.includes('eq') || lowerName.includes('high') || lowerName.includes('low') || lowerName.includes('bass') || lowerName.includes('medium') || lowerName.includes('kill_')) {
      categories.push('eq');
    }
    
    // Navegador
    if (lowerName.includes('browser') || lowerName.includes('load_deck') || lowerName.includes('folder')) {
      categories.push('browser');
    }
    
    // Samples
    if (lowerName.includes('sample')) {
      categories.push('samples');
    }
    
    // Stems
    if (lowerName.includes('stem')) {
      categories.push('stems');
    }
    
    // Sincronización
    if (lowerName.includes('sync')) {
      categories.push('sync');
    }
    
    // Scratch
    if (lowerName.includes('scratch') || lowerName.includes('touchwheel')) {
      categories.push('scratch');
    }
    
    // Mezclador
    if (lowerName.includes('crossfader') || lowerName.includes('xfader') || lowerName.includes('headphone') || lowerName.includes('pfl')) {
      categories.push('mixer');
    }
    
    // Master
    if (lowerName.includes('master')) {
      categories.push('master');
    }
    
    // Beat Jump
    if (lowerName.includes('beat') || lowerName.includes('skip_beat')) {
      categories.push('beatjump');
    }
    
    // Quantize
    if (lowerName.includes('quantize')) {
      categories.push('quantize');
    }
    
    // Slip
    if (lowerName.includes('slip')) {
      categories.push('slip');
    }
    
    // Conditions
    if (lowerName.includes('condition')) {
      categories.push('condition');
    }
    
    // Track
    if (lowerName.includes('track') || lowerName.includes('show_track') || lowerName.includes('track_phase') || lowerName.includes('track_speed')) {
      categories.push('track');
    }
    
    // Energy
    if (lowerName.includes('energy')) {
      categories.push('energy');
    }
    
    // Assistant
    if (lowerName.includes('assistant') || lowerName.includes('show_assistant')) {
      categories.push('assistant');
    }
    
    // Select
    if (lowerName.includes('select') && !lowerName.includes('pfl')) {
      categories.push('selection');
    }
    
    // Nothing (acciones especiales)
    if (lowerName.includes('nothing')) {
      categories.push('special');
    }
    
    if (categories.length === 0) {
      categories.push('other');
    }
    
    return categories;
  }

  /**
   * Parsea XML de forma asíncrona
   */
  private parseXML(xmlString: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Usar DOMParser del navegador
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      if (xmlDoc.documentElement.nodeName === 'parsererror') {
        reject(new Error('Error parseando XML'));
        return;
      }

      // Convertir a objeto simple
      const result = this.xmlToObject(xmlDoc.documentElement);
      resolve(result);
    });
  }

  /**
   * Convierte un elemento XML a objeto
   */
  private xmlToObject(node: Element): any {
    const obj: any = {};
    
    // Extraer atributos
    if (node.attributes && node.attributes.length > 0) {
      obj.$ = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj.$[attr.name] = attr.value;
      }
    }

    // Procesar hijos
    const children = Array.from(node.children || []);
    if (children.length > 0) {
      children.forEach(child => {
        const childObj = this.xmlToObject(child);
        const name = child.nodeName;
        
        // Manejar elementos con el mismo nombre (convertirlos en arrays)
        if (!obj[name]) {
          obj[name] = [];
        }
        obj[name].push(childObj);
      });
    } else if (node.textContent && node.textContent.trim()) {
      // Si no tiene hijos pero tiene texto, retornar el texto
      return node.textContent.trim();
    }

    // Si tiene atributos o hijos, retornar el objeto; si no, retornar texto o objeto vacío
    return Object.keys(obj).length > 0 ? obj : (node.textContent?.trim() || {});
  }

  /**
   * Obtiene todas las acciones extraídas
   */
  getAllActions(): ActionInfo[] {
    return Array.from(this.actions.values()).sort((a, b) => 
      a.action.localeCompare(b.action)
    );
  }

  /**
   * Obtiene acciones por categoría
   */
  getActionsByCategory(category: string): ActionInfo[] {
    return this.getAllActions().filter(action => 
      action.categories.includes(category)
    );
  }

  /**
   * Busca acciones por nombre
   */
  searchActions(query: string): ActionInfo[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllActions().filter(action =>
      action.action.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Resetea el extractor (limpia todas las acciones)
   */
  reset(): void {
    this.actions.clear();
  }

  /**
   * Obtiene estadísticas de extracción
   */
  getStats(): { total: number; byCategory: { [key: string]: number } } {
    const allActions = this.getAllActions();
    const byCategory: { [key: string]: number } = {};
    
    allActions.forEach(action => {
      action.categories.forEach(cat => {
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });
    });
    
    return {
      total: allActions.length,
      byCategory
    };
  }
}
