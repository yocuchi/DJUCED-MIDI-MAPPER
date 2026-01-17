// Biblioteca de acciones DJUCED con búsqueda y categorías

import { ActionInfo } from '../../shared/types';
import { ActionExtractor } from '../utils/action-extractor';

export class ActionLibrary {
  private container: HTMLElement;
  private actions: ActionInfo[] = [];
  private actionExtractor: ActionExtractor;
  private filteredActions: ActionInfo[] = [];
  private selectedCategory: string = 'all';

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.actionExtractor = new ActionExtractor();
    this.render();
    this.loadActions();
  }

  private async loadActions() {
    try {
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
        console.log(`📊 Acciones extraídas: ${stats.total} acciones únicas`);
        console.log('📊 Por categoría:', stats.byCategory);
      } catch (error) {
        console.warn('No se pudo cargar desde todos/, usando acciones por defecto:', error);
        this.actions = this.getDefaultActions();
      }
      
      if (this.actions.length === 0) {
        this.actions = this.getDefaultActions();
      }
      
      this.filteredActions = this.actions;
      this.renderActions();
    } catch (error) {
      console.error('Error cargando acciones:', error);
      this.actions = this.getDefaultActions();
      this.filteredActions = this.actions;
      this.renderActions();
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

  private render() {
    this.container.innerHTML = `
      <div class="action-library">
        <h3>Biblioteca de Acciones DJUCED</h3>
        <div class="library-controls">
          <div class="search-box">
            <input type="text" id="action-search" placeholder="Buscar acción..." class="search-input">
          </div>
          <div class="category-filter">
            <label>Filtrar por categoría:</label>
            <select id="category-select" class="category-select">
              <option value="all">Todas</option>
              <option value="playback">Reproducción</option>
              <option value="cue">Cue Points</option>
              <option value="loop">Loops</option>
              <option value="effects">Efectos</option>
              <option value="filter">Filtros</option>
              <option value="pitch">Pitch</option>
              <option value="volume">Volumen</option>
              <option value="eq">EQ</option>
              <option value="browser">Navegador</option>
              <option value="sync">Sincronización</option>
              <option value="scratch">Scratch</option>
              <option value="mixer">Mezclador</option>
              <option value="samples">Samples</option>
              <option value="stems">Stems</option>
              <option value="beatjump">Beat Jump</option>
              <option value="quantize">Quantize</option>
              <option value="slip">Slip</option>
              <option value="condition">Conditions</option>
              <option value="track">Track</option>
              <option value="energy">Energy</option>
              <option value="assistant">Assistant</option>
              <option value="selection">Selection</option>
              <option value="master">Master</option>
              <option value="special">Special</option>
              <option value="other">Otros</option>
            </select>
          </div>
        </div>
        <div id="actions-list" class="actions-list"></div>
        <div class="library-stats">
          <span id="action-count">0 acciones encontradas</span>
        </div>
      </div>
    `;

    const searchInput = document.getElementById('action-search') as HTMLInputElement;
    const categorySelect = document.getElementById('category-select') as HTMLSelectElement;

    searchInput.addEventListener('input', () => this.filterActions());
    categorySelect.addEventListener('change', () => {
      this.selectedCategory = categorySelect.value;
      this.filterActions();
    });
  }

  private filterActions() {
    const searchInput = document.getElementById('action-search') as HTMLInputElement;
    const searchTerm = searchInput.value.toLowerCase();

    this.filteredActions = this.actions.filter(action => {
      const matchesSearch = action.action.toLowerCase().includes(searchTerm);
      const matchesCategory = this.selectedCategory === 'all' || 
        action.categories.includes(this.selectedCategory);
      return matchesSearch && matchesCategory;
    });

    this.renderActions();
  }

  private renderActions() {
    const list = document.getElementById('actions-list')!;
    const countSpan = document.getElementById('action-count')!;

    countSpan.textContent = `${this.filteredActions.length} acción${this.filteredActions.length !== 1 ? 'es' : ''} encontrada${this.filteredActions.length !== 1 ? 's' : ''}`;

    if (this.filteredActions.length === 0) {
      list.innerHTML = '<div class="empty-state">No se encontraron acciones que coincidan con la búsqueda.</div>';
      return;
    }

    list.innerHTML = '';

    // Agrupar por categoría
    const grouped: { [key: string]: ActionInfo[] } = {};
    this.filteredActions.forEach(action => {
      const category = action.categories[0] || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(action);
    });

    Object.keys(grouped).sort().forEach(category => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'action-category';
      categoryDiv.innerHTML = `<h4 class="category-title">${this.getCategoryName(category)}</h4>`;
      
      const actionsGrid = document.createElement('div');
      actionsGrid.className = 'actions-grid';

      grouped[category].forEach(action => {
        const actionCard = document.createElement('div');
        actionCard.className = 'action-card';
        actionCard.innerHTML = `
          <div class="action-name">${action.action}</div>
          ${action.examples.length > 0 ? `
            <div class="action-examples">
              <strong>Ejemplos:</strong>
              <ul>
                ${action.examples.slice(0, 3).map(ex => `<li><code>${ex}</code></li>`).join('')}
              </ul>
            </div>
          ` : ''}
          <div class="action-categories">
            ${action.categories.map(cat => `<span class="category-tag">${this.getCategoryName(cat)}</span>`).join('')}
          </div>
        `;
        actionsGrid.appendChild(actionCard);
      });

      categoryDiv.appendChild(actionsGrid);
      list.appendChild(categoryDiv);
    });
  }

  private getCategoryName(category: string): string {
    const names: { [key: string]: string } = {
      'playback': 'Playback',
      'cue': 'Cue Points',
      'loop': 'Loops',
      'effects': 'Effects',
      'filter': 'Filters',
      'pitch': 'Pitch',
      'volume': 'Volume',
      'eq': 'EQ',
      'browser': 'Browser',
      'sync': 'Synchronization',
      'scratch': 'Scratch',
      'mixer': 'Mixer',
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
      'other': 'Other',
    };
    return names[category] || category;
  }

  getAllActions(): ActionInfo[] {
    return this.actions;
  }
}
