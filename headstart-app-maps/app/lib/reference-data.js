// Generated from Airtable — Types, Application Areas, Manufacturers tables.
// Regenerate this file periodically (see scripts/sync-airtable.js) rather than
// editing by hand. Submission Status = "Open for submission" rows only are
// included here; "Reference only" rows (e.g. Embedded PC) are deliberately
// excluded so they can never appear in this form.

export const REFERENCE_DATA = {

  industries: ["Consumer Electronics", "Defence", "Industrial"],

  segments: {
    "Consumer Electronics": ["Wearables"],
    "Defence": ["Air"],
    "Industrial": ["Automation"]
    // Note: "Computing" intentionally omitted -- its only Application Area
    // row (Edge AI processing / Embedded PC) is Reference only. Add
    // "Computing" here once a new Open-for-submission row exists under it.
  },

  types: [
    { id: "recHdMFeHmCRwdKWA", name: "Smart Watch", segment: "Wearables" },
    { id: "rec5sLC4ZIObbwjsA", name: "Smart Ring", segment: "Wearables" },
    { id: "recrsWoRc2XN3kKZM", name: "Smart Glasses", segment: "Wearables" },
    { id: "recrqvfo0WHOTpp50", name: "Combat Drone", segment: "Air" },
    { id: "recRDsoYa8wWjAwol", name: "Surveillance Drone", segment: "Air" },
    { id: "recaNqMeQEzI67XA9", name: "Robotic Arm", segment: "Automation" }
  ],

  // Only "Open for submission" rows. Each area lists which Type id(s) it's
  // relevant for -- used to filter the Application Area picker once one or
  // more Types have been selected.
  applicationAreas: [
    { id: "rec251ygMvIN3hLEu", segment: "Wearables", label: "Health monitoring — Biometric sensing", relevantTypes: ["rec5sLC4ZIObbwjsA"] },
    { id: "rec8QqIQMWOE2HpKP", segment: "Wearables", label: "Display — HMI", relevantTypes: ["recHdMFeHmCRwdKWA"] },
    { id: "recKDc9MEo52iUJuK", segment: "Wearables", label: "Power — Battery and charging", relevantTypes: ["rec5sLC4ZIObbwjsA"] },
    { id: "reciFffHUhg5OGdk1", segment: "Wearables", label: "Connectivity — Wireless modules", relevantTypes: ["recHdMFeHmCRwdKWA", "recrsWoRc2XN3kKZM"] },

    { id: "recE8tJAhmDLjE4hF", segment: "Air", label: "Undercarriage — Landing gear", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recLyUk6l2tf2lABY", segment: "Air", label: "Communications — Antennas and comms mast", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recY07M8jSNxSVkbu", segment: "Air", label: "Sensors — EO/IR imaging", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recpL1figvVuGCDpX", segment: "Air", label: "Propulsion — Engine power electronics", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recptEr8hG25bgjfj", segment: "Air", label: "Weapons — Release and arming", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recwZyTVXl28n09Ad", segment: "Air", label: "Structures — Control surface actuation", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },
    { id: "recx3cXUBHRKbndIZ", segment: "Air", label: "Avionics — Mission computing", relevantTypes: ["recrqvfo0WHOTpp50", "recRDsoYa8wWjAwol"] },

    { id: "recJ9i7ZNzRKB2Jl3", segment: "Automation", label: "Robotics — Motion control", relevantTypes: ["recaNqMeQEzI67XA9"] },
    { id: "recO4ZRN3uDBtfny3", segment: "Automation", label: "Robotics — Cabling and harnessing", relevantTypes: ["recaNqMeQEzI67XA9"] },
    { id: "recaEiYmhbDzwvTcD", segment: "Automation", label: "Robotics — End effector / gripper", relevantTypes: ["recaNqMeQEzI67XA9"] },
    { id: "reczAPcg0jlro1thK", segment: "Automation", label: "Robotics — Position sensing", relevantTypes: ["recaNqMeQEzI67XA9"] }
  ],

  // Full 157-manufacturer list synced from the Manufacturers table.
  manufacturers: [
    {
        "name": "Wago",
        "products": [
            "PCB Terminal Blocks",
            "DIN Rail Terminals",
            "Cage Clamp®"
        ]
    },
    {
        "name": "Advanced Thermal Solutions",
        "products": [
            "maxiFLOW™ Heatsinks",
            "Heat Pipes",
            "Liquid Cooling Plates"
        ]
    },
    {
        "name": "Amphenol",
        "products": [
            "MIL-DTL-38999 Series III",
            "Rhino High Power",
            "Bergstak",
            "Amphe-Lite"
        ]
    },
    {
        "name": "QuickLogic",
        "products": [
            "EOS S3 Sensor Processing",
            "eFPGA IP",
            "Chilkat"
        ]
    },
    {
        "name": "AEF Solutions",
        "products": [
            "Filter & EMP Connectors",
            "Special Application Connectors",
            "EMI/RFI Filter Modules",
            "Transient Voltage Suppression (TVS) Assemblies"
        ]
    },
    {
        "name": "Swissbit AG",
        "products": [
            "F-75/F-78 CFast Series",
            "N-30 PCIe SSDs",
            "iShield FIDO2 Keys"
        ]
    },
    {
        "name": "Vitelec",
        "products": [
            "BNC",
            "TNC",
            "N-Type Connectors",
            "Cable Assemblies"
        ]
    },
    {
        "name": "Rosenberger",
        "products": [
            "HFM® (High-Speed Fakra-Mini)",
            "SMP Connectors",
            "Fiber Optics"
        ]
    },
    {
        "name": "OSI Laser",
        "products": [
            "905nm Pulsed Lasers",
            "InGaAs Photodiodes"
        ]
    },
    {
        "name": "Sensory",
        "products": [
            "TrulyHandsfree™ Voice Control",
            "Biometric ID"
        ]
    },
    {
        "name": "Walsin Technology",
        "products": [
            "MLCCs (Multilayer Ceramic Capacitors)",
            "Chip and Precision Thin Film Resistors",
            "Inductors, Chokes, and Ferrites",
            "RF Filters and Chip Antennas"
        ]
    },
    {
        "name": "Takachi",
        "products": [
            "IP68/67 Plastic Enclosures",
            "Diecast Aluminium Boxes",
            "Rackmount Chassis"
        ]
    },
    {
        "name": "Azoteq",
        "products": [
            "Proximity Sensors",
            "Touch Sensors",
            "IQS Series Trackpad ICs"
        ]
    },
    {
        "name": "Staubli",
        "products": [
            "CombiTac Modular Connectors",
            "MC4 Solar Connectors"
        ]
    },
    {
        "name": "Memsic",
        "products": [
            "MEMS Accelerometers",
            "Magnetometers (Hall Effect)",
            "Thermal MEMS"
        ]
    },
    {
        "name": "ESS Technology",
        "products": [
            "SABRE® DACs",
            "ADCs",
            "Headphone Amplifiers"
        ]
    },
    {
        "name": "I-PEX",
        "products": [
            "CABLINE® Micro-Coax",
            "NOVASTACK® Board-to-Board",
            "EV High Voltage"
        ]
    },
    {
        "name": "Netzer",
        "products": [
            "Electric Encoders",
            "Rotary Position Sensors"
        ]
    },
    {
        "name": "Positronic",
        "products": [
            "Scorpion Power Connectors",
            "D-Subminiature",
            "PosiBand Contacts"
        ]
    },
    {
        "name": "Fibreco",
        "products": [
            "Expanded Beam Connectors",
            "Junior/Mini Tactical Connectors"
        ]
    },
    {
        "name": "EAO",
        "products": [
            "Illuminated Push Buttons",
            "Emergency Stop & Stop Switches",
            "Joysticks & Lever Switches",
            "HMI Keypads and Control Panels"
        ]
    },
    {
        "name": "UD info",
        "products": [
            "Industrial CompactFlash",
            "DOM",
            "Wide-Temp SSDs"
        ]
    },
    {
        "name": "QT Brightek",
        "products": [
            "Optocouplers",
            "SMD LEDs",
            "Dot Matrix Displays"
        ]
    },
    {
        "name": "Cap-XX",
        "products": [
            "DMF Series (High Power)",
            "DMH Series (Ultra-Thin)",
            "Cylindrical Supercaps"
        ]
    },
    {
        "name": "2J Antennas",
        "products": [
            "5G/LTE Antennas",
            "GNSS Antennas",
            "WiFi 6E/7 Internal Antennas"
        ]
    },
    {
        "name": "SCI Semiconductor",
        "products": [
            "CHERI-enabled MCUs",
            "Safety-Critical RISC-V Processors"
        ]
    },
    {
        "name": "Good-Ark Semiconductor",
        "products": [
            "Schottky Rectifiers",
            "TVS Diodes",
            "Wafer Level Chip Scale Packaging"
        ]
    },
    {
        "name": "NorComp",
        "products": [
            "SEAL-D IP67 Connectors",
            "M-Series Machined Connectors",
            "Armor Backshells"
        ]
    },
    {
        "name": "Jobst Technologies",
        "products": [
            "Microfluidic Sensors",
            "Glucose/Lactate Monitoring Sensors"
        ]
    },
    {
        "name": "KDS Daishinku",
        "products": [
            "Tuning Fork Crystals",
            "TCXO",
            "Automotive Crystal Units"
        ]
    },
    {
        "name": "TXC",
        "products": [
            "Quartz Crystal Resonators (MHz/kHz)",
            "Crystal Oscillators (XO, VCXO, TCXO, OCXO)",
            "ThermSym Temperature-Controlled OCXOs",
            "Automotive-Grade Timing Components"
        ]
    },
    {
        "name": "Major League Electronics",
        "products": [
            "Terminal Blocks",
            "Pin Headers",
            "SIM Card Connectors"
        ]
    },
    {
        "name": "Denchi",
        "products": [
            "Military Lithium-Ion Battery Packs",
            "Intelligent Chargers"
        ]
    },
    {
        "name": "Solitron",
        "products": [
            "Power MOSFETs",
            "Voltage Regulators",
            "SiC Devices"
        ]
    },
    {
        "name": "AMX Semiconductor",
        "products": [
            "Milan End Points",
            "Audio DSPs",
            "Networked Audio Modules"
        ]
    },
    {
        "name": "Redler Technologies",
        "products": [
            "Solid State Power Controllers",
            "Intelligent PDUs",
            "Servo Drives"
        ]
    },
    {
        "name": "TPC",
        "products": [
            "Flex-Rigid PCBs",
            "High-Layer Count Boards"
        ]
    },
    {
        "name": "Bren-Tronics",
        "products": [
            "24V 6T Vehicle Battery",
            "BB-2590/U Li-Ion Battery",
            "Soldier Chargers"
        ]
    },
    {
        "name": "Semflex",
        "products": [
            "High Performance Microwave Cables",
            "HP Series"
        ]
    },
    {
        "name": "EDAC",
        "products": [
            "Card Edge Connectors",
            "Rack & Panel Connectors",
            "Waterproof D-Subs"
        ]
    },
    {
        "name": "Johnson Components",
        "products": [
            "SMA Connectors",
            "2.92mm Connectors",
            "RF Adapters"
        ]
    },
    {
        "name": "Apacer",
        "products": [
            "Industrial 3D NAND SSDs",
            "DDR4/DDR5 DRAM",
            "Anti-Sulfuration Modules"
        ]
    },
    {
        "name": "MegaChips Corporation",
        "products": [
            "Custom ASICs",
            "Smart Connectivity LSIs",
            "Timing Controllers"
        ]
    },
    {
        "name": "KEC",
        "products": [
            "Backshells",
            "EMC Glands",
            "Bulkhead Fittings"
        ]
    },
    {
        "name": "GK Services",
        "products": [
            "Click Connect Series",
            "Environmentally Sealed Connectors"
        ]
    },
    {
        "name": "Isocom Components",
        "products": [
            "Radiation Hard Optocouplers",
            "Solid State Relays",
            "MOSFET Switches"
        ]
    },
    {
        "name": "EVVA",
        "products": [
            "Marine Batteries (LFP/NMC up to 800V)",
            "OEM Li-ion Battery Packs",
            "Energy Storage Systems (LiFePO4 up to 3.35MWh)",
            "Mobile & Light EV Batteries (e-bikes, UAVs)"
        ]
    },
    {
        "name": "Mobile Mark",
        "products": [
            "Rugged Vehicle Antennas",
            "MIMO Antennas",
            "Public Safety Antennas"
        ]
    },
    {
        "name": "ALIF Semiconductor",
        "products": [
            "Ensemble™ Series MCUs",
            "Balletto™ BLE MCUs",
            "aiPM™ Technology"
        ]
    },
    {
        "name": "Weidmuller",
        "products": [
            "Klippon® Connectors",
            "Industrial Ethernet",
            "Power Supplies"
        ]
    },
    {
        "name": "LEMO",
        "products": [
            "B Series Push-Pull",
            "M Series Ratchet Coupling",
            "REDEL Medical"
        ]
    },
    {
        "name": "SiTime",
        "products": [
            "Elite X™ Super-TCXOs",
            "Endura™ Rugged Oscillators",
            "Emerald™ OCXOs"
        ]
    },
    {
        "name": "Minco",
        "products": [
            "Kapton Heaters",
            "Flex Circuits",
            "RTD Sensors"
        ]
    },
    {
        "name": "iNRCORE",
        "products": [
            "1kW Planar Transformers",
            "Pulse Transformers",
            "Delay Lines"
        ]
    },
    {
        "name": "Premier Photonics",
        "products": [
            "InGaAs PIN Photodiodes",
            "APD Detectors",
            "Pulsed Laser Diodes"
        ]
    },
    {
        "name": "Kinetic Technologies",
        "products": [
            "Load Switches",
            "LED Drivers",
            "USB-C/PD Controllers"
        ]
    },
    {
        "name": "Senstech AG",
        "products": [
            "OEM Force Sensors",
            "Load Cells",
            "Pressure Sensors"
        ]
    },
    {
        "name": "Techpoint Golledge",
        "products": [
            "SAW Filters",
            "Quartz Crystals",
            "OCXOs"
        ]
    },
    {
        "name": "CDS - Crystal Display Systems",
        "products": [
            "Ultra-Wide Stretched Displays",
            "Transparent LCDs",
            "Rugged TFTs"
        ]
    },
    {
        "name": "Densitron",
        "products": [
            "Aurora i.MX8 ARM Computers",
            "OLEDs",
            "ProDeck Panels"
        ]
    },
    {
        "name": "Trompeter",
        "products": [
            "Twinax/Triax Connectors",
            "PL75 Series",
            "1553 Bus Couplers"
        ]
    },
    {
        "name": "NoMIS Power",
        "products": [
            "SiC MOSFETs",
            "SiC Power Modules"
        ]
    },
    {
        "name": "HUBER+SUHNER",
        "products": [
            "RADOX® Cables",
            "SUCOFLEX® RF Assemblies",
            "EMP Protectors"
        ]
    },
    {
        "name": "Mega Electronics",
        "products": [
            "AC Adapters",
            "Desktop Power Supplies",
            "Open Frame Units"
        ]
    },
    {
        "name": "MSI",
        "products": [
            "Switched Capacitor Filters",
            "Spectrum Analyzer ICs"
        ]
    },
    {
        "name": "Transys Electronics",
        "products": [
            "Obsolete Transistors",
            "SCRs",
            "Custom Packaging"
        ]
    },
    {
        "name": "Alp Lab AB",
        "products": [
            "E1M Edge-1 AI Modules",
            "MCU Development Boards"
        ]
    },
    {
        "name": "PCTEL",
        "products": [
            "Industrial IoT Antennas",
            "GNSS Antennas",
            "RF Test Tools"
        ]
    },
    {
        "name": "Lyontek",
        "products": [
            "Low Power SRAM",
            "Audio Amplifiers",
            "Pseudo SRAM"
        ]
    },
    {
        "name": "AC Tasarim",
        "products": [
            "Shielding Braids",
            "Protective Sleeves",
            "Grounding Straps"
        ]
    },
    {
        "name": "Geyer Electronic",
        "products": [
            "TCXO Oscillators",
            "Quartz Crystals",
            "Resonators"
        ]
    },
    {
        "name": "PalPilot",
        "products": [
            "PCB Manufacturing",
            "RJ45 Connectors",
            "LAN Magnetics"
        ]
    },
    {
        "name": "GenZ",
        "products": [
            "Rackmount 48V/24V LFP Battery Modules",
            "Cabinet Energy Storage Solutions (indoor/outdoor/mine-spec)",
            "Tactical Defence Batteries (GenZ TED/TEC)",
            "Rackmount Distribution Modules"
        ]
    },
    {
        "name": "Axelera AI",
        "products": [
            "Metis™ AI Platform",
            "M.2 AI Accelerators",
            "PCIe Cards"
        ]
    },
    {
        "name": "Hongda Capacitors",
        "products": [
            "Conductive Polymer Capacitors",
            "Hybrid Aluminum Electrolytics"
        ]
    },
    {
        "name": "GLF Integrated Power",
        "products": [
            "IQSmart™ Load Switches",
            "Battery Protection ICs",
            "Deep Sleep Management"
        ]
    },
    {
        "name": "InnoSenT GmbH",
        "products": [
            "24GHz Radar Modules",
            "MIMO Radar",
            "Traffic Monitoring Sensors"
        ]
    },
    {
        "name": "Pleora Technologies",
        "products": [
            "External Frame Grabbers",
            "Embedded Video Interfaces"
        ]
    },
    {
        "name": "Littelfuse & C&K",
        "products": [
            "Tactile Switches",
            "Toggle Switches",
            "Fuses",
            "TVS Diodes"
        ]
    },
    {
        "name": "Approved Technology ATGBICS",
        "products": [
            "Optical Transceivers (SFP+)",
            "Direct Attach Cables (DAC)",
            "Fibre Patch Leads"
        ]
    },
    {
        "name": "Exascend",
        "products": [
            "Explorer Series Rugged SSDs",
            "AS500 PCIe Gen4",
            "CFexpress Type B"
        ]
    },
    {
        "name": "Tecate",
        "products": [
            "Ultracapacitor Modules",
            "Film Capacitors",
            "Ceramic Caps"
        ]
    },
    {
        "name": "Winslow Adaptics",
        "products": [
            "Obsolescence & Prototyping IC Adapters",
            "Sockets",
            "Heatsinks",
            "Connectors"
        ]
    },
    {
        "name": "Apex",
        "products": [
            "PA Series Power Op-Amps",
            "PWM Amplifiers",
            "SA Series Precision ICs"
        ]
    },
    {
        "name": "Puya Semiconductor",
        "products": [
            "SPI NOR Flash",
            "I2C EEPROM",
            "Ultra-Low Power MCUs"
        ]
    },
    {
        "name": "Innophase IoT",
        "products": [
            "Talaria TWO™ Wi-Fi/BLE Modules",
            "Ultra Low Power SoCs"
        ]
    },
    {
        "name": "ALLDSP",
        "products": [
            "PLP Series DSP Modules",
            "1800i / 1800B Loudspeaker Processors",
            "MIVIO MILAN Listener Platform",
            "UXT44 / UXT22 Dante Interfaces"
        ]
    },
    {
        "name": "Phoenix Contact",
        "products": [
            "COMBICON PCB Terminal Blocks",
            "M12 Circular Connectors",
            "PLCnext"
        ]
    },
    {
        "name": "Vadatech",
        "products": [
            "MicroTCA Chassis",
            "FMC Modules",
            "VPX Carriers"
        ]
    },
    {
        "name": "Innodisk",
        "products": [
            "InnoAGE™ SSDs",
            "Industrial DRAM",
            "CAN Bus Expansion Cards"
        ]
    },
    {
        "name": "Iontra",
        "products": [
            "MCU-based Charge Control Algorithms",
            "Battery Evaluation Kits"
        ]
    },
    {
        "name": "MH Connectors",
        "products": [
            "D-Sub Hoods",
            "RJ45 Connectors",
            "Stacked D-Subs"
        ]
    },
    {
        "name": "Ivativ, Inc",
        "products": [
            "Wi-Fi/Bluetooth Combo Modules",
            "Low Energy IoT Modules"
        ]
    },
    {
        "name": "Runic Technology",
        "products": [
            "Precision Op-Amps",
            "LDO Regulators",
            "Analog Switches"
        ]
    },
    {
        "name": "Pulsiv",
        "products": [
            "OSMIUM Power Conversion Technology"
        ]
    },
    {
        "name": "Amphenol Ltd",
        "products": [
            "MIL-DTL-38999",
            "Rhino",
            "Raptor",
            "Stingray",
            "WaSP",
            "Terrapin"
        ]
    },
    {
        "name": "DB Unlimited",
        "products": [
            "MEMS Microphones",
            "Piezo Indicators",
            "Waterproof Speakers"
        ]
    },
    {
        "name": "Reyax",
        "products": [
            "LoRa/LoRaWAN Modules",
            "BLE, Wi-Fi, and NB-IoT/LTE Modules",
            "GNSS/GPS and UWB Positioning Modules",
            "RFID/NFC and Antenna Accessories"
        ]
    },
    {
        "name": "UTA Wireless",
        "products": [
            "Cat1-bis Modules (KING, VITA, EIRA-R2, ROSE-R2)",
            "LTE Cat.4/4G Module (NAYA-L4)",
            "5G NR Automotive Modules (GENE-N8, THAD-N7)",
            "GNSS Modules (MINA-G8, RULA-G9, ZEKE-G2)"
        ]
    },
    {
        "name": "Silanna Semiconductor",
        "products": [
            "Active Clamp Flyback Controllers",
            "High Frequency DC/DC"
        ]
    },
    {
        "name": "Lightricity",
        "products": [
            "Indoor PV Cells",
            "Light Energy Harvesting Management"
        ]
    },
    {
        "name": "Masach",
        "products": [
            "Drawn EMI/RFI Shields",
            "Two-Piece Shield Cans"
        ]
    },
    {
        "name": "Noreast",
        "products": [
            "Custom Transformers",
            "Toroidal Inductors",
            "Common Mode Chokes"
        ]
    },
    {
        "name": "Globalscale Technologies",
        "products": [
            "ESPRESSOBin™ Boards",
            "Mochabin",
            "IoT Gateways"
        ]
    },
    {
        "name": "Quell",
        "products": [
            "EESeal® Connector Inserts"
        ]
    },
    {
        "name": "LEX TM3",
        "products": [
            "PowerRACK™ Distribution Units",
            "Portable Power Systems",
            "Cable Assemblies"
        ]
    },
    {
        "name": "Mercury Systems",
        "products": [
            "Secure SSDs",
            "RF/Microwave Modules",
            "VME/VPX Processing Boards"
        ]
    },
    {
        "name": "Elma",
        "products": [
            "OpenVPX Backplanes",
            "ATR Chassis",
            "Rotary Switches"
        ]
    },
    {
        "name": "Apem",
        "products": [
            "TS Series Thumbsticks",
            "Q Series LED Indicators",
            "IP69K Panel Switches"
        ]
    },
    {
        "name": "RLS Merilna Tehnika",
        "products": [
            "Magnetic Encoders (Rotary/Linear)",
            "AksIM™ Series"
        ]
    },
    {
        "name": "Netsol",
        "products": [
            "STT-MRAM",
            "Parallel/Serial SRAM"
        ]
    },
    {
        "name": "Adaptive Networks",
        "products": [
            "Industrial PLC Modules",
            "ANB Series",
            "ISO-15118 Interfaces"
        ]
    },
    {
        "name": "McGill Microwave",
        "products": [
            "LMR/RG Cable Assemblies",
            "Times Microwave LMR Coaxial Cables (LMR-195/240/400/600)",
            "RF Coaxial Connectors (N-Type, SMA, BNC, TNC)",
            "Helium-Optimised Antennas and LMR Assemblies"
        ]
    },
    {
        "name": "Iskra",
        "products": [
            "Power Capacitors",
            "RFI Filters",
            "Contactors"
        ]
    },
    {
        "name": "Innodisk (Apex)",
        "products": [
            "APEX-X200 (Blackwell)",
            "APEX-E100 Box PC",
            "Vision Modules"
        ]
    },
    {
        "name": "Octavo Systems",
        "products": [
            "OSD335x (BeagleBone on Chip)",
            "OSD32MP1"
        ]
    },
    {
        "name": "CCTC",
        "products": [
            "MLCC Capacitors",
            "Ceramic Ferrules",
            "Alumina Ceramic Substrates"
        ]
    },
    {
        "name": "Adactus",
        "products": [
            "GNSS Antennas",
            "5G/LTE External Antennas",
            "Embedded PCB Antennas"
        ]
    },
    {
        "name": "Nicomatic",
        "products": [
            "CMM Series",
            "EMM Series",
            "Flat Flexible Cables (Cabling)"
        ]
    },
    {
        "name": "ISSI",
        "products": [
            "Automotive Grade DRAM",
            "SRAM",
            "HyperFlash™",
            "eMMC"
        ]
    },
    {
        "name": "Fortec",
        "products": [
            "Optical Bonded TFTs",
            "Distec BoxPCs",
            "High-Brightness Displays"
        ]
    },
    {
        "name": "iST",
        "products": [
            "Thin-film Platinum Temperature Sensors",
            "Flow Sensors",
            "Bio-sensors"
        ]
    },
    {
        "name": "EDEA",
        "products": [
            "6T Lithium Phosphate Batteries",
            "Armoured Vehicle Power Packs"
        ]
    },
    {
        "name": "HTC Korea",
        "products": [
            "Linear Power ICs",
            "Switching Power ICs",
            "LDO Voltage Regulators"
        ]
    },
    {
        "name": "Kayal",
        "products": [
            "AC/DC EV Chargers",
            "Energy Meters",
            "Surge Protectors"
        ]
    },
    {
        "name": "Omega",
        "products": [
            "Thermocouples",
            "Pressure Transducers",
            "Flow Meters"
        ]
    },
    {
        "name": "American Bright",
        "products": [
            "PLCC LEDs",
            "High-Power Infrared Emitters",
            "AC LED Modules"
        ]
    },
    {
        "name": "CamdenBoss",
        "products": [
            "CNMB Modular DIN Rail Enclosures",
            "Hex-Box IoT Enclosures"
        ]
    },
    {
        "name": "Sensaggio",
        "products": [
            "Pressure Transmitters",
            "NTC Temperature Probes"
        ]
    },
    {
        "name": "Gowanda",
        "products": [
            "RF Inductors",
            "Conical Inductors",
            "Power Magnetics"
        ]
    },
    {
        "name": "Nolato",
        "products": [
            "Conductive Silicones",
            "Thermal Interface Materials",
            "Gaskets"
        ]
    },
    {
        "name": "Wise Integration",
        "products": [
            "GaN Power ICs (WiseGan®)",
            "Digital Controllers"
        ]
    },
    {
        "name": "EdgeCore",
        "products": [
            "Open Networking Switches (1G-800G)",
            "SONiC-Based Leaf-Spine Switch Platforms",
            "Disaggregated AI Infrastructure Platform",
            "Wi-Fi and Enterprise Networking Hardware"
        ]
    },
    {
        "name": "Ambient Scientific",
        "products": [
            "GPX-10 AI Processor",
            "GPX-10 Pro SoC",
            "Nebula AI Toolchain",
            "AmbiSense Platform"
        ]
    },
    {
        "name": "Hydra AS",
        "products": [
            "Motor Capacitors",
            "DC Link Capacitors",
            "Power Factor Correction Units"
        ]
    },
    {
        "name": "Oxley",
        "products": [
            "LED Night Vision Lighting",
            "EMI Filters",
            "Data Capture (ODC)"
        ]
    },
    {
        "name": "Midwest Microwave",
        "products": [
            "Attenuators",
            "Terminators",
            "Phase Shifters"
        ]
    },
    {
        "name": "Digi International",
        "products": [
            "Digi XBee® Modules",
            "ConnectCore® SOMs",
            "Industrial Cellular Routers"
        ]
    },
    {
        "name": "Turbo India",
        "products": [
            "Circular Connector Backshells",
            "Dust Caps",
            "Strain Relief"
        ]
    },
    {
        "name": "AiTech",
        "products": [
            "VME/VPX Boards",
            "SFF Mission Computers",
            "Radiation-Hardened SBCs"
        ]
    },
    {
        "name": "Avon Magnetics",
        "products": [
            "Custom Toroidal Transformers",
            "Common Mode Chokes",
            "Air Cored Coils"
        ]
    },
    {
        "name": "Infrasolid",
        "products": [
            "Thermal IR Emitters",
            "IR Detectors",
            "TO-packaged Sources"
        ]
    },
    {
        "name": "ELFYS",
        "products": [
            "QPD Product Line (QPD-385-Y)",
            "SM Product Line (SM322, SM446)",
            "PD Product Line (PD1s, PD4sM, PD5s, PD25s, PD100s)",
            "Custom Photodetector Design Services"
        ]
    },
    {
        "name": "RichWave",
        "products": [
            "Wi-Fi Front End Modules (FEM)",
            "RF Switches",
            "Wireless Video"
        ]
    },
    {
        "name": "Greenliant",
        "products": [
            "NANDrive™ BGA SSDs",
            "ArmourDrive™ Removable SSDs",
            "Industrial CompactFlash"
        ]
    },
    {
        "name": "ELVIN & Co.",
        "products": [
            "Custom Transformers",
            "Chokes",
            "Industrial Winding Parts"
        ]
    },
    {
        "name": "Harding",
        "products": [
            "Custom Lithium Ion Packs",
            "Smart Chargers",
            "NiMH Assemblies"
        ]
    },
    {
        "name": "Quantum Dice",
        "products": [
            "VERTEX PCIe QRNG Source",
            "DISC™ Certification Protocol"
        ]
    },
    {
        "name": "Intelligent Memory",
        "products": [
            "ECC DRAM",
            "Low Density SDRAM",
            "Industrial Managed NAND"
        ]
    },
    {
        "name": "Winchester",
        "products": [
            "Socket Adapters",
            "Prototyping Hardware",
            "Obsolescence Adapters"
        ]
    },
    {
        "name": "OSI Opto",
        "products": [
            "Silicon Photodiodes",
            "X-Ray Detectors",
            "Color Sensors"
        ]
    },
    {
        "name": "Cinch",
        "products": [
            "Dura-Con™ Micro-D",
            "Omega MIL-C-26500",
            "ModICE® Enclosures"
        ]
    },
    {
        "name": "Passive Plus",
        "products": [
            "Fixed and Variable (Trimmer) Capacitors",
            "Thin Film Resistors and Attenuators",
            "Broadband Conical Inductors",
            "Custom Capacitor Assemblies and Design Kits"
        ]
    },
    {
        "name": "GSI Technology",
        "products": [
            "Gemini-II® APU",
            "Rad-Hard Monolithic SRAM",
            "Low Latency DRAM"
        ]
    },
    {
        "name": "SynQor",
        "products": [
            "Mil-COTS DC-DC Converters",
            "VPX Power Supplies",
            "UPS"
        ]
    },
    {
        "name": "MicroOled",
        "products": [
            "OLED Microdisplays",
            "Active Matrix OLED"
        ]
    },
    {
        "name": "XMOS",
        "products": [
            "xCORE® Multicore MCUs",
            "VocalFusion® Voice Processors"
        ]
    }
]
};
