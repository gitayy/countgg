import { Alert, AlertColor, Snackbar } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useSound from "use-sound";
import { SocketContext } from "../utils/contexts/SocketContext";
import { UserContext } from "../utils/contexts/UserContext";
import { useIsMounted } from "../utils/hooks/useIsMounted";
import { usePageVisibility } from "../utils/hooks/usePageVisibility";


export const SnackbarComponent = () => {

    const socket = useContext(SocketContext);
    const {counter, loading, setCounter, setAllegiance} = useContext(UserContext);
    const navigate = useNavigate();
    const isVisible = usePageVisibility();

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

      return(<>
      {snack && <Snackbar sx={{cursor: 'pointer'}} open={snack.open} onClick={() => navigate(snack.url)} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
         <Alert severity={(snack.severity as AlertColor || 'success')}>
           {snack.message}
         </Alert>
       </Snackbar>}
      </>);

}