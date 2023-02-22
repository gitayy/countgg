import Pog from '../assets/emotes/pog.png'
import PogFish from '../assets/emotes/pogfish.gif'

export const custom_emojis = [
    {
      id: 'pngs',
      name: 'PNGs',
      emojis: [
        {
          id: 'pog',
          name: 'Pog',
          keywords: ['pog'],
          skins: [{ src: Pog }],
        },
      ],
    },
    {
      id: 'gifs',
      name: 'GIFs',
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