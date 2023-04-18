import { Counter } from './types';
import { format } from 'date-fns';
import { createElement } from 'react';
import { validate as uuid_validate } from 'uuid';

export const site_version = "v1.2.3";
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
  '🌊': {value: 14, style: 'title-default'},
};

export const card_backgrounds = {
  'card_default': {value: 1, style: 'light'},
  'card_wavypurple': {value: 2, style: 'dark'},
  'card_rainbow_light': {value: 3, style: 'light'},
  'card_rainbow_dark': {value: 4, style: 'dark'},
  'card_blaze_1': {value: 5, style: 'dark'},
  'card_blaze_2': {value: 6, style: 'dark'},
  'card_radiant_1': {value: 7, style: 'light'},
  'card_radiant_2': {value: 8, style: 'light'},
  'card_wave_1': {value: 9, style: 'light'},
  'card_wave_2': {value: 10, style: 'light'},
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
  roles: ['counter'], 
  title: 'SYSTEM', 
  discordId: '0',
  pronouns: ['IT', 'IT', 'IT', 'IT'],
  avatar: '0',
  cardStyle: 'card_default', 
  cardBorderStyle: 'no_border_circle', 
  xp: 0,
  color: '#222222', 
}} as { [key: string]: Counter };

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

export const standardizeFormatOptions = ['Disabled', 'No Separator', 'Commas', 'Periods', 'Spaces']
export const nightModeOptions = ['System', 'On', 'Off'];
export const submitShortcutOptions = ['CtrlEnter', 'Enter', 'Off'];
export const customStrickenOptions = ['Disabled', 'Enabled', 'Inverse'];
export const postStyleOptions = ['Default', 'LC'];