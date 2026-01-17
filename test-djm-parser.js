// Script de prueba para parsear archivo DJM
const fs = require('fs');
const path = require('path');

// Simular el entorno del navegador para DOMParser
const { JSDOM } = require('jsdom');
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;
global.window = dom.window;

// Importar el parser (necesitamos adaptarlo para Node.js)
const filePath = path.join(__dirname, 'todos', 'DJControl Inpulse 200 Mk2.djm');

console.log('Leyendo archivo:', filePath);

try {
  const content = fs.readFileSync(filePath, 'utf-8');
  console.log('Archivo leído correctamente. Tamaño:', content.length, 'caracteres');
  
  // Intentar parsear XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');
  
  if (xmlDoc.documentElement.nodeName === 'parsererror') {
    const errorText = xmlDoc.documentElement.textContent || 'Error desconocido';
    console.error('Error parseando XML:', errorText);
    console.error('Primeras líneas del error:', errorText.substring(0, 500));
    process.exit(1);
  }
  
  console.log('XML parseado correctamente. Elemento raíz:', xmlDoc.documentElement.nodeName);
  
  // Verificar estructura
  const midiElements = xmlDoc.getElementsByTagName('midi');
  console.log('Elementos <midi> encontrados:', midiElements.length);
  
  if (midiElements.length > 0) {
    const midiElement = midiElements[0];
    const midiDevice = midiElement.getElementsByTagName('midi-device')[0];
    const midiMap = midiElement.getElementsByTagName('midi-map')[0];
    
    console.log('Elemento <midi-device> encontrado:', !!midiDevice);
    console.log('Elemento <midi-map> encontrado:', !!midiMap);
    
    if (midiDevice) {
      const controls = midiDevice.getElementsByTagName('control');
      console.log('Controles encontrados:', controls.length);
    }
    
    if (midiMap) {
      const maps = midiMap.getElementsByTagName('map');
      console.log('Mapeos encontrados:', maps.length);
      
      if (maps.length > 0) {
        console.log('Primer mapeo:', maps[0].getAttribute('name'), maps[0].getAttribute('action'));
      }
    }
  }
  
  // Intentar convertir a objeto como lo hace el parser
  function xmlToObject(node) {
    const obj = {};
    
    if (node.attributes && node.attributes.length > 0) {
      obj.$ = {};
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        obj.$[attr.name] = attr.value;
      }
    }
    
    const children = Array.from(node.children || []);
    if (children.length > 0) {
      children.forEach(child => {
        const childObj = xmlToObject(child);
        const name = child.nodeName;
        
        if (!obj[name]) {
          obj[name] = [];
        }
        obj[name].push(childObj);
      });
    } else if (node.textContent && node.textContent.trim()) {
      return node.textContent.trim();
    }
    
    return Object.keys(obj).length > 0 ? obj : (node.textContent?.trim() || '');
  }
  
  const result = xmlToObject(xmlDoc.documentElement);
  
  console.log('\n=== Estructura parseada ===');
  console.log('Claves del objeto raíz:', Object.keys(result));
  
  if (result.midi && result.midi.length > 0) {
    const midi = result.midi[0];
    console.log('Atributos de <midi>:', Object.keys(midi.$ || {}));
    console.log('Claves de <midi>:', Object.keys(midi).filter(k => k !== '$'));
    
    if (midi['midi-device'] && midi['midi-device'].length > 0) {
      const controls = midi['midi-device'][0].control || [];
      console.log('Controles parseados:', controls.length);
    }
    
    if (midi['midi-map'] && midi['midi-map'].length > 0) {
      const maps = midi['midi-map'][0].map || [];
      console.log('Mapeos parseados:', maps.length);
      
      if (maps.length > 0) {
        console.log('Primer mapeo parseado:', maps[0].$);
      }
    }
  }
  
  console.log('\n✅ Parseo exitoso!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
