/* All copy for the site, in one module. Carried verbatim from the previous
   src/data/site.js, plus the identity/nav block the new header needs.
   The prose is the author's own — do not rewrite it. */
const site = {
  identity: {
    name: 'Alp Bolukbasi',
    location: 'Karlsruhe, DE',
    line: 'M.Sc. Computer Science @ KIT : hardware-aware systems engineer',
    tagline: 'somewhere between the debugger and the datasheet',
    footer: 'somewhere between the debugger and the datasheet.'
  },

  nav: [
    { label: 'projects' }, { label: 'notes' }, { label: 'music' }, { label: 'cv' },
    { label: 'about' }, { label: 'github', href: 'https://github.com/alpblkba', external: true },
    { label: 'rss', href: '/rss.xml' }
  ],

  contact: [
    { k: 'email',    v: 'hello@alpblkba.dev',              href: 'mailto:hello@alpblkba.dev' },
    { k: 'PGP/GPG',  v: '0x5805EA560CCCAF6C',              href: '/pgp.txt' },
    { k: 'github',   v: 'github.com/alpblkba',             href: 'https://github.com/alpblkba' },
    { k: 'linkedin', v: 'linkedin.com/in/alpblkba',        href: 'https://www.linkedin.com/in/alpblkba' },
    { k: 'location', v: 'Karlsruhe, Germany' }
  ],

  facts: [
    { label: 'now',    text: 'Student assistant, KIT Chair for Embedded Systems (CES)' },
    { label: 'study',  text: 'M.Sc. Computer Science, KIT — since Oct 2025' },
    { label: 'before', text: '5+ years in Linux systems, infra and software development' },
    { label: 'focus',  text: 'RISC-V, FPGA/HLS, accelerators, hardware security' }
  ],

  direction: [
    'ops stuff', 'low level', 'embedded development',
    'hardware-software co-design', 'somewhere between debugger and the datasheet'
  ],

  interests: ['RISC-V', 'memory systems', 'FPGA prototyping', 'accelerators', 'hw/sw co-design', 'hardware security'],

  about: [
    'I come from systems and operations: networks, security, DevOps, and infrastructure-flavored engineering. That background made me interested in real systems, failure modes, performance bottlenecks, and the beautiful moment where abstractions stop being polite.',
    'Over time, the rabbit hole pulled me closer to the machine: low-level behavior, memory, hardware-aware software, embedded systems, and computer architecture. I decided to go back to school as a masters student.',
    'These days, I am mostly interested in the boundary between software and hardware: RISC-V, memory systems, FPGA-based prototyping, accelerators, hardware/software co-design, and hardware security.',
    'I am currently an M.Sc. computer science student at Karlsruhe Institute of Technology (KIT), working as a student assistant at the Chair of Embedded Systems on HLS implementations and hardware accelerators for embedded processors.'
  ],

  music: [
    "A small corner for my original music, and creative experiments. I just don't know when to upload.",
    'Different medium, same instinct: structure, timing, texture, constraints.'
  ],

  notes: [
    { title: 'Fault injection and differential fault analysis (DFA) on AES',              date: '29-07-2026', slug: 'aes-dfa-on-fpga'                       , tag: 'aes' },
    { title: 'How Git Could Have Saved My Friendship',                                    date: '20-07-2026', slug: 'how-git-could-have-saved-my-friendship', tag: 'git' },
    { title: 'Correlation Power Analysis on AES with an FPGA Sensor',                     date: '15-07-2026', slug: 'aes-cpa-on-fpga',                       tag: 'aes' },
    { title: 'AES-128 on an iCE40 FPGA',                                                  date: '08-07-2026', slug: 'aes-on-hardware',                       tag: 'aes' },
    { title: 'SRAM Weak PUF Readout on iCE40',                                            date: '07-06-2026', slug: 'sram-weak-puf-readout',                 tag: 'puf' }
  ],

  projectGroups: [
    {
      num: '01', title: 'computer architecture / hardware / embedded',
      items: [
        { kicker: 'verilog, accelerator' , name: 'rv32i-mla', tags: ['verilog', 'riscv', 'ISA', 'hardware-accelerator'],
          body: 'RV32I based 3 cycle pipelined CPU and accelerator experiments on PYNQ-Z2, written in Verilog. Focused on simple processor design, memory-mapped interfaces, and hardware/software integration.',
          href: 'https://github.com/alpblkba/rv32i-mla' },
        { kicker: 'verilog · hardare-security', name: 'hardware-security', tags: ['verilog', 'PUF', 'hardware-security'],
          body: 'FPGA-based hardware security experiments, Weak PUF readout from SRAM, AES-128 bit implementation, CPA and DFA on AES, mostly written in Verilog.',
          href: 'https://github.com/alpblkba/hardware-security' },
        { kicker: 'synthesis · bring-up', name: 'fpga-programming', tags: ['verilog', 'hardware'],
          body: 'KIT FPGA Programming Praktikum (lab) WS25/26 exercises, all solved on Verilog, synthesis flow, board bring-up, and hardware debugging.',
          href: 'https://github.com/alpblkba/fpga-programming' }
      ]
    },
    {
      num: '02', title: 'software / systems utilities',
      items: [
        { kicker: 'stm32 · c/c++', name: 'iot-lab', tags: ['stm32', 'uart'],
          body: 'Embedded systems lab work with STM32, C/C++, UART/GPIO bring-up, device-level debugging, and practical board interaction.',
          href: 'https://github.com/alpblkba/iot-lab' },
        { kicker: 'c/c++ · cross-platform', name: 'promon', tags: ['c++'],
          body: 'Tiny low-level process monitor targeting Windows, Linux, and macOS, written in C/C++ with a focus on system-level process inspection. Not finished yet.',
          href: 'https://github.com/alpblkba/promon' },
        { kicker: 'c++17 · Qt', name: 'alppad', tags: ['c++', 'qt'],
          body: 'A simple, minimalistic text editor application built with C++17 and the Qt framework.',
          href: 'https://github.com/alpblkba/alppad' },
        { kicker: 'rust · ratatui', name: 'alpnest', tags: ['rust', 'TUI', 'ratatui'],
          body: 'My personal/productivity nest, local first terminal cockpit, supports many operations, handling routine tasks, local LLM based operations. Project is ongoing.',
          href: 'https://github.com/alpblkba/alpnest' }
      ]
    }
  ],

  cv: {
    lead: 'M.Sc. Computer Science student at Karlsruhe Institute of Technology (KIT), focused on hardware-aware systems software, embedded systems, FPGA/HLS workflows, low-level debugging, and reliable infrastructure.',
    profile: 'Systems-oriented engineer with 5+ years of professional experience in Linux-based systems, network automation, DevOps, distributed telecom infrastructure, and production debugging. Current technical direction: computer architecture, embedded systems, FPGA/RTL, RISC-V, hardware security, accelerators, and hardware/software co-design.',
    experience: [
      { role: 'Student Assistant (HiWi)', org: 'KIT Chair for Embedded Systems (CES)', when: 'May 2026 – Present', where: 'Karlsruhe, Germany',
        bullets: [
          'Contributing to the Customized Embedded Processors Lab, rewrite focused on HLS-based accelerator development.',
          'Designed and updated FPGA/HLS lab infrastructure, Vitis/Vivado workflows, hardware/software interfaces, and student-facing documentation.',
          'Worked with Verilog, C, Vitis HLS, Vivado, embedded processors, and reproducible lab bring-up flows.'
        ] },
      { role: 'IP Integration Engineer', org: 'Nokia', when: 'Dec 2023 – Sep 2025', where: 'Istanbul, Turkey',
        bullets: [
          'Built Python network/systems automation for configuration, validation, and integration workflows on carrier-grade routing platforms.',
          'Supported large-scale network migrations across Nokia 7705, IXR 7250, and SR 7750 platforms in EMEA/APAC deployments.',
          'Debugged Linux, Kubernetes, TCP/IP, BGP, OSPF, IS-IS, MPLS, automation, and distributed deployment issues.'
        ] },
      { role: 'Integration Engineer', org: 'Ericsson', when: 'Oct 2022 – Dec 2023', where: 'Istanbul, Turkey',
        bullets: [
          'Developed Python, Ansible, and shell tooling for telecom node integration, deployment, validation, and recovery workflows.',
          'Troubleshot low-level connectivity, configuration, packet-flow, and Linux/networking issues in distributed deployment environments.',
          'Hands-on Linux sessions and demonstrations delivered for the fellow graduates in the MMEA region (my manager encouraged and motivated me to do so)'
        ] },
      { role: 'DevOps Engineer Intern', org: 'Huawei', when: 'Jun 2022 – Sep 2022', where: 'Istanbul, Turkey',
        bullets: ['Developed Go, Bash, and Ansible automation for network performance validation, provisioning workflows, CI/CD pipelines, and Linux infrastructure checks.'] },
      { role: 'Cyber Security Intern', org: 'PwC', when: 'Oct 2021 – Jun 2022', where: 'Istanbul, Turkey',
        bullets: ['Built a cyber security risk maturity model to evaluate, score, and visualize the security posture of a multi-entity enterprise environment.'] },
      { role: 'Network Security Engineer, Part-Time', org: 'Turkcell', when: 'Jul 2020 – Oct 2021', where: 'Istanbul, Turkey',
        bullets: ['Supported firewall, load balancer, WAN/LAN, VPN, routing, and network security troubleshooting in production environments.'] }
    ],
    education: [
      { role: 'M.Sc. Computer Science', org: 'Karlsruhe Institute of Technology (KIT)', when: 'Oct 2025 – Present', where: 'Karlsruhe, Germany',
        bullets: [
          'Focus: computer architecture, embedded systems, low-level systems, hardware/software co-design, security, and reliability.',
          'Selected relevant coursework: Embedded Systems I/II, FPGA Programming Lab, Hardware-Efficient AI, Low Power Design, Practical Introduction to Hardware Security, Internet of Everything, IoT Lab.'
        ] },
      { role: 'B.Sc. Computer Science', org: 'Ozyegin University', when: '2017 – 2022', where: 'Istanbul, Turkey',
        bullets: ['Graduation project: B-Auth, a blockchain-based authentication and authorization protocol for SDN controllers.'] }
    ],
    projects: [
      { role: 'Hardware Security FPGA Work',
        bullets: [
          'Implemented FPGA-based hardware security experiments using Verilog, UART, Python tooling, cocotb, and open-source FPGA flows.',
          'Built an SRAM PUF readout flow on Lattice iCE40HX8K and analyzed repeated power-cycle captures for reliability, uniqueness, uniformity, and bit-aliasing.',
          'Implemented AES-128 hardware modules including SubBytes, ShiftRows, MixColumns, AddRoundKey, key scheduling, and UART wrapper logic.'
        ] },
      { role: 'rv32i-mla — RISC-V / ML Accelerator Playground',
        bullets: [
          'Built a compact hardware/software co-design playground around a custom RV32I-subset processor and a fixed-function 4x4 int8 matrix multiplication accelerator.',
          'Worked across Verilog RTL, FPGA integration, Python board bring-up, and C-side runtime interaction.'
        ] },
      { role: 'B-Auth — Blockchain-Based Authentication for SDN Controllers',
        bullets: [
          'Designed a decentralized authentication and authorization protocol for SDN controllers.',
          'Integrated Python-based Ryu controllers with Go chaincode and performed formal verification tests with AVISPA.'
        ] }
    ],
    skills: [
      ['programming', 'C, C++, Python, Go, Bash, Verilog, SystemVerilog basics, Rust basics'],
      ['low-level / hardware', 'FPGA, RTL design, HLS, RISC-V, accelerators, embedded C, STM32, UART, SoC concepts'],
      ['systems', 'Linux, Docker, Kubernetes, CMake, Make, GDB, Git, Ansible, CI/CD, automation, observability/debug workflows'],
      ['networking', 'TCP/IP, BGP, OSPF, IS-IS, MPLS, routing platforms, distributed telecom infrastructure']
    ],
    languages: 'Turkish native · English C1/professional fluency · German A2'
  }
};

export default site;
export const { identity, nav, contact, facts, direction, interests, about, music, notes, projectGroups, cv } = site;
