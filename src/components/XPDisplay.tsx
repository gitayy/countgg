import { useContext, useState, useEffect } from "react";
import { SocketContext } from "../utils/contexts/SocketContext";
import { UserContext } from "../utils/contexts/UserContext";
import { Box, Typography, LinearProgress } from "@mui/material";
import { calculateLevel } from "../utils/helpers";

export const XPDisplay = () => {
    const { loading, loadedSiteVer, setLoadedSiteVer, counter, setCounter } = useContext(UserContext);
  const socket = useContext(SocketContext);

  const [xp, setXP] = useState<any>(0);


  useEffect(() => {
  
    socket.on(`xp`, function(data) {
      if(counter) {setXP(prevXP => {return parseInt(prevXP) + parseInt(data)})}
    });

    return (() => {
      socket.off('xp');
    });
  }, [loading])

  useEffect(() => {
    if(counter) {setXP(counter.xp)}
  }, [loading])

  return (
    <Box style={{ marginLeft: '8px', width: '100px' }}>
        <Typography variant="body1">LVL {calculateLevel(xp).level}</Typography>
        <LinearProgress variant="determinate" color='secondary' title={`${xp.toString()} / ${calculateLevel(xp).xpRequired}`} value={((xp - calculateLevel(xp).minXP) / (calculateLevel(xp).xpRequired - calculateLevel(xp).minXP)) * 100} sx={{borderRadius: '10px'}} />
        <Typography sx={{fontSize: '9px', mt: 0.5}}>{`${parseInt(xp).toLocaleString()} / ${calculateLevel(xp).xpRequired.toLocaleString()}`}</Typography>
    </Box>
  )
}