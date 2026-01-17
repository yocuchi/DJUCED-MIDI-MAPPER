// Definiciones de tipos para easymidi

declare module 'easymidi' {
  import { EventEmitter } from 'events';

  export interface NoteMessage {
    note: number;
    velocity: number;
    channel: number;
  }

  export interface ControlChangeMessage {
    controller: number;
    value: number;
    channel: number;
  }

  export class Input extends EventEmitter {
    constructor(name: string, virtual?: boolean);
    on(event: 'noteon', listener: (msg: NoteMessage) => void): this;
    on(event: 'noteoff', listener: (msg: NoteMessage) => void): this;
    on(event: 'cc', listener: (msg: ControlChangeMessage) => void): this;
    close(): void;
  }

  export class Output {
    constructor(name: string, virtual?: boolean);
    send(type: 'noteon', msg: NoteMessage): void;
    send(type: 'noteoff', msg: NoteMessage): void;
    send(type: 'cc', msg: ControlChangeMessage): void;
    close(): void;
  }

  export function getInputs(): string[];
  export function getOutputs(): string[];
}
