// src/data/sajuResultsEn.js

/**
 * Saju Analysis Result Dataset (English)
 * Generates dance types and AI analysis reasons by combining Five Elements, gender, and monthly energy.
 */

export const selectResultEn = (genre, gender, month, day, ohengCount) => {
  // 1. Find the strongest energy among the Five Elements
  const entries = Object.entries(ohengCount);
  const mainOheng = entries.length > 0 ? entries.sort((a, b) => b[1] - a[1])[0][0] : '木';

  // 2. Mapping dance styles by Five Elements
  const ohengMap = {
    '木': {
      type: 'Growth-oriented Dancer',
      typeDesc: 'You absorb new techniques like a sponge and constantly evolve your style.',
      vibe: 'Fresh and Flexible',
      groupSize: 'Mid-sized gatherings (10-20 people)',
      oheng: 'Holder of Wood (木) energy'
    },
    '火': {
      type: 'Passionate Center-stage',
      typeDesc: 'You radiate energy and capture everyone\'s attention on the floor like a protagonist.',
      vibe: 'Intense and Glamorous',
      groupSize: 'Large parties (30+ people)',
      oheng: 'Holder of Fire (火) energy'
    },
    '土': {
      type: 'Stable Supporter',
      typeDesc: 'A veteran style that makes partners feel most comfortable with an excellent sense of balance.',
      vibe: 'Calm and Solid',
      groupSize: 'Small private gatherings',
      oheng: 'Holder of Earth (土) energy'
    },
    '金': {
      type: 'Sharp Technician',
      typeDesc: 'You perform high-quality dance with precise techniques and disciplined movements.',
      vibe: 'Chic and Precise',
      groupSize: 'Mid-sized technical workshops',
      oheng: 'Holder of Metal (金) energy'
    },
    '水': {
      type: 'Flexible Flow Master',
      typeDesc: 'An emotional dancer who moves smoothly like waves along the melody of the music.',
      vibe: 'Dreamy and Delicate',
      groupSize: 'Atmospheric small parties',
      oheng: 'Holder of Water (水) energy'
    }
  };

  const genreEn = {
    '바차타': 'Bachata',
    '살사': 'Salsa',
    '키좀바': 'Kizomba',
    '쥬크': 'Zouk'
  }[genre] || genre;

  // 3. AI Analysis Reasons
  const currentOheng = ohengMap[mainOheng] || ohengMap['木'];
  const aiReasons = [
    `${currentOheng.oheng} → Optimal matching with ${genreEn}`,
    `Energy pattern analysis for those born in month ${month} complete`,
    gender === '남' || gender === 'male' ? 'Stable frame as a leader' : 'Highly delicate response as a follower',
    ohengCount[mainOheng] >= 3 ? 'Concentrated Five Element energy → Unique style' : 'Harmonious Five Element balance → All-rounder potential'
  ];

  // 4. Today's Tip
  const tips = [
    'Calm-toned outfits will further emphasize your sophisticated lines.',
    'You have great chemistry with party members you meet for the first time today.',
    'The most glamorous dance comes out when you focus on the basic steps.',
    'Enjoy the leisure of moving half a beat later than the first beat of the music.',
    'Eye contact with your partner is more important than flashy techniques today.'
  ];
  const tip = tips[day % tips.length];

  // 5. Vibe Text Database (Five Elements x Gender x Genre x Level)
  const vibeTextDB = {
    '木_남_바차타_입문': "Like a tree growing straight, your first Bachata step will be a new root. It's okay if it's your first time tonight.",
    '木_남_바차타_초급': "Full of growth energy, you're ready to leap further on the Bachata floor. Your connection with your partner will be special today.",
    '木_남_바차타_중급': "Your Wood (木) energy that has grown steadily, it's time to bear fruit on the Bachata floor today.",
    '木_남_바차타_상급': "With deep roots, you are the center of the floor today. Completely dominate the delicate tension of Bachata.",
    '木_남_살사_입문': "Starting like a sprout, the cheerful rhythm of Salsa cheers on your first steps.",
    '木_남_살사_초급': "With growing Wood (木) energy, you can quickly absorb the dynamic steps of Salsa.",
    '木_남_살사_중급': "Spreading flexibly, you will grow even further on the Salsa floor today.",
    '木_남_살사_상급': "The strength and flexibility of Wood (木), it's time to completely dominate the Salsa floor today.",
    '木_남_키좀바_입문': "Taking root slowly, today is the day you first feel the deep connection of Kizomba.",
    '木_남_키좀바_초급': "Growing stably like a tree, your warm Kizomba connection will deepen today.",
    '木_남_키좀바_중급': "Complete your delicate Kizomba lead with growing energy today.",
    '木_남_키좀바_상급': "Like the deep roots of a tree, it's a day to show a lead that completely embraces your partner.",
    '木_남_쥬크_입문': "Towards a new beginning, the free flow of Zouk welcomes you.",
    '木_남_쥬크_초급': "Growing Wood (木) energy, you can quickly learn the flexible movements of Zouk.",
    '木_남_쥬크_중급': "Having grown steadily, you will discover a new style on the Zouk floor today.",
    '木_남_쥬크_상급': "With the flexibility of Wood (木), it's time to create the most beautiful flow of Zouk.",

    '木_여_바차타_입문': "Excited like a spring sprout, your first Bachata step might change your life today.",
    '木_여_바차타_초급': "With growing Wood (木) energy, you will quickly bloom on the Bachata floor today.",
    '木_여_바차타_중급': "Fruit of steady growth, your Bachata partner will fall for your skills today.",
    '木_여_바차타_상급': "Reaching out gracefully like a tree, become the most beautiful flower on the Bachata floor today.",
    '木_여_살사_입문': "Fresh Wood (木) energy, the cheerfulness of Salsa will make your first challenge even more enjoyable.",
    '木_여_살사_초급': "Growing flexibly, there will be amazing progress if you leave your body to the rhythm of Salsa today.",
    '木_여_살사_중급': "Spreading naturally like a tree, your style will be completed on the Salsa floor today.",
    '木_여_살사_상급': "Wood (木) energy that never stops growing, you will shine the brightest on the Salsa floor today.",
    '木_여_키좀바_입문': "Warm like a tree, the deep connection of Kizomba will open your heart today.",
    '木_여_키좀바_초급': "With growing energy, you can quickly absorb the delicate emotions of Kizomba.",
    '木_여_키좀바_중급': "With the warmth of Wood (木), your connection with your partner will be especially deep today.",
    '木_여_키좀바_상급': "Deeply rooted emotions, your follow will be completed on the Kizomba floor today.",
    '木_여_쥬크_입문': "Light and excited like a spring breeze, the free energy of Zouk fits you perfectly.",
    '木_여_쥬크_초급': "With growing Wood (木) energy, completely enjoy the flexible flow of Zouk today.",
    '木_여_쥬크_중급': "Natural like a tree, your own style will shine on the Zouk floor today.",
    '木_여_쥬크_상급': "Flexible and strong Wood (木) energy, create the most beautiful flow on the Zouk floor today.",

    '火_남_바차타_입문': "Passion hot like a flame, even if it's your first time, you have energy to burn the Bachata floor.",
    '火_남_바차타_초급': "Burning Fire (火) energy, the passionate rhythm of Bachata will make you shine even more.",
    '火_남_바차타_중급': "With flame-like energy, it's time to monopolize attention on the Bachata floor today.",
    '火_남_바차타_상급': "Intensity of Fire (火) at its peak, the Bachata floor is your stage today.",
    '火_남_살사_입문': "A flame of passion just ignited, perfectly matching the hot energy of Salsa.",
    '火_남_살사_초급': "Burning Fire (火) energy, the dynamic rhythm of Salsa will explode your passion.",
    '火_남_살사_중급': "Like a flame, you will show the hottest performance on the Salsa floor today.",
    '火_남_살사_상급': "Putting all the energy of Fire (火) into Salsa, completely dominate the floor today.",
    '火_남_키좀바_입문': "Hot like a flame, the deep connection of Kizomba will gently embrace that passion.",
    '火_남_키좀바_초급': "Hot energy of Fire (火), sublimate it into a delicate Kizomba lead.",
    '火_남_키좀바_중급': "With both passion and delicacy, your Kizomba partner will completely fall for you today.",
    '火_남_키좀바_상급': "Intensity of Fire (火) and depth of Kizomba, you will be the most impressive couple on the floor today.",
    '火_남_쥬크_입문': "Taking your first step into the world of Zouk with flame-like energy, remember today's excitement.",
    '火_남_쥬크_초급': "Burning Fire (火) energy, your passion will shine in the free flow of Zouk.",
    '火_남_쥬크_중급': "Like a flame, radiate the hottest energy on the Zouk floor today.",
    '火_남_쥬크_상급': "Putting all the energy of Fire (火) into Zouk, become the protagonist of the floor tonight.",

    '火_여_바차타_입문': "Shining like a flame, the floor will focus on you from the first Bachata step.",
    '火_여_바차타_초급': "Burning Fire (火) energy, the passionate rhythm of Bachata will make you even more radiant.",
    '火_여_바차타_중급': "With flame-like energy, all eyes on the Bachata floor will be towards you today.",
    '火_여_바차타_상급': "Expressing everything about Bachata with the intensity of Fire (火), tonight will be the brightest night.",
    '火_여_살사_입문': "Starting Salsa with a flame of passion, the floor will notice you from the first day.",
    '火_여_살사_초급': "Hot energy of Fire (火), you will shine more today with the dynamic rhythm of Salsa.",
    '火_여_살사_중급': "Like a flame, you will capture everyone's attention on the Salsa floor today.",
    '火_여_살사_상급': "Peak of Fire (火), the Salsa floor is your stage today. Burn it as much as you want.",
    '火_여_키좀바_입문': "With hot passion, the deep connection of Kizomba will make you even more special today.",
    '火_여_키좀바_초급': "With the passion of Fire (火) energy, you can feel the delicate emotions of Kizomba even faster.",
    '火_여_키좀바_중급': "With both passion and delicacy, you will show the most beautiful follow on the Kizomba floor today.",
    '火_여_키좀바_상급': "Intensity of Fire (火) and depth of Kizomba, your dance will completely capture your partner's heart today.",
    '火_여_쥬크_입문': "First step into the world of Zouk with flame-like energy, you will remember today's excitement for a long time.",
    '火_여_쥬크_초급': "Burning Fire (火) energy, your passion will explode in the free flow of Zouk.",
    '火_여_쥬크_중급': "Like a flame, you will be the most dazzling presence on the Zouk floor today.",
    '火_여_쥬크_상급': "Putting all the energy of Fire (火) into Zouk, become the queen of the floor tonight.",

    '土_남_바차타_입문': "Stable like the earth, you can take your first Bachata step most reliably.",
    '土_남_바차타_초급': "Stability of Earth (土) energy, today is the day to perfectly build the foundation of Bachata.",
    '土_남_바차타_중급': "Solid like the earth, your Bachata partner will completely rely on your stable lead.",
    '土_남_바차타_상급': "Depth of Earth (土) and delicacy of Bachata, your dance will be of the highest quality today.",
    '土_남_살사_입문': "With stable Earth (土) energy, today is the day to build the most solid foundation of Salsa.",
    '土_남_살사_초급': "Reliable like the earth, you can completely absorb the rhythm of Salsa with your body.",
    '土_남_살사_중급': "With the weight of Earth (土), you can be the most stable partner on the Salsa floor.",
    '土_남_살사_상급': "Deep like the earth, complete your veteran dance on the Salsa floor today.",
    '土_남_키좀바_입문': "Warm and stable like Earth (土), you will feel the deep connection of Kizomba naturally.",
    '土_남_키좀바_초급': "With the embrace of the earth, you can learn the delicate lead of Kizomba most comfortably.",
    '土_남_키좀바_중급': "With the stability of Earth (土), you can show a lead that your partner can completely lean on.",
    '土_남_키좀바_상급': "Reliable like the earth, create the most completed connection on the Kizomba floor today.",
    '土_남_쥬크_입문': "With stable Earth (土) energy, you can start the free flow of Zouk comfortably.",
    '土_남_쥬크_초급': "Reliable like the earth, you can enjoy the flow of Zouk most stably.",
    '土_남_쥬크_중급': "With the depth of Earth (土), your partner will feel the most comfort on the Zouk floor.",
    '土_남_쥬크_상급': "Depth of the earth and freedom of Zouk, you can present the most completed dance today.",

    '土_여_바차타_입문': "Cozy like the earth, your first Bachata step will feel most natural.",
    '土_여_바차타_초급': "With the warm energy of Earth (土), today is the day to feel the emotions of Bachata most deeply.",
    '土_여_바차타_중급': "Stable and cozy, your Bachata partner will completely fall for your follow today.",
    '土_여_바차타_상급': "Deep embrace of Earth (土), you will show the most completed follow on the Bachata floor today.",
    '土_여_살사_입문': "Stable like the earth, you can take your first Salsa step most comfortably.",
    '土_여_살사_초급': "With the stability of Earth (土) energy, you can naturally absorb the Salsa rhythm with your body.",
    '土_여_살사_중급': "Solid and stable like the earth, you will be the most trusted partner on the Salsa floor today.",
    '土_여_살사_상급': "Depth of Earth (土) and energy of Salsa, your dance will be of the highest quality today.",
    '土_여_키좀바_입문': "Having cozy Earth (土) energy, the warm connection of Kizomba fits you best.",
    '土_여_키좀바_초급': "With the embrace of the earth, you can naturally feel the deep connection of Kizomba.",
    '土_여_키좀바_중급': "Warm like Earth (土), your Kizomba partner will completely fall for you today.",
    '土_여_키좀바_상급': "Deep embrace of the earth, you will show the most completed follow on the Kizomba floor today.",
    '土_여_쥬크_입문': "Cozy and stable, you can start the free flow of Zouk comfortably.",
    '土_여_쥬크_초급': "With the warmth of Earth (土) energy, you can naturally feel the emotions of Zouk.",
    '土_여_쥬크_중급': "Reliable like the earth, your partner will feel the most comfort on the Zouk floor today.",
    '土_여_쥬크_상급': "Depth of Earth (土) and freedom of Zouk, create the most completed flow on the floor today.",

    '金_남_바차타_입문': "Sharp and precise Metal (金) energy, you can start with disciplined steps from the first Bachata move.",
    '金_남_바차타_초급': "Precise like metal, you can learn Bachata techniques most quickly and systematically.",
    '金_남_바차타_중급': "With the sharpness of Metal (金), you can completely master Bachata techniques today.",
    '金_남_바차타_상급': "Perfect like metal, you will show the most technical dance on the Bachata floor today.",
    '金_남_살사_입문': "Precise and disciplined Metal (金) energy, you can quickly understand the complex techniques of Salsa.",
    '金_남_살사_초급': "Sharp like metal, you can learn Salsa rhythms and techniques most systematically.",
    '金_남_살사_중급': "With the precision of Metal (金), you will show the most disciplined dance on the Salsa floor.",
    '金_남_살사_상급': "Perfect technique like metal, your skills will shine on the Salsa floor today.",
    '金_남_키좀바_입문': "With sharp Metal (金) energy, you can start the precise lead of Kizomba perfectly from the beginning.",
    '金_남_키좀바_초급': "Precise like metal, you can master the delicate techniques of Kizomba quickly.",
    '金_남_키좀바_중급': "With the sharpness of Metal (金), you can completely finish the details of Kizomba leading today.",
    '金_남_키좀바_상급': "Exquisite like metal, you will show the most perfect lead on the Kizomba floor today.",
    '金_남_쥬크_입문': "Sharp and precise Metal (金) energy, you can start the free flow of Zouk most systematically.",
    '金_남_쥬크_초급': "Sharp like metal, you can quickly learn the technical parts of Zouk.",
    '金_남_쥬크_중급': "With the precision of Metal (金), you can create the most technical flow on the Zouk floor.",
    '金_남_쥬크_상급': "Perfect technique like metal, your skills will shine the brightest on the Zouk floor today.",

    '金_여_바차타_입문': "Sharp and sophisticated Metal (金) energy, you can start gracefully from the first Bachata step.",
    '金_여_바차타_초급': "Precise like metal, you can complete Bachata techniques most quickly.",
    '金_여_바차타_중급': "With the sophistication of Metal (金), you can completely finish the details of Bachata following today.",
    '金_여_바차타_상급': "Perfect like metal, you will show the most sophisticated dance on the Bachata floor today.",
    '金_여_살사_입문': "Precise and sophisticated Metal (金) energy, you can feel the technical beauty of Salsa from the beginning.",
    '金_여_살사_초급': "Sharp like metal, you can learn Salsa steps and rhythms most accurately.",
    '金_여_살사_중급': "With the sharpness of Metal (金), you will show the most disciplined and sophisticated dance on the Salsa floor.",
    '金_여_살사_상급': "Shining like metal, you will present the most completed dance on the Salsa floor today.",
    '金_여_키좀바_입문': "With sophisticated Metal (金) energy, you can feel the exquisite connection of Kizomba perfectly from the beginning.",
    '金_여_키좀바_초급': "Precise like metal, you can master delicate Kizomba following quickly.",
    '金_여_키좀바_중급': "With the sharpness of Metal (金), you can completely finish the details of Kizomba following today.",
    '金_여_키좀바_상급': "Perfect like metal, you will show the most exquisite follow on the Kizomba floor today.",
    '金_여_쥬크_입문': "Sharp and sophisticated Metal (金) energy, you can start the free flow of Zouk most gracefully.",
    '金_여_쥬크_초급': "Sharp like metal, you can quickly feel the technical beauty of Zouk.",
    '金_여_쥬크_중급': "With the sophistication of Metal (金), you can create the most graceful flow on the Zouk floor.",
    '金_여_쥬크_상급': "Shining like metal, you will present the most completed flow on the Zouk floor today.",

    '水_남_바차타_입문': "Flexible like water (水) energy, the flowing rhythm of Bachata will feel most natural to you.",
    '水_남_바차타_초급': "Flowing smoothly like Water (水), you can absorb the emotions of Bachata most quickly.",
    '水_남_바차타_중급': "With the flexibility of Water (水), you can naturally express the delicate leads of Bachata.",
    '水_남_바차타_상급': "Flowing perfectly like water, you will present the most emotional dance on the Bachata floor today.",
    '水_남_살사_입문': "With the flexible energy of Water (水), you can naturally melt into the rhythm of Salsa.",
    '水_남_살사_초급': "Gentle like water, you can learn the flow of Salsa most sensually.",
    '水_남_살사_중급': "With the flexibility of Water (水), you will show the most natural lead on the Salsa floor.",
    '水_남_살사_상급': "Flowing perfectly like water, you will present the most emotional performance on the Salsa floor today.",
    '水_남_키좀바_입문': "Gentle and flexible like Water (水), the deep connection of Kizomba will feel most natural.",
    '水_남_키좀바_초급': "Flexible like water, you can learn the delicate techniques of Kizomba most naturally.",
    '水_남_키좀바_중급': "With the depth and flexibility of Water (水), you can create the most completed Kizomba connection.",
    '水_남_키좀바_상급': "Flowing perfectly like water, you will show the deepest connection on the Kizomba floor today.",
    '水_남_쥬크_입문': "Flowing freely like Water (水), the free flow of Zouk fits you best.",
    '水_남_쥬크_초급': "Gentle like water, you can absorb the emotional flow of Zouk most quickly.",
    '水_남_쥬크_중급': "With the flexibility of Water (水), you can create the most natural flow on the Zouk floor.",
    '水_남_쥬크_상급': "Flowing perfectly like water, you will present the most beautiful flow on the Zouk floor today.",

    '水_여_바차타_입문': "Gentle and flexible Water (水) energy, the flowing rhythm of Bachata matches you perfectly.",
    '水_여_바차타_초급': "Flowing naturally like Water (水), you can feel the emotions of Bachata most deeply.",
    '水_여_바차타_중급': "Flexible like water, you can express the most delicate emotions of Bachata following.",
    '水_여_바차타_상급': "Depth and flexibility of Water (水), you will show the most beautiful follow on the Bachata floor today.",
    '水_여_살사_입문': "Natural like water (水) energy, you can sensually melt into the rhythm of Salsa.",
    '水_여_살사_초급': "Gentle like Water (水), you can naturally feel the flow of Salsa.",
    '水_여_살사_중급': "Flexible like water, you will show the most emotional follow on the Salsa floor today.",
    '水_여_살사_상급': "Perfect flow of Water (水), you will present the most beautiful dance on the Salsa floor today.",
    '水_여_키좀바_입문': "Gentle and deep like Water (水) energy, the warm connection of Kizomba will feel most natural.",
    '水_여_키좀바_초급': "Flexible like water, you can learn the delicate follow of Kizomba most naturally.",
    '水_여_키좀바_중급': "Deep and flexible like water, you will show the most emotional follow on the Kizomba floor today.",
    '水_여_키좀바_상급': "Depth and flexibility of Water (水), you will present the most completed follow on the Kizomba floor today.",
    '水_여_쥬크_입문': "Flowing freely like Water (水) energy, the free flow of Zouk matches you perfectly.",
    '水_여_쥬크_초급': "Gentle like Water (水), you can naturally feel the emotional flow of Zouk.",
    '水_여_쥬크_중급': "Flexible and free like water, you can create the most beautiful flow on the Zouk floor today.",
    '水_여_쥬크_상급': "Perfect flow of Water (水), you will present the most beautiful dance on the Zouk floor today."
  }

  // 6. Generate combination key and look up vibe text
  const levelLabel = ohengCount[mainOheng] >= 4 ? '상급' : ohengCount[mainOheng] >= 3 ? '중급' : ohengCount[mainOheng] >= 2 ? '초급' : '입문'
  
  // Normalize gender
  const normalizedGender = (gender === '남' || gender === 'male' || gender === '♂ 남성') ? '남' : '여';
  const vibeKey = `${mainOheng}_${normalizedGender}_${genre}_${levelLabel}`;
  
  // Determine final vibeText
  const vibeText = vibeTextDB[vibeKey] || `With ${mainOheng} energy, tonight will be a special night on the ${genreEn} floor.`;

  return {
    selectedType: ohengMap[mainOheng],
    aiReasons,
    tip,
    genre: genreEn,
    vibeText,
    levelLabel: { '입문': 'Intro', '초급': 'Beginner', '중급': 'Intermediate', '상급': 'Advanced' }[levelLabel] || levelLabel,
    mainOheng: { '木': 'Wood', '火': 'Fire', '土': 'Earth', '金': 'Metal', '水': 'Water' }[mainOheng] || mainOheng
  };
};
