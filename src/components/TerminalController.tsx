import { useContext, useEffect, useState } from 'react';
import Terminal, { ColorMode, TerminalInput, TerminalOutput } from 'react-terminal-ui';
import { SocketContext } from '../utils/contexts/SocketContext';
import { UserContext } from '../utils/contexts/UserContext';

export const TerminalController = (props = {}) => {
  const { user, counter, loading, setCounter, allegiance } = useContext(UserContext);
  const socket = useContext(SocketContext);
  
  const defaultLines = user && counter && allegiance ? [
    <TerminalOutput>&gt; CPU CORE 0: {allegiance.val.p0[0]}kB / {allegiance.val.p0[1]}kB </TerminalOutput>,
    <TerminalOutput>&gt; CPU CORE 1: {allegiance.val.p1[0]}GB / {allegiance.val.p1[1]}GB </TerminalOutput>,
    <TerminalOutput>&gt; CPU CORE 2: {allegiance.val.p2[0]}MB / {allegiance.val.p2[1]}MB </TerminalOutput>,
    <TerminalOutput>&gt; ssh-keygen: USER {user.uuid}: {user.inventory ? user.inventory.filter(item => {return item['type'] === 'key'}).length : 0} / 6 SECURE KEYS CREATED</TerminalOutput>,
    <TerminalOutput>&gt; ssh-keygen: GROUP {allegiance.name}: {allegiance.val.team_inventory ? allegiance.val.team_inventory.filter(item => {return item['type'] === 'key'}).length : 0} / 5 SECURE KEYS CREATED</TerminalOutput>,
    <TerminalOutput>&gt; LOADED SUCCESSFULLY AT {Date.now()}</TerminalOutput>
  ] : [];
  const [terminalLineData, setTerminalLineData] = useState(user && counter && allegiance ? defaultLines : []);

  useEffect(() => {
    socket.on('addToTerminal', function(data) {
      const { response, responseColor } = data;
      setTerminalLineData(prevLines => {
          let ld = [...prevLines];
            ld.push(
              <TerminalOutput><span style={{color: responseColor}}>{response}</span></TerminalOutput>
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
      const isAnswerAttempt = input.toLocaleLowerCase().trim().match(/^answer (.*)$/i);
      ld.push(<TerminalInput>{input}</TerminalInput>);
    if (['help', '-help', '--help', 'h', '-h', '--h'].includes(input.toLocaleLowerCase().trim())) {
      ld.push(
      <TerminalOutput>hint</TerminalOutput>,
      <TerminalOutput>-- GRANTS USER UNIQUE HINT</TerminalOutput>,
      <TerminalOutput>question [number?]</TerminalOutput>,
      <TerminalOutput>-- DISPLAYS CURRENT QUESTION</TerminalOutput>,
      <TerminalOutput>answer &lt;answer&gt;</TerminalOutput>,
      <TerminalOutput>-- SUBMITS ANSWER ATTEMPT. USERS MAY NOT ATTEMPT TWO QUESTIONS IN A ROW</TerminalOutput>,
      <TerminalOutput>clear</TerminalOutput>,
      <TerminalOutput>-- CLEARS TERMINAL</TerminalOutput>,
      );
    } else if (input.toLocaleLowerCase().trim() === 'hint') {
      socket.emit('requestHint');
    } else if (input.toLocaleLowerCase().trim() === 'clear') {
      ld = defaultLines;
    } else if (input.toLocaleLowerCase().startsWith('question') && allegiance) {
      const match = input.match(/^question\s*(\d+)?$/i);
      if (match) {
        const questionIndex = match[1] ? parseInt(match[1]) - 1 : allegiance.val.q.qH.length - 1;
        const question = allegiance.val.q.qH[questionIndex];
        if (question) {
          ld.push(<TerminalOutput>"{question}"</TerminalOutput>);
        } else {
          ld.push(<TerminalOutput>{`No question ${questionIndex + 1} found`}</TerminalOutput>);
        }
      } else {
        ld.push(<TerminalOutput>{`Unrecognized question number: ${input}`}</TerminalOutput>);        
      }
    } else if(isAnswerAttempt && allegiance && counter) {
      if(Date.now() < allegiance.val.q.tTA) {
        ld.push(<TerminalOutput><span style={{color: 'red'}}>ERROR: MUST WAIT {allegiance.val.q.tTA - Date.now()} BEFORE NEXT ATTEMPT</span></TerminalOutput>);
      } else if(counter.uuid === allegiance.val.q.lU) {
        ld.push(<TerminalOutput><span style={{color: 'red'}}>ERROR: USER MAY NOT SUBMIT TWO ANSWERS IN A ROW</span></TerminalOutput>);
      } else {
        ld.push(<TerminalOutput>SUBMITTING ANSWER "{isAnswerAttempt[1].trim()}"</TerminalOutput>);
        socket.emit('submitQuizAnswer', isAnswerAttempt[1].trim());
      }
    } else if (input) {
      ld.push(<TerminalOutput>Unrecognized command</TerminalOutput>);
    }
    if(ld.length > 21) {
      ld = ld.slice(-21)
    }
    setTerminalLineData(ld);
  }

  if(counter && !loading && allegiance) {
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