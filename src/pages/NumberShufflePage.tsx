import { useContext, useEffect, useRef, useState } from 'react';
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Dialog, Grid, IconButton, Modal, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Theme, Typography, useMediaQuery } from '@mui/material';
import { convertToTimestamp, findPossibleIndicesForNextMove, formatDate, formatDateExact, formatTimeDiff} from '../utils/helpers';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SocketContext } from '../utils/contexts/SocketContext';
import moment from 'moment-timezone';
import { MUIBarGraph } from '../components/MUIBarGraph';
import ErrorBoundary from '../components/ErrorBoundary';
import { UserContext } from '../utils/contexts/UserContext';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';



export const NumberShufflePage = () => {
    const location = useLocation();
    useEffect(() => {
        document.title = `Number Shuffle | Counting!`;
        return (() => {
          document.title = 'Counting!';
        })
      }, [location.pathname]);
      const params = new URLSearchParams(location.search);
    const { counter } = useContext(UserContext);
    const navigate = useNavigate()


  // Access optional parameters
  const a = params.get('seed');
  const currentDay = moment().tz('America/New_York').format('YYYY-MM-DD');

  function useSetting<T>(
    key: string,
    initial: T
  ): [T, (value: T | ((t: T) => T)) => void] {
    const [current, setCurrent] = useState<T>(() => {
      try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initial;
      } catch (e) {
        return initial;
      }
    });
    const setSetting = (value: T | ((t: T) => T)) => {
      try {
        const v = value instanceof Function ? value(current) : value;
        setCurrent(v);
        window.localStorage.setItem(key, JSON.stringify(v));
      } catch (e) {}
    };
    return [current, setSetting];
  }
      const socket = useContext(SocketContext);
    
      const [gameSize, setGameSize] = useState(10);
      const [preferredGameSize, setPreferredGameSize] = useSetting<number>("preferredGameSize", 10);
      const [seed_id, setSeed_id] = useState(params.get('seed') || undefined);
      const [dateStr, setDateStr] = useState('');
      const [gameStatus, setGameStatus] = useState('Loading...');
      const [scoreData, setScoreData] = useState([]);
      const [highScore, setHighScore] = useState(0);
      const [highScoreSeed, setHighScoreSeed] = useState('');
      const [searchParams, setSearchParams] = useSearchParams();
      const [gameHistory, setGameHistory] = useState<{seed: string, gameStatus: string, size: number, score: number}[]>([])
      const [page, setPage] = useState(0);
      const [rowsPerPage, setRowsPerPage] = useState(10);
    
      const handleChangePage = (event, newPage) => {
        setPage(newPage);
      };
    
      const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
      };

      const startGame = (isDaily: boolean, gameSize?: number, seed_id?: string) => {
        socket.emit('number_shuffle', {isDaily: isDaily, size: preferredGameSize, seed_id: seed_id});
      }

      useEffect(() => {
        console.log('number_shuffle on');
        socket.on('number_shuffle_games', (data) => {
          console.log(data);
          setGameHistory(data);
        })
        socket.on('number_shuffle', (data) => {
          // console.log(data);
          const movesCopy = [...data.moves];
          setNumbers(movesCopy);
          setNumbersCopy(movesCopy);
          setCurrentNumber(data.randomNumber);
          data.gameStatus !== 'in_progress' && data.gameStatus !== 'won' && data.fresh_loss
          ? setTimeout(() => {
            setGameStatus(data.gameStatus);
          }, 1000)
          : setGameStatus(data.gameStatus);
          setSeed_id(data.seed_id);
          !data.day && setSearchParams({"seed": data.seed_id})
          data.highScore !== undefined && setHighScore(data.highScore)
          data.highScoreSeed !== undefined && setHighScoreSeed(data.highScoreSeed)
          setDateStr(data.day);
          setGameSize(data.size);
          setScore(data.score);
          setScoreData(data.all_scores);
          currentSelectedIndex.current = -1;
          setSelectedIndex(-1);
        });
          socket.emit('number_shuffle', {isDaily: seed_id === undefined, size: gameSize, seed_id: seed_id});
        return (() => {
          console.log('number_shuffle off');
          socket.off('number_shuffle');
        })
      }, [socket]);

      useEffect(() => {
        if(gameStatus !== 'Loading...' && gameStatus !== 'in_progress') {
          setDialogOpen(true);
        }
      }, [gameStatus]);

      const [numbers, setNumbers] = useState(Array(gameSize).fill(0));
      const [numbersCopy, setNumbersCopy] = useState(Array(gameSize).fill(0));
      const [score, setScore] = useState(0);
  const [currentNumber, setCurrentNumber] = useState(-1);
  const currentSelectedIndex = useRef(-1);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleSave = (index: number) => {
    socket.emit('number_shuffle', {newMoveSpot: index, seed_id: seed_id});
  }

  const [dialogOpen, setDialogOpen] = useState(false);
  const [optionsDialogOpen, setOptionsDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(true);
    const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up('lg'));

    // Function to generate rainbow colors
function generateRainbowColors(count, opacity = 1) {
  let colors: string[] = [];
  const rainbowLength = 360; // 360 degrees for the full color spectrum
  const step = rainbowLength / count;

  for (let i = 0; i < count; i++) {
    const hue = i * step;
    const color = `hsl(${hue}, 100%, 50%, ${opacity})`;
    colors.push(color);
  }

  return colors;
}

function generateClosestRainbowEmojiColors(count) {
  const emojiColors = [
    { emoji: '❤️', hue: 0 },          // Red
    { emoji: '🧡', hue: 30 },         // Orange
    { emoji: '💛', hue: 60 },         // Yellow
    { emoji: '💚', hue: 120 },        // Green
    { emoji: '💙', hue: 210 },        // Blue
    { emoji: '💜', hue: 270 },        // Indigo
    { emoji: '💗', hue: 330 },        // Pink
  ];

  const step = 360 / count;
  
  return Array.from({ length: count }, (_, index) => {
    const hue = index * step;
    const closestColor = emojiColors.reduce((prev, curr) => {
      return Math.abs(curr.hue - hue) < Math.abs(prev.hue - hue) ? curr : prev;
    });
    return closestColor.emoji;
  });
}

const [isCopied, setIsCopied] = useState(false);

const [clipboardText, setClipboardText] = useState('');
const [clipboardThingOpen, setClipboardThingOpen] = useState(false);

useEffect(() => {
  if(!dialogOpen) {
    setIsCopied(false);
    setClipboardThingOpen(false);
  } else {

  }
}, [dialogOpen])


      const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus and select the text when the component mounts
    if(inputRef.current && clipboardThingOpen) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [clipboardThingOpen]);

const copyToClipboard = async () => {
  const closestEmojis = generateClosestRainbowEmojiColors(numbersCopy.length);
  const emojiStr = closestEmojis.map((emoji, index) => {
    if(numbersCopy[index] !== 0) {
      return emoji;
    } else {
      return '🖤';
    }}).join('');
    const fullClipboard = `Number Shuffle ${score}/${gameSize}${dateStr ? ` (${dateStr})` : ' (Freeplay)'} ${emojiStr}   \nhttps://counting.gg/shuffle${seed_id && !dateStr ? `?seed=${seed_id}` : ''}`;
    console.log(fullClipboard);
    setClipboardText(fullClipboard);

    if (
      /android|iphone|ipad|ipod|webos/i.test(navigator.userAgent) &&
      !/firefox/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share({ text: fullClipboard });
        setIsCopied(true);
        return;
      } catch (e) {
        console.warn("navigator.share failed:", e);
        setClipboardThingOpen(true);
      }
    }
    try {
      await navigator.clipboard.writeText(fullClipboard);
      setIsCopied(true);
      return;
    } catch (e) {
      console.warn("navigator.clipboard.writeText failed:", e);
      setClipboardThingOpen(true);
    }
}



  const renderNumbers = () => {
  const rainbowColors = generateRainbowColors(numbersCopy.length);
  const rainbowColorsWithOpacity = generateRainbowColors(numbersCopy.length, 0.35);
    return numbersCopy.map((number, index) => (
      <Grid item key={index} sx={{display: 'flex', flexDirection: 'row', height: `${100 / gameSize}%`,
      background: numbers[index] !== 0 ? `black!important` : 'white!important',
      opacity: numbers[index] !== 0 ? `1` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? `1` : `0.25`
      }}>
        <Grid container spacing={0}>
          <Grid item xs={2} lg={1}sx={{
            display: 'flex',
            textShadow: '0px 0px 3px black, 0px 0px 3px black',
            color: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            // bgcolor: rainbowColors[index],
            background: numbers[index] !== 0 ? `${rainbowColors[index]}` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? `${rainbowColors[index]}` : `${rainbowColors[index]}`
          }}>{index + 1}</Grid>
          <Grid item xs={10} lg={11} sx={{
                        color: 'white',
                        textShadow: '0px 0px 3px black, 0px 0px 3px black',
            background: numbers[index] !== 0 ? `${rainbowColors[index]}` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? `${rainbowColorsWithOpacity[index]}` : `${rainbowColors[index]}`,
            border: `2px solid ${numbers[index] !== 0 ? `transparent` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? `transparent` : `${rainbowColors[index]}`}`,
          }}>
        <Box
          sx={{
            width: '100%',
            // height: isDesktop ? '7vh' : '5vh',
            // height: '6vh',
            // mt: '1vh',
            height: '100%',
            minHeight: '5px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: `${Math.min(...[(25 / gameSize), 5])}rem`,
            cursor: numbers[index] !== 0 ? 'default' : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? `pointer` : 'not-allowed',
            
            // border: `2px solid ${numbers[index] !== 0 ? `transparent` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? 'green' : 'red'}}`,
            // bgcolor: number === 0 ? 'background.paper' : 'green',
            // background: numbers[index] !== 0 ? `purple!important` : findPossibleIndicesForNextMove(numbers, currentNumber).includes(index) ? 'green' : 'red',

          }}
          onClick={() => {
            if (currentNumber > 0 && number === 0 && findPossibleIndicesForNextMove(numbers, currentNumber).includes(index)) {
              const newNumbers = [...numbers];
              newNumbers[index] = currentNumber;
              setNumbersCopy(newNumbers);
              currentSelectedIndex.current = index;
              setSelectedIndex(index);
            }
          }}
        >
          {number === 0 ? '' : number}
        </Box>
        </Grid>
        {/* {number !== 0 && numbers[index] === 0 && (
          <Button
            onClick={() => handleSave(index)}
            variant="contained"
            color="primary"
            size="small"
            style={{ marginTop: '1vh', width: '10%', height: '5vh', marginLeft: '10px' }}
          >
            Save
          </Button>
        )} */}
        </Grid>
      </Grid>
    ));
  };
  
  const [newGameModalOpen, setNewGameModalOpen] = useState(false);
  const newGameCheck = () => {
    if(gameStatus === 'in_progress') {
      setNewGameModalOpen(true);
    } else {
      startGame(false);
    }
  }

  useEffect(() => {
    if(counter) {
      socket.emit('number_shuffle_games');
    }
  }, [counter])

  const modalStyle = {
    position: 'absolute' as 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '75%',
    bgcolor: 'background.paper',
    color: 'text.primary',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
    maxHeight: '75%', 
    overflowY: 'scroll',
  };

  const checkGameSize = (input) => {
    // Ensure the input is a number between 1 and 20
    if (/^\d+$/.test(input)) {
      const number = parseInt(input, 10);
      if (number >= 2 && number <= 20) {
        setPreferredGameSize(number);
      }
    }
  };

    return (
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, display: 'flex', color: 'text.primary'}}>
          <Grid container spacing={0} sx={{flexGrow: 1}}>
            <Grid item xs={6} sx={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <Accordion sx={{width: '100%'}} expanded={modalOpen} onChange={() => setModalOpen(!modalOpen)} aria-labelledby="modal-modal-title" aria-describedby="modal-modal-description">
        <AccordionSummary
          // expandIcon={<ExpandMoreIcon />}
          sx={{
            cursor: "pointer",
          }}
        >
          <Typography sx={{
            fontSize: '1.5rem',
            textAlign: 'center',
            display: 'block', 
            width: '100%',}}>Number Shuffle</Typography>
        </AccordionSummary>
        <AccordionDetails>
        {/* <Typography variant="h4" component="h1" align="center" m={1} mb={3}>
          Number Shuffle
        </Typography> */}

        <Typography variant="body2" component="h1" align="center" m={1}>
          {gameSize} random numbers between 1 and 1000.
        </Typography>

        <Typography variant="body2" component="h1" align="center" m={1}>
          Order the numbers from smallest to largest.
        </Typography>

        <Typography variant="body2" component="h1" align="center" m={1}>
          Once you place a number, you cannot move it.
        </Typography>

        <Typography variant="body2" component="h1" align="center" m={1}>
          The game ends when there are no more possible moves.
        </Typography>
        </AccordionDetails>
        </Accordion>

        <Modal
            open={dialogOpen}
            onClose={() => {setDialogOpen(false)}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Grid container sx={modalStyle}>
              <Grid item xs={12}>
              {gameStatus === 'won' ? <Box>
                <Typography variant="h3" component="h1" align="center" m={1}>
                  You won! You scored {numbers.filter(number => {return number !== 0}).length} points!
                </Typography>
                </Box> : <Box>
                  <Typography variant="h3" component="h1" align="center" m={1}>
                  You lost! You scored {numbers.filter(number => {return number !== 0}).length} points!
                </Typography>
                </Box>
                }
              </Grid>
              <Grid item xs={12}>
              {counter ? <Box>
                <Typography variant="h6" component="h1" align="center" m={1} onClick={() => startGame(false, undefined, highScoreSeed)
                   } sx={{cursor: 'pointer'}}>
                  High score: {highScore}/{gameSize}
                </Typography>
                </Box> : <Box>
                  <Typography variant="h6" component="h1" align="center" m={1}>
                  Sign in to track your high score! 
                </Typography>
                </Box>
                }
              </Grid>
              <Grid item xs={12} lg={6}>
                <Button onClick={() => {copyToClipboard()}} variant="contained" color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Button onClick={() => {setDialogOpen(false); startGame(false)}} variant="contained" color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  New Game
                </Button>
                </Grid>
              {clipboardThingOpen && <TextField
                label="Number Shuffle Results"
                variant="outlined"
                fullWidth
                multiline
                inputRef={inputRef} // Reference for focusing and selecting text
                value={clipboardText}
                sx={{
                  my: 3,
                }}
              />}
              <Grid item xs={12}>
                <Button onClick={() => {setDialogOpen(false)}} color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  Close
                </Button>
                </Grid>
                <Grid item xs={12}>
                {scoreData && <ErrorBoundary comment='Bar Graph'><MUIBarGraph scores={scoreData} /></ErrorBoundary>}
              </Grid>
              </Grid>
              
          </Modal>
          <Modal
            open={optionsDialogOpen}
            onClose={() => {setOptionsDialogOpen(false)}}
            aria-labelledby="modal-options-modal-title"
            aria-describedby="modal-options-modal-description"
          >
            <Grid container sx={modalStyle}>
              <Grid item xs={12}>
              <Box>
                  <Typography variant="h3" component="h1" align="center" m={1}>
                  Options
                </Typography>
                </Box>
                
              </Grid>
              <Grid item xs={12} lg={6}>
              <TextField
                label="Game Size (2 to 20)"
                variant="outlined"
                fullWidth
                type='number'
                defaultValue={preferredGameSize}
                onChange={e => checkGameSize((e.target as HTMLInputElement).value)}
                inputProps={{
                  pattern: '[0-9]*', // Allow only numeric input
                  inputMode: 'numeric', // Set input mode to numeric
                  // maxLength: 2, // Limit the input to 2 characters (optional)
                  // min: "2", max: "20", step: "1"
                  step: "1"
                }}
              />
              </Grid>
              <Grid item xs={12} lg={6}>
                <Button onClick={() => {setOptionsDialogOpen(false); newGameCheck()}} variant="contained" color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  New Game
                </Button>
                </Grid>
              {clipboardThingOpen && <TextField
                label="Number Shuffle Results"
                variant="outlined"
                fullWidth
                multiline
                inputRef={inputRef} // Reference for focusing and selecting text
                value={clipboardText}
                sx={{
                  my: 3,
                }}
              />}
              <Grid item xs={12}>
                <Button onClick={() => {setOptionsDialogOpen(false)}} color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  Close
                </Button>
                </Grid>
              </Grid>
          </Modal>
          <Modal
            open={historyDialogOpen}
            onClose={() => {setHistoryDialogOpen(false)}}
            aria-labelledby="modal-history-modal-title"
            aria-describedby="modal-history-modal-description"
          >
            <Grid container sx={modalStyle}>
              <Grid item xs={12}>
              <Box>
                  <Typography variant="h3" component="h1" align="center" m={1}>
                  History
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} lg={12}>
              <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Game Status</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Start Game</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {gameHistory
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((game, index) => (
                <TableRow key={index}>
                  <TableCell>{game.gameStatus}</TableCell>
                  <TableCell>{game.size}</TableCell>
                  <TableCell>{game.score}</TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => {startGame(false, undefined, game.seed); setHistoryDialogOpen(false)}}
                    >
                      <PlayCircleOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={gameHistory.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
              </Grid>
              <Grid item xs={12}>
                <Button onClick={() => {setHistoryDialogOpen(false)}} color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  Close
                </Button>
                </Grid>
              </Grid>
          </Modal>
          <Modal
            open={newGameModalOpen}
            onClose={() => {setNewGameModalOpen(false)}}
            aria-labelledby="modal-new-game-modal-title"
            aria-describedby="modal-new-game=modal-description"
          >
            <Grid container sx={modalStyle}>
              <Grid item xs={12}>
              <Box>
                <Typography variant="h3" component="h1" align="center" m={1}>
                  Are you sure? Your game is still in progress!
                </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Button onClick={() => {startGame(false); setNewGameModalOpen(false)}} variant="contained" color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  New Game
                </Button>
              </Grid>
              <Grid item xs={12} lg={6}>
                <Button onClick={() => {setNewGameModalOpen(false)}} color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
                  Close
                </Button>
                </Grid>
              </Grid>
          </Modal>
        {/* <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} sx={{
          // width: "80vw",
          // height: "80vh",
        }}>
          <Paper sx={{width: "100%", height: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'}}>
            You lost! You scored {numbers.filter(number => {return number !== 0}).length} points!
            </Paper>
        </Dialog> */}

        <Typography variant="h1" sx={{mt: 3, width: "100%", textAlign: 'center', borderRadius: '10px', 
        // bgcolor: `secondary.light`
        }}>{currentNumber > 0 ? currentNumber : gameStatus === 'won' ? 'W' : ""}</Typography>
        {gameStatus !== 'Loading...' && gameStatus === 'in_progress' && (
          <Button
            onClick={() => handleSave(currentSelectedIndex.current)}
            variant="contained"
            color="primary"
            size="small"
            disabled = {selectedIndex === -1}
            sx={{ width: '95%', height: '5vh', mb: 2, flexGrow: 1, fontSize: '5rem' }}
          >
            Shuffle
          </Button>
        )}

        {gameStatus !== 'Loading...' && gameStatus !== 'in_progress' &&
        <Button
        onClick={() => setDialogOpen(true)}
        variant="contained"
        color="primary"
        size="small"
        sx={{ width: '95%', height: '5vh', mb: 2 }}
      >
        View Results
      </Button>}

{/* {(
          <Button
            onClick={() => startGame(false)}
            variant="contained"
            color="primary"
            size="small"
            style={{ marginTop: '1vh', width: '95%', height: '5vh', 
            marginLeft: '10px'
           }}
          >
            Start
          </Button>
        )} */}
        {/* {gameStatus !== 'Loading...' && gameStatus !== 'in_progress' && 
        <Button onClick={() => {setDialogOpen(false); startGame(false)}} variant="contained" color="primary" size="small" style={{ marginTop: '1vh', width: '95%', height: '5vh', marginLeft: '10px' }}>
        New Game
      </Button>} */}

      

         <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'end', mt: 3, flexGrow: 1, width: '100%'}}>
          <Box sx={{display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center'}}>
          {gameStatus !== 'Loading...' && 
        <Button onClick={() => {setDialogOpen(false); newGameCheck()}} variant="contained" color="primary" size="small" sx={{ width: '95%', height: '5vh', mb: 2 }}>
        New Game
      </Button>}
      <Grid container spacing={1} sx={{width: '95%'}}>
        <Grid item xs={6}>
        <Button onClick={() => {setOptionsDialogOpen(true)}} variant="contained" color="secondary" size="small" sx={{ width: '100%', height: '5vh', mb: 2 }}>
        Options
      </Button>
        </Grid>
        <Grid item xs={6}>
        <Button onClick={() => {setHistoryDialogOpen(true)}} variant="contained" color="secondary" size="small" sx={{ width: '100%', height: '5vh', mb: 2 }}>
        History
      </Button>
        </Grid>
      </Grid>
      {dateStr && <Paper sx={{width: '100%'}}>
          <Typography fontSize={'1rem'} align="center" m={1}>
            Daily Challenge {dateStr}
          </Typography>
          </Paper>}
          </Box>
        </Box>

        </Grid>

        

        <Grid item xs={6} sx={{display: 'flex', bgcolor: '' }}>

        <Box sx={{ 
          // px: '20px', 
          display: 'flex', flexGrow: 1 }}>
            {/* <Grid container sx={{display: 'flex', flexDirection: 'column', height: isDesktop ? 'calc(100vh - 140px)' : 'calc(90vh - 140px)' }}> */}
            <Grid container sx={{flexDirection: 'column'}}>
                {renderNumbers()}
            </Grid>
        </Box>
        </Grid>
        </Grid>

      </Box>
    );
  }
