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
  I built a differential fault analysis (DFA) collection setup against an AES-128 core on a Lattice iCE40HX8K, in the exact shape of a Piret-Quisquater key recovery needs with eight correct and faulty pairs. The setup uses 4800 on-chip ring oscillators on the same die as the victim to inject timing faults through voltage sags that supply hard enough to break AES critical path. I did not run the key recovery itself and instead the deliverable is the fault set and which faults are usable. 
  </p>

  <h2>Hardware setup and threat model</h2>

  <p>
  A fault attack pushes the circuit outside its safe operating conditions so that one computation goes wrong in a controlled way however nothing here breaks AES at the algorithmic level. The attacker then reads the secret back out of the wrong result. On this board, the disturbance is generated on-chip by the victim's own neighbour in the FPGA fabric. This matches the threat model behind shared and cloud FPGAs, where two tenants are isolated in logic but share one power distribution network. In this case, the ring oscillators are targeted and a usual disturbance is usually a glitch on the clock or supply.
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
  A ring oscillator is a single inverting gate wired back to its own input and never settles. It flips as fast as the silicon allows and draws switching current on every transition. The design places 4800 of them on the die and a 8-bit mask gates the array, with each mask bit enabling groups of 600 oscillators.
  </p>

  <p>
  Switching the grid on pulls a sudden current from the shared supply (oscillators), which sags the rail for a moment. Gate delay grows as the supply voltage drops, exactly called an <a href="https://www.ema-eda.com/ema-resources/blog/investigating-ir-drop-understanding-impacts-and-optimization-strategies/">IR drop</a> for details. This sag stretches the AES critical path. When the path no longer settles inside the 60 MHz clock period, a flip flop latches an unfinished value, entering a wrong byte into the AES state. The toggle counter free-runs, making the sag land at a different point in every encryption. This creates a timing fault and only aimed a single byte instead of a round. The idea is that, I ran many encryptions and filter the outputs for the required fault shape. In the provided <code>top_level.v</code> from lab, the randomness comes from one detail, which is the toggle counter <code>cycles_ctr</code>. Toggle counter <code>cycles_ctr</code> does never reset between each encryption, and only freezes while injection is off and resumes from wherever it stopped. Therefore sag lands at a different point in every encryption. A hardware attack like this is statistical since you need to run many encryptions and filter the outputs for the fault shape I want.
  </p>

  <h2>The useful fault shape</h2>

  <p>
  AES-128 runs ten rounds and the tenth round omits the MixColumns operation. Take a single wrong byte at the input of round 9. SubBytes and ShiftRows keep it a single byte. MixColumns then spreads that byte across all four bytes of its column however because round 10 has no MixColumns, those four bytes are only permuted with ShiftRows into four fixed ciphertext positions. A usable fault shows up as exactly four altered ciphertext bytes on one diagonal where there are four diagonals, one for each round 9th column.
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
  I did not hardcode any byte positions and computed the four groups from the ShiftRows permutation in the AES' own <code>shiftrows.v</code>. They stay correct if the byte ordering ever changes:
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
  For one group I guessed its four last-round key bytes. I undid the last round on both the correct and the faulty ciphertext, then tested whether the difference could have come from a single-byte MixColumns input. Wrong guesses failed the test and One fault narrowed those four key bytes to a small candidate set and a second fault in the same group made them unique. Four groups with two faults each, plus one correct ciphertext, yields to the full last-round key. The collection target was two usable faults per group, and eight in total.
  </p>

  <h2>The classifier and its baseline</h2>

  <p>
  The host software includes a classifier that sorts each result because not every wrong ciphertext is a usable fault, and a classifier compares the faulty ciphertext against the fault-free one, reads which bytes changed, and decides which diagonal they fall on. It labels the outcome clean when nothing changed and it labels the outcome usable when exactly four bytes on one diagonal changed. A partial label means one to three bytes on one diagonal changed, indicating a round 10 fault. A spread label means the changes crossed more than one diagonal, indicating the fault happened before round 9. I discarded partial and spread faults as my goal was to create a "correct fault". 
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
  I validated the classifier against a software AES before trusting it on hardware. I injected single-byte faults at the round 9 input in software. The classifier flagged every one as usable with the correct group, with zero misclassifications over 3200 trials. Then I injected round 8 faults. It rejected all of them as spread, with zero false positives. Only then the faulty ciphertexts from the board made sense.
  </p>

  <h2>calibration</h2>

  <p>
  The injector has three settings: active oscillator count for how many oscillators to enable, toggle period, and active duty cycle which's the fraction of that period for grid to be stay active. The correct configuration depends on the physical board. The calibration tool sweeps the settings, fires a batch of encryptions with random plaintexts for each configuration, and counts the classifier's verdicts.
  </p>

  <p>
  The useful region is a thin ridge. Too little energy produces no faults. Too much energy faults almost every encryption, but the faults spread across several diagonals and are useless. The single-byte faults occur in a narrow band where 10 to 40 percent of encryptions fail.
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
  Reducing the number of active oscillators below 4800 did not lower the fault rate gradually. On this board, it dropped to zero. The working point I settled on used the full grid, a short toggle period, and a 60 percent duty cycle.
  </p>

  <h2>Board-specific failures</h2>

  <p>
  The FIPS-197 known-answer test returned a repeating 32-bit garbage word instead of the expected ciphertext. The provided bitstream closed timing at 59.25 MHz, under the 60 MHz target, and my board's silicon was slightly slower. Rebuilding from the same source with the correct toolchain closed timing at 62 MHz. The known-answer test then passed:
  </p>

  <pre><code>Plaintext:  3243f6a8885a308d313198a2e0370734
Ciphertext: 3925841d02dc09fbdc118597196a0b32</code></pre>

  <p>
  I applied a strict rule for the remaining work. The known-answer test must pass first. If it does not return the FIPS vector, no collected data is trustworthy.
  </p>

  <p>
  Newer Yosys versions synthesized each oscillator as two lookup tables instead of one. Placing 4800 oscillators at two LUTs each overflowed the device, failing place-and-route at 154 percent utilization. The cause was the <code>keep</code> attribute on the feedback wire pinning an intermediate net. I rewrote the oscillator as a single NAND gate so the kept net was the loop node. This folded the oscillator back to one LUT and fit the design at 91 percent utilization:
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
  The collection script encrypted random plaintexts, kept the usable faults, and stopped once every diagonal had two. One run filled all four groups with eight usable faults in 1100 attempts, taking about one minute. Each pair recorded the plaintext, the fault-free ciphertext, the faulty ciphertext, and the altered byte positions.
  </p>

  <p>
  I verified every collected pair against a software AES. The fault-free ciphertexts matched exactly. Each faulty ciphertext differed in precisely the four positions of its group. The set is internally consistent and sufficient for a Piret-Quisquater key recovery.
  </p>

  <p>
  With a working bitstream and a calibrated operating point, collection is simple. Encrypt random plaintexts at mask 0xff, cycles 8, activecycles 5, keep only the usable faults, and stop once every diagonal has two. One run filled all four groups in roughly 550 to 1100 attempts, about a minute of wall-clock time. Each kept pair records the plaintext, the fault-free ciphertext, the faulty ciphertext, and the altered byte positions.
  </p>

  <p>
  Finding the board took longer than it should have. The iCE40-HX8K breakout exposes an FTDI bridge, and on macOS <code>/dev/cu.Bluetooth-Incoming-Port</code> also matches a <code>/dev/cu.*</code> prefix and gets picked first, so the port lookup matches on the USB vendor id instead of the device name. RTS is wired to <code>rstin</code>, which is active low, so <code>setRTS(True)</code> asserts reset. Swapping those two lines holds the FPGA in reset and every read times out with no error message:
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
  As a last check I re-verified every collected pair against a software AES. The fault-free ciphertexts matched exactly, and each faulty ciphertext differed in precisely the four positions of its group. The set is internally consistent andsufficient for a Piret-Quisquater key recovery.
  </p>


  <h2>Limits</h2>

  <p>
  The yield of usable faults is low and I do not have one clean number for it. The collection run gives about 0.7 percent, eight faults in roughly 1100 attempts. The committed calibration CSV gives 12 percent usable at the same operating point and the sweep used for the figure gives 2 percent, with a fault rate of 28 versus 19 percent. Those are separate runs on separate days and I did not repeat them enough to say which is representative. The honest statement is that the yield is somewhere in the low single digits and varies more between sessions than I expected.
  </p>

  <p>
  The calibration parameters are specific to this board and would need remeasuring on another. I also did not run the key recovery. Reporting a validated fault set is more honest than presenting a half-finished recovery, but it does mean the last claim in this note, that the set is sufficient, rests on the structure of the fault pattern rather than on a recovered key.
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
