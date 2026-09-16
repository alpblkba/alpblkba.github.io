+++
title = "Laxity and memory contention on STM32U585"
date = 2026-09-11

[extra]
display_date = "11-09-2026"
tag = "laxity"
list_title = "Laxity and memory contention on STM32U585"
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

Imagine a single Kubernetes pod holding several services with limited resources. There is no CPU throttling on those services, no resource policy limiting them, and no simple way to know beforehand which service will consume more of the shared resource. If those services are critical, I also cannot just throttle one of them or write a new policy around it, since I may not know what that service is doing or how much the throttling will affect it.

The services stay colocated and start competing for the same limited part of the machine. One service can consume enough of a shared resource to degrade another service even though neither one technically fails. You run diagnostics, yet you don't see any network issue, database issue, you run "kubectl get/describe pod" with wider metrics, everything looks fine on the surface and no functional bugs on the actual software. That is the famous <a href="https://www.techtarget.com/it-infrastructure/definition/What-is-noisy-neighbor-cloud-computing-performance">noisy neighbor</a> problem in the form I care about here. The load might not be seen on the CPU side, instead moved to the filesystem/kernel side and the interference can also sit below the obvious CPU limit, for example in shared cache, memory bandwidth, the <a href="https://en.wikipedia.org/wiki/Page_cache">OS page cache</a>, or another shared subsystem. If I cannot remove the workload or constrain it safely, placement becomes one of the few controls left. I move something so the two workloads stop competing for the same resource.

I wanted to look at the same question on a much smaller machine.

On an MCU, ML inference, sensors, audio, DMA, and the network stack can all touch the same memory system. ThreadX can decide which software thread gets CPU time, but that does not mean it decides how every memory access is shared. Peripherals and DMA engines can generate traffic independently while the Cortex-M33 keeps executing. If an inference suddenly takes longer, knowing that the CPU was available does not tell me why.

Laxity started from "where abstractions stopped being polite", and the current implementation measures how memory placement changes inference cost on an STM32 board. I keep equivalent activation arenas in SRAM1, SRAM2, and SRAM3, then move the neural network working buffer between them while another bus master generates traffic elsewhere in the memory system (the point is not the three SRAM names themselves). I needed a machine where I could control placement precisely enough to ask whether two valid memory addresses still have the same execution cost once the rest of the system becomes busy.

## Platform and software stack

Laxity is split between target firmware and host-side experiment tooling. The embedded side runs on a B-U585I-IOT02A with an STM32U585 Cortex-M33 at 160 MHz. Application code runs under ThreadX and uses the STM32 HAL and BSP around the board peripherals. Neural inference is generated with ST Edge AI Core from a human activity recognition model trained on the WISDM accelerometer dataset. The generated activation arena is 2944 bytes.

The host side stays separate from the measurement path. Shell entry points handle toolchain checks, generation, building, flashing, capture, and monitoring. Python handles telemetry parsing and offline analysis. The interactive monitor is written in Rust with Ratatui, crossterm, and serialport. The Rust parser follows the same framing, CRC, and resynchronisation rules as the Python parser, since I did not want live inspection and offline analysis to become two different interpretations of the same capture.

| Layer | Implementation used in Laxity |
| --- | --- |
| Target firmware | C on STM32U585, ThreadX, STM32 HAL/BSP |
| Inference | ST Edge AI Core 4.0.1 generated network, 2,944-byte activation arena |
| Contention source | GPDMA1 memory-to-memory traffic through a circular linked list |
| Timing and telemetry | Cortex-M33 DWT cycle counter, fixed 32-byte records, SPSC ring, CRC-framed transport |
| Live monitor | Rust with Ratatui, crossterm, serialport |
| Offline analysis | Python with `telemetry_parse.py` and `analyse.py` |
| Experiment automation | Shell with `doctor.sh`, `generate.sh`, `generate-model.sh`, `build.sh`, `flash.sh`, `capture.sh`, `monitor.sh` |
| Diagrams | Mermaid sources under `docs/diagrams/src`, generated SVG committed beside them |

## The live view

I think of the Laxity interface a bit like Task Manager, except on lower layer. Instead of showing processes, CPU load, and total system memory, I want it to show memory regions, placements, competing masters, and the cost attached to those placements.

The stored telemetry data is the source of truth for the experiment and the TUI itself is just for visualizing the stored telemetry capture, and the interface is either a live or replayed projection of that capture. It shows the selected arena and DMA target, current and rolling cycle counts, the uncontended reference for each placement, CRC and sequence-gap counters, and the board recovery log. Serial, UDP, and file replay all use the same decode path.

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

Having the interface is crucial because the memory problem is otherwise difficult to see while the board is running. I do not want a slowdown to appear as one number after the experiment. I want to know where inference is placed, where the competing traffic is going, which reference applies to that placement, and whether moving the workload changes the cost.

## System map

The diagrams below describe the experiment more accurately than a long list of scripts. Target firmware owns the inference workload, the competing DMA master, and the telemetry path. Host software stores and interprets the stream. The experiment tooling keeps the same firmware image across placement cells so a placement comparison does not quietly become a comparison between different binaries.

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/architecture.svg"
    alt="Laxity architecture across experiment tooling, host software, firmware, and STM32U585 hardware"
    loading="lazy"
  />
  <figcaption>
    Laxity architecture across experiment tooling, host software, firmware, and STM32U585 hardware.
  </figcaption>
</figure>

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/experiment-flow.svg"
    alt="Laxity experiment flow from toolchain checks and model generation to telemetry capture and analysis"
    loading="lazy"
  />
  <figcaption>
    The experiment loop from toolchain checks and model generation through build, flash,
    capture, replay, and analysis.
  </figcaption>
</figure>

The actual contention question is smaller than the complete repository. One Cortex-M33 inference stream uses an activation arena. One independent GPDMA requester generates memory traffic. I can place each side independently in SRAM1, SRAM2, or SRAM3 and keep the rest of the experiment fixed.

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/memory-contention.svg"
    alt="STM32U585 memory contention experiment with a movable activation arena and GPDMA working set"
    loading="lazy"
  />
  <figcaption>
    The activation arena and the DMA working set can be placed independently in SRAM1,
    SRAM2, or SRAM3.
  </figcaption>
</figure>

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/runtime-sequence.svg"
    alt="Runtime sequence for configuring the DMA aggressor, timing inference, recording telemetry, and updating the TUI"
    loading="lazy"
  />
  <figcaption>
    One measured cell configures the competing master, runs inference, records telemetry,
    validates the frame on the host, and updates the live view.
  </figcaption>
</figure>

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/docs/diagrams/generated/use-cases.svg"
    alt="Laxity use cases covering build and deployment, experiment execution, live observation, replay, and analysis"
    loading="lazy"
  />
  <figcaption>
    The repository includes build and deployment, controlled sweeps, live observation,
    persisted capture, replay, and placement comparison.
  </figcaption>
</figure>

## DMA as the competing master

A second ThreadX thread looked like the obvious way to generate memory pressure. It would have measured the wrong thing.

The STM32U585 has one Cortex-M33 core and no simultaneous multithreading. Two software threads cannot execute at the same time. If an aggressor thread preempted inference, its own execution time would become part of the measured wall-cycle interval. Increasing aggressor activity would increase latency partly because the scheduler gave the CPU to something else. I would not know how much of the slowdown came from memory interference.

That is why I needed another requester that could generate memory traffic while the Cortex-M33 continued executing. GPDMA1 gives me that so that the aggressor performs memory-to-memory transfers inside a selected SRAM region using a circular linked list. It does not interrupt the core during the measured interval and afterwards I poll its completion state.

That choice keeps the question a lot narrower since the inference stays on the core, the competing traffic comes from another bus master. This way I can change the activation placement and DMA placement independently without changing the scheduling problem at the same time.

Internal SRAM on the STM32U585 is not covered by the data cache, so activation accesses from the Cortex-M33 reach the on-chip memory system directly. Instruction fetches come from flash with the instruction cache enabled. Therefore I am measuring a specific interaction between the core, GPDMA, and internal SRAM rather than claiming that the experiment represents every kind of memory interference on the part.

## Placement under contention

Without another bus master active, moving the activation arena between SRAM1, SRAM2, and SRAM3 barely changes inference time. I measured the placement effect, but it was too small to act on. This was actually an remarkable result because it gave me a reference point. If the memory system is quiet, these placements are effectively interchangeable for this workload, while the behavior changes once GPDMA starts generating traffic.

Same region placement creates a clear penalty. SRAM1 and SRAM2 are also relatively isolated from each other when inference and DMA use different regions. SRAM3 behaves differently. TSRAM3 can penalize inference in the other regions as well, but the reverse effect is much smaller.

I care more about that comparison than about a headline number since the result means that the memory topology doesn't behave like one flat pool with interchangeable addresses once another master becomes active. A placement that is fine while the system is idle can become worse than another valid placement under traffic.

The main capture still contains the measured values for anyone who wants to inspect them directly.

| Arena | No aggressor | DMA in SRAM1 | DMA in SRAM2 | DMA in SRAM3 |
| --- | --- | --- | --- | --- |
| SRAM1, 192 KiB | 320,898 | 337,877 | 320,927 | 335,843 |
| SRAM2, 64 KiB | 320,901 | 320,960 | 337,845 | 335,847 |
| SRAM3, 512 KiB | 320,899 | 320,967 | 320,937 | 352,088 |

Those values came from one firmware image. I kept all three activation arenas in the binary at the same time and selected the active one through a pointer. I did that because an earlier relink of unchanged source moved the observed median more than the idle placement effect itself. A build-per-placement experiment would have mixed memory placement with image layout.

The experiment also has a limitation here. Each region initially contributed one arena address, so region and address were partly confounded. Later I added a second address inside SRAM2 and reproduced the primary SRAM2 result. That reduces the concern for SRAM2, but I do not generalize it to every address across all three SRAM regions.

## Live contention views

The TUI views below are projections of the stored telemetry rather than replacements for the capture. Their rolling values change while replay is running. I use them because they make the topology visible during one experiment cell.

<div class="figure-grid">
<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/assets/03-dashboard-wide-late.png"
    alt="Laxity TUI showing same-bank contention with inference and GPDMA both in SRAM2"
    loading="lazy"
  />
  <figcaption>
    Same-region contention on SRAM2. The selected arena pays the larger cost while
    another region becomes the cheaper observed placement.
  </figcaption>
</figure>

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/assets/02-dashboard-wide-alt.png"
    alt="Laxity TUI showing SRAM1 as the best placement while SRAM2 is congested"
    loading="lazy"
  />
  <figcaption>
    Keeping the activation arena outside the region carrying the competing traffic
    brings the other placements closer to their own idle references.
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
    Same-region contention on SRAM3. The live comparison makes the placement
    difference visible without waiting for the final analysis table.
  </figcaption>
</figure>

<figure>
  <img
    src="https://github.com/alpblkba/laxity/raw/HEAD/assets/02-dashboard-80x24.png"
    alt="Laxity TUI showing cross-bank contention with inference in SRAM2 and GPDMA traffic in SRAM3"
    loading="lazy"
  />
  <figcaption>
    Cross-region traffic with inference in SRAM2 and GPDMA in SRAM3. This is the
    directional SRAM3 effect shown in the interface rather than only in a table.
  </figcaption>
</figure>
</div>

## Telemetry and replay

Each completed inference produces a fixed 32 byte telemetry record and contains a sequence number, release timestamp, execution interval, arena identity, and competing-master identity. Records enter a single producer single consumer ring and leave the target inside framed messages with a version, type, payload length, and CRC.

The same UART also carries ASCII diagnostics which parser advances byte by byte until it finds a valid frame, and lets binary telemetry and recovery text share one transport. It also means a partial or corrupted frame does not permanently desynchronise the capture.

I kept sequence numbers advancing when a record is dropped. A host side gap therefore tells me that something disappeared without depending on another counter. The live Ratatui monitor and the offline Python parser implement the same recovery rules and I replayed the same capture through both implementations to check that they agreed.

During the runs, I treat the stored captures as the measurement records because the TUI is allowed to change therefore a new layout, rolling window, or rendering decision should not change the experiment that already happened.

## Sensing and the real board workload

My course project had a hard requirement of using at least two sensors, so I initially framed the activation placement for a two sensor setup from the start. I replaced the synthetic inference input with data from the inertial sensor. The environmental sensor and microphone run beside it. The golden vector remains available as an explicit mode because I did not want a broken live input path to fall back silently to synthetic data and still look healthy.

The microphone gave me another independent traffic source and also exposed a practical resource collision. The board support package assigned GPDMA1 channel 0 to the microphone, while my synthetic memory aggressor was already using the same channel. I moved the aggressor to channel 1 and left its other settings unchanged.

That collision was useful beyond fixing the firmware and it was the same resource problem one level above the benchmark. A real peripheral driver constrained where the synthetic requester could live before either one generated memory traffic.

## Wi-Fi and transport

The B-U585I-IOT02A includes an MXCHIP module connected through SPI2. ST provides a NetX Duo driver for it. The network stack builds, links, and executes, but the module initially carried firmware older than the version expected by the driver.

The driver responds to that mismatch with an assertion that becomes an infinite loop in the ThreadX binding. The rest of the target can therefore continue booting and streaming telemetry while the network side stops progressing. I updated the module firmware through SWD because the ST-LINK mass-storage volume did not mount on my Mac. 

The Wifi connection itself is still not something I claim as demonstrated in this version. The credentials, network configuration, and host receiver exist, but I am waiting for a DHCP assigned address from the board before calling association successful. Serial remains the demonstration fallback, and both transports feed the same decoder.

## Laxity direction

The controlled DMA experiment is how I make the problem visible but it is yet to be the final definition of Laxity.

For my KIT IoT Lab course presentation demo, I did planned to use a noisy neighbor-like contention scenario because it is easy to reproduce in front of someone, secondly (I personally think that) it is a cool and sophisticated degradation scenario that is difficult to observe with basic diagnostic commands, and cares more about physical placement of the resources. 

Inference runs from one SRAM region, GPDMA generates traffic against another, and the interface shows whether changing placement changes the observed cost.

The direction I care about is broader though since I want a hardware-assisted memory QoS and telemetry layer where software can observe the memory topology, see what is using it, measure the cost of interference, and compare alternative placements.

The current STM32 setup is the first environment where I can control those variables well enough to test the idea. I do not want Laxity to depend just on SRAM1, SRAM2, SRAM3, STM32, or even SRAM specifically. Another board may expose a different number of SRAM banks, external DRAM, tightly coupled memory, shared cache, an accelerator, or another memory hierarchy. The names change but the question stays the same.

**"If two valid memory locations have different execution costs under the current traffic pattern, I want that difference to be visible to software."**

I also do not want every part of the project to require a physical board. Persisted captures already let the host side run without hardware *(and also I have to return the board back after the presentation, and I want to be able to continue working on Laxity)*. The next step is to make the topology and traffic model usable through simulation as well, so the QoS logic, placement policy, replay, and visualization can be developed independently from one target. Hardware still has to validate hardware claims. Simulation is for exercising the model before I have a board attached. 

There is no placement planner in Laxity (yet). The runtime measures per-region costs that such a policy could use later, but it does not currently choose a placement from those measurements. That distinction matters. I have telemetry and controlled placement experiments. I do not yet have an allocator that can look at the current interference and move a workload automatically.

The activation arena is also fixed at 2944 bytes because that size belongs to the generated network. Giving the runtime a larger buffer does not make the network touch more memory, so the current experiment does not tell me how interference scales with activation footprint. All reported inference measurements were also collected at optimisation level zero, which changes the length of the inference interval and therefore the relative contribution of fixed-cost interference.

The part I want to keep is the interface between the hardware and the policy, describe the memory topology, observe the requesters, measure the interference and compare placement cost. Then let a later runtime decide whether moving something is worth it.

repository and measurements are <a href="https://github.com/alpblkba/laxity">here</a>.
