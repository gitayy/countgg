import { useContext, useEffect, useState } from 'react';
import Terminal, { ColorMode, TerminalOutput } from 'react-terminal-ui';
import { SocketContext } from '../utils/contexts/SocketContext';
import { UserContext } from '../utils/contexts/UserContext';

export const TerminalController = (props = {}) => {
  const { user, counter, loading } = useContext(UserContext);
  const socket = useContext(SocketContext);
  
  const defaultLines = user && counter ? [
    <TerminalOutput key={Math.random()}>&gt; ALL SYSTEMS OFFLINE</TerminalOutput>,
  ] : [];
  const [terminalLineData, setTerminalLineData] = useState(user && counter ? defaultLines : []);

  useEffect(() => {
    socket.on('addToTerminal', function(data) {
      const { response, responseColor } = data;
      setTerminalLineData(prevLines => {
          let ld = [...prevLines];
            ld.push(
              <TerminalOutput key={Math.random()}><span style={{color: responseColor}}>{response}</span></TerminalOutput>
            )
          if(ld.length > 21) {
            ld = ld.slice(-21)
          }
          return ld;
      });
    });

    return () => {
      socket.off('addToTerminal');
    }
  },[]);

  function handleInput(input: string) {
      let ld = [...terminalLineData];
    ld.push(<TerminalOutput key={Math.random()}>Unrecognized command</TerminalOutput>);
    if(ld.length > 21) {
      ld = ld.slice(-21)
    }
    setTerminalLineData(ld);
  }

  if(counter && !loading) {
    return (
      <div className="container" style={{maxWidth: '100%'}}>
        <Terminal name='ssh-keygen' colorMode={ ColorMode.Dark }  onInput={ terminalInput => handleInput(terminalInput) }>
          { terminalLineData }
        </Terminal>
      </div>
    )
  } else {
    return <></>
  }
  };