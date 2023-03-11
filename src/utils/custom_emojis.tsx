import Pog from '../assets/emotes/pog.png'
import GotIt from '../assets/emotes/gotit.png'
import Dafek from '../assets/emotes/dafek.png'
import Fr from '../assets/emotes/fr-emoji.png'
import Soaked from '../assets/emotes/soaked.png'
import Please from '../assets/emotes/please.png'
import Thanks from '../assets/emotes/thanks.png'
import Wholesome from '../assets/emotes/wholesome.png'
import Upvote from '../assets/emotes/upvote.png'
import Downvote from '../assets/emotes/downvote.png'
import BeenADay from '../assets/emotes/beenaday.png'

import PogFish from '../assets/emotes/pogfish.gif'

export const custom_emojis = [
    {
      id: 'static',
      name: 'Static',
      emojis: [
        {
          id: 'pog',
          name: 'Pog',
          keywords: ['pog'],
          skins: [{ src: Pog }],
        },
        {
          id: 'got_it',
          name: 'Got it',
          keywords: ['gotit', 'got-it', 'got_it'],
          skins: [{ src: GotIt }],
        },
        {
          id: 'dafek',
          name: 'dafek',
          keywords: ['dafek', 'dafuq', 'wtf', 'wth'],
          skins: [{ src: Dafek }],
        },
        {
          id: 'fr-emoji',
          name: 'Fr',
          keywords: ['fr', 'forreal', 'lowkey'],
          skins: [{ src: Fr }],
        },
        {
          id: 'soaked',
          name: 'soaked',
          keywords: ['soaked', 'fox'],
          skins: [{ src: Soaked }],
        },
        {
          id: 'PLEASE',
          name: 'PLEASE',
          keywords: ['please'],
          skins: [{ src: Please }],
        },
        {
          id: 'THANKS',
          name: 'THANKS',
          keywords: ['thanks'],
          skins: [{ src: Thanks }],
        },
        {
          id: 'wholesome',
          name: 'Wholesome',
          keywords: ['wholesome', 'reddit', 'award'],
          skins: [{ src: Wholesome }],
        },
        {
          id: 'upvote',
          name: 'Upvote',
          keywords: ['upvote', 'reddit', 'vote'],
          skins: [{ src: Upvote }],
        },
        {
          id: 'downvote',
          name: 'Downvote',
          keywords: ['downvote', 'reddit', 'vote'],
          skins: [{ src: Downvote }],
        },
        {
          id: 'beenaday',
          name: 'BeenADay',
          keywords: ['beenaday', 'sign', 'man', 'bruh'],
          skins: [{ src: BeenADay }],
        },
      ],
    },
    {
      id: 'animated',
      name: 'Animated',
      emojis: [
        {
          id: 'pogfish',
          name: 'PogFish',
          keywords: ['pog', 'fish'],
          skins: [{ src: PogFish }],
        },
      ],
    },
  ]