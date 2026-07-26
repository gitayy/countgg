import { useParams } from 'react-router-dom'
import { BingoGameView } from '../components/bingo/BingoGameView'

export const BingoGamePage = () => {
  const { gameId } = useParams()
  return <BingoGameView gameId={gameId ?? ''} />
}
