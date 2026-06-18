export interface AvatarParameters {
  gender: string;          // 'male' | 'female' (no neutral)
  hairStyle: string;       // 30 styles
  hairColor: string;       // Hex code
  skinColor: string;       // Hex code
  eyeColor: string;        // Hex code (irisColor)
  expression: string;      // 30 styles
  clothingType: string;    // 30 top styles
  clothingColor: string;   // Hex code
  bottomType: string;      // 30 bottom styles
  bottomColor: string;     // Hex code
  accessory: string;       // 30 accessories
  eyebrowsStyle: string;   // 10 eyebrows styles
  eyeStyle: string;        // 10 eye shapes
  noseStyle: string;       // 10 nose shapes
  mouthStyle: string;      // 10 mouth shapes
  earStyle: string;        // 10 ear shapes
  background: string;      // 8 situational backgrounds
  facialHair: string;      // 'none' | 'beard' | 'mustache'
  facialHairColor: string; // Hex code
  shoeType?: string;       // 'sneakers' | 'boots' | 'slippers' | 'loafers' | 'heels' | 'rainbow_socks'
  shoeColor?: string;      // Hex code
  summaryText?: string;    // Contextual description
}

export interface PresetAvatar {
  id: string;
  name: string;
  avatar: AvatarParameters;
  emoji: string;
}
