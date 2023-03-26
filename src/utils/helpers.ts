import { Counter } from './types';
import { format } from 'date-fns';
import { createElement } from 'react';
import { validate as uuid_validate } from 'uuid';

export const site_version = "v1.1.0";
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
  // 'TEST TITLE': {value: 6, style: 'title-default'}
};

export const card_backgrounds = {
  'card_default': {value: 1, style: 'light'},
  'card_wavypurple': {value: 2, style: 'dark'},
  // 'test_background': {value: 3, style: 'light'}
}

export const card_borders = {
  'no_border_square': {value: 1},
  'no_border_circle': {value: 2},
  'border_square_blue': {value: 3},
  'border_circle_blue': {value: 4},
  // 'test_border': {value: 5}
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

export const cachedCounters = {} as { [key: string]: Counter };

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

export const formatDateExact = (timestamp: number) => {
  const fnsFormatted = format(timestamp, 'yyyy-MM-dd HH:mm:ss.SSS');
  return fnsFormatted + timestamp.toString().split(".")[1]; //nanoseconds
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
  const intervalIndex = Math.ceil((time+1) / per);
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