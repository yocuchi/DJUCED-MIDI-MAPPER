// Usage instructions component

export class Instructions {
  private container: HTMLElement;

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
    this.render();
  }

  private render() {
    this.container.innerHTML = `
      <div class="instructions">
        <h3>Usage Instructions</h3>
        
        <div class="instruction-section">
          <h4>1. Connect MIDI Device</h4>
          <ol>
            <li>Connect your MIDI controller to the computer</li>
            <li>In the "MIDI Devices" section, select your input and output device</li>
            <li>Click "Connect"</li>
            <li>You'll see a confirmation message when the connection is successful</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>2. Record MIDI Commands</h4>
          <ol>
            <li>Click the "Record New Command" button in the "Record MIDI Command" section</li>
            <li>The button will change to "Recording..." and turn red</li>
            <li>Press any button, fader, or control on your MIDI controller</li>
            <li>The command will be automatically captured and displayed on screen</li>
            <li>You'll be asked for a name for the control (e.g., "Play Button", "Volume Fader 1")</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>3. Assign DJUCED Actions</h4>
          <ol>
            <li>After recording a command, the mapping editor will automatically open</li>
            <li>Or you can click "Edit" on any existing mapping</li>
            <li>Select the DJUCED action you want to assign from the dropdown menu</li>
            <li>Choose the channel (Default, 1, 2, 3, or 4)</li>
            <li>Configure the value if necessary (usually "auto")</li>
            <li>Check "Temporary" if you want the action to be temporary</li>
            <li>Click "Save"</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>4. Consult Action Library</h4>
          <ol>
            <li>Go to the "Action Library" tab</li>
            <li>Search for actions using the search bar</li>
            <li>Filter by category to find related actions</li>
            <li>Each action shows its name, usage examples, and categories</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>5. Test Mappings</h4>
          <ol>
            <li>In the "Test Panel" section, you can see MIDI messages in real time</li>
            <li>Activate simulation mode to see what actions would be executed</li>
            <li>Use real mode to send MIDI commands to DJUCED</li>
            <li>The log shows all events to help you debug</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>6. Save and Load Mappings</h4>
          <ol>
            <li>Once you've created your mappings, click "Save Mapping"</li>
            <li>You'll be asked for a mapping name, map name, and description</li>
            <li>Choose where to save the .djm file</li>
            <li>To load an existing mapping, use the "Load Mapping" button</li>
          </ol>
        </div>

        <div class="instruction-section">
          <h4>Tips and Tricks</h4>
          <ul>
            <li><strong>Descriptive names:</strong> Use clear names for your controls (e.g., "Play Deck 1" instead of "Button 1")</li>
            <li><strong>Organization:</strong> Group related controls using similar names</li>
            <li><strong>Testing:</strong> Always test your mappings before using them in a live session</li>
            <li><strong>Backup:</strong> Save copies of your custom mappings</li>
            <li><strong>Values:</strong> Most actions work with "auto", but some require specific values (0, 1, etc.)</li>
            <li><strong>Categories:</strong> Use the action library to discover new DJUCED features</li>
          </ul>
        </div>

        <div class="instruction-section">
          <h4>MIDI Control Types</h4>
          <ul>
            <li><strong>Note On/Off:</strong> Buttons and keys (toggle or press)</li>
            <li><strong>Control Change (CC):</strong> Faders, knobs, pads with continuous values</li>
            <li><strong>Toggle:</strong> For buttons that alternate between two states (on/off)</li>
            <li><strong>Interval:</strong> For controls with continuous value range (faders, knobs)</li>
            <li><strong>Incremental:</strong> For rotary controls that send relative increments</li>
          </ul>
        </div>

        <div class="instruction-section">
          <h4>Type "Interval" (Interval Type)</h4>
          <p>The <strong>interval</strong> type is used for controls that have a continuous range of values, 
          unlike <strong>toggle</strong> controls that only have two states (on/off).</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Features:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Value range:</strong> Can have any value between <code>min</code> and <code>max</code> 
              (usually 0 to 7f in hexadecimal, which is 0 to 127 in decimal)</li>
              <li><strong>Typical use:</strong> Volume faders, EQ knobs (bass, mid, high), filters, 
              pitch controls, crossfader, etc.</li>
              <li><strong>Precision:</strong> Provides 128 discrete values (0-127) by default</li>
              <li><strong>Example:</strong> A volume fader can be at any position between 0% (min) and 100% (max)</li>
            </ul>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Example - Normal Interval:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto;"><code>&lt;control name="VOL_A"&gt;
  &lt;input message="b1 00 47" min="0" max="7f" type="interval"/&gt;
&lt;/control&gt;</code></pre>
            <p style="margin-top: 10px; margin-bottom: 0;">
              This control can receive any value between 0 and 7f (127), allowing precise volume control.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Incremental Intervals</h4>
          <p><strong>Incremental intervals</strong> are a special type of control that maps differently 
          from normal intervals. They are used for rotary controls (knobs, jog wheels) that send relative values 
          instead of absolute values.</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">Incremental Interval Features:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Inverted ranges:</strong> Values go from <strong>high to low</strong> 
              (<code>min="7f-40"</code> and <code>max="1-3f"</code> instead of <code>min="0"</code> and <code>max="7f"</code>)</li>
              <li><strong>Relative values:</strong> Send increments/decrements instead of absolute positions</li>
              <li><strong>Typical use:</strong> Jog wheels, incremental rotary knobs, navigation controls (browse)</li>
              <li><strong>Additional properties:</strong> Have <code>incremental="yes"</code> and <code>steps-per-turn</code></li>
              <li><strong>Automatic detection:</strong> The system tries to automatically detect these controls when 
              they move from high to low, but you can configure them manually</li>
            </ul>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #FF9800; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Example - Incremental Interval:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="BROWSE"&gt;
  &lt;input message="b0 01 01" min="7f-40" steps-per-turn="24" 
        incremental="yes" max="1-3f" type="interval"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>min="7f-40":</strong> Range of high values (127-64 in decimal) - positive increments</li>
              <li><strong>max="1-3f":</strong> Range of low values (1-63 in decimal) - negative increments</li>
              <li><strong>incremental="yes":</strong> Indicates it's an incremental control</li>
              <li><strong>steps-per-turn="24":</strong> Number of steps per full turn of the control</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              <strong>Important note:</strong> When configuring a mapping, if it's a rotary control that moves from high 
              to low (like a jog wheel or incremental knob), make sure to mark it as incremental so it's configured 
              correctly with inverted ranges.
            </p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #1a1a1a; border-left: 3px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px; color: #2196F3;">How to detect if it's an incremental interval?</h5>
            <ul style="margin-left: 30px; margin-bottom: 0;">
              <li>✅ <strong>It's incremental if:</strong> It's a rotary knob/jog wheel that sends values going from high to low</li>
              <li>✅ <strong>Typical values:</strong> Starts at 64-127 (0x40-0x7F) and goes down to 1-63 (0x01-0x3F)</li>
              <li>✅ <strong>Behavior:</strong> Each rotation sends a relative increment/decrement, not an absolute position</li>
              <li>❌ <strong>NOT incremental if:</strong> It's a fader or knob that sends absolute positions (0-127)</li>
            </ul>
          </div>
        </div>

        <div class="instruction-section">
          <h4>LSBit-Input (Least Significant Bit Input)</h4>
          <p><strong>lsbit-input</strong> (LSB = Least Significant Bit) is an advanced MIDI technique 
          that increases control precision through 14-bit resolution.</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">How does it work?</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              In standard MIDI, Control Change (CC) messages have 7-bit resolution, 
              providing 128 possible values (0-127). For controls that require greater precision, 
              the <strong>14-bit resolution</strong> technique is used:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>MSB (Most Significant Bit):</strong> The main <code>input</code> message uses the 7 most 
              significant bits (values 0-127)</li>
              <li><strong>LSB (Least Significant Bit):</strong> The <code>lsbit-input</code> message uses the 7 least 
              significant bits (values 0-127)</li>
              <li><strong>Combination:</strong> Together they provide 14-bit resolution = 16,384 possible values 
              (128 × 128 = 16,384)</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">Numbering pattern:</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              In MIDI, the LSB of a CC control is always at control number + 32 (0x20 in hexadecimal):
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li>If the main CC is <code>0x01</code>, the LSB will be <code>0x21</code> (0x01 + 0x20)</li>
              <li>If the main CC is <code>0x05</code>, the LSB will be <code>0x25</code> (0x05 + 0x20)</li>
              <li>If the main CC is <code>0x20</code>, the LSB will be <code>0x40</code> (0x20 + 0x20)</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">When is it used:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>High-precision controls:</strong> Volume faders, EQ knobs, pitch, etc.</li>
              <li><strong>Smooth movements:</strong> Allows smoother transitions without "jumps" between values</li>
              <li><strong>Professional controllers:</strong> Many high-end controllers use this technique</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Practical Example:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="FILTER_A"&gt;
  &lt;input message="b1 01 3f" min="0" max="7f" type="interval"/&gt;
  &lt;lsbit-input message="b1 21 3f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Main input:</strong> <code>b1 01 3f</code> - Channel 1, CC 0x01 (MSB), value 0x3f (63)</li>
              <li><strong>LSBit-input:</strong> <code>b1 21 3f</code> - Channel 1, CC 0x21 (LSB = 0x01 + 0x20), value 0x3f (63)</li>
              <li><strong>Result:</strong> The software combines both values to obtain 14-bit precision</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              Note: Not all controls need lsbit-input. It's only used when the controller 
              and software support 14-bit resolution for that specific control.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Input Message and Output Message in .djm files</h4>
          <p>In .djm files, each control can have two types of MIDI messages:</p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Input Message</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              The <strong>input message</strong> is the MIDI message that the physical controller sends to the software 
              when the user interacts with a control (presses a button, moves a fader, etc.).
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Purpose:</strong> Notify the software that the user has activated a control</li>
              <li><strong>Direction:</strong> Controller → Software (DJUCED)</li>
              <li><strong>Example:</strong> When you press the "Play" button on your controller, it sends a message 
              like "90 07 7f" that the software interprets as "start playback"</li>
              <li><strong>Required:</strong> All controls must have an input message</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #2196F3;">Output Message</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              The <strong>output message</strong> is the MIDI message that the software sends back to the controller 
              to update the visual or physical state of the control (turn on LEDs, update displays, etc.).
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Purpose:</strong> Synchronize the controller state with the software state</li>
              <li><strong>Direction:</strong> Software (DJUCED) → Controller</li>
              <li><strong>Example:</strong> When DJUCED starts playback, it sends a message to the controller 
              to turn on the "Play" button LED to match the actual state</li>
              <li><strong>Optional:</strong> Not all controls need an output message (for example, 
              faders that only send data but have no visual feedback)</li>
              <li><strong>Multiple outputs:</strong> Some controls can have multiple output messages 
              to control different LEDs or related indicators</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Practical Example 1 - CUE Button:</h5>
            <p style="margin-bottom: 10px;">
              A typical "CUE" button has:
            </p>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>Input:</strong> "91 06 7f" - When you press the button, it sends this message to DJUCED</li>
              <li><strong>Output 1:</strong> "91 06 7f" - DJUCED sends this message to turn on the button LED when it's active</li>
              <li><strong>Output 2:</strong> "94 06 7f" - DJUCED sends an additional message to update another related indicator</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #4CAF50; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Practical Example 2 - Hot Cue with multiple LEDs:</h5>
            <p style="margin-bottom: 10px;">
              A typical "Hot Cue 1" (HC1_B) button has two output messages to control different LEDs:
            </p>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="HC1_B"&gt;
  &lt;input message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 08 7f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Input:</strong> "97 00 7f" - When you press the Hot Cue 1 button on deck B</li>
              <li><strong>Output 1:</strong> "97 00 7f" - Controls the <strong>main button LED</strong> (turns on when the hot cue is active/playing)</li>
              <li><strong>Output 2:</strong> "97 08 7f" - Controls the <strong>associated DELETE button LED</strong> (turns on when there's a hot cue saved in position 1)</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              This pattern is common in controllers with Hot Cue buttons that have separate LEDs to indicate:
              (1) if the hot cue is active, and (2) if there's a hot cue saved in that position. 
              The second output message corresponds to the DELETE_HC1_B control message, allowing 
              synchronization of the visual state of both related buttons.
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>How does DJUCED decide which Output Message to send?</h4>
          <p>A common question is: <strong>how is it decided which output message to send when there are multiple?</strong></p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">The answer:</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              <strong>DJUCED automatically decides</strong> which output messages to send based on the software's internal state. 
              .djm files are <strong>static XML files</strong> (no JavaScript or programming logic) that only 
              define which messages are available. The decision logic is implemented within the DJUCED software.
            </p>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">How it works:</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li><strong>The .djm file defines:</strong> Which output messages are available for each control</li>
              <li><strong>DJUCED decides:</strong> When and which ones to send according to the current software state</li>
              <li><strong>Multiple outputs:</strong> DJUCED can send <strong>all</strong> defined output messages, 
              each at the appropriate time according to the state</li>
            </ul>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #FF9800; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Example with HC1_B:</h5>
            <pre style="background: #1a1a1a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 10px;"><code>&lt;control name="HC1_B"&gt;
  &lt;input message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 00 7f" min="0" max="7f" type="toggle"/&gt;
  &lt;output message="97 08 7f" min="0" max="7f" type="toggle"/&gt;
&lt;/control&gt;</code></pre>
            <p style="margin-bottom: 10px;"><strong>DJUCED sends:</strong></p>
            <ul style="margin-left: 30px; margin-bottom: 10px;">
              <li><strong>Output 1 ("97 00 7f"):</strong> When hot cue 1 is <strong>active/playing</strong> 
              → Turns on the main button LED</li>
              <li><strong>Output 2 ("97 08 7f"):</strong> When there's a <strong>saved hot cue</strong> in position 1 
              → Turns on the DELETE button LED</li>
              <li><strong>Both can be sent simultaneously</strong> if the hot cue is active AND there's a saved hot cue</li>
            </ul>
            <p style="margin-bottom: 0; font-style: italic;">
              The logic of when to send each message is programmed within DJUCED, not in the .djm file. 
              The .djm file only tells DJUCED: "these are the messages you can use for this control".
            </p>
          </div>

          <div style="margin-top: 15px; padding: 15px; background-color: #1a1a1a; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Summary:</h5>
            <ul style="margin-left: 30px; margin-bottom: 0;">
              <li>❌ <strong>NO JavaScript</strong> in .djm files (they're just static XML)</li>
              <li>✅ <strong>DJUCED decides</strong> which output messages to send according to the software state</li>
              <li>✅ <strong>Multiple outputs</strong> can be sent simultaneously or at different times</li>
              <li>✅ The .djm file only <strong>defines which messages are available</strong>, not when to use them</li>
            </ul>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Can I change all mappings from one deck to another with a button?</h4>
          <p>This is a common question: <strong>Is it possible to create a mapping that changes all controls from deck 1 to deck 3 with a single button?</strong></p>
          
          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #f44336;">Short answer: Not directly</h5>
            <p style="margin-left: 15px; margin-bottom: 15px;">
              DJUCED's mapping system <strong>does not allow dynamically changing the channel</strong> of multiple mappings with a single action. 
              Each mapping has its channel (1, 2, 3, 4, or default) <strong>hardcoded</strong> in the .djm file.
            </p>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #FF9800;">Why isn't it possible?</h5>
            <ul style="margin-left: 30px; margin-bottom: 15px;">
              <li>.djm files are <strong>static XML</strong> with no programming logic</li>
              <li>Each mapping has its <strong>fixed</strong> channel defined in the <code>chann=</code> attribute</li>
              <li>There's no action in DJUCED that allows changing the channel of other mappings</li>
              <li><strong>Conditions</strong> (condition_one, condition_two) only change which action is executed, not the channel</li>
            </ul>
          </div>

          <div style="margin-top: 15px;">
            <h5 style="margin-bottom: 8px; color: #4CAF50;">Possible alternatives:</h5>
            <div style="margin-left: 15px;">
              <p style="margin-bottom: 10px;"><strong>1. Use the "select" action:</strong></p>
              <div style="margin-left: 20px; margin-bottom: 15px;">
                <p style="margin-bottom: 10px;">
                  There's the <code>action=select</code> action that's commonly used in .djm files. Based on the analysis of multiple 
                  mapping files, this action appears to have the following function:
                </p>
                
                <div style="padding: 12px; background-color: #1a1a1a; border-left: 3px solid #2196F3; border-radius: 4px; margin-bottom: 10px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>What does action=select do?</strong></p>
                  <ul style="margin-left: 25px; margin-bottom: 0;">
                    <li><strong>Selects a deck</strong> in the DJUCED interface (marks which deck is "active" or "selected")</li>
                    <li>Typically used with buttons like <code>MASTER_A</code> and <code>MASTER_B</code> in Hercules controllers</li>
                    <li>Example: <code>action="chann=1 action=select value="auto""</code> selects deck 1</li>
                    <li>Example: <code>action="chann=3 action=select value="auto""</code> selects deck 3</li>
                  </ul>
                </div>

                <p style="margin-bottom: 10px;"><strong>⚠️ Important limitation:</strong></p>
                <p style="margin-bottom: 10px;">
                  The <code>select</code> action <strong>does NOT change the channel of existing mappings</strong>. If you have a control mapped 
                  to <code>chann=1 action=play_pause</code>, it will continue controlling deck 1 even after using <code>action=select</code> 
                  to select deck 3.
                </p>

                <div style="padding: 12px; background-color: #2a2a2a; border-left: 3px solid #FF9800; border-radius: 4px; margin-bottom: 10px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>When could it be useful?</strong></p>
                  <p style="margin-bottom: 0;">
                    The <code>select</code> action could be useful if DJUCED has some functionality that depends on the "selected" deck, 
                    such as certain interface actions or navigation. However, <strong>it does not allow dynamically changing which deck 
                    MIDI controls point to</strong> - those remain fixed according to the channel defined in each mapping.
                  </p>
                </div>

                <div style="padding: 12px; background-color: #1a1a1a; border-left: 3px solid #4CAF50; border-radius: 4px;">
                  <p style="margin-top: 0; margin-bottom: 8px;"><strong>Real usage example:</strong></p>
                  <pre style="background: #0a0a0a; padding: 10px; border-radius: 4px; overflow-x: auto; margin-bottom: 8px; font-size: 0.9em;"><code>&lt;map name="MASTER_A" action="chann=1 action=select value=&quot;auto&quot;"/&gt;
&lt;map name="MASTER_B" action="chann=2 action=select value=&quot;auto&quot;"/&gt;</code></pre>
                  <p style="margin-bottom: 0; font-size: 0.9em;">
                    These mappings select deck 1 or 2 respectively, but <strong>do not change</strong> which deck other 
                    controls like <code>PLAY_A</code> or <code>PITCH_A</code> point to - those continue controlling the deck specified in their own 
                    <code>chann=</code> attribute.
                  </p>
                </div>
              </div>
              
              <p style="margin-bottom: 10px;"><strong>2. Create duplicate mappings:</strong></p>
              <p style="margin-left: 20px; margin-bottom: 15px;">
                You could create <strong>duplicate sets of controls</strong> mapped to different channels and use conditions to 
                activate/deactivate groups. For example:
              </p>
              <ul style="margin-left: 40px; margin-bottom: 15px;">
                <li>Set A: All controls mapped to channel 1</li>
                <li>Set B: The same controls mapped to channel 3</li>
                <li>Use a condition to activate one or the other set</li>
              </ul>
              <p style="margin-left: 20px; margin-bottom: 15px; font-style: italic;">
                ⚠️ This would be very complex and would require duplicating all controls, plus conditions don't work 
                exactly like that (they only affect individual actions, not groups of mappings).
              </p>

              <p style="margin-bottom: 10px;"><strong>3. Use multiple .djm files:</strong></p>
              <p style="margin-left: 20px; margin-bottom: 15px;">
                You could create <strong>two different .djm files</strong> (one with controls to deck 1, another to deck 3) and switch 
                between them manually in DJUCED. It's not automatic with a button, but it's the most practical solution.
              </p>
            </div>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #2a2a2a; border-left: 4px solid #2196F3; border-radius: 4px;">
            <h5 style="margin-top: 0; margin-bottom: 10px;">Conclusion:</h5>
            <p style="margin-bottom: 10px;">
              <strong>It's not possible</strong> to dynamically change all mappings from one deck to another with a single button using 
              DJUCED's standard mapping system. The channel is fixed in each mapping.
            </p>
            <p style="margin-bottom: 0;">
              The best alternative is to create <strong>separate .djm files</strong> for different deck configurations, 
              or use the <code>select</code> action if DJUCED supports some operation mode based on deck selection 
              (this would depend on DJUCED's specific implementation).
            </p>
          </div>
        </div>

        <div class="instruction-section">
          <h4>Troubleshooting</h4>
          <ul>
            <li><strong>Device not detected:</strong> Make sure it's connected and turned on. Restart the application if necessary.</li>
            <li><strong>Commands not captured:</strong> Verify that the device is connected correctly and that you've clicked "Record"</li>
            <li><strong>Mappings don't work:</strong> Check that DJUCED is configured to use the correct .djm file</li>
            <li><strong>Errors when saving:</strong> Make sure you have write permissions in the selected folder</li>
          </ul>
        </div>
      </div>
    `;
  }
}
