// Manejo de MIDI usando easymidi

import * as easymidi from 'easymidi';
import { EventEmitter } from 'events';
import { MidiMessage, MidiDevice } from '../shared/types';

export class MidiHandler extends EventEmitter {
  private input: easymidi.Input | null = null;
  private output: easymidi.Output | null = null;
  private currentInputPort: number | null = null;
  private currentOutputPort: number | null = null;

  /**
   * Obtiene lista de dispositivos MIDI de entrada disponibles
   */
  getInputDevices(): MidiDevice[] {
    try {
      const ports = easymidi.getInputs();
      return ports.map((name, index) => ({
        name,
        port: index,
      }));
    } catch (error) {
      console.error('Error obteniendo dispositivos de entrada:', error);
      return [];
    }
  }

  /**
   * Obtiene lista de dispositivos MIDI de salida disponibles
   */
  getOutputDevices(): MidiDevice[] {
    try {
      const ports = easymidi.getOutputs();
      return ports.map((name, index) => ({
        name,
        port: index,
      }));
    } catch (error) {
      console.error('Error obteniendo dispositivos de salida:', error);
      return [];
    }
  }

  /**
   * Abre un dispositivo MIDI de entrada
   */
  openInput(port: number): boolean {
    try {
      this.closeInput();
      
      const devices = easymidi.getInputs();
      if (port >= 0 && port < devices.length) {
        this.input = new easymidi.Input(devices[port]);
        this.currentInputPort = port;
        
        this.input.on('noteon', (msg) => {
          this.emit('message', this.convertToMidiMessage('note', msg.note, msg.velocity, msg.channel));
        });
        
        this.input.on('noteoff', (msg) => {
          this.emit('message', this.convertToMidiMessage('note', msg.note, 0, msg.channel));
        });
        
        this.input.on('cc', (msg) => {
          this.emit('message', this.convertToMidiMessage('cc', msg.controller, msg.value, msg.channel));
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error abriendo dispositivo de entrada:', error);
      return false;
    }
  }

  /**
   * Abre un dispositivo MIDI de salida
   */
  openOutput(port: number): boolean {
    console.log('[MidiHandler.openOutput] INICIO - port:', port);
    try {
      console.log('[MidiHandler.openOutput] Cerrando output anterior...');
      this.closeOutput();
      
      console.log('[MidiHandler.openOutput] Obteniendo lista de dispositivos...');
      const devices = easymidi.getOutputs();
      console.log('[MidiHandler.openOutput] Dispositivos disponibles:', devices);
      console.log('[MidiHandler.openOutput] Número de dispositivos:', devices.length);
      
      if (port >= 0 && port < devices.length) {
        console.log(`[MidiHandler.openOutput] Abriendo dispositivo: ${devices[port]} (puerto ${port})`);
        const openStart = Date.now();
        this.output = new easymidi.Output(devices[port]);
        const openEnd = Date.now();
        console.log(`[MidiHandler.openOutput] Dispositivo abierto en ${openEnd - openStart}ms`);
        this.currentOutputPort = port;
        console.log('[MidiHandler.openOutput] FIN - Éxito');
        return true;
      }
      console.warn('[MidiHandler.openOutput] Puerto inválido o fuera de rango');
      return false;
    } catch (error) {
      console.error('[MidiHandler.openOutput] ERROR:', error);
      console.error('[MidiHandler.openOutput] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      return false;
    }
  }

  /**
   * Cierra el dispositivo de entrada actual
   */
  closeInput(): void {
    if (this.input) {
      this.input.close();
      this.input = null;
      this.currentInputPort = null;
    }
  }

  /**
   * Cierra el dispositivo de salida actual
   */
  closeOutput(): void {
    console.log('[MidiHandler.closeOutput] INICIO');
    if (this.output) {
      console.log('[MidiHandler.closeOutput] Cerrando output...');
      try {
        const closeStart = Date.now();
        this.output.close();
        const closeEnd = Date.now();
        console.log(`[MidiHandler.closeOutput] Output cerrado en ${closeEnd - closeStart}ms`);
      } catch (error) {
        console.error('[MidiHandler.closeOutput] ERROR al cerrar:', error);
      }
      this.output = null;
      this.currentOutputPort = null;
      console.log('[MidiHandler.closeOutput] FIN');
    } else {
      console.log('[MidiHandler.closeOutput] No hay output para cerrar');
    }
  }

  /**
   * Envía un mensaje MIDI
   */
  sendMessage(message: MidiMessage): void {
    console.log('[MidiHandler.sendMessage] INICIO');
    console.log('[MidiHandler.sendMessage] Mensaje recibido:', JSON.stringify(message));
    console.log('[MidiHandler.sendMessage] output existe?', this.output !== null);
    console.log('[MidiHandler.sendMessage] currentOutputPort:', this.currentOutputPort);
    
    if (!this.output) {
      console.warn('[MidiHandler.sendMessage] No hay dispositivo de salida abierto');
      throw new Error('No hay dispositivo de salida abierto');
    }

    try {
      console.log('[MidiHandler.sendMessage] Tipo de mensaje:', message.type);
      
      // Verificar estado del output antes de enviar
      console.log('[MidiHandler.sendMessage] Verificando estado del output antes de enviar...');
      if (!this.output) {
        throw new Error('Output se volvió null antes de enviar');
      }
      
      if (message.type === 'note') {
        console.log('[MidiHandler.sendMessage] Procesando mensaje NOTE');
        console.log('[MidiHandler.sendMessage] value:', message.value, 'note:', message.note, 'channel:', message.channel);
        
        if (message.value > 0) {
          console.log('[MidiHandler.sendMessage] Preparando noteon...');
          const noteonData = {
            note: message.note!,
            velocity: message.value,
            channel: message.channel,
          };
          console.log('[MidiHandler.sendMessage] Datos noteon:', JSON.stringify(noteonData));
          console.log('[MidiHandler.sendMessage] Llamando a output.send("noteon")...');
          const noteonStart = Date.now();
          this.output.send('noteon', noteonData);
          const noteonEnd = Date.now();
          const noteonDuration = noteonEnd - noteonStart;
          console.log(`[MidiHandler.sendMessage] noteon enviado en ${noteonDuration}ms`);
          if (noteonDuration > 1000) {
            console.warn(`[MidiHandler.sendMessage] ⚠️ ADVERTENCIA: noteon tardó ${noteonDuration}ms (más de 1 segundo)`);
          }
        } else {
          console.log('[MidiHandler.sendMessage] Preparando noteoff...');
          const noteoffData = {
            note: message.note!,
            velocity: 0,
            channel: message.channel,
          };
          console.log('[MidiHandler.sendMessage] Datos noteoff:', JSON.stringify(noteoffData));
          console.log('[MidiHandler.sendMessage] Llamando a output.send("noteoff")...');
          const noteoffStart = Date.now();
          this.output.send('noteoff', noteoffData);
          const noteoffEnd = Date.now();
          const noteoffDuration = noteoffEnd - noteoffStart;
          console.log(`[MidiHandler.sendMessage] noteoff enviado en ${noteoffDuration}ms`);
          if (noteoffDuration > 1000) {
            console.warn(`[MidiHandler.sendMessage] ⚠️ ADVERTENCIA: noteoff tardó ${noteoffDuration}ms (más de 1 segundo)`);
          }
        }
      } else if (message.type === 'cc') {
        console.log('[MidiHandler.sendMessage] Procesando mensaje CC');
        console.log('[MidiHandler.sendMessage] cc:', message.cc, 'value:', message.value, 'channel:', message.channel);
        const ccData = {
          controller: message.cc!,
          value: message.value,
          channel: message.channel,
        };
        console.log('[MidiHandler.sendMessage] Datos cc:', JSON.stringify(ccData));
        console.log('[MidiHandler.sendMessage] Llamando a output.send("cc")...');
        const ccStart = Date.now();
        this.output.send('cc', ccData);
        const ccEnd = Date.now();
        const ccDuration = ccEnd - ccStart;
        console.log(`[MidiHandler.sendMessage] cc enviado en ${ccDuration}ms`);
        if (ccDuration > 1000) {
          console.warn(`[MidiHandler.sendMessage] ⚠️ ADVERTENCIA: cc tardó ${ccDuration}ms (más de 1 segundo)`);
        }
      } else {
        console.warn('[MidiHandler.sendMessage] Tipo de mensaje desconocido:', message.type);
        throw new Error(`Tipo de mensaje desconocido: ${message.type}`);
      }
      
      console.log('[MidiHandler.sendMessage] FIN - Mensaje enviado exitosamente');
    } catch (error) {
      console.error('[MidiHandler.sendMessage] ERROR CAPTURADO:', error);
      console.error('[MidiHandler.sendMessage] Tipo de error:', error?.constructor?.name);
      console.error('[MidiHandler.sendMessage] Stack trace:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  /**
   * Convierte un mensaje de easymidi a MidiMessage
   */
  private convertToMidiMessage(
    type: 'note' | 'cc',
    data1: number,
    data2: number,
    channel: number
  ): MidiMessage {
    const statusByte = type === 'note' 
      ? (data2 > 0 ? 0x90 : 0x80)
      : 0xB0;
    
    const status = statusByte | channel;
    const hex1 = data1.toString(16).padStart(2, '0');
    const hex2 = data2.toString(16).padStart(2, '0');
    const raw = `${status.toString(16).padStart(2, '0')} ${hex1} ${hex2}`;

    return {
      channel,
      type,
      note: type === 'note' ? data1 : undefined,
      cc: type === 'cc' ? data1 : undefined,
      value: data2,
      raw: raw.toUpperCase(),
    };
  }

  /**
   * Verifica si hay un dispositivo de entrada abierto
   */
  isInputOpen(): boolean {
    return this.input !== null;
  }

  /**
   * Verifica si hay un dispositivo de salida abierto
   */
  isOutputOpen(): boolean {
    const result = this.output !== null;
    console.log('[MidiHandler.isOutputOpen] resultado:', result, 'currentOutputPort:', this.currentOutputPort);
    return result;
  }

  /**
   * Cierra todos los dispositivos
   */
  closeAll(): void {
    this.closeInput();
    this.closeOutput();
  }
}
