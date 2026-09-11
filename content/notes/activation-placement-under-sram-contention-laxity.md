+++
title = "Activation placement under SRAM contention on STM32U585"
date = 2026-09-11

[extra]
display_date = "11-09-2026"
tag = "laxity"
list_title = "Activation placement under SRAM contention on STM32U585"
source = "https://github.com/alpblkba/laxity"
diagrams = "https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated"
assets = "https://github.com/alpblkba/laxity/raw/HEAD/assets"
+++
  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/STM32U585.jpeg"
  alt="B-U585I-IOT02A development board carrying the STM32U585 used for the Laxity measurements"
  loading="lazy"
  />
  <figcaption>
  The B-U585I-IOT02A used for the measurements. The STM32U585 runs the inference workload,
  while GPDMA and the sensing peripherals provide independent traffic through the on-chip
  memory system.
  </figcaption>
  </figure>

  <p>I measured whether the address of a neural network's activation arena changes its inference time on an STM32U585. With no other bus master active, moving the arena between the three on-chip SRAM regions changed the median by three cycles out of 320,898. With GPDMA traffic active, placement changed the median by as much as 31,189 cycles. Both measurements come from one firmware image, and the telemetry path that records them costs 118 cycles per record outside the measured inference interval.</p>

  <p>The uncontended result is measurable and operationally useless. The contended result reaches 9.7 percent and depends strongly on which SRAM region the competing master uses. SRAM3 also produces a directional cross-region effect: traffic there penalizes inference using SRAM1 and SRAM2 by about 4.7 percent, while traffic in SRAM1 or SRAM2 has almost no reciprocal effect on inference placed in SRAM3. The measurements establish that asymmetry; they do not yet identify the internal arbitration point that causes it.</p>

  <h2>Platform and software stack</h2>

  <p>Laxity is split between a C firmware target and host-side experiment tooling. The embedded side runs on a B-U585I-IOT02A with an STM32U585 Cortex-M33 at 160 MHz. Application code runs under ThreadX and uses the STM32 HAL/BSP around the board peripherals. Neural inference is generated with ST Edge AI Core 4.0.1 from a human-activity-recognition model trained on the WISDM accelerometer dataset. The network's activation arena is 2,944 bytes.</p>

  <p>The host side is deliberately separate from the measurement path. Shell entry points handle toolchain checks, generation, building, flashing, capture, and monitoring. Python is used for telemetry parsing and offline analysis. The interactive monitor is a Rust program built with Ratatui, crossterm, and serialport. The Rust parser follows the same framing, CRC, and resynchronisation rules as the Python parser so live inspection and offline analysis do not become two different interpretations of the capture.</p>

  <table>
  <thead>
  <tr><th>Layer</th><th>Implementation used in Laxity</th></tr>
  </thead>
  <tbody>
  <tr><td>Target firmware</td><td>C on STM32U585, ThreadX, STM32 HAL/BSP</td></tr>
  <tr><td>Inference</td><td>ST Edge AI Core 4.0.1 generated network, 2,944-byte activation arena</td></tr>
  <tr><td>Contention source</td><td>GPDMA1 memory-to-memory traffic through a circular linked list</td></tr>
  <tr><td>Timing and telemetry</td><td>Cortex-M33 DWT cycle counter, fixed 32-byte records, SPSC ring, CRC-framed transport</td></tr>
  <tr><td>Live monitor</td><td>Rust: Ratatui, crossterm, serialport</td></tr>
  <tr><td>Offline analysis</td><td>Python: <code>telemetry_parse.py</code> and <code>analyse.py</code></td></tr>
  <tr><td>Experiment automation</td><td>Shell: <code>doctor.sh</code>, <code>generate.sh</code>, <code>generate-model.sh</code>, <code>build.sh</code>, <code>flash.sh</code>, <code>capture.sh</code>, <code>monitor.sh</code></td></tr>
  <tr><td>Diagrams</td><td>Mermaid sources under <code>docs/diagrams/src</code>, generated SVG committed beside them</td></tr>
  </tbody>
  </table>

  <h2>The live view</h2>

  <p>The TUI is not the source of truth for the experiment; the stored telemetry capture is. The interface is a live or replayed projection of that capture. It shows the selected arena and DMA target, current and rolling cycle counts, the uncontended reference for each placement, CRC and sequence-gap counters, and the board's ASCII recovery log. The same decode path is used for serial, UDP, and file replay.</p>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/laxity-tui.gif"
  alt="Animated Laxity terminal UI replaying telemetry and comparing SRAM placement penalties"
  loading="lazy"
  />
  <figcaption>
  <code>laxity-tui</code> replaying a contention sweep. The display compares each placement against
  its own uncontended median while keeping CRC rejects, sequence gaps, target drops, and the
  raw board log visible.
  </figcaption>
  </figure>

  <h2>System map before the measurements</h2>

  <p>The diagrams below are the shortest way to explain what is being measured. The architecture separates target firmware, host software, and experiment tooling. The experiment flow shows how a run moves from toolchain checks to a persisted telemetry capture. The memory diagram isolates the actual contention question: one Cortex-M33 inference stream and one independent GPDMA requester, each selectable across SRAM1, SRAM2, and SRAM3.</p>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/architecture.svg"
  alt="Laxity architecture across experiment tooling, host software, firmware, and STM32U585 hardware"
  loading="lazy"
  />
  <figcaption>
  Laxity's architecture. Shell tooling builds and programs the target; C firmware owns the
  inference, aggressor, and telemetry path; Python and the Rust TUI consume the captured stream.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/experiment-flow.svg"
  alt="Laxity experiment flow from toolchain checks and model generation to telemetry capture and analysis"
  loading="lazy"
  />
  <figcaption>
  The experiment loop from <code>doctor.sh</code> and model generation through build, flash,
  capture, replay, and analysis. The persisted telemetry file sits between the target and the
  host-side interpretation.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/memory-contention.svg"
  alt="STM32U585 memory contention experiment with a movable activation arena and GPDMA working set"
  loading="lazy"
  />
  <figcaption>
  The measured memory problem. The 2,944-byte activation arena and the DMA working set can be
  placed independently in SRAM1, SRAM2, or SRAM3. The idle placement spread is three cycles;
  same-region SRAM3 contention reaches +31,189 cycles.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/runtime-sequence.svg"
  alt="Runtime sequence for configuring the DMA aggressor, timing inference, recording telemetry, and updating the TUI"
  loading="lazy"
  />
  <figcaption>
  Runtime sequence for one measured cell: configure the aggressor, start independent DMA
  traffic, time inference with the DWT counter, push one record after the measured interval,
  validate it on the host, and update the live view.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/use-cases.svg"
  alt="Laxity use cases covering build and deployment, experiment execution, live observation, replay, and analysis"
  loading="lazy"
  />
  <figcaption>
  The project is larger than the single benchmark: it includes build and deployment, controlled
  sweeps, live observation, capture integrity checks, replay, and comparison of placement costs.
  </figcaption>
  </figure>

  <table>
  <thead>
  <tr><th>Measurement</th><th>Observed value</th></tr>
  </thead>
  <tbody>
  <tr><td>Target</td><td>STM32U585, Cortex-M33 at 160 MHz</td></tr>
  <tr><td>Activation arena</td><td>2,944 bytes</td></tr>
  <tr><td>Timing source</td><td>DWT cycle counter</td></tr>
  <tr><td>Competing master</td><td>GPDMA1 memory-to-memory traffic</td></tr>
  <tr><td>Uncontended placement spread</td><td>3 cycles out of 320,898 (9.3 ppm)</td></tr>
  <tr><td>Largest contended increase</td><td>31,189 cycles (9.7%)</td></tr>
  <tr><td>Main capture</td><td>9,062 records over 180 seconds, 0 drops, 0 sequence gaps, 0 CRC rejects</td></tr>
  </tbody>
  </table>

  <h2>The scheduling problem</h2>
  <p>Real-time scheduling assigns limited resources to work with timing constraints. Laxity, also called slack, is the time a job can still lose before missing its deadline:</p>
  <p><code>laxity = deadline - now - estimated_remaining_execution</code></p>
  <p>A least laxity first scheduler gives processor time to the job with the smallest remaining slack. That model is useful when execution cost belongs mostly to the task and the processor assigned to it. I was interested in a different resource. A converted neural network needs an activation arena for intermediate tensors, and embedded deployment usually treats that arena as a size constraint. If the arena fits in SRAM, its exact address is normally left to the linker. That is fine if memory access cost stays effectively constant. It becomes less obvious once another bus master moves data at the same time.</p>
  <p>I had already seen the larger version of this problem in platform work. Kubernetes can place pods according to CPU and memory capacity, while cgroups regulate processor use. Two workloads can still interfere through shared cache and memory bandwidth while staying inside those limits. CPU pinning, NUMA-aware placement, and Intel RDT through <code>resctrl</code> are ways to control parts of that shared path, although RDT itself is an operating system mechanism rather than a Kubernetes primitive. The STM32U585 has a much smaller machine, but the same question appears in another form. ThreadX schedules software threads on one Cortex-M33 core. GPDMA, sensors, and other peripherals can move data independently through the memory system.</p>
  <p>There is no cgroup or RDT interface to configure here. The run-time choice I could actually control was the address of the activation arena. I named the project Laxity because I wanted to know whether that placement could recover enough execution time to become useful to a scheduler. I did not know whether the effect would be measurable when I started.</p>
  <h2>How I split the work</h2>
  <p>I used coding agents throughout the project, but I did not want one agent producing a repository I could run without being able to explain it. I split the work into conceptual blocks, usually around two per day. Each block had a concrete question, a done condition, and things that were explicitly outside its scope. One agent changed the repository, another inspected the current state and prepared the next block, and a third reread the repository after changes so its model of the system stayed current. I read every diff. This made the project slower. I kept the process because I had to debug the system and present it alone, and I wanted every layer to remain something I could reason about without asking the agent that wrote it.</p>
  <p>The first toolchain failure also gave me a rule that stayed useful for the rest of the project:</p>
  <blockquote>
  <p>Exit status lies. Establish success from output and artefacts.</p>
  </blockquote>
  <h2>Toolchain failures</h2>
  <p>STM32CubeMX can print <code>KO</code> and still exit with status zero. I saw the same behaviour around its software-management commands and parts of the ST Edge AI installation flow. After that, my scripts stopped treating <code>$?</code> as sufficient evidence. They checked the emitted text and the files that should have appeared. The first broken script was <code>versions.sh</code>. It captured an ANSI-coloured banner as the programmer version. I changed the parser to strip escape sequences before matching. If parsing still fails, the pin file contains the literal value <code>unparsed</code> rather than a plausible-looking string. <code>doctor.sh</code> produced a different false failure. It reported no ST-LINK while the board was connected.</p>
  <p>The board and programmer were both fine. The problem was this combination:</p>
  <table>
  <thead>
  <tr>
  <th>Part</th>
  <th>What mattered here</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td><code>grep -q</code></td>
  <td>Stops reading as soon as a match is found.</td>
  </tr>
  <tr>
  <td><code>pipefail</code></td>
  <td>Propagates a non-zero producer status, including SIGPIPE, to the pipeline.</td>
  </tr>
  </tbody>
  </table>
  <p><code>grep -q</code> exits as soon as it finds a match. The process feeding it can then receive SIGPIPE and exit with status 141. Under <code>pipefail</code>, that turns the complete pipeline into a failure. I changed the check so the consumer reads the complete input. I also misunderstood the relationship between X-CUBE-AI and ST Edge AI Core at first. I had treated them as alternatives. The pack I installed through CubeMX was only the integration layer and did not contain the command line generator, inference headers, or runtime archive I needed. The actual generator came from ST Edge AI Core, installed separately. I found part of that command interface by intentionally sending CubeMX an invalid command and letting it print the supported command list.</p>
  <h2>Model selection and licensing</h2>
  <p>The course provides a neural network, but I wanted the repository to stand on a model whose provenance I could document. I used a human activity recognition network from ST's model zoo, trained on the WISDM accelerometer dataset. The model accepts 24 samples across three axes and returns four class scores. Its generated activation arena is 2,944 bytes. My first note said the model was safe to commit because it was publicly downloadable. That was wrong. The model uses SLA0044. It is not an OSI licence, and availability on a public website does not imply redistribution rights. I removed that assumption from the repository design.</p>
  <p><code>toolchain.toml</code> now pins the model name, source, SHA-256, and generator version. <code>generate-model.sh</code> checks those values before generating code and refuses to continue on a mismatch. I keep one model-derived test artefact in the tree: a golden input and its reference output. The synthetic input is described by its formula, while the output comes from ST's generator. The firmware uses that pair as a known-good inference check. The network itself is not committed.</p>
  <h2>First firmware bring-up</h2>
  <p>The first firmware I flashed produced no output. There was no visible fault either. The board appeared to do nothing. The ThreadX byte pool was configured for 1,024 bytes, while one thread requested a 1,024-byte stack. <code>App_ThreadX_Init</code> returned an error, and the generated failure path entered an infinite loop. That failure changed how I treated later measurements. A system that never started and a system that started but produced no interesting result can look identical from outside. I started checking the mechanism before interpreting the result. CubeMX gave me a related problem during configuration. Several keys were accepted, echoed as <code>OK</code>, and preserved through a save and reload, but disappeared when code was generated.</p>
  <p>After four separate commands behaved that way, I stopped treating the configuration database as the final state. Generated code became the evidence that a setting had actually survived.</p>
  <h2>Cycle counting</h2>
  <p>Inference timing uses the Cortex-M33 DWT cycle counter. The counter is 32 bits wide. At 160 MHz it wraps after about 26.8 seconds, which is shorter than a normal capture session. I therefore detect wrap and mark it in telemetry instead of assuming each timing interval lives inside one counter epoch. I kept the counter implementation independent of STM32 vendor headers. Time in milliseconds is supplied through a function pointer. I did that because I wanted the measurement port to remain movable to another Cortex-M part without carrying the rest of the STM32 platform layer with it.</p>
  <h2>Telemetry format</h2>
  <p>Each completed inference produces a fixed 32-byte record. The record contains a sequence number, release timestamp, execution interval, arena identity, and competing-master identity. Field offsets are asserted at compile time, and the implementation rejects big-endian builds instead of silently changing the wire representation. Records enter a single producer single consumer ring using free-running indices. Occupancy is:</p>
  <p><code>occupancy = head - tail</code></p>
  <p>The producer therefore does not need modulo arithmetic to decide whether the ring is full. Sequence numbers advance when a record is dropped rather than when it is transmitted. I wanted loss to remain visible after transport, so a gap at the host directly identifies a missing record without relying on another status counter. Batches leave the target inside framed messages. Each frame has the magic bytes <code>0x4C 0x58</code>, a version, type, payload length, and CRC-16/CCITT-FALSE over the payload.</p>
  <p>The same UART also carries ASCII diagnostics. When the parser does not find a valid frame at the current byte, it advances by one byte and keeps looking. This lets the binary and text streams share one transport and lets the parser recover after partial or corrupted data. The CRC implementation is bitwise rather than table-driven. It runs outside the inference timing interval, so I had no measured reason to spend 512 bytes of flash on a lookup table.</p>
  <h2>Measuring telemetry overhead</h2>
  <p>I measured the instrumentation before using it to make timing claims. A null probe exercises the telemetry path without running inference. Reading the ring costs 14 cycles at both the median and p99. Pushing one record costs 118 cycles. A normal inference is around 320,900 cycles, so the push cost is about 0.037 percent of that interval. The push also happens after the inference timing interval has ended. The probe stores samples in static arrays. I had already seen an undersized stack turn into a silent target, so I did not want the instrument validation to depend on another large stack allocation.</p>
  <p>It also resets the telemetry ring every 32 pushes. Without that reset, later samples would eventually measure the full-ring path rather than the successful push path I wanted to characterize. I used insertion sort for the small fixed sample set rather than pulling <code>qsort</code> from newlib into the firmware image. Those choices came from failures I had already seen rather than from a generic benchmark design.</p>
  <h2>Uncontended placement</h2>
  <p>I allocate three activation arenas, one in each SRAM region, with identical alignment. All three exist at once. A pointer selects the active arena at run time. I needed the firmware image to remain identical across placement cells because an earlier relink of unchanged source moved the observed median by 85 cycles. That was already much larger than the uncontended effect I eventually measured. A build-per-placement experiment would therefore have mixed placement with image layout. The three uncontended medians were:</p>
  <table>
  <thead>
  <tr>
  <th>Placement</th>
  <th>Median inference time</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>SRAM1</td>
  <td>320,898 cycles</td>
  </tr>
  <tr>
  <td>SRAM2</td>
  <td>320,901 cycles</td>
  </tr>
  <tr>
  <td>SRAM3</td>
  <td>320,899 cycles</td>
  </tr>
  <tr>
  <td>Same-region control pair</td>
  <td>Identical medians; 0-cycle spread</td>
  </tr>
  </tbody>
  </table>
  <p>The full spread is three cycles out of 320,898, or 9.3 parts per million. I also measured SRAM1 twice under two different labels while keeping the same address. The two medians were identical, so the control spread was zero cycles at this sample count. The timer resolves the placement effect. The effect is still too small to act on. One confound remained in the first experiment. Each region contributed one arena address, so I could not initially separate "this region" from "this address inside the region." I later added a second address inside SRAM2 and reproduced the primary SRAM2 median. That reduces the address-confound concern for SRAM2; I do not generalize it to every address on all three SRAMs.</p>
  <h2>Firmware identity</h2>
  <p>While testing whether I could restore a known image before overwriting it, I found that the ELF itself was not reproducible. A clean rebuild of identical source reordered <code>.debug_str</code> and moved the section headers after it. The ELF changed by 48 bytes even though every allocated section, every symbol, and the programmed image were identical. My capture metadata used <code>elf_sha256</code>. That pinned a container whose irrelevant debug layout changed between clean builds. Captures now store <code>image_sha256</code> as well. This is the hash of the binary bytes that actually run on the target, and the analysis requires that value. My first implementation of that hash was:</p>
  <p>The broken command was <code>arm-none-eabi-objcopy -O binary "$ELF" /dev/stdout | shasum -a 256</code>.</p>
  <p>It was wrong. <code>objcopy</code> seeks in its output. With <code>/dev/stdout</code> connected to a pipe, it emitted no binary data and still exited successfully. <code>shasum</code> therefore calculated the SHA-256 of an empty file. Every image would have received the same constant hash. The script now writes the binary to a temporary file and hashes the file afterward.</p>
  <h2>DMA as the competing master</h2>
  <p>A second ThreadX thread looked like the obvious way to generate memory pressure. It would have measured the wrong thing. The Cortex-M33 has one core and no simultaneous multithreading. Two software threads cannot execute simultaneously. If an aggressor thread preempts inference, its own execution time becomes part of the measured wall-cycle interval. Increasing its activity would then produce a latency increase containing scheduler time. I would not know how much came from memory interference. I needed another master that could generate requests while the Cortex-M33 continued executing. GPDMA1 provides that.</p>
  <p>The aggressor performs memory-to-memory transfers inside a selected SRAM region using a circular linked list. I run the channel at high priority, with the source and destination assigned to different matrix ports. It does not interrupt the core during the measured interval. I poll the completion counter afterward. I avoided a periodic DMA interrupt because one interrupt every 32 ms would overlap roughly 6 percent of inference windows. Those windows would contain interrupt-service time in addition to bus contention. Internal SRAM on the STM32U585 is not covered by the data cache, so activation accesses from the Cortex-M33 reach the on-chip memory system directly. Instruction fetches come from flash with the instruction cache enabled.</p>
  <p>That keeps the experiment focused on data traffic between the core, DMA, and internal SRAM. CubeMX did not configure the DMA channel correctly from script mode. Settings taken from ST examples disappeared during regeneration, and one of the commands returned:</p>
  <table>
  <thead><tr><th>CubeMX script command</th><th>Result</th></tr></thead>
  <tbody><tr><td><code>set mode GPDMA1 Channel 0 - 2 Words Internal FIFO</code></td><td><code>KO</code></td></tr></tbody>
  </table>
  <p>I configure the channel directly with a small HAL sequence instead. I also recorded hashes of the three generated files that could have been disturbed by later CubeMX regeneration. They stayed unchanged.</p>
  <h2>Contention results</h2>
  <p>The main capture contains 9,062 records over 180 seconds. Each experiment cell contains between 217 and 225 samples. The capture had zero dropped records, zero sequence gaps, and zero CRC rejections. The table shows median inference cycles. Values in parentheses are relative to the same arena's uncontended median.</p>
  <table>
  <thead>
  <tr>
  <th>Arena</th>
  <th>No aggressor</th>
  <th>DMA in SRAM1</th>
  <th>DMA in SRAM2</th>
  <th>DMA in SRAM3</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>SRAM1, 192 KiB</td>
  <td>320,898</td>
  <td>337,877 (+16,979)</td>
  <td>320,927 (+29)</td>
  <td>335,843 (+14,945)</td>
  </tr>
  <tr>
  <td>SRAM2, 64 KiB</td>
  <td>320,901</td>
  <td>320,960 (+59)</td>
  <td>337,845 (+16,944)</td>
  <td>335,847 (+14,946)</td>
  </tr>
  <tr>
  <td>SRAM3, 512 KiB</td>
  <td>320,899</td>
  <td>320,967 (+68)</td>
  <td>320,937 (+38)</td>
  <td>352,088 (+31,189)</td>
  </tr>
  </tbody>
  </table>
  <p>When inference and DMA share SRAM1, the median increases by 16,979 cycles. SRAM2 gives almost the same result at 16,944 cycles. Both are about 5.3 percent. SRAM1 and SRAM2 barely affect each other when the arena and DMA buffer are separated. SRAM2 traffic adds 29 cycles to an SRAM1 arena. SRAM1 traffic adds 59 cycles to an SRAM2 arena. Those changes are around 0.01 percent. SRAM3 is different. Sharing SRAM3 costs 31,189 cycles, or 9.7 percent. The experiment therefore gave me two very different placement regimes. With an idle memory system, the full placement range was three cycles. With another bus master active, the range reached 31,189 cycles.</p>
  <p>That is the measurement I would use if I later build a placement policy.</p>

  <h2>What the contention cells look like live</h2>

  <p>The screenshots below are rolling TUI views, not replacements for the final capture table. Their sample counts and rolling medians change while replay is running. They are useful because they expose the topology of a cell directly: where inference is placed, where GPDMA is writing, which uncontended median is being used as the reference, and which alternate placement is currently cheapest under the same traffic.</p>

  <div class="figure-grid">
  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/03-dashboard-wide-late.png"
  alt="Laxity TUI showing same-bank contention with inference and GPDMA both in SRAM2"
  loading="lazy"
  />
  <figcaption>
  Same-bank contention on SRAM2 with a 1 KiB DMA working set. The selected SRAM2 arena pays
  the large penalty while SRAM1 is the observed best placement in the rolling comparison.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/02-dashboard-wide-alt.png"
  alt="Laxity TUI showing SRAM1 as the best placement while SRAM2 is congested"
  loading="lazy"
  />
  <figcaption>
  The same SRAM2 contention pattern with a 4 KiB DMA working set. Keeping the arena outside
  the congested SRAM2 region brings SRAM1 and SRAM3 back close to their own idle references.
  </figcaption>
  </figure>
  </div>

  <div class="figure-grid">
  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/04-dashboard-100x30.png"
  alt="Laxity TUI showing same-bank SRAM3 contention and SRAM1 as the observed best placement"
  loading="lazy"
  />
  <figcaption>
  Same-bank contention on SRAM3. The rolling view shows the characteristic roughly 9.7 percent
  penalty for keeping inference in SRAM3 and a much smaller cost when the arena moves to SRAM1
  or SRAM2.
  </figcaption>
  </figure>

  <figure>
  <img
  src="https://github.com/alpblkba/laxity/raw/HEAD/assets/02-dashboard-80x24.png"
  alt="Laxity TUI showing cross-bank contention with inference in SRAM2 and GPDMA traffic in SRAM3"
  loading="lazy"
  />
  <figcaption>
  Cross-bank traffic with inference in SRAM2 and GPDMA in SRAM3. SRAM1 and SRAM2 are nearly
  tied in the rolling view, both paying about 4.7 percent, while an SRAM3 placement pays the
  larger same-region penalty. This is the directional SRAM3 effect in the interface rather
  than only in a summary table.
  </figcaption>
  </figure>
  </div>

  <h2>SRAM3 asymmetry</h2>
  <p>SRAM3 also creates a cross-region effect. When the DMA aggressor runs in SRAM3, an arena in SRAM1 gains 14,945 cycles and an arena in SRAM2 gains 14,946. Both are about 4.7 percent. The reverse direction is almost absent. DMA in SRAM1 adds 68 cycles to inference in SRAM3. DMA in SRAM2 adds 38. The result follows the region used by the aggressor rather than a symmetric SRAM pair. I do not have the mechanism pinned down.</p>
  <p>One possibility is that SRAM3 sits behind a matrix path shared with traffic toward the other SRAMs. Another is that an SRAM3 transaction occupies a shared resource for longer, which could explain both the cross-region effect and the larger same-region penalty. Shared arbitration upstream of the SRAM slaves would also fit the measurements. The DMA completion counter advances at the same rate in all three regions. That rules out a simple explanation based on the aggressor doing less work in one region, but it does not distinguish between the remaining mechanisms.</p>
  <p>The next step for this result is the reference manual, not another blind sweep. I need to map the SRAM slave ports and matrix arbitration closely enough to see which of those mechanisms the part can actually implement. I also swept the DMA working set over 1, 4, 8, and 16 KiB. Within a cell, the median moves by about 420 to 570 cycles, which is well above the zero-cycle control spread. The direction depends on the DMA region. SRAM1 and SRAM2 aggressors cause slightly less interference as the working set grows. An SRAM3 aggressor causes more. When both inference and DMA use SRAM3, the response is nearly flat. Averaging all of those cells produces a small downward trend. I do not use that aggregate because it combines trends with opposite signs.</p>

  <table>
  <thead>
  <tr><th>Arena</th><th>DMA region</th><th>1 KiB</th><th>4 KiB</th><th>8 KiB</th><th>16 KiB</th></tr>
  </thead>
  <tbody>
  <tr><td>SRAM1</td><td>SRAM1</td><td>338,414</td><td>337,981</td><td>337,898</td><td>337,877</td></tr>
  <tr><td>SRAM1</td><td>SRAM3</td><td>335,420</td><td>335,746</td><td>335,816</td><td>335,843</td></tr>
  <tr><td>SRAM2</td><td>SRAM2</td><td>338,391</td><td>337,951</td><td>337,869</td><td>337,845</td></tr>
  <tr><td>SRAM2</td><td>SRAM3</td><td>335,421</td><td>335,747</td><td>335,819</td><td>335,847</td></tr>
  <tr><td>SRAM3</td><td>SRAM3</td><td>351,997</td><td>352,052</td><td>352,066</td><td>352,088</td></tr>
  </tbody>
  </table>

  <p>The working-set sweep matters because it stops the contention cost from looking like one constant per SRAM pair. Same-region SRAM1 and SRAM2 get slightly cheaper as the aggressor grows from 1 to 16 KiB, while an SRAM3 aggressor becomes slightly more expensive against SRAM1 and SRAM2. The SRAM3/SRAM3 cell is almost flat across the same range.</p>

  <h2>Sensor integration</h2>
  <p>The course required two sensors, so I replaced the synthetic inference input with data from the inertial sensor. The environmental sensor and microphone also run beside it. The golden vector remains available as an explicit mode. I kept it because falling back silently from a live sensor to synthetic data would make a broken input path look like a working inference path. The microphone uses the digital filter peripheral. Its buffer counter gave me a useful independent check on the audio clock. The firmware prints one status block per second, and the counter advanced by 31 to 32 half-buffers between consecutive reports.</p>
  <p>Each half-buffer contains 512 samples:</p>
  <p><code>512 × 31.7 = 16,230 samples/s</code></p>
  <p>The configured clock chain predicts 16,233 samples/s. Seeing buffer movement would only tell me that data exists. The measured rate told me that the clock chain was also behaving close to the configured value.</p>
  <h2>DMA channel collision</h2>
  <p>The microphone later collided with the synthetic aggressor. The board support package assigns GPDMA1 channel 0 to the microphone inside a <code>static</code> function. I could not redirect that channel from the outside. My synthetic memory aggressor also used channel 0. I moved the aggressor to channel 1 and left its other settings unchanged. The earlier captures were all collected on channel 0. Equal-priority DMA arbitration is round robin, so I do not expect the numerical channel index to affect the measured contention at equal priority. I have not measured that assumption directly, so I keep it as an assumption in the results rather than treating it as established behaviour.</p>
  <p>The collision was also a useful example of the same resource problem appearing above the actual experiment. A real peripheral driver constrained where the synthetic master could be placed before either one generated bus traffic.</p>
  <h2>Wi-Fi bring-up</h2>
  <p>The B-U585I-IOT02A includes an MXCHIP module connected through SPI2. ST provides a NetX Duo driver for it. The network stack builds, links, and executes. Adding it increased the text size by 68 KiB, and I verified that 31 driver entry points remained in the final image. I checked the symbols because an earlier build had linked successfully while garbage collection removed the complete driver. The module initially reported firmware V2.1.11, while the driver requires V2.3.4. The driver checks the version against a fixed tuple and executes <code>MX_ASSERT(false)</code> when the firmware is too old. In the ThreadX binding, that macro becomes an infinite loop.</p>
  <p>The target therefore continues booting and streaming telemetry while the network side stops progressing without explaining the reason. ST distributes the module updater as a binary intended for the ST-LINK mass-storage volume. That volume did not mount on my Mac. The debugger enumerated, but macOS created no block device. The updater eventually has to be programmed into target flash anyway, so I wrote it through SWD. Before programming, the updater's read-only check found 743 differing bytes in the first kilobyte. Afterward it reported zero differences across all 686,672 bytes.</p>
  <p>ST also publishes MD5 hashes for the updater payloads. Both payload hashes matched. One payload appears verbatim inside the updater binary at a fixed offset, so 95.6 percent of the programmed file is covered by the published vendor hash. The board later printed the same offset in its own console output. The Wi-Fi connection itself is still not demonstrated. The credentials, network configuration, and host receiver are implemented. I am waiting for a DHCP-assigned address from the board before calling association successful.</p>
  <h2>Terminal monitor</h2>
  <p>The telemetry transport mixes binary frames and ASCII status output. Opening the port directly in a terminal produces mostly binary noise. My original workflow was to store the stream and inspect it later with a Python parser. That worked for analysis and gave me poor visibility during a running experiment. I wrote a host TUI in Rust using Ratatui, crossterm, and serialport. I cared more about keeping the parser behaviour identical than about how the interface looked. The Rust frame parser therefore follows the Python parser's CRC handling and byte-by-byte resynchronisation rules. I replayed every stored capture through both implementations and compared their record, drop, and sequence-gap counts.</p>
  <p>The TUI supports UDP, serial, and file replay through the same decode path. Serial stays available as the demonstration fallback if network transport is unavailable. I did not want that path to use a separate parser that was exercised only when something else had already failed. Incoming bytes can also be written unchanged to a capture file. The existing Python parser accepts those files directly. I treat the stored capture as the measurement record. The interface is a live view over it. The idle state needed some care as well. The header reports the selected source, time since the last received byte, time since the last valid frame, CRC rejection count, and sequence-gap count.</p>
  <p>Those fields let me distinguish a silent source, wrong serial port, and malformed frame stream without attaching another debugger. The first implementation had three display problems. One pane truncated placeholder text halfway through a word. Long source paths consumed the following field rather than being elided. Headless mode also omitted two fields available in the Python output, including the cycle-counter wrap flag. I fixed all three.</p>
  <p>Two implementation choices also became problematic during long sessions. Each cell stored samples in a sorted vector through insertion, giving unbounded storage and quadratic insertion work. The experiment projection was also recalculated twice for each rendered frame, even though telemetry changes much less often than the renderer runs. Both were changed. The retained sample-window size is shown in the interface now because the displayed percentile belongs to that window rather than an unbounded history.</p>
  <h2>Host-side verification</h2>
  <p>I built the Rust crate on Linux as a second environment. That gave me another build of the parser and checked that the host implementation had not accidentally picked up a macOS dependency. Thirty-three tests pass there, along with <code>clippy</code> with warnings treated as errors and the formatting check. I then replayed the complete main capture through headless mode and compared it with the Python parser. Both reported:</p>
  <table>
  <thead>
  <tr>
  <th>Parser result</th>
  <th>Count</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>Frames</td>
  <td>18,124</td>
  </tr>
  <tr>
  <td>Records</td>
  <td>9,062</td>
  </tr>
  <tr>
  <td>Drops</td>
  <td>0</td>
  </tr>
  <tr>
  <td>Sequence gaps</td>
  <td>0</td>
  </tr>
  <tr>
  <td>False syncs</td>
  <td>0</td>
  </tr>
  </tbody>
  </table>
  <p>I also checked whether every byte in the input belonged to the same category in both implementations:</p>
  <table>
  <thead>
  <tr>
  <th>Input category</th>
  <th>Bytes</th>
  </tr>
  </thead>
  <tbody>
  <tr>
  <td>18,124 frame headers × 8 bytes</td>
  <td>144,992</td>
  </tr>
  <tr>
  <td>9,062 batch payloads × 32 bytes</td>
  <td>289,984</td>
  </tr>
  <tr>
  <td>9,062 header payloads × 140 bytes</td>
  <td>1,268,680</td>
  </tr>
  <tr>
  <td>Skipped ASCII bytes</td>
  <td>65,843</td>
  </tr>
  <tr>
  <td><strong>Total / file size</strong></td>
  <td><strong>1,769,499</strong></td>
  </tr>
  </tbody>
  </table>
  <p>Nothing is left over. For screenshots, I ran the binary inside a pseudo-terminal and passed its output through a terminal-emulator library. That produced the final character grid and attributes, which I then rendered with a monospace font. My first renderer made one panel border look broken. I initially suspected the TUI. The terminal characters were correct. My renderer used a cell width that did not match the font's horizontal advance, so adjacent box-drawing glyphs did not touch. The rendering bug was mine.</p>
  <h2>How the diagrams are generated</h2>
  <p>The repository contains five Mermaid sources in <code>docs/diagrams/src</code>, with generated SVG files committed beside them. I wanted the diagrams to remain editable as text because the project structure was still changing while I was documenting it. When a dependency changes, I can update the graph and review the change in Git instead of opening a drawing tool. Rasterising the SVGs exposed one Mermaid detail. Node labels can be stored inside <code>&lt;foreignObject&gt;</code> elements containing HTML. CairoSVG rendered the shapes and edges but omitted those labels because it does not implement the embedded HTML path Mermaid relies on.</p>
  <p>I switched the rasterisation step to headless Chromium, which renders the SVG through a browser engine and preserves the text. One diagram had a different problem. Its generated aspect ratio was around 0.29, so fitting it on a 16:9 slide made the content unreadable. For the presentation I split the flow at its natural section boundaries and laid the three stages out horizontally. The source diagram remains vertical because that version is easier to read as documentation.</p>
  <h2>Limits</h2>
  <p>There is no placement planner in Laxity. The runtime measures per-region costs that such a policy could use later. It does not currently choose a placement from those measurements. The activation arena is also fixed at 2,944 bytes because that size belongs to the generated network. Giving the runtime a larger buffer does not make the network touch more memory, so this experiment does not say how the interference scales with activation footprint. All reported inference measurements were collected at optimisation level zero. That lengthens the inference interval and can reduce the relative contribution of any fixed-cost interference.</p>
  <p>The complete sensing pipeline cannot currently be disabled at run time. Its cost therefore appears as a shift in the uncontended baseline rather than as an isolated timing result for each sensor path. SRAM3 is still the unresolved part of the result. DMA traffic there adds roughly 4.7 percent to inference using SRAM1 or SRAM2, while traffic in those two regions has almost no reciprocal effect on inference in SRAM3. I have measurements for the asymmetry. I do not yet have the bus-level mechanism that explains it.</p>

  <p>repository and measurements are <a href="https://github.com/alpblkba/laxity">here.</p>

