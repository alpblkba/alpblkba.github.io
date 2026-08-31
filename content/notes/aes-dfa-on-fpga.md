+++
title = "Fault Injection and DFA on an FPGA AES Core"
date = 2026-07-29

[extra]
display_date = "29-07-2026"
tag = "aes"
list_title = "Fault injection and differential fault analysis (DFA) on AES"
source = "https://github.com/alpblkba/hardware-security/tree/main/task4-dfa"
+++
  <p>
  I built a differential fault analysis (DFA) collection setup against an
  AES-128 core on a Lattice iCE40HX8K. It collected eight correct and faulty
  ciphertext pairs in the shape required by a Piret-Quisquater key recovery.
  The setup used 4800 on-chip ring oscillators to create voltage sags large
  enough to violate the AES critical path. I did not run the key recovery,
  so the deliverable is the validated fault set and its usability criteria.
  </p>

  <h2>Hardware setup and threat model</h2>

  <p>
  A fault attack pushes a circuit outside its safe operating conditions so
  that one computation fails in a controlled way. Nothing here breaks AES
  at the algorithmic level. The attacker instead recovers information from
  the incorrect result. On this board, the victim's own neighbour in the
  FPGA fabric generates the disturbance. This matches the threat model for
  shared and cloud FPGAs, where two tenants are isolated in logic but share
  one power distribution network. The usual disturbances are clock or
  supply glitches; this design targets the supply with ring oscillators.
  </p>

  <table>
  <tbody>
  <tr><th>Target</th><td>AES-128, fault at the round-9 input</td></tr>
  <tr><th>Platform</th><td>Lattice iCE40HX8K</td></tr>
  <tr><th>Fault source</th><td>4800 on-chip ring oscillators</td></tr>
  <tr><th>Deliverable</th><td>correct and faulty ciphertext pairs for DFA</td></tr>
  </tbody>
  </table>

  <h2>Ring oscillators as a fault source</h2>

  <p>
  A ring oscillator is an inverting gate wired back to its own input, so it
  never settles. It switches as fast as the silicon allows and draws current
  on every transition. The design places 4800 oscillators on the die. An
  8-bit mask gates the array, with each bit enabling a group of 600.
  </p>

  <p>
  Enabling the grid creates a sudden current demand on the shared supply,
  which causes an <a href="https://www.ema-eda.com/ema-resources/blog/investigating-ir-drop-understanding-impacts-and-optimization-strategies/">IR drop</a> and briefly sags the rail. Gate delay grows as
  the supply voltage falls, stretching the AES critical path. If the path
  no longer settles within the 60 MHz clock period, a flip-flop captures an
  unfinished value and introduces an incorrect byte into the AES state.
  The aim is a timing fault in one byte, rather than corruption across a
  whole round.
  In the lab's <code>top_level.v</code>, the timing variation comes from the
  toggle counter <code>cycles_ctr</code>. The <code>cycles_ctr</code> counter does
  not reset between encryptions. It freezes while injection is off, then
  resumes from its previous value, so the sag lands at a different point in
  each encryption. I therefore ran many encryptions and filtered the results
  for the required fault shape. The attack is statistical because I could
  control the injector settings, but not the exact byte affected in each run.
  </p>

  <h2>The useful fault shape</h2>

  <p>
  AES-128 runs ten rounds, and round 10 omits MixColumns. A single wrong
  byte at the input of round 9 stays one byte through SubBytes and
  ShiftRows. MixColumns then spreads it across all four bytes in one
  column. Since round 10 has no MixColumns, ShiftRows only permutes those
  four bytes into fixed ciphertext positions. A usable fault therefore
  changes exactly four ciphertext bytes on one diagonal. There are four
  diagonals, one for each round-9 column.
  </p>
  <figure>
  <img
  src=/assets/notes/aes-dfa-on-fpga/fault-groups.png
  alt="The four DFA fault groups, each a diagonal of the ciphertext state matrix"
  loading="lazy"
  />
  <figcaption>
  The four fault groups. A single-byte fault at the round-9 input diffuses through MixColumns into one output diagonal.
  </figcaption>
  </figure>

  <p>
  I computed the four groups from the ShiftRows permutation in the AES
  core's own <code>shiftrows.v</code> rather than hardcoding byte positions.
  This keeps the classifier tied to the implementation's byte ordering:
  </p>

  <pre><code># ShiftRows forward map (input byte index -&gt; output byte index), from shiftrows.v
_SR = {0: 0, 4: 4, 8: 8, 12: 12,
       5: 1, 9: 5, 13: 9, 1: 13,
       10: 2, 14: 6, 2: 10, 6: 14,
       15: 3, 3: 7, 7: 11, 11: 15}

GROUPS = [tuple(sorted(_SR[4 * c + r] for r in range(4))) for c in range(4)]
# -&gt; [(0,7,10,13), (1,4,11,14), (2,5,8,15), (3,6,9,12)]
_POS_TO_GROUP = {pos: gi for gi, g in enumerate(GROUPS) for pos in g}</code></pre>

  <p>
  For one group, the recovery guesses its four last-round key bytes and
  undoes the last round on both ciphertexts. It only needs the state where
  the fault was still one byte wide, since that is where the difference has
  a shape that can be tested. A correct guess produces a difference that
  could come from a single-byte MixColumns input, while wrong guesses fail
  that test. One fault narrows the four bytes to a small candidate set, and
  a second fault in the same group makes them unique. Two faults for each
  of the four groups, plus one correct ciphertext, yield the full last-round
  key. I therefore set the collection target at eight usable faults.
  </p>

  <h2>The classifier and its baseline</h2>

  <p>
  Not every incorrect ciphertext is useful, so the host software classifies
  each result against its fault-free ciphertext. It finds the changed bytes
  and checks which diagonal they occupy. An unchanged result is clean.
  Exactly four changes on one diagonal are usable. One to three changes on
  one diagonal are partial, which indicates a round-10 fault. Changes across
  several diagonals are spread, which indicates a fault before round 9. I
  discarded partial and spread results because the collection target
  required the four-byte round-9 pattern.
  </p>

  <pre><code>def classify_fault(correct, faulty):
    """
    "clean"    -- identical ciphertext, no fault
    "usable"   -- exactly 4 bytes differ, all inside one diagonal group
                  (a single-byte round-9 fault; this is what I needed for a DFA)
    "partial"  -- 1..3 bytes differ, all inside one group (a late round 10 fault; the weaker 1-byte-key model, not the standard one)
    "spread"   -- differing bytes span more than one group (fault earlier than round 9, or multiple faults; not usable)
    """
    diff = diff_positions(correct, faulty)
    if not diff:
        return "clean", None

    groups_hit = {_POS_TO_GROUP[i] for i in diff}
    if len(groups_hit) != 1:
        return "spread", None

    group = groups_hit.pop()
    return ("usable" if len(diff) == 4 else "partial"), group</code></pre>

  <p>
  I validated the classifier against a software AES before trusting board
  output. I first injected single-byte faults at the round-9 input. The
  classifier marked every result usable and assigned the correct group,
  with zero misclassifications over 3200 trials. I then injected round-8
  faults. It rejected all of them as spread, with zero false positives.
  Only after those checks did I use it on faulty ciphertexts from the board.
  </p>

  <h2>Calibration</h2>

  <p>
  The injector has three settings: active oscillator count, toggle period,
  and active duty cycle. The duty cycle is the fraction of each period for
  which the grid stays active. The working configuration depends on the
  physical board, so the calibration tool sweeps these settings. For each
  configuration, it encrypts a batch of random plaintexts and counts the
  classifier's verdicts.
  </p>

  <p>
  The useful region was narrow. Too little energy produced no faults. Too
  much energy faulted almost every encryption, but the changes spread across
  several diagonals and became unusable. The single-byte faults appeared in
  a band where 10 to 40 percent of encryptions failed.
  </p>
  <figure>
  <img
  src=/assets/notes/aes-dfa-on-fpga/calibration-sweep.png
  alt="Fault outcome composition against injection intensity, showing usable faults only in a narrow band"
  loading="lazy"
  />
  <figcaption>
  Outcome composition as injection intensity rises. Usable single-byte
  faults appear only in the shaded 10 to 40 percent band. Beyond it,
  spreads take over.
  </figcaption>
  </figure>

  <p>
  Reducing the active oscillator count below 4800 did not lower the fault
  rate gradually. On this board, the rate dropped to zero. I settled on the
  full grid, a short toggle period, and a 60 percent duty cycle.
  </p>

  <h2>Board-specific failures</h2>

  <p>
  The FIPS-197 known-answer test initially returned a repeating 32-bit
  garbage word instead of the expected ciphertext. The provided bitstream
  closed timing at 59.25 MHz, below the 60 MHz target, and my board's
  silicon was slightly slower. I rebuilt the same source with the correct
  toolchain and reached 62 MHz. The known-answer test then passed:
  </p>

  <pre><code>Plaintext:  3243f6a8885a308d313198a2e0370734
Ciphertext: 3925841d02dc09fbdc118597196a0b32</code></pre>

  <p>
  I used one strict rule after that failure: the known-answer test had to
  pass before collection. If the board did not return the FIPS vector, I
  treated every collected result as untrustworthy.
  </p>

  <p>
  Newer Yosys versions synthesized each oscillator as two lookup tables
  instead of one. At two LUTs per oscillator, the 4800-oscillator design
  reached 154 percent utilization and failed place-and-route. The
  <code>keep</code> attribute on the feedback wire had pinned an intermediate
  net. I rewrote the oscillator as a single NAND gate so the kept net was
  the loop node. The oscillator then used one LUT again, and the design fit
  at 91 percent utilization:
  </p>

  <pre><code>module ringosc( enable, out );
        input enable;
        output out;
        (* keep *) wire A /* synthesis syn_keep=1 keep=1 */;
        // original: two LUTs per RO on yosys &gt;= 0.6, 154% utilization, P&amp;R fails
        //   assign A = ~A &amp;&amp; enable;
        // fixed: one SB_LUT4 (NAND, INIT=0x0FFF) per RO on both toolchains.
        // Only the disabled steady level differs (1 instead of 0), which is
        // irrelevant to the fault attack.
        assign A = ~(A &amp;&amp; enable);
        assign out = A;
    endmodule</code></pre>

  <h2>Fault collection set</h2>

  <p>
  The collection script encrypted random plaintexts, kept usable faults,
  and stopped when every diagonal had two. One run filled all four groups
  with eight usable faults in 1100 attempts, taking about one minute. Each
  pair recorded the plaintext, fault-free ciphertext, faulty ciphertext,
  and altered byte positions.
  </p>

  <p>
  I verified every collected pair against a software AES. The fault-free
  ciphertexts matched exactly, and each faulty ciphertext differed in the
  four positions of its group. Those checks made the set internally
  consistent with the input required by a Piret-Quisquater key recovery.
  </p>

  <p>
  The working parameters were mask 0xff, cycles 8, and activecycles 5.
  With those settings, a collection run filled all four groups in roughly
  550 to 1100 attempts, or about one minute of wall-clock time. The script
  kept only usable faults and stopped once every diagonal had two, while
  retaining both ciphertexts, the plaintext, and the altered positions.
  </p>

  <p>
  Finding the board took longer than it should have. The iCE40-HX8K
  breakout exposes an FTDI bridge, but on macOS
  <code>/dev/cu.Bluetooth-Incoming-Port</code> also matches a
  <code>/dev/cu.*</code> prefix and may be selected first. I changed the port
  lookup to match the USB vendor id rather than the device name. RTS is
  wired to <code>rstin</code>, which is active low, so
  <code>setRTS(True)</code> asserts reset. Swapping the two RTS calls holds
  the FPGA in reset, and every read times out without an error message:
  </p>

  <pre><code>def reset(self):
    # RTS is wired to rstin (active low): setRTS(True) drives the pin low =
    # reset asserted. Do not swap these or the FPGA stays held in reset.
    self.ser.setRTS(True)
    time.sleep(0.001)
    self.ser.setRTS(False)
    time.sleep(0.001)
    self.ser.reset_input_buffer()
    self.ser.reset_output_buffer()</code></pre>


  <p>
  After the final collection, I repeated the software AES check on every
  pair. The fault-free ciphertexts still matched exactly, and each faulty
  ciphertext changed precisely the four positions of its group. I did not
  run the recovery itself, but the set has the required Piret-Quisquater
  fault structure.
  </p>


  <h2>Limits</h2>

  <p>
  The yield of usable faults was low, and I do not have one clean number
  for it. The collection run gives about 0.7 percent, with eight faults in
  roughly 1100 attempts. The committed calibration CSV gives 12 percent
  usable at the same operating point. The sweep used for the figure gives
  2 percent usable, while the two reported total fault rates are 28 and 19
  percent.
  These runs happened on separate days, and I did not repeat them enough to
  decide which value is representative. The yield stayed in the low single
  digits in collection and varied between sessions more than I expected.
  </p>

  <p>
  The calibration parameters are specific to this board and need to be
  measured again on another device. I also did not run the key recovery.
  The claim that the set is sufficient rests on its validated fault
  structure, not on a recovered key, so I have kept that limit attached to
  every recovery claim in this note.
  </p>


  <h2>References and implementation</h2>
  <ul>
  <li>
  J. Krautter, D. R. Gnad, M. B. Tahoori, <em>FPGAhammer: Remote
  Voltage Fault Attacks on Shared FPGAs, suitable for DFA on AES</em>,
  TCHES 2018.
  </li>
  <li>
  G. Piret, JJ. Quisquater, <em>A Differential Fault Attack Technique
  against SPN Structures, with Application to the AES and Khazad</em>,
  CHES 2003.
  </li>
  <li>
  E. Biham, A. Shamir, <em>Differential Fault Analysis of Secret Key
  Cryptosystems</em>, CRYPTO 1997.
  </li>
  <li>NIST, <em>FIPS PUB 197: Advanced Encryption Standard (AES)</em>.</li>
  <li>
  <a
  href="https://github.com/alpblkba/hardware-security/tree/main/task4-dfa"
  target="_blank"
  rel="noreferrer"
  >
  FPGA control software, fault classifier, and calibration tooling
  </a>
  </li>
  </ul>
