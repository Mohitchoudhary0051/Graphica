/* ============================================
   GRAPHICA — Demo Data Module
   All seed data for the prototype
   ============================================ */

const DemoData = (() => {

  const institution = {
    name: 'Greenfield Institute of Technology',
    campus: 'Main Campus',
    address: '42 Greenfield Road, Oakville',
    phone: '+1 (555) 200-1000',
    email: 'safety@greenfield.edu'
  };

  const buildings = [
    { id: 'block-a', name: 'Block A', floors: 3, description: 'Academic Block — Engineering' },
    { id: 'block-b', name: 'Block B', floors: 3, description: 'Academic Block — Sciences' },
    { id: 'science', name: 'Science Building', floors: 2, description: 'Laboratories & Research' },
    { id: 'admin', name: 'Administration Block', floors: 2, description: 'Offices & Records' },
    { id: 'library', name: 'Library', floors: 2, description: 'Central Library' },
    { id: 'auditorium', name: 'Auditorium', floors: 1, description: 'Main Auditorium' }
  ];

  const users = [
    {
      id: 'user-001',
      name: 'Arjun Mehta',
      email: 'student@graphica.demo',
      password: 'demo123',
      role: 'student',
      department: 'Computer Science',
      avatar: null,
      status: 'active',
      joinDate: '2025-08-15'
    },
    {
      id: 'user-002',
      name: 'Priya Sharma',
      email: 'staff@graphica.demo',
      password: 'demo123',
      role: 'staff',
      department: 'Safety & Facilities',
      avatar: null,
      status: 'active',
      joinDate: '2023-06-01'
    },
    {
      id: 'user-003',
      name: 'Dr. Rajesh Kapoor',
      email: 'admin@graphica.demo',
      password: 'demo123',
      role: 'admin',
      department: 'Administration',
      avatar: null,
      status: 'active',
      joinDate: '2021-01-10'
    },
    {
      id: 'user-004',
      name: 'Sneha Patel',
      email: 'sneha@greenfield.edu',
      password: 'demo123',
      role: 'student',
      department: 'Electrical Engineering',
      avatar: null,
      status: 'active',
      joinDate: '2025-08-15'
    },
    {
      id: 'user-005',
      name: 'Vikram Rao',
      email: 'vikram@greenfield.edu',
      password: 'demo123',
      role: 'staff',
      department: 'Maintenance',
      avatar: null,
      status: 'active',
      joinDate: '2024-03-20'
    }
  ];

  const emergencyContacts = [
    { name: 'Campus Security', phone: '+1 (555) 200-1111', available: '24/7' },
    { name: 'Medical Room', phone: '+1 (555) 200-1222', available: '8 AM – 6 PM' },
    { name: 'Administration Office', phone: '+1 (555) 200-1000', available: '9 AM – 5 PM' },
    { name: 'Fire Services', phone: '911', available: '24/7' },
    { name: 'Safety Officer — Priya Sharma', phone: '+1 (555) 200-1333', available: '8 AM – 5 PM' },
    { name: 'Poison Control', phone: '+1 (800) 222-1222', available: '24/7' }
  ];

  // ── Learning Modules ──────────────────────────
  const learningModules = [
    {
      id: 'fire-safety',
      title: 'Fire Safety',
      icon: 'flame',
      category: 'fire',
      duration: '25 min',
      difficulty: 'Essential',
      description: 'Learn how to prevent, identify, and respond to fire emergencies in an educational setting.',
      overview: `Fire is one of the most common emergencies in buildings. Knowing what to do before, during, and after a fire can save lives. This module covers fire prevention, alarm response, evacuation procedures, and extinguisher basics for educational institutions.`,
      before: [
        'Know the location of fire exits, extinguishers, and alarm pull stations on your floor.',
        'Identify at least two evacuation routes from every room you regularly use.',
        'Keep corridors, stairwells, and exits clear of obstructions at all times.',
        'Report any damaged fire safety equipment immediately.',
        'Familiarize yourself with the sound of the fire alarm.'
      ],
      during: [
        'If you discover a fire, activate the nearest fire alarm pull station.',
        'Alert others in the immediate area and begin evacuation.',
        'Stay low if there is smoke — crawl below the smoke layer.',
        'Feel doors before opening — if hot, use an alternate route.',
        'Close doors behind you to slow the spread of fire.',
        'Move to the designated assembly point and stay there.',
        'Do not use elevators.',
        'Do not re-enter the building until cleared by authorities.'
      ],
      after: [
        'Remain at the assembly point until headcount is confirmed.',
        'Report any missing persons to emergency personnel.',
        'Seek medical attention for smoke inhalation or burns.',
        'Do not re-enter the building until fire services declare it safe.',
        'Report the incident and cooperate with investigations.'
      ],
      doList: [
        'Stay calm and follow evacuation procedures.',
        'Use stairways, not elevators.',
        'Help others who need assistance if it is safe to do so.',
        'Close doors behind you.',
        'Go to the assembly point.'
      ],
      dontList: [
        'Do not use elevators during a fire.',
        'Do not run — walk quickly and calmly.',
        'Do not go back for personal belongings.',
        'Do not prop open fire doors.',
        'Do not hide in restrooms or closets.'
      ],
      checklist: [
        'I know where the nearest fire exit is.',
        'I know where the nearest fire extinguisher is.',
        'I know the fire alarm sound.',
        'I know my assembly point.',
        'I know at least two evacuation routes.'
      ]
    },
    {
      id: 'earthquake-safety',
      title: 'Earthquake Safety',
      icon: 'mountain',
      category: 'earthquake',
      duration: '20 min',
      difficulty: 'Essential',
      description: 'Understand earthquake preparedness and the Drop, Cover, and Hold On technique.',
      overview: `Earthquakes can strike without warning. Buildings, furniture, and falling objects pose the greatest risk. This module teaches the internationally recommended Drop, Cover, and Hold On technique and how to prepare for seismic events.`,
      before: [
        'Identify safe spots in each room — under sturdy desks or tables, away from windows.',
        'Secure heavy furniture, bookshelves, and lab equipment to walls.',
        'Know the building evacuation routes for post-earthquake evacuation.',
        'Keep an emergency kit accessible: water, flashlight, first aid.',
        'Practice Drop, Cover, and Hold On regularly.'
      ],
      during: [
        'DROP to your hands and knees immediately.',
        'Take COVER under a sturdy desk or table. Protect your head and neck.',
        'HOLD ON to your shelter until shaking stops.',
        'If no shelter is available, move to an interior wall and protect your head.',
        'Stay away from windows, glass, heavy objects, and exterior walls.',
        'If outdoors, move to an open area away from buildings and power lines.',
        'Do not run outside during shaking.',
        'If in a wheelchair, lock the wheels, cover your head and neck.'
      ],
      after: [
        'Check yourself and others for injuries.',
        'Evacuate the building once shaking stops — use stairs, not elevators.',
        'Watch for falling debris, broken glass, and damaged structures.',
        'Move to an open assembly area.',
        'Be prepared for aftershocks.',
        'Report structural damage and injuries.',
        'Do not re-enter damaged buildings.'
      ],
      doList: [
        'Drop, Cover, and Hold On immediately.',
        'Protect your head and neck.',
        'Stay indoors until shaking stops, then evacuate.',
        'Move away from windows and heavy objects.',
        'Check for injuries after shaking stops.'
      ],
      dontList: [
        'Do not run during an earthquake.',
        'Do not stand in doorways (this is a myth).',
        'Do not use elevators.',
        'Do not go near damaged buildings.',
        'Do not light matches or candles — gas leaks may be present.'
      ],
      checklist: [
        'I know the Drop, Cover, Hold On technique.',
        'I have identified safe spots in my classroom.',
        'I know where to assemble after an earthquake.',
        'I know how to check for gas leaks.',
        'I know what to do during aftershocks.'
      ]
    },
    {
      id: 'electrical-safety',
      title: 'Electrical Safety',
      icon: 'zap',
      category: 'electrical',
      duration: '20 min',
      difficulty: 'Essential',
      description: 'Recognize electrical hazards and respond safely to electrical emergencies.',
      overview: `Electrical hazards are common in educational institutions with labs, workshops, and aging infrastructure. This module covers hazard recognition, safe practices, and emergency response for electrical incidents.`,
      before: [
        'Report any damaged electrical outlets, exposed wiring, or sparking equipment.',
        'Never overload power outlets with multiple devices.',
        'Keep water and liquids away from electrical equipment.',
        'Know the location of electrical panels and circuit breakers.',
        'Learn how to safely disconnect power in an emergency.'
      ],
      during: [
        'If you see sparks or smell burning from an outlet, disconnect the device if safe.',
        'Do not touch someone who is in contact with a live electrical source.',
        'Use a non-conductive material (wood, rubber) to separate a person from a live wire.',
        'If a person is receiving a shock, turn off the power source first.',
        'Call for emergency medical help immediately.',
        'If there is an electrical fire, use a CO2 or dry powder extinguisher — never water.'
      ],
      after: [
        'Ensure the power source is disconnected.',
        'Provide first aid for electrical burns — cool the area, do not apply ointments.',
        'Report the incident to campus security and maintenance.',
        'The affected area should remain closed until inspected.',
        'Document what happened for the safety record.'
      ],
      doList: [
        'Report damaged outlets and exposed wires.',
        'Disconnect power before helping a shock victim if possible.',
        'Use non-conductive materials to separate a person from live wires.',
        'Use appropriate fire extinguishers for electrical fires.',
        'Seek medical help for electrical burns.'
      ],
      dontList: [
        'Do not touch a person in contact with a live wire with bare hands.',
        'Do not use water on electrical fires.',
        'Do not overload power outlets.',
        'Do not attempt to repair electrical equipment yourself.',
        'Do not ignore burning smells from outlets.'
      ],
      checklist: [
        'I know where the nearest electrical panel is.',
        'I know how to safely disconnect power.',
        'I know which extinguisher to use for electrical fires.',
        'I know not to touch a person receiving a shock.',
        'I know how to report electrical hazards.'
      ]
    },
    {
      id: 'flood-safety',
      title: 'Flood Safety',
      icon: 'droplets',
      category: 'flood',
      duration: '15 min',
      difficulty: 'Important',
      description: 'Prepare for and respond to flooding situations on campus.',
      overview: `Flooding can result from heavy rain, plumbing failures, or natural disasters. This module covers preparation, response, and recovery for flood situations in educational institutions.`,
      before: [
        'Know if your campus is in a flood-prone area.',
        'Identify higher ground and upper floors for emergency shelter.',
        'Keep important documents and electronics elevated from floor level in labs.',
        'Ensure drainage systems and gutters are clear.',
        'Know the campus flood evacuation plan.'
      ],
      during: [
        'Move to higher ground or upper floors immediately.',
        'Avoid walking through moving water — 15 cm of moving water can knock you down.',
        'Stay away from floodwater — it may be electrically charged or contaminated.',
        'Do not drive or walk through flooded areas.',
        'Disconnect electrical equipment if water is rising and it is safe to do so.',
        'Follow instructions from campus security and emergency services.'
      ],
      after: [
        'Do not return to flooded buildings until cleared by authorities.',
        'Watch for structural damage — weakened walls, floors, and ceilings.',
        'Avoid contact with floodwater — it may contain sewage or chemicals.',
        'Report damage to facilities management.',
        'Document damage for insurance and records.'
      ],
      doList: [
        'Move to higher ground immediately.',
        'Disconnect electronics if safe to do so.',
        'Follow campus evacuation routes.',
        'Report flooding to campus security.',
        'Stay away from floodwater.'
      ],
      dontList: [
        'Do not walk through floodwater.',
        'Do not touch electrical equipment in flooded areas.',
        'Do not return to buildings until cleared.',
        'Do not ignore flood warnings.',
        'Do not underestimate the power of moving water.'
      ],
      checklist: [
        'I know the campus flood evacuation routes.',
        'I know where higher ground is on campus.',
        'I know to avoid walking through floodwater.',
        'I know how to report flood damage.',
        'I know the dangers of contaminated floodwater.'
      ]
    },
    {
      id: 'severe-weather',
      title: 'Severe Weather',
      icon: 'cloud-lightning',
      category: 'weather',
      duration: '15 min',
      difficulty: 'Important',
      description: 'Respond safely to severe weather including storms, lightning, and extreme heat.',
      overview: `Severe weather events — thunderstorms, lightning, high winds, extreme heat — can pose serious risks on campus. This module covers weather awareness, shelter procedures, and heat safety.`,
      before: [
        'Monitor local weather forecasts during severe weather season.',
        'Know the campus severe weather shelter locations.',
        'Identify interior rooms on the lowest floor — away from windows.',
        'Keep emergency supplies accessible: water, flashlight, phone charger.',
        'Know the difference between a watch (conditions possible) and a warning (event occurring).'
      ],
      during: [
        'Move indoors immediately when severe weather warnings are issued.',
        'Go to an interior room on the lowest floor, away from windows.',
        'If lightning is nearby, stay away from windows, plumbing, and electrical equipment.',
        'If caught outdoors in lightning, crouch low — do not lie flat or shelter under trees.',
        'During extreme heat, stay hydrated, stay in shade, and watch for signs of heat stroke.',
        'Follow all campus announcements and PA instructions.'
      ],
      after: [
        'Remain sheltered until the all-clear is given.',
        'Watch for downed power lines, fallen trees, and structural damage.',
        'Report any damage or injuries to campus security.',
        'Check on others who may need help.',
        'Resume normal activities only when instructed.'
      ],
      doList: [
        'Monitor weather alerts and campus announcements.',
        'Move to shelter immediately during warnings.',
        'Stay away from windows during storms.',
        'Stay hydrated during extreme heat.',
        'Report damage and injuries.'
      ],
      dontList: [
        'Do not ignore weather warnings.',
        'Do not shelter under trees during lightning.',
        'Do not touch downed power lines.',
        'Do not go outdoors during a tornado warning.',
        'Do not underestimate heat-related illness.'
      ],
      checklist: [
        'I know the campus severe weather shelter locations.',
        'I know the difference between a watch and a warning.',
        'I know what to do during lightning.',
        'I know the signs of heat stroke.',
        'I know to stay away from windows during storms.'
      ]
    }
  ];

  // ── Quiz Questions ──────────────────────────
  const quizQuestions = {
    'fire-safety': [
      {
        id: 'fq1',
        question: 'What is the first thing you should do if you discover a fire in a building?',
        options: [
          'Try to extinguish it yourself',
          'Activate the nearest fire alarm pull station',
          'Call your family',
          'Open windows to let smoke out'
        ],
        correct: 1,
        explanation: 'Activating the fire alarm alerts everyone in the building and triggers emergency response. Personal firefighting should only be attempted with small fires and proper equipment.'
      },
      {
        id: 'fq2',
        question: 'What should you do if there is smoke in a corridor during evacuation?',
        options: [
          'Run through it quickly',
          'Stay standing and cover your nose with your hand',
          'Stay low and crawl below the smoke layer',
          'Wait for the smoke to clear'
        ],
        correct: 2,
        explanation: 'Smoke rises, so the air is cleaner near the floor. Staying low and crawling reduces smoke inhalation, which is the leading cause of fire-related deaths.'
      },
      {
        id: 'fq3',
        question: 'Should you use an elevator during a fire evacuation?',
        options: [
          'Yes, it is faster',
          'Only if the fire is on a different floor',
          'Never — always use stairways',
          'Only if the elevator is designated for fire service'
        ],
        correct: 2,
        explanation: 'Elevators can malfunction during fires, open on the fire floor, or fill with smoke. Always use stairways for fire evacuation.'
      },
      {
        id: 'fq4',
        question: 'What should you do before opening a closed door during a fire?',
        options: [
          'Open it quickly to check',
          'Kick it open',
          'Feel the door and handle — if hot, use an alternate route',
          'Wait for someone else to open it'
        ],
        correct: 2,
        explanation: 'A hot door indicates fire on the other side. Opening it could cause a backdraft. Always check and use an alternate route if the door is warm or hot.'
      },
      {
        id: 'fq5',
        question: 'Where should you go after evacuating a building during a fire?',
        options: [
          'The nearest café',
          'Back to the building entrance to watch',
          'The designated assembly point',
          'Your vehicle in the parking lot'
        ],
        correct: 2,
        explanation: 'Assembly points are designated safe areas where headcounts are conducted. Going there ensures you are accounted for and receive further instructions.'
      },
      {
        id: 'fq6',
        question: 'What type of fire extinguisher should you NEVER use on an electrical fire?',
        options: [
          'CO2 extinguisher',
          'Dry powder extinguisher',
          'Water extinguisher',
          'Foam extinguisher'
        ],
        correct: 2,
        explanation: 'Water conducts electricity and can cause electrocution. Use CO2 or dry powder extinguishers for electrical fires.'
      }
    ],
    'earthquake-safety': [
      {
        id: 'eq1',
        question: 'What is the recommended immediate response when an earthquake starts?',
        options: [
          'Run toward the nearest exit',
          'Drop, Cover, and Hold On',
          'Stand in a doorway',
          'Jump out of a window if on the ground floor'
        ],
        correct: 1,
        explanation: 'Drop, Cover, and Hold On is the internationally recommended technique. Running during shaking is dangerous due to falling objects and structural failure.'
      },
      {
        id: 'eq2',
        question: 'Which is the safest place during an earthquake indoors?',
        options: [
          'Near windows for quick escape',
          'In the elevator',
          'Under a sturdy desk or table, away from windows',
          'In a doorway'
        ],
        correct: 2,
        explanation: 'A sturdy desk or table provides protection from falling debris. Doorways are no safer than other parts of modern buildings. Stay away from windows, which can shatter.'
      },
      {
        id: 'eq3',
        question: 'What should you do immediately after an earthquake stops?',
        options: [
          'Run back inside to collect belongings',
          'Stay where you are indefinitely',
          'Evacuate the building using stairs and watch for damage',
          'Use the elevator to exit quickly'
        ],
        correct: 2,
        explanation: 'After shaking stops, carefully evacuate using stairs. Watch for structural damage, broken glass, and fallen debris. Be prepared for aftershocks.'
      },
      {
        id: 'eq4',
        question: 'Why should you not light matches or candles after an earthquake?',
        options: [
          'The flames could attract aftershocks',
          'There may be gas leaks that could ignite',
          'The building code prohibits it',
          'It wastes emergency supplies'
        ],
        correct: 1,
        explanation: 'Earthquakes can rupture gas lines. An open flame near a gas leak can cause an explosion. Use flashlights instead.'
      },
      {
        id: 'eq5',
        question: 'What should you do if you are outdoors when an earthquake starts?',
        options: [
          'Run inside the nearest building',
          'Move to an open area away from buildings and power lines',
          'Lie flat on the ground',
          'Get into your car'
        ],
        correct: 1,
        explanation: 'Open areas reduce the risk of being hit by falling debris from buildings, power lines, or trees. Stay away from structures until shaking stops.'
      }
    ],
    'electrical-safety': [
      {
        id: 'elq1',
        question: 'What should you do if you see someone being electrocuted by a live wire?',
        options: [
          'Grab them and pull them away',
          'Pour water on them to break the circuit',
          'Turn off the power source or use a non-conductive material to separate them',
          'Wait until they fall away naturally'
        ],
        correct: 2,
        explanation: 'Never touch someone in contact with electricity — you will also be electrocuted. Turn off the power source or use a non-conductive material like wood or rubber to push them away.'
      },
      {
        id: 'elq2',
        question: 'Which extinguisher should you use for an electrical fire?',
        options: [
          'Water extinguisher',
          'CO2 or dry powder extinguisher',
          'Foam extinguisher',
          'Any available extinguisher'
        ],
        correct: 1,
        explanation: 'CO2 and dry powder extinguishers are safe for electrical fires. Water and foam can conduct electricity and cause electrocution.'
      },
      {
        id: 'elq3',
        question: 'What is a common sign of an electrical hazard in a building?',
        options: [
          'Cold floor tiles',
          'Burning smell from an outlet or flickering lights',
          'Unusual silence',
          'Bright fluorescent lighting'
        ],
        correct: 1,
        explanation: 'A burning smell, sparking outlets, warm switch plates, and flickering lights all indicate potential electrical faults that should be reported immediately.'
      },
      {
        id: 'elq4',
        question: 'Why should you not overload power outlets?',
        options: [
          'It increases your electricity bill',
          'It can cause overheating, melting, and fire',
          'It slows down your devices',
          'It makes the lights brighter'
        ],
        correct: 1,
        explanation: 'Overloaded outlets draw more current than the wiring can safely handle, causing overheating that can melt insulation and start fires.'
      },
      {
        id: 'elq5',
        question: 'What should you do if you notice a damaged electrical outlet?',
        options: [
          'Cover it with tape',
          'Ignore it if it still works',
          'Report it immediately and do not use it',
          'Try to fix it yourself'
        ],
        correct: 2,
        explanation: 'Damaged outlets should be reported to maintenance and not used until professionally repaired. Covering with tape or attempting self-repair is dangerous.'
      }
    ],
    'flood-safety': [
      {
        id: 'flq1',
        question: 'How much moving water can knock a person off their feet?',
        options: [
          'About 1 meter',
          'About 15 centimeters (6 inches)',
          'Only waist-deep water',
          'Moving water cannot knock you down'
        ],
        correct: 1,
        explanation: 'Just 15 cm (6 inches) of fast-moving water can knock an adult off their feet. Never walk through moving floodwater.'
      },
      {
        id: 'flq2',
        question: 'Why should you avoid contact with floodwater?',
        options: [
          'It is always very cold',
          'It may be contaminated with sewage, chemicals, or electrically charged',
          'It causes permanent staining on clothes',
          'There is no particular reason to avoid it'
        ],
        correct: 1,
        explanation: 'Floodwater often contains sewage, chemicals, and debris. Submerged electrical systems can also make it electrically charged.'
      },
      {
        id: 'flq3',
        question: 'What is the safest place during a flood in a multi-story building?',
        options: [
          'The basement',
          'The ground floor',
          'Upper floors or the roof',
          'The parking garage'
        ],
        correct: 2,
        explanation: 'Moving to higher ground — upper floors or even the roof — provides the safest position during flooding. Basements and ground floors are the most dangerous.'
      },
      {
        id: 'flq4',
        question: 'When should you disconnect electrical equipment during a flood?',
        options: [
          'After the water reaches the outlets',
          'When water is rising and it is still safe to access the equipment',
          'Only after the flood recedes',
          'Never — leave everything connected'
        ],
        correct: 1,
        explanation: 'Disconnect electronics early, while it is still safe. Once water reaches electrical outlets or equipment, touching them becomes extremely dangerous.'
      }
    ],
    'severe-weather': [
      {
        id: 'swq1',
        question: 'What is the difference between a weather "watch" and a "warning"?',
        options: [
          'A watch means it is happening; a warning means it might happen',
          'A watch means conditions are possible; a warning means the event is occurring or imminent',
          'They mean the same thing',
          'A watch is more serious than a warning'
        ],
        correct: 1,
        explanation: 'A watch means conditions are favorable for severe weather. A warning means severe weather is occurring or imminent — take action immediately.'
      },
      {
        id: 'swq2',
        question: 'Where should you shelter during a thunderstorm with lightning?',
        options: [
          'Under a large tree',
          'In an open field, crouching low',
          'In an interior room on the lowest floor, away from windows',
          'On the roof for better visibility'
        ],
        correct: 2,
        explanation: 'Interior rooms on lower floors provide the best protection from lightning, flying debris, and high winds. Trees attract lightning and windows can shatter.'
      },
      {
        id: 'swq3',
        question: 'What are early signs of heat stroke?',
        options: [
          'Shivering and pale skin',
          'Hot dry skin, confusion, rapid pulse, headache',
          'Increased appetite and energy',
          'Cold sweats and low blood pressure'
        ],
        correct: 1,
        explanation: 'Heat stroke symptoms include hot/dry skin (sweating may stop), confusion, rapid pulse, headache, and nausea. It is a medical emergency requiring immediate cooling and medical help.'
      },
      {
        id: 'swq4',
        question: 'Why should you stay away from downed power lines after a storm?',
        options: [
          'They are a tripping hazard',
          'They may still be energized and can electrocute you from several meters away',
          'They block traffic',
          'They are someone else\'s responsibility'
        ],
        correct: 1,
        explanation: 'Downed power lines can remain energized and electrify the ground around them. Stay at least 10 meters away and report them to emergency services.'
      }
    ]
  };

  // ── Simulation Scenarios ──────────────────────────
  const simulations = [
    {
      id: 'sim-fire-classroom',
      title: 'Fire in the Classroom',
      category: 'fire',
      icon: 'flame',
      difficulty: 'Intermediate',
      duration: '10 min',
      description: 'You notice smoke in a classroom. Make the right decisions to keep yourself and others safe.',
      steps: [
        {
          id: 's1',
          narrative: 'You are in a classroom on the second floor of Block A during a lecture. You notice a thin trail of smoke coming from an electrical socket near the window. The smoke has a sharp, acrid smell. About 30 students are in the room.',
          question: 'What do you do first?',
          choices: [
            { text: 'Activate the fire alarm and alert the instructor', correct: true, feedback: 'Correct. Activating the alarm ensures the entire building is alerted. This is always the first priority.' },
            { text: 'Investigate the socket to see what is burning', correct: false, feedback: 'Incorrect. Investigating an electrical fire puts you at risk of shock or burns. Alert others first.' },
            { text: 'Quietly leave the room without telling anyone', correct: false, feedback: 'Incorrect. Leaving without alerting others puts 30 people at risk. Always raise the alarm.' },
            { text: 'Open the windows to let the smoke out', correct: false, feedback: 'Incorrect. Opening windows can feed oxygen to the fire. Evacuate first.' }
          ]
        },
        {
          id: 's2',
          narrative: 'The fire alarm is now sounding. The instructor asks everyone to evacuate. Some students are rushing toward the main staircase. Others are heading for the elevator.',
          question: 'What is the safest evacuation approach?',
          choices: [
            { text: 'Take the elevator — it is faster for getting down from the 2nd floor', correct: false, feedback: 'Incorrect. Elevators must never be used during a fire. They can open on the fire floor or lose power.' },
            { text: 'Use the nearest stairway, walking quickly but not running', correct: true, feedback: 'Correct. Stairways are the safest exit. Walk quickly but calmly to prevent falls and panic.' },
            { text: 'Wait in the classroom until firefighters arrive', correct: false, feedback: 'Incorrect. Unless exits are blocked, you should evacuate immediately. Waiting allows smoke to accumulate.' },
            { text: 'Jump from the second floor window', correct: false, feedback: 'Incorrect. A two-story jump risks serious injury. Use the stairway instead.' }
          ]
        },
        {
          id: 's3',
          narrative: 'As you approach the stairway, you see another student struggling with a heavy bag. The corridor is getting smoky.',
          question: 'What do you do?',
          choices: [
            { text: 'Tell them to leave the bag and help them move toward the stairway', correct: true, feedback: 'Correct. Personal belongings should be abandoned. Help others evacuate safely — lives matter more than bags.' },
            { text: 'Go back to the classroom to get your own belongings', correct: false, feedback: 'Incorrect. Never go back for belongings during a fire. Every second counts.' },
            { text: 'Push past them quickly — you need to get out', correct: false, feedback: 'Incorrect. Pushing can cause falls and panic, especially in a smoky stairway. Help others if safe.' },
            { text: 'Stop and wait for them to sort out their bag', correct: false, feedback: 'Incorrect. Standing still in a smoky corridor increases smoke inhalation. Help them leave the bag and move.' }
          ]
        },
        {
          id: 's4',
          narrative: 'You have exited the building. There is a crowd forming near the building entrance. Some people are talking about going back inside.',
          question: 'What is the correct action now?',
          choices: [
            { text: 'Go back inside to check if anyone is left', correct: false, feedback: 'Incorrect. Never re-enter a burning building. Trained firefighters handle search and rescue.' },
            { text: 'Move to the designated assembly point and wait for a headcount', correct: true, feedback: 'Correct. The assembly point is where attendance is checked and emergency services are coordinated.' },
            { text: 'Leave campus and go home', correct: false, feedback: 'Incorrect. Leaving means you cannot be accounted for. Emergency responders may risk their lives searching for you.' },
            { text: 'Stand near the building entrance to watch', correct: false, feedback: 'Incorrect. Staying near the building is dangerous. Debris, smoke, or explosions could occur.' }
          ]
        }
      ]
    },
    {
      id: 'sim-earthquake',
      title: 'Earthquake During Class',
      category: 'earthquake',
      icon: 'mountain',
      difficulty: 'Intermediate',
      duration: '10 min',
      description: 'An earthquake strikes while you are in class. Navigate the situation safely.',
      steps: [
        {
          id: 's1',
          narrative: 'You are in a ground-floor laboratory in the Science Building. Suddenly, the floor starts shaking violently. Lab equipment is rattling, ceiling tiles are dropping, and students are screaming.',
          question: 'What is your immediate response?',
          choices: [
            { text: 'Run out of the building immediately', correct: false, feedback: 'Incorrect. Running during an earthquake is dangerous — falling objects and structural failures are most deadly during shaking.' },
            { text: 'Drop under a sturdy lab table, cover your head, and hold on', correct: true, feedback: 'Correct. Drop, Cover, and Hold On protects you from falling debris. A sturdy table is the best available shelter.' },
            { text: 'Stand in the doorway', correct: false, feedback: 'Incorrect. The doorway myth is outdated. Modern doorways are no stronger than other parts of the building.' },
            { text: 'Try to secure the lab equipment to prevent damage', correct: false, feedback: 'Incorrect. Your safety is the priority, not equipment. Attempting to secure heavy items during shaking puts you at risk.' }
          ]
        },
        {
          id: 's2',
          narrative: 'The shaking has lasted about 30 seconds and is slowing. Ceiling tiles have fallen, a shelf has toppled, and there is broken glass on the floor. The shaking stops.',
          question: 'What do you do now?',
          choices: [
            { text: 'Stay under the table indefinitely', correct: false, feedback: 'Incorrect. Once shaking stops, you should cautiously evacuate. But do be prepared for aftershocks.' },
            { text: 'Carefully check for injuries, then evacuate using the stairway', correct: true, feedback: 'Correct. Check yourself and nearby people for injuries. Then evacuate carefully, watching for broken glass and structural damage.' },
            { text: 'Use the elevator to evacuate', correct: false, feedback: 'Incorrect. Elevators should never be used after an earthquake. They may be damaged or lose power.' },
            { text: 'Light a match to check for damage in dark areas', correct: false, feedback: 'Incorrect. Gas lines may be ruptured. Any open flame could cause an explosion.' }
          ]
        },
        {
          id: 's3',
          narrative: 'As you move through the corridor, you notice cracks in the walls and water dripping from the ceiling. Another student has a cut on their arm from broken glass.',
          question: 'How do you handle this?',
          choices: [
            { text: 'Ignore the injuries and run outside as fast as possible', correct: false, feedback: 'Incorrect. While evacuation is important, basic first aid (pressure on a wound) takes seconds and could prevent serious blood loss.' },
            { text: 'Help apply pressure to their wound, then evacuate together carefully', correct: true, feedback: 'Correct. Apply basic first aid quickly, then continue evacuating together. Watch for further hazards like falling debris.' },
            { text: 'Go back to the lab to get the first aid kit', correct: false, feedback: 'Incorrect. The building may be structurally compromised. Do not go back inside. First aid supplies will be available at the assembly point.' },
            { text: 'Tell them to wait while you go get professional help', correct: false, feedback: 'Incorrect. Leaving an injured person alone in a damaged building is dangerous. Help them evacuate.' }
          ]
        },
        {
          id: 's4',
          narrative: 'You have reached the open assembly area. An aftershock hits — a brief but strong tremor. Some people start running.',
          question: 'What is the correct response?',
          choices: [
            { text: 'Run toward the parking lot', correct: false, feedback: 'Incorrect. Running during aftershocks is dangerous. Drop and cover where you are.' },
            { text: 'Go back inside to shelter', correct: false, feedback: 'Incorrect. Buildings may be damaged and unsafe. Stay in the open area.' },
            { text: 'Drop to the ground, protect your head, and stay in the open area', correct: true, feedback: 'Correct. In an open area, drop and protect your head. Stay away from buildings and power lines. The open area is the safest place.' },
            { text: 'Stand still and look around to assess the situation', correct: false, feedback: 'Incorrect. Standing during an aftershock puts you at risk of falling. Drop and cover.' }
          ]
        }
      ]
    },
    {
      id: 'sim-electrical',
      title: 'Electrical Emergency',
      category: 'electrical',
      icon: 'zap',
      difficulty: 'Intermediate',
      duration: '8 min',
      description: 'A student is electrocuted by faulty equipment. Respond safely and effectively.',
      steps: [
        {
          id: 's1',
          narrative: 'You are in a computer lab in Block B. A student has plugged in a device and is now frozen, gripping the device. You can see sparks at the outlet and the student appears unable to let go. Other students are panicking.',
          question: 'What is your first action?',
          choices: [
            { text: 'Grab the student and pull them away from the device', correct: false, feedback: 'Incorrect. Touching someone in contact with electricity will electrocute you as well. You must break the circuit first.' },
            { text: 'Pour water on the outlet to stop the sparks', correct: false, feedback: 'Incorrect. Water conducts electricity. This could electrocute the victim and anyone nearby.' },
            { text: 'Find and turn off the circuit breaker or unplug the device using a non-conductive object', correct: true, feedback: 'Correct. Disconnecting the power source is the safest first step. Use a wooden chair, plastic object, or rubber-soled shoe — never your bare hands.' },
            { text: 'Run out of the room and call someone', correct: false, feedback: 'Incorrect. While calling for help is important, the victim needs the power disconnected immediately. Seconds matter.' }
          ]
        },
        {
          id: 's2',
          narrative: 'You have disconnected the power. The student has fallen to the floor. They are unconscious but breathing. There are burn marks on their hand.',
          question: 'What do you do next?',
          choices: [
            { text: 'Shake them to wake them up', correct: false, feedback: 'Incorrect. Shaking an electrocution victim can worsen internal injuries. Keep them still and monitor breathing.' },
            { text: 'Apply burn ointment to their hand immediately', correct: false, feedback: 'Incorrect. Do not apply ointments to electrical burns. Cool the area with clean water only, and wait for medical help.' },
            { text: 'Call for emergency medical help, place them in recovery position, and cool the burns with clean water', correct: true, feedback: 'Correct. Call for medical help immediately. Place an unconscious but breathing person in the recovery position. Cool burns with clean, lukewarm water.' },
            { text: 'Try to plug the device back in to see what went wrong', correct: false, feedback: 'Incorrect. The faulty equipment should not be touched until inspected by a qualified electrician.' }
          ]
        },
        {
          id: 's3',
          narrative: 'Medical help is on the way. Other students are asking if they should continue working on the other computers in the lab.',
          question: 'What should happen with the lab?',
          choices: [
            { text: 'Other computers are probably fine — students can continue working', correct: false, feedback: 'Incorrect. The electrical fault may affect the entire circuit. The lab should be evacuated and inspected.' },
            { text: 'Evacuate the lab and report the incident to campus security and maintenance', correct: true, feedback: 'Correct. The entire lab should be evacuated and the electrical system inspected before anyone uses it again.' },
            { text: 'Only unplug the faulty device and continue', correct: false, feedback: 'Incorrect. The problem may be in the building wiring, not just one device. Full inspection is needed.' },
            { text: 'Lock the lab and throw away the faulty device', correct: false, feedback: 'Incorrect. The device should be preserved for inspection. The lab needs professional electrical inspection.' }
          ]
        }
      ]
    },
    {
      id: 'sim-flood',
      title: 'Flood on Campus',
      category: 'flood',
      icon: 'droplets',
      difficulty: 'Intermediate',
      duration: '8 min',
      description: 'Heavy rain causes flooding on campus. Navigate the rising water safely.',
      steps: [
        {
          id: 's1',
          narrative: 'You are on the ground floor of Block A during a heavy rainstorm. Water is beginning to seep under the main entrance doors. The corridor floor is getting wet and the water level is slowly rising. Other students are looking around nervously.',
          question: 'What is your immediate response?',
          choices: [
            { text: 'Walk through the water to reach the main exit and leave campus', correct: false, feedback: 'Incorrect. Walking through floodwater is dangerous — it may be electrically charged from submerged outlets or contaminated. Even shallow moving water can knock you down.' },
            { text: 'Move to the upper floors immediately and alert others', correct: true, feedback: 'Correct. Moving to higher ground is the safest response during flooding. Upper floors provide safety from rising water. Alert others as you go.' },
            { text: 'Try to block the water with furniture and bags', correct: false, feedback: 'Incorrect. Attempting to block floodwater wastes valuable time. The priority is getting to higher ground before water levels rise further.' },
            { text: 'Go to the basement to check the drainage system', correct: false, feedback: 'Incorrect. Basements are the most dangerous place during flooding. They flood first and can trap you. Always move upward.' }
          ]
        },
        {
          id: 's2',
          narrative: 'You are now on the second floor with several other students. The water on the ground floor is knee-deep. You notice that some electrical outlets on the ground floor are now submerged. A student suggests going back down to retrieve a laptop.',
          question: 'What should you do?',
          choices: [
            { text: 'Let them go — it is their decision', correct: false, feedback: 'Incorrect. You should actively discourage anyone from entering floodwater, especially near submerged electrical equipment. Electrocution is a serious risk.' },
            { text: 'Advise them strongly against going back and explain the electrical hazard', correct: true, feedback: 'Correct. Submerged electrical outlets make floodwater extremely dangerous. No belongings are worth risking electrocution. Stay on higher floors until help arrives.' },
            { text: 'Go with them to help carry things quickly', correct: false, feedback: 'Incorrect. Going back into floodwater puts both of you at risk. Submerged electrical systems can electrify the water.' },
            { text: 'Disconnect the building power by going to the basement panel', correct: false, feedback: 'Incorrect. The basement is flooded and the most dangerous location. Only qualified personnel should handle electrical systems, and never in flooded conditions.' }
          ]
        },
        {
          id: 's3',
          narrative: 'The rain continues. Campus security has announced over the PA system to remain on upper floors and await assistance. A student suggests crossing the flooded courtyard to reach the library, which is on higher ground.',
          question: 'What is the safest action?',
          choices: [
            { text: 'Cross the courtyard — the library is closer to the exit', correct: false, feedback: 'Incorrect. Crossing a flooded courtyard is extremely dangerous. Moving water can be much stronger than it appears. Stay where you are.' },
            { text: 'Stay on the upper floor as instructed and wait for assistance', correct: true, feedback: 'Correct. Follow the PA instructions. Emergency services know the safest routes and timing. Attempting to cross floodwater risks being swept away.' },
            { text: 'Try to drive out of the campus parking lot', correct: false, feedback: 'Incorrect. Driving through floodwater is one of the leading causes of flood-related deaths. As little as 30 cm of water can float a car.' },
            { text: 'Go to the roof of the building for better visibility', correct: false, feedback: 'Incorrect. While the roof provides high ground, it exposes you to lightning and severe weather. Stay on upper floors indoors unless specifically directed to the roof by emergency services.' }
          ]
        },
        {
          id: 's4',
          narrative: 'The rain has stopped and water levels are slowly receding. Campus security announces that it is safe to begin evacuating the building via the east stairway, which has been inspected.',
          question: 'What should you do as you leave?',
          choices: [
            { text: 'Rush down the stairs quickly to get out', correct: false, feedback: 'Incorrect. Stairs may be wet and slippery. Walk carefully, use handrails, and watch for debris or structural damage.' },
            { text: 'Walk carefully using handrails, avoid any remaining water, and report damage', correct: true, feedback: 'Correct. Move carefully on potentially slippery surfaces. Avoid touching any water that may still be in contact with electrical systems. Report any damage you observe.' },
            { text: 'Take the elevator since it is faster', correct: false, feedback: 'Incorrect. Elevators should never be used after flooding. Water damage may have compromised the electrical systems and elevator shaft.' },
            { text: 'Go back to the ground floor to collect your belongings first', correct: false, feedback: 'Incorrect. Ground floor areas have not been inspected for electrical or structural hazards. Follow the designated evacuation route and do not deviate.' }
          ]
        }
      ]
    },
    {
      id: 'sim-severe-weather',
      title: 'Severe Thunderstorm on Campus',
      category: 'weather',
      icon: 'cloud-lightning',
      difficulty: 'Intermediate',
      duration: '8 min',
      description: 'A severe thunderstorm with lightning strikes campus. Make critical safety decisions.',
      steps: [
        {
          id: 's1',
          narrative: 'You are walking across the open campus grounds between Block A and the Science Building. Dark clouds have gathered rapidly. You hear thunder rumbling and see a flash of lightning in the distance. The storm is approaching fast.',
          question: 'What do you do first?',
          choices: [
            { text: 'Continue walking — the storm is still far away', correct: false, feedback: 'Incorrect. Lightning can strike from over 15 km away. If you can hear thunder, you are within striking distance. Seek shelter immediately.' },
            { text: 'Shelter under the large tree near the pathway', correct: false, feedback: 'Incorrect. Trees are one of the most dangerous places during lightning. They attract lightning strikes and can cause fatal ground current or falling branches.' },
            { text: 'Immediately move to the nearest building and go to an interior room', correct: true, feedback: 'Correct. A substantial building provides the best lightning protection. Move to an interior room on a lower floor, away from windows, plumbing, and electrical equipment.' },
            { text: 'Lie flat on the ground to make yourself a smaller target', correct: false, feedback: 'Incorrect. Lying flat increases your contact with the ground, making you more vulnerable to ground current from a nearby lightning strike. Get to a building instead.' }
          ]
        },
        {
          id: 's2',
          narrative: 'You have reached the Science Building. The storm is directly overhead — lightning is frequent and close. Inside, you see students standing near the large windows watching the storm. Others are using their laptops plugged into wall outlets.',
          question: 'What should you tell them?',
          choices: [
            { text: 'Nothing — they are inside and safe', correct: false, feedback: 'Incorrect. Being inside reduces risk, but standing near windows and using plugged-in electronics during a thunderstorm is still dangerous. Windows can shatter and lightning can travel through wiring.' },
            { text: 'Move away from windows, unplug electronics, and avoid plumbing fixtures', correct: true, feedback: 'Correct. Windows can shatter from wind or pressure changes. Lightning can travel through electrical wiring and plumbing. Move to interior rooms and unplug devices.' },
            { text: 'Open the windows to equalize air pressure', correct: false, feedback: 'Incorrect. Opening windows lets in rain and wind, and puts you closer to lightning danger. Keep windows closed and move away from them.' },
            { text: 'Go to the basement for maximum protection', correct: false, feedback: 'Incorrect. While lower floors are generally safer from wind, basements can flood during severe storms. An interior room on the lowest above-ground floor is ideal.' }
          ]
        },
        {
          id: 's3',
          narrative: 'The storm intensifies. The lights flicker and then go out — a power outage. Emergency lighting activates dimly. A student says they feel unwell — they appear flushed, confused, and their skin is hot and dry. It was very hot before the storm.',
          question: 'What do you suspect and how do you respond?',
          choices: [
            { text: 'They are just anxious — give them water and wait', correct: false, feedback: 'Incorrect. Hot, dry skin with confusion indicates heat stroke, not anxiety. Heat stroke is a life-threatening emergency requiring immediate cooling and medical help.' },
            { text: 'Recognize signs of heat stroke — cool them immediately and call for medical help', correct: true, feedback: 'Correct. Hot/dry skin, confusion, and rapid pulse are signs of heat stroke. Move them to a cool area, apply cool water to their skin, fan them, and call for emergency medical help immediately.' },
            { text: 'Tell them to go outside and get fresh air', correct: false, feedback: 'Incorrect. Going outside during a severe thunderstorm with lightning is dangerous. Also, heat stroke requires active cooling, not just fresh air.' },
            { text: 'Give them cold food from the cafeteria', correct: false, feedback: 'Incorrect. Someone with confusion from heat stroke may not be able to safely swallow food. Focus on external cooling and call medical help.' }
          ]
        },
        {
          id: 's4',
          narrative: 'The storm has passed. The all-clear announcement is made. As you exit the building, you notice a power line has fallen across the walkway. It is lying on wet ground and appears to be sparking intermittently.',
          question: 'What is the correct action?',
          choices: [
            { text: 'Step over the power line carefully since it seems inactive between sparks', correct: false, feedback: 'Incorrect. A downed power line can be energized even when not visibly sparking. The wet ground conducts electricity, making the area around it lethal.' },
            { text: 'Stay at least 10 meters away, warn others, and report it to campus security immediately', correct: true, feedback: 'Correct. Downed power lines can energize the ground for several meters around them, especially on wet surfaces. Keep everyone away and report it immediately.' },
            { text: 'Use a wooden stick to move the power line off the walkway', correct: false, feedback: 'Incorrect. Even wood can conduct electricity at high voltages. Never attempt to move a downed power line. Wait for trained utility workers.' },
            { text: 'Pour water on it to short-circuit it safely', correct: false, feedback: 'Incorrect. Adding water to an energized power line creates a larger conductive area, increasing the danger zone. Stay away and call emergency services.' }
          ]
        }
      ]
    }
  ];

  // ── Demo Hazard Reports ──────────────────────────
  const hazardReports = [
    {
      id: 'GR-2026-0001',
      title: 'Loose electrical wire in corridor',
      category: 'Electrical',
      location: 'Block B — 2nd Floor, Corridor',
      building: 'block-b',
      description: 'Exposed wire hanging from ceiling near room B-204. Appears to be from old light fixture. Area is busy during class changes.',
      severity: 'high',
      status: 'under-review',
      reporter: 'user-001',
      reporterName: 'Arjun Mehta',
      date: '2026-09-08',
      photo: null,
      assignedTo: null,
      notes: [],
      suggestedCategory: 'Electrical',
      suggestedPriority: 'high'
    },
    {
      id: 'GR-2026-0002',
      title: 'Blocked emergency exit',
      category: 'Obstruction',
      location: 'Science Building — Ground Floor',
      building: 'science',
      description: 'South emergency exit door is blocked by stored lab equipment. Cannot be opened from inside.',
      severity: 'high',
      status: 'resolved',
      reporter: 'user-002',
      reporterName: 'Priya Sharma',
      date: '2026-09-02',
      photo: null,
      assignedTo: 'user-005',
      notes: [
        { author: 'Dr. Rajesh Kapoor', date: '2026-09-03', text: 'Assigned to maintenance for immediate clearance.' },
        { author: 'Vikram Rao', date: '2026-09-04', text: 'Equipment relocated. Exit clear and functional.' }
      ],
      resolvedDate: '2026-09-04',
      suggestedCategory: 'Obstruction',
      suggestedPriority: 'high'
    },
    {
      id: 'GR-2026-0003',
      title: 'Damaged light switch sparking',
      category: 'Electrical',
      location: 'Block A — Room 204',
      building: 'block-a',
      description: 'Light switch in room 204 produces sparks when toggled. Plastic cover is cracked and discolored from heat.',
      severity: 'high',
      status: 'assigned',
      reporter: 'user-004',
      reporterName: 'Sneha Patel',
      date: '2026-09-06',
      photo: null,
      assignedTo: 'user-005',
      notes: [
        { author: 'Dr. Rajesh Kapoor', date: '2026-09-07', text: 'Assigned to Vikram Rao. Room 204 should not use this switch until repaired.' }
      ],
      suggestedCategory: 'Electrical',
      suggestedPriority: 'high'
    },
    {
      id: 'GR-2026-0004',
      title: 'Fire extinguisher expired',
      category: 'Emergency Equipment',
      location: 'Library — 1st Floor',
      building: 'library',
      description: 'Fire extinguisher near the main reading area shows an inspection sticker from 2024. Needs immediate servicing.',
      severity: 'medium',
      status: 'in-progress',
      reporter: 'user-002',
      reporterName: 'Priya Sharma',
      date: '2026-09-09',
      photo: null,
      assignedTo: 'user-005',
      notes: [
        { author: 'Priya Sharma', date: '2026-09-09', text: 'Vendor contacted for servicing. Expected completion by September 15.' }
      ],
      suggestedCategory: 'Emergency Equipment',
      suggestedPriority: 'medium'
    },
    {
      id: 'GR-2026-0005',
      title: 'Cracked stairway railing',
      category: 'Maintenance',
      location: 'Block A — West Stairway, 2nd Floor',
      building: 'block-a',
      description: 'Metal railing on the west stairway is cracked and loose. Students grab this railing during class changes.',
      severity: 'medium',
      status: 'reported',
      reporter: 'user-001',
      reporterName: 'Arjun Mehta',
      date: '2026-09-11',
      photo: null,
      assignedTo: null,
      notes: [],
      suggestedCategory: 'Maintenance',
      suggestedPriority: 'medium'
    }
  ];

  // ── Demo Drills ──────────────────────────
  const drills = [
    {
      id: 'drill-001',
      type: 'Fire Evacuation Drill',
      category: 'fire',
      building: 'block-a',
      buildingName: 'Block A',
      date: '2026-09-15',
      time: '10:30',
      instructions: 'All occupants of Block A must evacuate using designated stairways. Proceed to Assembly Point A (front lawn). Do not use elevators. Staff should conduct headcount upon arrival at assembly point.',
      status: 'upcoming',
      createdBy: 'user-003',
      participation: null,
      evacuationTime: null,
      observations: null,
      issues: null
    },
    {
      id: 'drill-002',
      type: 'Earthquake Drill',
      category: 'earthquake',
      building: 'science',
      buildingName: 'Science Building',
      date: '2026-09-22',
      time: '14:00',
      instructions: 'All occupants must practice Drop, Cover, and Hold On. After the all-clear signal (3 short bells), evacuate to Assembly Point B (rear parking area). Lab instructors must ensure gas lines and equipment are secured before evacuation.',
      status: 'upcoming',
      createdBy: 'user-003',
      participation: null,
      evacuationTime: null,
      observations: null,
      issues: null
    },
    {
      id: 'drill-003',
      type: 'Fire Evacuation Drill',
      category: 'fire',
      building: 'block-b',
      buildingName: 'Block B',
      date: '2026-08-20',
      time: '11:00',
      instructions: 'Standard fire evacuation procedure for Block B.',
      status: 'completed',
      createdBy: 'user-003',
      participation: 87,
      evacuationTime: '4 min 12 sec',
      observations: 'Overall smooth evacuation. Some confusion at 2nd floor junction. Need better signage.',
      issues: 'Two students used the elevator despite instructions. Signage at 2nd floor junction inadequate.'
    }
  ];

  // ── Demo Alerts ──────────────────────────
  const alerts = [
    {
      id: 'alert-001',
      title: 'Electrical maintenance in Block B',
      message: 'Rooms B-201 to B-210 will undergo electrical maintenance on September 13. Classes relocated to Block A. Avoid the 2nd floor of Block B during 9 AM – 4 PM.',
      severity: 'warning',
      building: 'block-b',
      audience: 'all',
      createdBy: 'user-003',
      createdDate: '2026-09-11',
      expiryDate: '2026-09-13',
      active: true
    },
    {
      id: 'alert-002',
      title: 'Fire evacuation drill — Block A',
      message: 'A fire evacuation drill is scheduled for Block A on September 15 at 10:30 AM. All occupants must participate. Proceed to Assembly Point A (front lawn) when the alarm sounds.',
      severity: 'info',
      building: 'block-a',
      audience: 'all',
      createdBy: 'user-003',
      createdDate: '2026-09-10',
      expiryDate: '2026-09-15',
      active: true
    }
  ];

  // ── Map Markers ──────────────────────────
  const mapMarkers = [
    { id: 'marker-1', type: 'exit', label: 'Emergency Exit', x: 15, y: 85, floor: 'ground', building: 'block-a', instructions: 'Main emergency exit. Push bar to open. Leads to front lawn assembly point.' },
    { id: 'marker-2', type: 'exit', label: 'Emergency Exit', x: 85, y: 85, floor: 'ground', building: 'block-a', instructions: 'Rear emergency exit. Push bar to open. Leads to rear parking assembly point.' },
    { id: 'marker-3', type: 'staircase', label: 'Staircase West', x: 10, y: 50, floor: 'ground', building: 'block-a', instructions: 'West staircase. Use for evacuation from upper floors. Do not use during flooding.' },
    { id: 'marker-4', type: 'staircase', label: 'Staircase East', x: 90, y: 50, floor: 'ground', building: 'block-a', instructions: 'East staircase. Use for evacuation from upper floors.' },
    { id: 'marker-5', type: 'assembly', label: 'Assembly Point A', x: 50, y: 95, floor: 'ground', building: 'block-a', instructions: 'Primary assembly point. Gather here after evacuating Block A. Wait for headcount.' },
    { id: 'marker-6', type: 'extinguisher', label: 'Fire Extinguisher', x: 30, y: 40, floor: 'ground', building: 'block-a', instructions: 'CO2 fire extinguisher. Suitable for electrical and small fires. Pull pin, aim at base of fire, squeeze handle, sweep.' },
    { id: 'marker-7', type: 'extinguisher', label: 'Fire Extinguisher', x: 70, y: 40, floor: 'ground', building: 'block-a', instructions: 'Dry powder fire extinguisher. Suitable for most fire types. Pull pin, aim at base of fire, squeeze handle, sweep.' },
    { id: 'marker-8', type: 'firstaid', label: 'First Aid Kit', x: 50, y: 30, floor: 'ground', building: 'block-a', instructions: 'First aid kit located at the reception desk. Contains bandages, antiseptic, gloves, CPR mask, and burn dressings.' },
    { id: 'marker-9', type: 'exit', label: 'Emergency Exit', x: 50, y: 10, floor: 'ground', building: 'block-a', instructions: 'North emergency exit. Leads to side pathway toward the Science Building.' }
  ];

  // ── Demo Notifications ──────────────────────────
  const notifications = [
    {
      id: 'notif-001',
      userId: 'user-001',
      message: 'Your hazard report GR-2026-0001 is now under review.',
      type: 'report',
      date: '2026-09-09T10:30:00',
      read: false
    },
    {
      id: 'notif-002',
      userId: 'user-001',
      message: 'New fire evacuation drill scheduled for Block A on September 15.',
      type: 'drill',
      date: '2026-09-10T08:00:00',
      read: false
    },
    {
      id: 'notif-003',
      userId: 'user-001',
      message: 'Electrical Safety module is now available.',
      type: 'learning',
      date: '2026-09-05T09:00:00',
      read: true
    },
    {
      id: 'notif-004',
      userId: 'user-003',
      message: 'New hazard report submitted: GR-2026-0005 — Cracked stairway railing.',
      type: 'report',
      date: '2026-09-11T14:20:00',
      read: false
    },
    {
      id: 'notif-005',
      userId: 'user-003',
      message: 'Fire extinguisher maintenance in progress at Library.',
      type: 'maintenance',
      date: '2026-09-09T11:00:00',
      read: true
    }
  ];

  // ── Demo Progress ──────────────────────────
  const userProgress = {
    'user-001': {
      modules: {
        'fire-safety': { status: 'in-progress', progress: 65, completedSections: ['overview', 'before', 'during'], startDate: '2026-09-05' },
        'earthquake-safety': { status: 'completed', progress: 100, completedSections: ['overview', 'before', 'during', 'after', 'do-dont', 'checklist'], startDate: '2026-09-01', completedDate: '2026-09-04' },
        'electrical-safety': { status: 'in-progress', progress: 30, completedSections: ['overview'], startDate: '2026-09-10' },
        'flood-safety': { status: 'not-started', progress: 0, completedSections: [] },
        'severe-weather': { status: 'not-started', progress: 0, completedSections: [] }
      },
      quizAttempts: [
        { quizId: 'earthquake-safety', score: 4, total: 5, percentage: 80, date: '2026-09-04' },
        { quizId: 'fire-safety', score: 5, total: 6, percentage: 83, date: '2026-09-07' }
      ],
      simAttempts: [
        { simId: 'sim-earthquake', score: 3, total: 4, percentage: 75, date: '2026-09-05', correctDecisions: 3, criticalMistakes: 1 }
      ],
      drillParticipation: ['drill-003']
    }
  };

  // ── Settings ──────────────────────────
  const settings = {
    institution: { ...institution },
    emergencyContacts: [...emergencyContacts],
    defaultBuilding: 'block-a',
    notificationPreferences: {
      alerts: true,
      drills: true,
      reports: true,
      learning: true
    }
  };

  /**
   * Initialize demo data — only seeds if not already initialized
   */
  function initializeDemoData() {
    if (Storage.hasData(Storage.KEYS.INITIALIZED)) {
      return; // Don't overwrite existing data
    }

    Storage.saveData(Storage.KEYS.USERS, users);
    Storage.saveData(Storage.KEYS.MODULES, learningModules);
    Storage.saveData(Storage.KEYS.QUIZZES, quizQuestions);
    Storage.saveData(Storage.KEYS.REPORTS, hazardReports);
    Storage.saveData(Storage.KEYS.ALERTS, alerts);
    Storage.saveData(Storage.KEYS.DRILLS, drills);
    Storage.saveData(Storage.KEYS.MAPS, mapMarkers);
    Storage.saveData(Storage.KEYS.NOTIFICATIONS, notifications);
    Storage.saveData(Storage.KEYS.PROGRESS, userProgress);
    Storage.saveData(Storage.KEYS.SETTINGS, settings);
    Storage.saveData(Storage.KEYS.ATTEMPTS, []);
    Storage.saveData(Storage.KEYS.SIM_ATTEMPTS, []);
    Storage.saveData(Storage.KEYS.INITIALIZED, true);
  }

  return {
    institution,
    buildings,
    users,
    emergencyContacts,
    learningModules,
    quizQuestions,
    simulations,
    hazardReports,
    drills,
    alerts,
    mapMarkers,
    notifications,
    settings,
    initializeDemoData
  };
})();
