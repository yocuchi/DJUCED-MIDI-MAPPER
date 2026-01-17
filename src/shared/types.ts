// Tipos compartidos entre main y renderer

export interface MidiMessage {
  channel: number;
  type: 'note' | 'cc' | 'sysex';
  note?: number;
  cc?: number;
  value: number;
  raw: string; // Mensaje en formato hexadecimal (ej: "90 03 7f")
}

export interface MidiControl {
  name: string;
  input: MidiMessage;
  outputs?: MidiMessage[]; // Array de mensajes de salida (puede haber múltiples)
  type: 'toggle' | 'interval' | 'incremental';
  min?: string;
  max?: string;
  stepsPerTurn?: number;
  incremental?: boolean;
}

export interface DjucedAction {
  action: string;
  channel: string; // "1", "2", "default", etc.
  value: string; // "auto", "0", "1", etc.
  condition1?: string;
  condition2?: string;
  takeover?: string;
  temporary?: boolean;
}

export interface Mapping {
  controlName: string;
  control: MidiControl;
  action: DjucedAction;
  displayName?: string; // Nombre personalizado editable para el mapeo
}

export interface DjmFile {
  name: string;
  mapName: string;
  description: string;
  version: string;
  sysex?: string;
  controls: MidiControl[];
  mappings: Mapping[];
}

export interface MidiDevice {
  name: string;
  port: number;
  manufacturer?: string;
}

export interface ActionInfo {
  action: string;
  examples: string[];
  categories: string[];
}
