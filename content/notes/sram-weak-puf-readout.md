+++
title = "SRAM Weak PUF Readout on iCE40"
date = 2026-06-07

[extra]
display_date = "07-06-2026"
tag = "puf"
list_title = "SRAM Weak PUF Readout on iCE40"
+++
  <p>
  I read an SRAM PUF response from a Lattice iCE40 board for the first task
  in a hardware security course. I expected to spend most of the time on
  security, but the work went into proving that the response was real.
  Before I could discuss any security property, I had to make sure every
  byte left the FPGA and reached the PC without the measurement pipeline
  inventing an artifact.
  </p>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/lattice_iCE40HX8K.jpg alt="Lattice iCE40HX8K board used for the weak SRAM PUF task" />
  <figcaption>The Lattice iCE40HX8K board used for the weak SRAM PUF readout.</figcaption>
  </figure>

  <p>
  A physical unclonable function, or PUF, derives a device-specific response
  from manufacturing variations already present inside the chip. The value
  comes from the physical device rather than non-volatile memory that stores
  a fixed secret.
  </p>

  <p>
  Two chips made from the same design still differ slightly at the physical
  level. A PUF tries to turn those differences into a reproducible digital
  fingerprint.
  </p>

  <h2>What a weak PUF is</h2>

  <p>
  A weak PUF exposes one or a small number of challenge-response pairs. This
  makes it useful as a device fingerprint: power up the device, read the
  response, and use it to identify or characterize that physical instance.
  </p>

  <p>
  A strong PUF instead supports a large challenge-response space. I was not
  building an authentication protocol in this task. I first needed to learn
  whether I could read a hardware-derived startup pattern reliably, then
  analyse whether it behaved like a useful fingerprint.
  </p>

  <h2>Why SRAM</h2>

  <p>
  SRAM cells are built from cross-coupled inverters. Ideally, an uninitialized
  cell could power up as either 0 or 1. In real silicon, tiny mismatches between
  transistors make some cells slightly prefer one state over the other.
  </p>

  <p>
  A cell that tends to power up to the same value across repeated cycles can
  contribute to a device-specific response. A cell that changes randomly is
  less useful for identification, although it still describes the physical
  behaviour of the memory.
  </p>

  <h2>SRAM, BRAM, and the FPGA detail</h2>

  <p>
  In a microcontroller or processor, SRAM usually means general on-chip static
  memory. On an FPGA, the name can be confusing because the fabric exposes
  embedded block memories, or BRAMs.
  </p>

  <p>
  The naming difference did not affect the measurement. What mattered was
  that the memory had a power-up state before the design intentionally
  overwrote it. The readout circuit had to capture that state and stream it
  to the host before I treated the data as a PUF response.
  </p>

  <h2>What this task does</h2>

  <p>
  The implementation reads startup memory on a Lattice iCE40 FPGA, sends the
  raw response to a PC over UART, and analyses data collected across repeated
  power cycles.
  </p>

  <p>
  The analysis covers the usual first-order PUF metrics: uniformity,
  bit-aliasing, uniqueness, and reliability. Those metrics only mean
  something if the readout path is trustworthy. A broken UART transfer or
  an off-by-one address bug can look like a bad PUF even when the physical
  source behaves correctly.
  </p>

  <p>
  During bring-up, I recorded each UART and FSM failure beside the PUF
  measurement it affected. That made the boundary clear: the startup value
  came from the memory, while the address logic and transport decided whether
  I ever observed that value correctly.
  </p>

  <h2>Setup</h2>

  <p>
  The task collected SRAM startup data from the FPGA and sent it to the
  host. The circuit was small, but the measurement crossed state transitions,
  counters, UART handshakes, and host-side validation.
  </p>

  <h2>Build workflow</h2>

  <p>
  Before taking measurements, I made the design build, flash, and run in a
  repeatable way. I initially treated the process as "compile the Verilog and
  flash the bitstream." After repeating the same Yosys, nextpnr, icepack, and
  programmer commands, I moved them into a small Makefile to avoid copy-paste
  mistakes while debugging.
  </p>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/build.jpg alt="FPGA build output for the PUF task" />
  <figcaption>Build output after synthesizing the PUF readout design.</figcaption>
  </figure>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/alp-makefile.jpg alt="Makefile workflow for the FPGA PUF task" />
  <figcaption>The Makefile used for the build and flashing loop.</figcaption>
  </figure>

  <h2>Trusting the measurement</h2>

  <p>
  Turning the FPGA into a measurement instrument took more work than the
  PUF concept itself. Until I verified the readout path, every PUF metric
  remained suspect.
  </p>

  <p>
  Before analysing uniqueness, stability, entropy, or security properties,
  I had to answer a narrower question: was I receiving the bytes that the
  FPGA intended to send?
  </p>

  <p>
  The data path crossed FPGA memory, read address generation, byte
  selection, UART transmission, host-side capture, and Python analysis.
  I checked each boundary before using the final data.
  </p>

  <h2>Readout pipeline</h2>

  <p>
  The design follows a small FSM. It waits for a command from the host,
  decides whether this is a normal PUF readout or a diagnostic request,
  reads memory words, selects the correct byte, hands that byte to the UART
  transmitter, waits until the transmitter really finished, and then moves
  to the next byte.
  </p>

  <p>
  The PC only sees a serial byte stream. The FPGA has to
  maintain the current byte index, derive the RAM address, select the low
  or high byte of a 16-bit word, and avoid sending the same byte twice.
  </p>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/registers.jpg alt="Registers used inside the PUF readout module" />
  <figcaption>The internal registers made the readout state explicit.</figcaption>
  </figure>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/byte_index_to_raddr.jpg alt="Byte index to SRAM read address mapping" />
  <figcaption>The byte index mapped to the SRAM read address.</figcaption>
  </figure>

  <h2>Debugging the readout path</h2>

  <p>
  I added a diagnostic mode that did not depend on the RAM contents. It
  returned a known pattern, which let me debug the transport path before
  blaming the PUF data.
  </p>

  <p>
  Normal PUF output is hard to debug at first because it is supposed to look
  somewhat random. If the output is strange, it is not immediately obvious
  whether the problem comes from the PUF source, the address mapping, the UART
  transmitter, or the host-side capture script.
  </p>

  <p>
  To separate these problems, I added a debug request path. Instead of
  reading SRAM data, the FPGA could send a known byte pattern. This reduced
  the problem to a much simpler question:
  </p>

  <pre><code>if I ask the FPGA to send known bytes, do I receive exactly those bytes?</code></pre>

  <p>
  The expected diagnostic marker was:
  </p>

  <pre><code>44 42</code></pre>

  <p>
  which is ASCII for:
  </p>

  <pre><code>D B</code></pre>

  <p>
  At one point, however, the PC was receiving:
  </p>

  <pre><code>44 44 42 42</code></pre>

  <p>
  These bytes were constants generated by the debug case statement, so the
  duplicated values could not come from SRAM/BRAM. The fault had to be in
  the transmit path.
  </p>

  <p>
  At that point I had no evidence of a PUF problem. I first had to prove
  that the measurement infrastructure was not creating the duplicated
  bytes.
  </p>

  <p>
  The UART module exposes a small ready/enable style interface. The PUF
  controller presents one byte on <code>uart_data_to_tx</code>, then asserts
  <code>uart_tx_enable</code> for one clock cycle when the transmitter is ready.
  </p>

  <p>
  There is one timing trap in that interface: seeing
  <code>uart_tx_ready</code> high does not necessarily mean that the byte you
  just requested has already been transmitted. It may still be high from before
  the transmission started.
  </p>

  <p>
  During bring-up, the FSM treated this immediately-high ready signal as if the
  transfer had already completed. The result was that the same byte could be
  accepted twice, which showed up as paired bytes in the debug stream.
  </p>

  <p>
  The fix was to make the transmit pulse registered and explicit, and then wait
  for the UART transmitter to actually become busy before accepting completion.
  The final sequence became:
  </p>

  <ol>
  <li>wait until <code>uart_tx_ready</code> is high;</li>
  <li>place the next byte on <code>uart_data_to_tx</code>;</li>
  <li>assert <code>uart_tx_enable</code> for exactly one clock;</li>
  <li>enter a wait state;</li>
  <li>observe <code>uart_tx_ready</code> going low;</li>
  <li>only then wait for <code>uart_tx_ready</code> to return high;</li>
  <li>increment the byte index and continue.</li>
  </ol>

  <p>
  The <code>uart_seen_busy</code> register prevents the FSM from confusing
  "the transmitter was already ready" with "the byte has finished
  transmitting."
  </p>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/puf_uart_handshake.jpg alt="UART handshake logic for the PUF readout" />
  <figcaption>
  The important part was waiting for ready-high, then confirming
  that the transmitter actually entered the busy phase.
  </figcaption>
  </figure>

  <h2>How the PC reads the response</h2>

  <p>
  The PC does not directly read individual PUF bits from the FPGA. It talks to
  the FPGA through a serial UART link.
  </p>

  <p>
  The host script sends a one-byte command such as <code>s</code> for a normal
  SRAM PUF readout or <code>d</code> for diagnostic mode. After receiving the
  command, the FPGA starts streaming bytes back over UART.
  </p>

  <p>
  The full readout is:
  </p>

  <pre><code>16 KiB = 16384 bytes = 131072 bits</code></pre>

  <p>
  On the host side, the capture script collects these bytes and writes them as
  hexadecimal text. The final file shape is:
  </p>

  <pre><code>512 lines × 64 hex characters</code></pre>

  <p>
  Each line is then interpreted as one 256-bit response block. That format
  made the later analysis easier: the same bit position can be compared
  across repeated power cycles for reliability, while the bit distribution
  inside a response can be used for uniformity-style checks.
  </p>

  <p>
  The capture script is therefore part of the measurement infrastructure.
  If it silently receives fewer bytes, repeats stale data, or writes malformed
  lines, the statistical analysis becomes meaningless.
  </p>

  <h2>From raw bytes to PUF metrics</h2>

  <p>
  After the UART path started behaving, the task became more like a data
  analysis problem. The capture script produced hexadecimal readout files.
  I converted those hex strings back into bit vectors and then computed the
  first-order PUF metrics from those vectors.
  </p>

  <p>
  Uniformity checks whether a response has a balanced number of zeros and
  ones. For each captured response, I counted the number of one bits and
  divided it by the response length. A perfectly balanced response would be
  close to 50%. If the value is far away from that, the memory startup
  pattern is biased toward either zero or one.
  </p>

  <pre><code>uniformity = number_of_ones / number_of_bits</code></pre>

  <p>
  Bit-aliasing looks at the same idea from the bit-position side. For a
  given bit position, I checked how often that bit was one across multiple
  captured responses. If every bit position behaves independently and
  without global bias, these values should also be around 50% on average.
  </p>

  <pre><code>bit_aliasing[i] = number_of_responses_where_bit_i_is_1 / number_of_responses</code></pre>

  <p>
  Reliability is about stability across repeated measurements. For this,
  I compared responses captured after repeated power cycles and counted how
  many bit positions changed. A reliable PUF response should not flip too
  much between repeated readouts of the same device.
  </p>

  <p>
  The Python analysis was not complicated, but it only became meaningful
  after the FPGA readout path returned the expected diagnostic bytes every
  time.
  </p>

  <h2>Small Verilog lessons from this task</h2>

  <p>
  The Verilog part looked small, but it forced a few useful habits.
  </p>

  <p>
  I made transmit pulses explicit. I cleared
  <code>uart_tx_enable</code> by default on every clock and asserted it only in
  the state that intentionally sends a byte. This avoids accidentally holding a
  send request high for multiple cycles.
  </p>

  <p>
  The byte index and RAM address are different concepts. The RAM returns
  16-bit words, while UART sends 8-bit bytes. The controller therefore uses a
  byte index for the outgoing stream and derives the RAM word address from it:
  </p>

  <pre><code>raddr = i_r[13:1]</code></pre>

  <p>
  The lowest bit selects which half of the 16-bit word is sent:
  </p>

  <pre><code>i_r[0] = 0  -&gt;  rdata[7:0]
i_r[0] = 1  -&gt;  rdata[15:8]</code></pre>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/byte_index_to_raddr.jpg alt="Byte index to SRAM read address mapping" />
  <figcaption>
  The readout is byte-oriented from the UART perspective, but word-oriented
  from the RAM perspective.
  </figcaption>
  </figure>

  <p>
  Debug output should not depend on the thing being debugged. The
  diagnostic stream was useful precisely because it bypassed the PUF data path
  and sent known constants. That made it possible to isolate the UART/FSM issue
  before trusting the SRAM readout.
  </p>

  <p>
  Before measuring the physical effect, I needed enough independent checks
  to show that the pipeline was not inventing artifacts. The diagnostic
  stream provided that check for the UART and FSM path.
  </p>

  <h2>Measurements</h2>

  <p>
  Once the readout path became reliable, I collected repeated measurements
  and analysed the PUF response itself.
  </p>
  <figure>
  <img src=/assets/notes/sram-weak-puf-readout/measurements.jpg alt="Measurements collected from the weak SRAM PUF readout" />
  <figcaption>Repeatable measurements after the UART path worked.</figcaption>
  </figure>

  <h2>Where the effort went</h2>

  <p>
  In this task, hardware security depended more on bring-up and measurement
  engineering than I expected. Most of the effort went into digital design,
  UART communication, host-side capture, verification, and small debugging
  loops.
  </p>

  <p>
  The PUF idea had to pass through a real hardware data path before it
  became a plot or metric. I could not separate the security claim from
  the measurement path that produced its data.
  </p>

  <h2>Next steps</h2>

  <p>
  I still need to analyse stability across resets and uniqueness across
  devices, if I can access more than one. I also do not yet know how much
  post-processing the response would need before it could serve as a
  reliable fingerprint.
  </p>
