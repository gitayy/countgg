import { Alert, AlertColor, Snackbar } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSound from "use-sound";
import { SocketContext } from "../utils/contexts/SocketContext";
import { UserContext } from "../utils/contexts/UserContext";
import { useIsMounted } from "../utils/hooks/useIsMounted";
import { usePageVisibility } from "../utils/hooks/usePageVisibility";
import tadaSfx from '../utils/sounds/tada_compressed.mp3'
import popSfx from '../utils/sounds/pop_compressed.mp3'


export const SnackbarComponent = () => {

    const socket = useContext(SocketContext);
    const {counter, loading, setCounter, setAllegiance} = useContext(UserContext);
    const navigate = useNavigate();
    const isVisible = usePageVisibility();

    const [popRate, setPopRate] = useState(0.5);

    const [playTada, {stop: stopTada}] = useSound(tadaSfx, { interrupt: false });
    const [playPop, {stop: stopPop}] = useSound(popSfx, { interrupt: false, playbackRate: popRate });
    
    const [snack, setSnack] = useState({
        message: '',
        severity: '',
        open: false,
        url: ''
      });
    

    useEffect(() => {
        socket.on(`achievement`, function(data) {
            setSnack({ message: `Achievement unlocked: ${data.name}`, severity: 'success', open: true, url: `/counter/${counter?.uuid}`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
            }, 5000);
          });

          socket.on(`popupMessage`, function(data) {
            setSnack({ message: data, severity: 'error', open: true, url: `/counter/${counter ? counter.uuid : ''}`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
            }, 5000);
          });

          socket.on(`newTeamMember`, function(data) {
            setSnack({ message: `New team member: ${data.name}`, severity: 'success', open: true, url: `/counter/${data.uuid}`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
            }, 5000);
          });

          socket.on(`setCounter`, function(data) {
            if(setCounter) {
              setCounter(data);
            }
          });

          socket.on(`forcePageNav`, function(data) {
            navigate(data.forcePageNav);
          });

          return(() => {
            socket.off(`achievement`);
            socket.off(`newTeamMember`);
            socket.off(`forcePageNav`);
          })
        }, [])

        useEffect(() => {
          socket.on(`setCounter`, function(data) {
            if(setCounter) {
              setCounter(data);
            }
          });
          return(() => {
            socket.off(`setCounter`);
          })
        }, [setCounter])

        useEffect(() => {
          socket.on(`setAllegiance`, function(data) {
            if(setAllegiance) {
              setAllegiance(data);
            }
          });
          return(() => {
            socket.off(`setAllegiance`);
          })
        }, [setAllegiance])

        useEffect(() => {

          socket.on(`popper`, function(data) {
            // if(isVisible) {
              // console.log("Poppin");
              playPop();
              setPopRate(0.5 + data.w * 0.1)
            // };
            setSnack({ message: `${data.w}`, 
            severity: 'info', 
            open: true, 
            url: `/contest`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
              }, 5000);
            });

            socket.on(`popper2`, function(data) {
              // if(isVisible) {
                // console.log("Poppin 2");
                setPopRate(1)
                playPop();
              // };
              setSnack({ message: `${data.w}`, 
              severity: 'info', 
              open: true, 
              url: `/contest`})
              setTimeout(() => {
                  setSnack({
                      message: '',
                      severity: '',
                      open: false,
                      url: ''
                    });
                }, 5000);
              });

          socket.on(`new_inventory`, function(data) {
            if(isVisible) {
              playTada();
            };
            setSnack({ message: 
            data.teamUnlock 
            ? `New team item: ${data.newItem.name} unlocked by ${data.unlocker.name}`
            : `New item: ${data.newItem.name}`, 
            severity: 'success', 
            open: true, 
            url: `/contest`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
              }, 5000);
            });

            return(() => {
              socket.off(`new_inventory`);
              socket.off(`popper`);
              socket.off(`popper2`);
            })
          }, [isVisible, playTada, playPop])

        

      return(<>
      {snack && <Snackbar sx={{cursor: 'pointer'}} open={snack.open} onClick={() => navigate(snack.url)} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
         <Alert severity={(snack.severity as AlertColor || 'success')}>
           {snack.message}
         </Alert>
       </Snackbar>}
      </>);

}