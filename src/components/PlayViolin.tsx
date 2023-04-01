import { useEffect } from "react";
import useSound from "use-sound";
import violinSfx from '../utils/sounds/violin-epic.mp3'

export default function PlayViolin({ playSound }) {

  const [play, {stop}] = useSound(violinSfx, { interrupt: true });

  useEffect(() => {
    if(playSound && play) {
      console.log("Playing sound");
      play();
      return(() => {stop()})
    }
  }, [playSound, play]);
  return null;
}