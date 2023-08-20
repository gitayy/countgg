import { Alert, AlertColor, Snackbar } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SocketContext } from "../utils/contexts/SocketContext";
import { UserContext } from "../utils/contexts/UserContext";
import Confetti from 'react-confetti'
import useWindowDimensions from "../utils/hooks/useWindowDimensions";

export const SnackbarComponent = () => {

    const socket = useContext(SocketContext);
    const {counter, setCounter, items, setItems, user, setUser} = useContext(UserContext);
    const navigate = useNavigate();

    const [snack, setSnack] = useState({
        message: '',
        severity: '',
        open: false,
        url: ''
      });
    

    useEffect(() => {
        socket.on(`achievement`, function(data) {
            setSnack({ message: `Achievement unlocked: ${data.name}`, severity: 'success', open: true, url: `/counter/${counter?.username}`})
            setConfetti(true);
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
                  setConfetti(false);
            }, 5000);
          });

          socket.on(`levelUp`, function(data) {
            setSnack({ message: `Level ${data.level} reached! New reward available...`, severity: 'success', open: true, url: `/rewards`})
            setConfetti(true);
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
                  setConfetti(false);
            }, 5000);
          });

          socket.on(`celebration`, function(data) {
            setSnack({ message: data.message, severity: 'success', open: true, url: `/`})
            setConfetti(true);
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
                  setConfetti(false);
            }, 5000);
          });

          socket.on(`item`, function(data) {
            setSnack({ message: `New ${data.item ? data.item.category : "item"} unlocked: ${data.item ? data.item.name : "???"}`, severity: 'success', open: true, url: `/prefs`})
            setConfetti(true);
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
                  setConfetti(false);
            }, 5000);
          });

          socket.on(`popupMessage`, function(data) {
            setSnack({ message: data, severity: 'error', open: true, url: `/counter/${counter ? counter.username : ''}`})
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
              console.log("Setting counter");
              console.log(data);
              setCounter(data);
            }
          });

          socket.on(`setItems`, function(data) {
            if(setItems) {
              console.log("Setting items");
              console.log(data);
              setItems(data);
            }
          });

          socket.on(`setUser`, function(data) {
            if(setUser) {
              console.log("Setting user");
              console.log(data);
              setUser(data);
            }
          });
          
          socket.on(`setUserItems`, function(data) {
            if(setItems) {
              console.log("Setting user items");
              console.log(data);
              setItems(data);
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


        const [confetti, setConfetti] = useState(false);
        const { height, width } = useWindowDimensions();

        // console.log("AYO@@2");
        // console.log(height, width, window.innerHeight, window.innerWidth);

      return(<>
      {snack && <Snackbar sx={{cursor: 'pointer'}} open={snack.open} onClick={() => navigate(snack.url)} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
         <Alert severity={(snack.severity as AlertColor || 'success')}>
           {snack.message}
         </Alert>
       </Snackbar>}
       {confetti && <Confetti run={confetti} recycle={false} height={height || Math.floor(window.innerHeight)} width={width || Math.floor(window.innerWidth)} />}
       {/* <Confetti /> */}
       {/* <Confetti height={height || Math.floor(window.innerHeight)} width={width || Math.floor(window.innerWidth)} /> */}
      </>);

}