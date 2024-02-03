import { useEffect, useState } from 'react'
import { getShopItems } from '../api'
import { Item } from '../types'
import { useIsMounted } from './useIsMounted'

export function useFetchShop() {
  const [shopItems, setShopItems] = useState<Item[]>([])
  const [shopItemsLoading, setShopItemsLoading] = useState<boolean>(true)
  const isMounted = useIsMounted()

  useEffect(() => {
    getShopItems()
      .then(({ data }) => {
        if (isMounted.current) {
          setShopItems(data.sort((itemA: Item, itemB: Item) => itemA.price - itemB.price))
        }
        setShopItemsLoading(false)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])

  return { shopItems, shopItemsLoading }
}
