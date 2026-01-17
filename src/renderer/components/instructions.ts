// Componente de instrucciones de uso

export class Instructions {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="instructions">
        <h3>Instrucciones de Uso</h3>
        
        <div class="instruction-section">
          <h4>1. Conectar Dispositivo MIDI</h4>
          <ol>
            <li>Conecta tu controladora MIDI al ordenador</li>
            <li>En la sección "Dispositivos MIDI", selecciona tu dispositivo de entrada y salida</li>
            <li>Haz clic en "Conectar"</li>
            <li>Verás un mensaje de confirmación cuando la conexión sea exitosa</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>2. Grabar Comandos MIDI</h4>
          <ol>
            <li>Haz clic en el botón "Grabar Nuevo Comando" en la sección "Grabar Comando MIDI"</li>
            <li>El botón cambiará a "Grabando..." y se pondrá rojo</li>
            <li>Presiona cualquier botón, fader o control en tu controladora MIDI</li>
            <li>El comando se capturará automáticamente y se mostrará en pantalla</li>
            <li>Se te pedirá un nombre para el control (ej: "Play Button", "Volume Fader 1")</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>3. Asignar Acciones DJUCED</h4>
          <ol>
            <li>Después de grabar un comando, se abrirá automáticamente el editor de mapeo</li>
            <li>O puedes hacer clic en "Editar" en cualquier mapeo existente</li>
            <li>Selecciona la acción DJUCED que quieres asignar desde el menú desplegable</li>
            <li>Elige el canal (Default, 1, 2, 3, o 4)</li>
            <li>Configura el valor si es necesario (normalmente "auto")</li>
            <li>Marca "Temporary" si quieres que la acción sea temporal</li>
            <li>Haz clic en "Guardar"</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>4. Consultar Biblioteca de Acciones</h4>
          <ol>
            <li>Ve a la pestaña "Biblioteca de Acciones"</li>
            <li>Busca acciones usando la barra de búsqueda</li>
            <li>Filtra por categoría para encontrar acciones relacionadas</li>
            <li>Cada acción muestra su nombre, ejemplos de uso y categorías</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>5. Probar Mapeos</h4>
          <ol>
            <li>En la sección "Panel de Pruebas", puedes ver los mensajes MIDI en tiempo real</li>
            <li>Activa el modo de simulación para ver qué acciones se ejecutarían</li>
            <li>Usa el modo real para enviar comandos MIDI a DJUCED</li>
            <li>El log muestra todos los eventos para ayudarte a depurar</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>6. Guardar y Cargar Mapeos</h4>
          <ol>
            <li>Una vez que hayas creado tus mapeos, haz clic en "Guardar Mapeo"</li>
            <li>Se te pedirá un nombre para el mapeo, nombre del mapa y descripción</li>
            <li>Elige dónde guardar el archivo .djm</li>
            <li>Para cargar un mapeo existente, usa el botón "Cargar Mapeo"</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>Consejos y Trucos</h4>
          <ul>
            <li><strong>Nombres descriptivos:</strong> Usa nombres claros para tus controles (ej: "Play Deck 1" en lugar de "Button 1")</li>
            <li><strong>Organización:</strong> Agrupa controles relacionados usando nombres similares</li>
            <li><strong>Pruebas:</strong> Siempre prueba tus mapeos antes de usarlos en una sesión en vivo</li>
            <li><strong>Backup:</strong> Guarda copias de tus mapeos personalizados</li>
            <li><strong>Valores:</strong> La mayoría de acciones funcionan con "auto", pero algunas requieren valores específicos (0, 1, etc.)</li>
            <li><strong>Categorías:</strong> Usa la biblioteca de acciones para descubrir nuevas funcionalidades de DJUCED</li>
          </ul>
        </div>

        <div class="instruction-section">
          <h4>Tipos de Controles MIDI</h4>
          <ul>
            <li><strong>Note On/Off:</strong> Botones y teclas (toggle o pulsación)</li>
            <li><strong>Control Change (CC):</strong> Faders, knobs, pads con valores continuos</li>
            <li><strong>Toggle:</strong> Para botones que alternan entre dos estados (on/off)</li>
            <li><strong>Interval:</strong> Para controles con rango de valores continuos (faders, knobs)</li>
            <li><strong>Incremental:</strong> Para controles rotativos que envían incrementos relativos</li>
          </ul>
        </div>

        <div class="instruction-section">
          <h4>Type "Interval" (Tipo Intervalo)</h4>
          <p>El tipo <strong>interval</strong> se utiliza para controles que tienen un rango continuo de valores, 
          a diferencia de los controles <strong>toggle</strong> que solo tienen dos estados (encendido/apagado).</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Características:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Rango de valores:</strong> Puede tener cualquier valor entre <code>min</code> y <code>max</code> 
              (normalmente 0 a 7f en hexadecimal, que es 0 a 127 en decimal)</li>
              <li><strong>Uso típico:</strong> Faders de volumen, knobs de EQ (bass, mid, high), filtros, 
              controles de pitch, crossfader, etc.</li>
              <li><strong>Precisión:</strong> Proporciona 128 valores discretos (0-127) por defecto</li>
              <li><strong>Ejemplo:</strong> Un fader de volumen puede estar en cualquier posición entre 0% (min) y 100% (max)</li>
            </ul>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo - Intervalo Normal:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>&lt;control name="VOL_A"&gt;
  &lt;input message="b1 00 47" min="0" max="7f" type="interval"/&gt;
&lt;/control&gt;</code></pre>
            <p style="margin-top: 10px; margin-bottom: 0;">
              Este control puede recibir cualquier valor entre 0 y 7f (127), permitiendo un control preciso del volumen.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Intervalos Incrementales (Incremental Intervals)</h4>
          <p>Los <strong>intervalos incrementales</strong> son un tipo especial de control que se mapea de forma diferente 
          a los intervalos normales. Se utilizan para controles rotativos (knobs, jog wheels) que envían valores relativos 
          en lugar de valores absolutos.</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">Características de Intervalos Incrementales:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Rangos invertidos:</strong> Los valores van de <strong>mayor a menor</strong> 
              (<code>min="7f-40"</code> y <code>max="1-3f"</code> en lugar de <code>min="0"</code> y <code>max="7f"</code>)</li>
              <li><strong>Valores relativos:</strong> Envían incrementos/decrementos en lugar de posiciones absolutas</li>
              <li><strong>Uso típico:</strong> Jog wheels, knobs rotativos incrementales, controles de navegación (browse)</li>
              <li><strong>Propiedades adicionales:</strong> Tienen <code>incremental="yes"</code> y <code>steps-per-turn</code></li>
              <li><strong>Detección automática:</strong> El sistema intenta detectar automáticamente estos controles cuando 
              se mueven de mayor a menor, pero puedes configurarlos manualmente</li>
            </ul>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #FF9800; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo - Intervalo Incremental:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="BROWSE"&gt;
  &lt;input message="b0 01 01" min="7f-40" steps-per-turn="24" 
        incremental="yes" max="1-3f" type="interval"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>min="7f-40":</strong> Rango de valores altos (127-64 en decimal) - incrementos positivos</li>
              <li><strong>max="1-3f":</strong> Rango de valores bajos (1-63 en decimal) - incrementos negativos</li>
              <li><strong>incremental="yes":</strong> Indica que es un control incremental</li>
              <li><strong>steps-per-turn="24":</strong> Número de pasos por vuelta completa del control</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              <strong>Nota importante:</strong> Cuando configures un mapeo, si es un control rotativo que se mueve de mayor 
              a menor (como un jog wheel o knob incremental), asegúrate de marcarlo como incremental para que se configure 
              correctamente con los rangos invertidos.
            </p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #1a1a1a; border-left: 3px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px; color: #2196F3;">¿Cómo detectar si es un intervalo incremental?</h5>
            <ul style="margin-left: 30px; margin-bottom: 0;">
              <li>✅ <strong>Es incremental si:</strong> Es un knob/jog wheel rotativo que envía valores que van de mayor a menor</li>
              <li>✅ <strong>Valores típicos:</strong> Empieza en 64-127 (0x40-0x7F) y baja a 1-63 (0x01-0x3F)</li>
              <li>✅ <strong>Comportamiento:</strong> Cada rotación envía un incremento/decremento relativo, no una posición absoluta</li>
              <li>❌ <strong>NO es incremental si:</strong> Es un fader o knob que envía posiciones absolutas (0-127)</li>
            </ul>
          </div>
        </div>

        <div class="instruction-section">
          <h4>LSBit-Input (Least Significant Bit Input)</h4>
          <p>El <strong>lsbit-input</strong> (LSB = Least Significant Bit, bit menos significativo) es una técnica 
          avanzada de MIDI que permite aumentar la precisión de los controles mediante resolución de 14 bits.</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">¿Cómo funciona?</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              En MIDI estándar, los mensajes Control Change (CC) tienen 7 bits de resolución, 
              lo que proporciona 128 valores posibles (0-127). Para controles que requieren mayor precisión, 
              se usa la técnica de <strong>14-bit resolution</strong>:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>MSB (Most Significant Bit):</strong> El mensaje principal <code>input</code> usa los 7 bits 
              más significativos (valores 0-127)</li>
              <li><strong>LSB (Least Significant Bit):</strong> El mensaje <code>lsbit-input</strong> usa los 7 bits 
              menos significativos (valores 0-127)</li>
              <li><strong>Combinación:</strong> Juntos proporcionan 14 bits de resolución = 16,384 valores posibles 
              (128 × 128 = 16,384)</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">Patrón de numeración:</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              En MIDI, el LSB de un control CC siempre está en el número de control + 32 (0x20 en hexadecimal):
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li>Si el CC principal es <code>0x01</code>, el LSB será <code>0x21</code> (0x01 + 0x20)</li>
              <li>Si el CC principal es <code>0x05</code>, el LSB será <code>0x25</code> (0x05 + 0x20)</li>
              <li>Si el CC principal es <code>0x20</code>, el LSB será <code>0x40</code> (0x20 + 0x20)</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">Cuándo se usa:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Controles de alta precisión:</strong> Faders de volumen, knobs de EQ, pitch, etc.</li>
              <li><strong>Movimientos suaves:</strong> Permite transiciones más fluidas sin "saltos" entre valores</li>
              <li><strong>Controladores profesionales:</strong> Muchas controladoras de gama alta usan esta técnica</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo Práctico:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="FILTER_A"&gt;
  &lt;input message="b1 01 3f" min="0" max="7f" type="interval"/&gt;
  &lt;lsbit-input message="b1 21 3f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Input principal:</strong> <code>b1 01 3f</code> - Canal 1, CC 0x01 (MSB), valor 0x3f (63)</li>
              <li><strong>LSBit-input:</strong> <code>b1 21 3f</code> - Canal 1, CC 0x21 (LSB = 0x01 + 0x20), valor 0x3f (63)</li>
              <li><strong>Resultado:</strong> El software combina ambos valores para obtener una precisión de 14 bits</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              Nota: No todos los controles necesitan lsbit-input. Solo se usa cuando el controlador 
              y el software soportan resolución de 14 bits para ese control específico.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Input Message y Output Message en archivos .djm</h4>
          <p>En los archivos .djm, cada control puede tener dos tipos de mensajes MIDI:</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Input Message (Mensaje de Entrada)</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              El <strong>input message</strong> es el mensaje MIDI que el controlador físico envía al software 
              cuando el usuario interactúa con un control (presiona un botón, mueve un fader, etc.).
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Propósito:</strong> Notificar al software que el usuario ha activado un control</li>
              <li><strong>Dirección:</strong> Controlador → Software (DJUCED)</li>
              <li><strong>Ejemplo:</strong> Cuando presionas el botón "Play" en tu controladora, envía un mensaje 
              como "90 07 7f" que el software interpreta como "iniciar reproducción"</li>
              <li><strong>Obligatorio:</strong> Todos los controles deben tener un input message</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">Output Message (Mensaje de Salida)</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              El <strong>output message</strong> es el mensaje MIDI que el software envía de vuelta al controlador 
              para actualizar el estado visual o físico del control (encender LEDs, actualizar displays, etc.).
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Propósito:</strong> Sincronizar el estado del controlador con el estado del software</li>
              <li><strong>Dirección:</strong> Software (DJUCED) → Controlador</li>
              <li><strong>Ejemplo:</strong> Cuando DJUCED inicia la reproducción, envía un mensaje al controlador 
              para encender el LED del botón "Play" y que coincida con el estado real</li>
              <li><strong>Opcional:</strong> No todos los controles necesitan output message (por ejemplo, 
              faders que solo envían datos pero no tienen retroalimentación visual)</li>
              <li><strong>Múltiples outputs:</strong> Algunos controles pueden tener varios output messages 
              para controlar diferentes LEDs o indicadores relacionados</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo Práctico 1 - Botón CUE:</h5>
            <p style="margin-bottom: 10px;">
              Un botón "CUE" típico tiene:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Input:</strong> "91 06 7f" - Cuando presionas el botón, envía este mensaje a DJUCED</li>
              <li><strong>Output 1:</strong> "91 06 7f" - DJUCED envía este mensaje para encender el LED del botón cuando está activo</li>
              <li><strong>Output 2:</strong> "94 06 7f" - DJUCED envía un mensaje adicional para actualizar otro indicador relacionado</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo Práctico 2 - Hot Cue con múltiples LEDs:</h5>
            <p style="margin-bottom: 10px;">
              Un botón "Hot Cue 1" (HC1_B) típico tiene dos output messages para controlar diferentes LEDs:
            </p>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="HC1_B"&gt;
  &lt;input message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 08 7f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Input:</strong> "97 00 7f" - Cuando presionas el botón Hot Cue 1 del deck B</li>
              <li><strong>Output 1:</strong> "97 00 7f" - Controla el <strong>LED del botón principal</strong> (se enciende cuando el hot cue está activo/reproduciendo)</li>
              <li><strong>Output 2:</strong> "97 08 7f" - Controla el <strong>LED del botón DELETE asociado</strong> (se enciende cuando hay un hot cue guardado en la posición 1)</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              Este patrón es común en controladoras con botones de Hot Cue que tienen LEDs separados para indicar:
              (1) si el hot cue está activo, y (2) si hay un hot cue guardado en esa posición. 
              El segundo output message corresponde al mensaje del control DELETE_HC1_B, permitiendo 
              sincronizar el estado visual de ambos botones relacionados.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>¿Cómo decide DJUCED qué Output Message enviar?</h4>
          <p>Una pregunta común es: <strong>¿cómo se decide cuál output message enviar cuando hay múltiples?</strong></p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">La respuesta:</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              <strong>DJUCED decide automáticamente</strong> qué output messages enviar basándose en el estado interno del software. 
              Los archivos .djm son <strong>archivos XML estáticos</strong> (sin JavaScript ni lógica de programación) que solo 
              definen qué mensajes están disponibles. La lógica de decisión está implementada dentro del software DJUCED.
            </p>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">Cómo funciona:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>El archivo .djm define:</strong> Qué output messages están disponibles para cada control</li>
              <li><strong>DJUCED decide:</strong> Cuándo y cuáles enviar según el estado actual del software</li>
              <li><strong>Múltiples outputs:</strong> DJUCED puede enviar <strong>todos</strong> los output messages definidos, 
              cada uno en el momento apropiado según el estado</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #FF9800; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Ejemplo con HC1_B:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="HC1_B"&gt;
  &lt;input message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 08 7f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <p style="margin-bottom: 10px;"><strong>DJUCED envía:</strong></p>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Output 1 ("97 00 7f"):</strong> Cuando el hot cue 1 está <strong>activo/reproduciendo</strong> 
              → Enciende el LED del botón principal</li>
              <li><strong>Output 2 ("97 08 7f"):</strong> Cuando hay un <strong>hot cue guardado</strong> en la posición 1 
              → Enciende el LED del botón DELETE</li>
              <li><strong>Ambos pueden enviarse simultáneamente</strong> si el hot cue está activo Y hay un hot cue guardado</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              La lógica de cuándo enviar cada mensaje está programada dentro de DJUCED, no en el archivo .djm. 
              El archivo .djm solo le dice a DJUCED: "estos son los mensajes que puedes usar para este control".
            </p>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #1a1a1a; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Resumen:</h5>
            <ul style="margin-left: 30px; margin-bottom: 0;">
              <li>❌ <strong>NO hay JavaScript</strong> en los archivos .djm (son solo XML estático)</li>
              <li>✅ <strong>DJUCED decide</strong> qué output messages enviar según el estado del software</li>
              <li>✅ <strong>Múltiples outputs</strong> pueden enviarse simultáneamente o en diferentes momentos</li>
              <li>✅ El archivo .djm solo <strong>define qué mensajes están disponibles</strong>, no cuándo usarlos</li>
            </ul>
          </div>
        </div>

        <div class="instruction-section">
          <h4>¿Puedo cambiar todos los mapeos de un deck a otro con un botón?</h4>
          <p>Esta es una pregunta común: <strong>¿Es posible crear un mapeo que cambie todos los controles del deck 1 al deck 3 con un solo botón?</strong></p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #f44336;">Respuesta corta: No directamente</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              El sistema de mapeos de DJUCED <strong>no permite cambiar dinámicamente el canal</strong> de múltiples mapeos con una sola acción. 
              Cada mapeo tiene su canal (1, 2, 3, 4, o default) <strong>hardcodeado</strong> en el archivo .djm.
            </p>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">¿Por qué no es posible?</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li>Los archivos .djm son <strong>XML estáticos</strong> sin lógica de programación</li>
              <li>Cada mapeo tiene su canal <strong>fijo</strong> definido en el atributo <code>chann=</code></li>
              <li>No existe una acción en DJUCED que permita cambiar el canal de otros mapeos</li>
              <li>Las <strong>condiciones</strong> (condition_one, condition_two) solo cambian qué acción se ejecuta, no el canal</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Alternativas posibles:</h5>
            <div style="margin-left: 15px;">
              <p style="margin-bottom: 10px;"><strong>1. Usar la acción "select":</strong></p>
              <div style="margin-left: 20px; margin-bottom: 15px;">
                <p style="margin-bottom: 10px;">
                  Existe la acción <code>action=select</code> que se usa comúnmente en los archivos .djm. Basándome en el análisis de múltiples 
                  archivos de mapeo, esta acción parece tener la siguiente función:
                </p>
                
                <div style="padding: 12px; background-color: #1a1a1a; border-left: 3px solid #2196F3; border-radius: 4px; margin-bottom: 10px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>¿Qué hace action=select?</strong></p>
                  <ul style="margin-left: 25px; margin-bottom: 0;">
                    <li><strong>Selecciona un deck</strong> en la interfaz de DJUCED (marca qué deck está "activo" o "seleccionado")</li>
                    <li>Se usa típicamente con botones como <code>MASTER_A</code> y <code>MASTER_B</code> en controladores Hercules</li>
                    <li>Ejemplo: <code>action="chann=1 action=select value="auto""</code> selecciona el deck 1</li>
                    <li>Ejemplo: <code>action="chann=3 action=select value="auto""</code> selecciona el deck 3</li>
                  </ul>
                </div>

                <p style="margin-bottom: 10px;"><strong>⚠️ Limitación importante:</strong></p>
                <p style="margin-bottom: 10px;">
                  La acción <code>select</code> <strong>NO cambia el canal de los mapeos existentes</strong>. Si tienes un control mapeado 
                  a <code>chann=1 action=play_pause</code>, seguirá controlando el deck 1 incluso después de usar <code>action=select</code> 
                  para seleccionar el deck 3.
                </p>

                <div style="padding: 12px; background-color: #2a2a2a; border-left: 3px solid #FF9800; border-radius: 4px; margin-bottom: 10px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>¿Cuándo podría ser útil?</strong></p>
                  <p style="margin-bottom: 0;">
                    La acción <code>select</code> podría ser útil si DJUCED tiene alguna funcionalidad que dependa del deck "seleccionado", 
                    como ciertas acciones de la interfaz o navegación. Sin embargo, <strong>no permite cambiar dinámicamente a qué deck 
                    apuntan los controles MIDI</strong> - esos siguen siendo fijos según el canal definido en cada mapeo.
                  </p>
                </div>

                <div style="padding: 12px; background-color: #1a1a1a; border-left: 3px solid #4CAF50; border-radius: 4px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>Ejemplo real de uso:</strong></p>
                  <pre style="background: #0a0a0a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 8px; font-size: 0.9em;"><code>&lt;map name="MASTER_A" action="chann=1 action=select value=&quot;auto&quot;"/&gt;
&lt;map name="MASTER_B" action="chann=2 action=select value=&quot;auto&quot;"/&gt;</code></pre>
                  <p style="margin-bottom: 0; font-size: 0.9em;">
                    Estos mapeos seleccionan el deck 1 o 2 respectivamente, pero <strong>no cambian</strong> a qué deck apuntan otros 
                    controles como <code>PLAY_A</code> o <code>PITCH_A</code> - esos siguen controlando el deck especificado en su propio 
                    atributo <code>chann=</code>.
                  </p>
                </div>
              </div>
              
              <p style="margin-bottom: 10px;"><strong>2. Crear mapeos duplicados:</strong></p>
              <p style="margin-left: 20px; margin-bottom: 15px;">
                Podrías crear <strong>conjuntos duplicados de controles</strong> mapeados a diferentes canales y usar condiciones para 
                activar/desactivar grupos. Por ejemplo:
              </p>
              <ul style="margin-left: 40px; margin-bottom: 15px;">
                <li>Conjunto A: Todos los controles mapeados al canal 1</li>
                <li>Conjunto B: Los mismos controles mapeados al canal 3</li>
                <li>Usar una condición para activar uno u otro conjunto</li>
              </ul>
              <p style="margin-left: 20px; margin-bottom: 15px; font-style: italic;">
                ⚠️ Esto sería muy complejo y requeriría duplicar todos los controles, además de que las condiciones no funcionan 
                exactamente así (solo afectan acciones individuales, no grupos de mapeos).
              </p>

              <p style="margin-bottom: 10px;"><strong>3. Usar múltiples archivos .djm:</strong></p>
              <p style="margin-left: 20px; margin-bottom: 15px;">
                Podrías crear <strong>dos archivos .djm diferentes</strong> (uno con controles al deck 1, otro al deck 3) y cambiar 
                entre ellos manualmente en DJUCED. No es automático con un botón, pero es la solución más práctica.
              </p>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Conclusión:</h5>
            <p style="margin-bottom: 10px;">
              <strong>No es posible</strong> cambiar dinámicamente todos los mapeos de un deck a otro con un solo botón usando 
              el sistema de mapeos estándar de DJUCED. El canal está fijo en cada mapeo.
            </p>
            <p style="margin-bottom: 0;">
              La mejor alternativa es crear <strong>archivos .djm separados</strong> para diferentes configuraciones de deck, 
              o usar la acción <code>select</code> si DJUCED soporta algún modo de operación basado en selección de deck 
              (esto dependería de la implementación específica de DJUCED).
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Solución de Problemas</h4>
          <ul>
            <li><strong>No se detecta el dispositivo:</strong> Asegúrate de que esté conectado y encendido. Reinicia la aplicación si es necesario.</li>
            <li><strong>No se capturan comandos:</strong> Verifica que el dispositivo esté conectado correctamente y que hayas hecho clic en "Grabar"</li>
            <li><strong>Los mapeos no funcionan:</strong> Comprueba que DJUCED esté configurado para usar el archivo .djm correcto</li>
            <li><strong>Errores al guardar:</strong> Asegúrate de tener permisos de escritura en la carpeta seleccionada</li>
          </ul>
        </div>
      </div>
    `;
  }
}
