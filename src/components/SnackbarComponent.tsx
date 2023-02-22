import { Alert, Snackbar } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CounterContext } from "../utils/contexts/CounterContext";
import { SocketContext } from "../utils/contexts/SocketContext";


export const SnackbarComponent = () => {

    const socket = useContext(SocketContext);
    const {counter, loading} = useContext(CounterContext);
    const navigate = useNavigate();

    
    const [snack, setSnack] = useState({
        message: '',
        severity: '',
        open: false,
        url: ''
      });
    

    useEffect(() => {
        socket.on(`achievement`, function(data) {
            setSnack({ message: `Achievement unlocked: ${data.name}`, severity: 'success', open: true, url: `/counter/${counter?.id}`})
            setTimeout(() => {
                setSnack({
                    message: '',
                    severity: '',
                    open: false,
                    url: ''
                  });
            }, 5000);
          });

          socket.on(`forcePageNav`, function(data) {
            navigate(data.forcePageNav);
          });
        })

        

      return(<>
      {snack && <Snackbar sx={{cursor: 'pointer'}} open={snack.open} onClick={() => navigate(snack.url)} anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}>
         <Alert>
           {snack.message}
         </Alert>
       </Snackbar>}
      </>);

}