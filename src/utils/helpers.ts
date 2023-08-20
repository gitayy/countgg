import { Counter, PostType } from './types';
import { format } from 'date-fns';
import { createElement } from 'react';
import { validate as uuid_validate } from 'uuid';

export const site_version = "v1.3.3";
export var loaded_site_version;
export function updateSiteVer(siteVer: string) {
  loaded_site_version = siteVer;
}

export const titles = {
  'COUNTER': {value: 1, style: 'title-default'},
  'BETA TESTER': {value: 2, style: 'title-default'},
  'THE BIG ONE': {value: 3, style: 'title-default'},
  'NOTHING PERSONNEL': {value: 4, style: 'title-default'},
  'CAN I GET UHHHH': {value: 5, style: 'title-default'},
  'TEAM BLAZE': {value: 6, style: 'title-default'},
  'HOT': {value: 7, style: 'title-default'},
  '🔥': {value: 8, style: 'title-default'},
  'TEAM RADIANT': {value: 9, style: 'title-default'},
  'DAZZLING': {value: 10, style: 'title-default'},
  '⭐': {value: 11, style: 'title-default'},
  'TEAM WAVE': {value: 12, style: 'title-default'},
  'SOAKED': {value: 13, style: 'title-default'},
  // '🌊': {value: 14, style: 'title-default'},
};

export const card_backgrounds = {
  // 'default': {value: 1, style: 'light'},
  'wavypurple': {value: 2, style: 'dark'},
  // 'rainbow_light': {value: 3, style: 'light'},
  'rainbow_dark': {value: 4, style: 'dark'},
  'blaze_1': {value: 5, style: 'dark'},
  'blaze_2': {value: 6, style: 'dark'},
  // 'radiant_1': {value: 7, style: 'light'},
  // 'radiant_2': {value: 8, style: 'light'},
  // 'wave_1': {value: 9, style: 'light'},
  // 'wave_2': {value: 10, style: 'light'},
}

export const card_borders = {
  'no_border_square': {value: 1},
  'no_border_circle': {value: 2},
  'border_square_blue': {value: 3},
  'border_circle_blue': {value: 4},
  'border_blaze_square': {value: 5},
  'border_blaze_circle': {value: 6},
  'border_radiant_square': {value: 7},
  'border_radiant_circle': {value: 8},
  'border_wave_square': {value: 9},
  'border_wave_circle': {value: 10},
}

export const pronouns: [string, string, string, string][] = [['he', 'him', 'his', 'his'], ['she', 'her', 'her', 'hers'], ['they', 'them', 'their', 'theirs']];

export const defaultCounter = (uuid: string) => ({
  uuid: uuid,
  id: 1,
  discordId: '',
  name: '...',
  username: '...',
  color: '#333333',
  roles: [],
  avatar: '1',
  pronouns: ['they', 'them', 'their', 'theirs'] as [string, string, string, string],
  title: '...',
  cardStyle: '',
  cardBorderStyle: '',
  xp: 100
});

export function EmojiTest(props) {  
  return createElement('em-emoji', props, "" )
}

export const areAllArrayItemsUnique = (arrToTest) => {
  return (arrToTest.length === new Set(arrToTest).size);
}

export const doesArrayContainEntireOf2ndArray = (arr, target) => {
  return target.every(v => arr.includes(v));
}

export const countSameItemsInTwoArrays = (arr1, arr2) => {
  return arr1.filter(i => arr2.includes(i)).length;
}

export const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '75%',
  bgcolor: 'background.paper',
  color: 'text.primary',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '75%', 
  overflowY: 'scroll',
};

export const cachedCounters = {'[SYSTEM]': {
  id: -1,
  uuid: '[SYSTEM]',
  name: '[SYSTEM]',
  username: '[SYSTEM]',
  roles: ['counter'], 
  title: 'SYSTEM', 
  discordId: '0',
  pronouns: ['IT', 'IT', 'IT', 'IT'],
  avatar: '0',
  cardStyle: 'card_default', 
  cardBorderStyle: 'no_border_circle', 
  xp: 0,
  color: '#222222', 
  emoji: "🤖",
}} as { [key: string]: Counter };

export const fakePost = (counter?: Counter): PostType => {
  return {
    uuid: `00000000-0000-0000-00000000`,
    timestamp: "0",
    timeSinceLastCount: 321,
    timeSinceLastPost: 152,
    thread: "fake", 
    rawText: "1,234,567 This is an example post.",
    reactions: [],
    rawCount: "1234567",
    stricken: false,
    isCount: true,
    hasComment: true,
    comment: "This is an example post.", 
    countContent: "1,234,567",
    authorUUID: counter ? counter.uuid : "[SYSTEM]",
    isDeleted: false,
    isCommentDeleted: false,
    isValidCount: true,
    validCountNumber: 1234567,
  }
}

export const addCounterToCache = (counter: Counter) => {
  const { uuid } = counter;
              
  if (!cachedCounters[uuid]) {
    cachedCounters[uuid] = counter;
  }
}

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // check if date is today or yesterday
  if(date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString()}`;
  } else if(date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString()}`;
  }

  // format date in standard format
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
}

export const formatDateWithMilliseconds = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  // check if date is today or yesterday
  if(date.toDateString() === now.toDateString()) {
    return `Today at ${date.toLocaleTimeString(undefined, {hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3})}`;
  } else if(date.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${date.toLocaleTimeString(undefined, {hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3})}`;
  }

  // format date in standard format
  return `${date.toLocaleDateString()} at ${date.toLocaleTimeString(undefined, {hour: 'numeric', minute: 'numeric', second: 'numeric', fractionalSecondDigits: 3})}`;
}

export const formatDateExact = (timestamp: number) => {
  const fnsFormatted = format(timestamp, 'yyyy-MM-dd HH:mm:ss.SSS');
  return timestamp.toString().split(".")[1] ? fnsFormatted + timestamp.toString().split(".")[1] : fnsFormatted; //nanoseconds
}

export var latencyCheck = '';
export var latency = 0

export const uuidParseNano = (uuid) => {
  // Get nanosecond current timestamp string length
  let tl = 16;
  // Strip out timestamp from UUID
  let ts = '';
  let i = -1;
  while(tl--) {
    i++;
    // If special symbols, skip
    if(i===8||i===13||i===14||i===18||i===19||i===23) {
      tl++;
      continue;
    }
    // If timestamp, copy
    ts += uuid[i];
  }
  return BigInt(ts);
}

export const uuidv1ToMs = (uuidv1) => {
  try {
    const uuid_arr = uuidv1.split( '-' );
    const time_str = [
      uuid_arr[ 2 ].substring( 1 ),
      uuid_arr[ 1 ],
      uuid_arr[ 0 ]
    ].join( '' );
    const int_time = parseInt( time_str, 16 ) - 122192928000000000;
    const int_millisec = Math.floor( int_time / 10000 );
    return int_millisec;
  } catch(err) {
    console.log(`Error converting uuidv1 to ms: ${uuidv1}`);
    console.log(err);
    return 0;
  }  
};

export const formatTimeDiff = (time1, time2) => {
  const diff = Math.abs(time2 - time1);
  const year = 31536000000;
  const day = 86400000;
  const hour = 3600000;
  const minute = 60000;
  const second = 1000;
  
  const years = Math.floor(diff / year);
  const days = Math.floor((diff % year) / day);
  const hours = Math.floor((diff % day) / hour);
  const minutes = Math.floor((diff % hour) / minute);
  const seconds = Math.floor((diff % minute) / second);
  const milliseconds = parseFloat((diff % second).toFixed(3));

  var result: string[] = [];
  if (years) result.push(`${years} year${years > 1 ? 's' : ''}`);
  if (days) result.push(`${days} day${days > 1 ? 's' : ''}`);
  if (hours) result.push(`${hours} hour${hours > 1 ? 's' : ''}`);
  if (minutes) result.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
  if (seconds) result.push(`${seconds} second${seconds > 1 ? 's' : ''}`);
  if (milliseconds) result.push(`${milliseconds} millisecond${milliseconds > 0 && milliseconds < 2 ? '' : 's'}`);

  return result.join(', ');
} 

const replyColorNames = [
  'replyGold',
  'reply0',
  'reply100',
  'reply200',
  'reply300',
  'reply400',
  'reply500',
  'reply600',
  'reply700',
  'reply800',
  'reply900',
  'reply1000'
];

export function getReplyColorName(time: number, per: number = 100) {
  if(typeof(time) === 'string') {time = parseFloat(time)}
  const intervalIndex = Math.ceil(Math.round(time) / per);
  if (time < 1) {
    return replyColorNames[0];
  }
  if (intervalIndex >= replyColorNames.length) {
    return replyColorNames[replyColorNames.length - 1];
  }
  return replyColorNames[intervalIndex];
}

export const convertToTimestamp = (uuid) => {
  // should return epoch time as a number or null if invalid input
  try {
    if(uuid_validate(uuid)) {
        return Number(uuidParseNano(uuid)) / 1000;
    } else {
        return null;
    }
  }
  catch(err) {
    console.log(err);
    return null;
  }
}

export const isValidHexColor = (color: string): boolean => {
  const hexColorRegex = /^[0-9A-Fa-f]{6}$/;
  return hexColorRegex.test(color);
}

export const convertMsToFancyTime = (ms: number) => {
  const hours = Math.floor(ms / 3600000).toString().padStart(1, '0');
  ms %= 3600000;
  const minutes = Math.floor(ms / 60000).toString().padStart((parseInt(hours) > 0 ? 2 : 1), '0');
  ms %= 60000;
  const seconds = Math.floor(ms / 1000).toString().padStart(parseInt(hours) > 0 ? 2 : parseInt(minutes) > 0 ? 2 : 1, '0');
  const millisecondsFormatted = (ms % 1000).toString().padStart(3, '0');
  
  return `${parseInt(hours) > 0 ? `${hours}:` : ``}${parseInt(hours) > 0 ? `${minutes}:` : parseInt(minutes) > 0 ? `${minutes}:` : ``}${seconds}.${millisecondsFormatted}`;
}

interface Level {
  level: string;
  xpRequired: number;
  minXP: number;
}

export const levelThresholds: Level[] = [
  { level: '1', xpRequired: 100, minXP: 0 },
  { level: '2', xpRequired: 250, minXP: 100},
  { level: '3', xpRequired: 500, minXP: 250 },
  { level: '4', xpRequired: 800, minXP: 500 },
  { level: '5', xpRequired: 1200, minXP: 800 },
  { level: '6', xpRequired: 1700, minXP: 1200 },
  { level: '7', xpRequired: 2500, minXP: 1700 },
  { level: '8', xpRequired: 3500, minXP: 2500 },
  { level: '9', xpRequired: 5000, minXP: 3500 },
  { level: '10', xpRequired: 6666, minXP: 5000 },
  { level: '11', xpRequired: 8333, minXP: 6666 },
  { level: '12', xpRequired: 10000, minXP: 8333 },
  { level: '13', xpRequired: 12345, minXP: 10000 },
  { level: '14', xpRequired: 15000, minXP: 12345 },
  { level: '15', xpRequired: 20000, minXP: 15000 },
  { level: '16', xpRequired: 26000, minXP: 20000 },
  { level: '17', xpRequired: 33000, minXP: 26000 },
  { level: '18', xpRequired: 42069, minXP: 33000 },
  { level: '19', xpRequired: 54321, minXP: 42069 },
  { level: '20', xpRequired: 69420, minXP: 54321 },
  { level: '21', xpRequired: 84999, minXP: 69420 },
  { level: '22', xpRequired: 100000, minXP: 84999 },
  { level: '23', xpRequired: 118000, minXP: 100000 },
  { level: '24', xpRequired: 138000, minXP: 118000 },
  { level: '25', xpRequired: 160000, minXP: 138000 },
  { level: '26', xpRequired: 183000, minXP: 160000 },
  { level: '27', xpRequired: 208000, minXP: 183000 },
  { level: '28', xpRequired: 235000, minXP: 208000 },
  { level: '29', xpRequired: 265000, minXP: 235000 },
  { level: '30', xpRequired: 300000, minXP: 265000 },
  { level: '31', xpRequired: 337000, minXP: 300000 },
  { level: '32', xpRequired: 377000, minXP: 337000 },
  { level: '33', xpRequired: 420069, minXP: 377000 },
  { level: '34', xpRequired: 465000, minXP: 420069 },
  { level: '35', xpRequired: 509000, minXP: 465000 },
  { level: '36', xpRequired: 555555, minXP: 509000 },
  { level: '37', xpRequired: 605000, minXP: 555555 },
  { level: '38', xpRequired: 666666, minXP: 605000 },
  { level: '39', xpRequired: 725000, minXP: 666666 },
  { level: '40', xpRequired: 800000, minXP: 725000 },
  { level: '41', xpRequired: 888888, minXP: 800000 },
  { level: '42', xpRequired: 1000000, minXP: 888888 },
  { level: '43', xpRequired: 1234567, minXP: 1000000 },
  { level: '44', xpRequired: 1500000, minXP: 1234567 },
  { level: '45', xpRequired: 1750000, minXP: 1500000 },
  { level: '46', xpRequired: 2020202, minXP: 1750000 },
  { level: '47', xpRequired: 2270000, minXP: 2020202 },
  { level: '48', xpRequired: 2600000, minXP: 2270000 },
  { level: '49', xpRequired: 3000000, minXP: 2600000 },
  { level: '50', xpRequired: 3000000, minXP: 3000000 }, // Maximum level
];

export const calculateLevel = (totalXP) => {
  let level: Level = { level: '1', xpRequired: 100, minXP: 0 };
  for (let i = levelThresholds.length - 1; i >= 0; i--) {
    if (totalXP >= levelThresholds[i].minXP) {
      level = levelThresholds[i];
      break;
    }
  }
  return level;
}


export const standardizeFormatOptions = ['Disabled', 'No Separator', 'Commas', 'Periods', 'Spaces']
export const nightModeOptions = ['System', 'On', 'Off'];
export const submitShortcutOptions = ['CtrlEnter', 'Enter', 'Off'];
export const customStrickenOptions = ['Disabled', 'Enabled', 'Inverse'];
export const soundOnStrickenOptions = ['Disabled', 'All Stricken', 'Only My Counts'];
export const postStyleOptions = ['Default', 'LC'];
export const clearOptions = ['Clear', 'No Clear', 'Clipboard', 'Custom'];
export const nightModeColorOptions = ['Default', 'Light', 'Dark'];
export const postPositionOptions = ['Left', 'Right', ];
export const hideStrickenOptions = ['Disabled', 'Minimize', 'Hide'];