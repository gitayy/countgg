import { areArraysEqual } from "@mui/base";
import { Alert, Box, Button, FormControl, InputLabel, Link, MenuItem, Modal, Paper, Select, Snackbar, Step, StepLabel, Stepper, styled, TextField, Tooltip, Typography } from "@mui/material";
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loading } from "../components/Loading";
import { joinAlliance } from "../utils/api";
import { ContestPage } from "./ContestPage";
import { Counter } from "../utils/types";
import violinSfx from '../utils/sounds/violin.mp3'
import useSound from 'use-sound';
import { useIsMounted } from "../utils/hooks/useIsMounted";
import { ContestAboutPage } from "./ContestAboutPage";
import { UserContext } from "../utils/contexts/UserContext";
import { LinearProgressWithLabel } from "../utils/styles";
import { InventoryItem } from "../components/InventoryItem";
import { cachedCounters, defaultCounter } from "../utils/helpers";
import { SocketContext } from "../utils/contexts/SocketContext";

export const April2023SignupPage = ({ fullPage = true }: {fullPage?: boolean}) => {
    const navigate = useNavigate();
    const { user, counter, loading, setCounter, allegiance } = useContext(UserContext); 
    const socket = useContext(SocketContext);
    const [step, setStep] = useState(0);
    // AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
    // CHANGE THIS _____________________________________________________ to 0

    const isMounted = useIsMounted();

    const [play, {stop}] = useSound(violinSfx, { interrupt: true });

    const location = useLocation();
    useEffect(() => {
        if(fullPage) {
            if(counter && counter.roles && counter.roles.includes('contestant')) {            
                if(isBlaze) {document.title = `Team Blaze 🔥 | countGG`;}
                if(isRadiant) {document.title = `Team Radiant ⭐ | countGG`;}
                if(isWave) {document.title = `Team Wave 🌊 | countGG`;}
            } else {
                document.title = `Contest | countGG`;
            }
            return (() => {
              document.title = 'countGG';
            })
        }

        return () => {};
      }, [location.pathname, counter]);

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const [backgroundIndex, setBackgroundIndex] = useState(0);

    const userKeyCount = allegiance && user && user.inventory ? user.inventory.filter(item => {return item['type'] === 'key'}).length : 0;
    const teamKeyCount = allegiance && user && allegiance.val.team_inventory ? allegiance.val.team_inventory.filter(item => {return item['type'] === 'key'}).length : 0
    const combinedKeyCount = userKeyCount + teamKeyCount;

    const handleOpeningPackage = () => {
        socket.emit('openPackage');
    }

    const [modalOpen, setModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalDesc, setModalDesc] = useState('');
    const handleModalClose = () => {
        setModalOpen(false);
    };

    useEffect(() => {
        socket.on('showModal', function(data) {
          const { title, desc } = data;
          setModalTitle(title);
          setModalDesc(desc);
          setModalOpen(true);
        });
    
        return () => {
          socket.off('showModal');
        }
      },[]);

    useEffect(() => {
        const interval = setInterval(() => {
        setBackgroundIndex((prevIndex) => (prevIndex + 1) % 3);
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const colors = ['#ff0000', '#00ff00', '#0000ff'];

    const currentColor = colors[backgroundIndex];
    const nextColor = colors[(backgroundIndex + 1) % 3];
    
    const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }    
        setSnackbarOpen(false);
      };

    const rulesNext = () => {
        setStep(2);
    }

    // const namesNext = async () => {
    //     if(step===66666) {
    //         setSnackbarOpen(true)
    //         setSnackbarMessage('Ok')
    //     } else {
    //         setStep(1);
    //         try {
    //             // const res = await registerCounter(updateInfo);
    //             // if(res.status == 201) {
    //             //     navigate(`/#registration`);
    //             //     window.location.reload();
    //             // }
    //         }
    //         catch(err) {
    //             setSnackbarOpen(true)
    //             setSnackbarMessage('Error: Submission rejected by server. If this comes as a surprise, please reach out to discord mods via DM!')
    //         }
    //     }
    // }

    const [alliance, setAlliance] = useState('');
    const [allianceEmoji, setAllianceEmoji] = useState('');
    const [teammates, setTeammates] = useState<Counter[]>([]);

    useEffect(() => {
        if(counter && counter.roles && counter.roles.includes('blaze')) {
            // setAlliance('blaze')
            setAllianceEmoji('🔥')
        } else if(counter && counter.roles && counter.roles.includes('radiant')) {
            // setAlliance('radiant')
            setAllianceEmoji('⭐')
        } else if(counter && counter.roles && counter.roles.includes('wave')) {
            // setAlliance('wave')
            setAllianceEmoji('🌊')
        }
        return () => {};
    }, [counter])

    const finallyPickTeam = async () => {
        try {
            const timeNow = Date.now().toString();
            const res = await joinAlliance(timeNow);
            if(res.status == 201) {
                // console.log(res);
                setStep(3);
                // console.log(res.data);
                try {
                    setAlliance(res.data.team);
                    setTeammates(res.data.counters);
                    // setPlaySound(true);
                    if(play) {
                        // console.log("Playing sound");
                        play();
                    }
                }
                catch(err) {
                    console.log(err);
                }
            }
        }
        catch(err) {
            setSnackbarOpen(true)
            setSnackbarMessage(`Error: Could not join a team. Maybe you're already on a team.`);
        }
    }

    const [disableButton, setDisableButton] = useState(true);

    useEffect(() => {
        // Set the disableButton state to true when the component mounts
        setDisableButton(true);
    
        // Use setTimeout to enable the button after the required time has passed
        let timeoutId: NodeJS.Timeout;
        if (step === 0) {
          timeoutId = setTimeout(() => {
            setDisableButton(false);
          }, 90000);
        }
        // } else if (step === 1) {
        //   timeoutId = setTimeout(() => {
        //     setDisableButton(false);
        //   }, 120000); // 2 minutes
        // }
    
        // Clear the timeout when the component unmounts or when the step changes
        return () => {
          clearTimeout(timeoutId);
        };
      }, [step]);

    const options = ['🔥 BLAZE', '⭐ RADIANT', '🌊 WAVE'];
    const isBlaze = counter && counter.roles && counter.roles.includes('contestant') && counter.roles.includes('blaze')
    const isRadiant = counter && counter.roles && counter.roles.includes('contestant') && counter.roles.includes('radiant')
    const isWave = counter && counter.roles && counter.roles.includes('contestant') && counter.roles.includes('wave')
    const [fakeAlliance, setFakeAlliance] = useState('🔥 BLAZE');
    const fakeAllianceRef = useRef('🔥 BLAZE');
    const startTime = useRef(0);
    let intervalId: NodeJS.Timeout;
    const animation = () => {
        // Choose the next option in the list
        const currentIndex = options.indexOf(fakeAllianceRef.current);
        const nextIndex = (currentIndex + 1) % options.length;
        const nextOption = options[nextIndex];
      
        // Update the alliance state
        setFakeAlliance(nextOption);
        fakeAllianceRef.current = nextOption;

        // console.log(`Ok, ${fakeAllianceRef.current}`);
      
        // Update the animation speed
        const elapsedTime = Date.now() - startTime.current;
        if (elapsedTime >= 10000 && elapsedTime < 20000) {
          clearInterval(intervalId);
          intervalId = setInterval(animation, 200);
        } else if (elapsedTime >= 20000 && elapsedTime < 30000) {
          clearInterval(intervalId);
          intervalId = setInterval(animation, 400);
        } else if (elapsedTime >= 30000 && elapsedTime < 40000) {
          clearInterval(intervalId);
          intervalId = setInterval(animation, 800);
        } else if (elapsedTime >= 40000 && elapsedTime < 50000) {
          clearInterval(intervalId);
          intervalId = setInterval(animation, 1600);
        } else if (elapsedTime >= 50000) {
          clearInterval(intervalId);
        //   console.log(`All done. Setting them to real value: ${alliance}`);
          if(alliance === 'blaze') {
            setFakeAlliance('🔥 BLAZE');
            fakeAllianceRef.current = '🔥 BLAZE';
            setAllianceEmoji('🔥')
          } else if(alliance === 'radiant') {
            setFakeAlliance('⭐ RADIANT');
            fakeAllianceRef.current = '⭐ RADIANT';
            setAllianceEmoji('⭐')
          } else if(alliance === 'wave') {
            setFakeAlliance('🌊 WAVE');
            fakeAllianceRef.current = '🌊 WAVE';
            setAllianceEmoji('🌊')
          }
          setTimeout(function() {
            if(setCounter) {
                setCounter((counter) => {
                    counter.roles.push('contestant');
                    counter.roles.push(alliance);
                    return counter;
                })
            }
          }, 5000)
        }
      };
    // useEffect(() => {
    //     let intervalId: NodeJS.Timeout;
        
    //     // Define the animation function here
        
    //     intervalId = setInterval(animation, 100);
      
    //     // Clear the interval when component unmounts or alliance changes again
    //     return () => clearInterval(intervalId);
    //   }, [fakeAlliance]);

      useEffect(() => {
        
        if(alliance) {
            // setStartTime(Date.now());
            startTime.current = Date.now();
            intervalId = setInterval(animation, 100);
      
            // Clear the interval when component unmounts or alliance changes again
            // return () => clearInterval(intervalId);
        }

        // return () => {};
        return () => clearInterval(intervalId); //untested, this may break it but it stops the memory leak error issue
      }, [alliance]);

    // const AnimatedButton = styled(Button)(({ theme }) => ({
    //     position: 'relative',
    //     overflow: 'hidden',
    //     zIndex: 6,
    //     animation: 'colorCycle 6s linear infinite',
    //     // '&::before, &::after': {
    //     //   content: '""',
    //     //   position: 'absolute',
    //     //   top: 0,
    //     //   left: 0,
    //     //   right: 0,
    //     //   bottom: 0,
    //     //   zIndex: 2,
    //     //   animation: 'colorCycle 6s linear infinite',
    //     // },
    //     // '&::before': {
    //     //   background: 'linear-gradient(120deg, #f44336, #ffeb3b, #4caf50)',
    //     //   animationDelay: '0s',
    //     // },
    //     // '&::after': {
    //     //   background: 'linear-gradient(120deg, #ffeb3b, #4caf50, #f44336)',
    //     //   animationDelay: '2s',
    //     // },
    //     '@keyframes colorCycle': {
    //       '0%': {
    //         background: 'linear-gradient(120deg, #f44336, #ffeb3b, #4caf50)',
    //       },
    //       '50%': {
    //         background: 'linear-gradient(120deg, #ffeb3b, #4caf50, #f44336)',
    //       },
    //       '100%': {
    //         background: 'linear-gradient(120deg, #4caf50, #f44336, #ffeb3b)',
    //       },
    //     },
    //   }));

//     const [playSound, setPlaySound] = useState(false);

//   useEffect(() => {
//     if (playSound) {
//         try {
//             // const audio = new Audio('../utils/sounds/violin.mp3');
//             // const audio = new Audio(violinSfx);
//             // violinSfx.close();
//             // audio.play();
//             // playViolin();
      
//             // return () => {/*violinSfx.close(); */audio.pause(); audio.currentTime = 0;}
//         }
//         catch(err) {
//             // console.log("lol");
//             console.log(err);
//         }
//     }
//   }, [playSound]);

    if(counter && !counter.roles.includes('contestant')) {
        return (<>
        <Snackbar
    open={snackbarOpen}
    autoHideDuration={6000}
    onClose={handleClose}
    >
        <Alert severity="error" onClose={handleClose}>
            {snackbarMessage}
        </Alert>
    </Snackbar>
        <Box sx={{ bgcolor: 'primary.light', flexGrow: 1, p: 2}}>
        <Stepper activeStep={step} alternativeLabel>
            <Step key={'About'}>
                <StepLabel>{'About'}</StepLabel>
            </Step>
            <Step key={'Rules'}>
                <StepLabel>{'Rules'}</StepLabel>
            </Step>
            <Step key={'Join a Team'}>
                <StepLabel>{'Join a Team'}</StepLabel>
            </Step>
        </Stepper>
        {step == 0 && <>
            <Paper sx={{p: 2}}>
        <ContestAboutPage />
        {/* <Typography variant="h3">About</Typography> */}
        {/* <Paper sx={{p: 2}}>
            <Typography sx={{mt: 1}} variant="h6">What is this?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Three teams. One winner.</Typography>
            <Typography sx={{mt: 1}} variant="body1">The Count Allegiance pits three teams against each other: Blaze, Radiant, and Wave.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Pledge your support to one of these teams, and collaborate on a series of puzzles and challenges.</Typography>
            <Typography sx={{mt: 1}} variant="body1">You'll be randomly* assigned a team (weighted on certain factors).</Typography>
            <Typography sx={{mt: 1}} variant="body1">Participants in this special event will receive exclusive achievements and other rewards.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But definitely not money because of laws. And if a winner gets a $25 gift card that's just a coincidence.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">What is the Count Allegiance?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Following a series of unmitigated natural disasters, society has been divided into three color-coded groups.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Rising sea levels caused oceans to flood over our towns, our cities. Our homes.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But not everyone wanted to move away. They didn't quit. They adapted in the face of a challenge. As the generations go by, it's as if they had always lived underwater. Submersion is a way of life.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Others didn't want to live such a lifestyle. They moved to dry land. But they, too, had to adapt.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Rising temperatures made life on land much more difficult. But as the years went by, they were no longer battling the extreme heat. They were molded by it. Soon, they couldn't stop their children from going outside and staring directly into the sun for hours at a time. They were addicted to the heat and could never go back to their old way of life. </Typography>
            <Typography sx={{mt: 1}} variant="body1">And yet, a third group emerged. Not wanting to deal with this wasteland of a planet. This final group wanted to innovate, to expand their horizons. To find somewhere new. Somewhere better.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Why is it called the Count Allegiance? Well... following the destructive global disasters, people came to realize that they should just enjoy what they have. And everyone seems to love counting. So rather than avoiding it they each embraced it. It's like it's the only thing they have in common.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Aside from counting, these groups are quite secretive. They rarely, if at all, contact each other. Not necessarily out of hatred, but their differences make it difficult to communicate in the first place.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But each group wants to be the first one to achieve The Prophecy.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">What is the Prophecy?</Typography>
            <Typography sx={{mt: 1}} variant="body1">Ancient texts warned that a great disaster would divide society into three groups. These groups would live in harmony until, one day, they tried to unite.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Once united, they would suffer a series of challenges that pit them against one another, causing division and despair.</Typography>
            <Typography sx={{mt: 1}} variant="body1">However...</Typography>
            <Typography sx={{mt: 1}} variant="body1">With hard work and diligence, one group will make a major breakthrough that will advance their society by unimaginable means.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are prophecized to enjoy years of prosperity.</Typography>
            <Typography sx={{mt: 1}} variant="body1">But not all will reap such rewards...</Typography>
            <Typography sx={{mt: 1}} variant="body1">After generations of near-isolation, the groups are once again back together on the brand new counting website, countGG.com. Their new favorite website.</Typography>
            <Typography sx={{mt: 1}} variant="body1">Thus triggering the Prophecy... who will win?</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Blaze 🔥</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Blaze is known for being fearless and agressive. No matter how harsh or volatile their environment, they will overcome. Unless it's water. That sucks.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are driven and passionate. Never fearing any challenges. Not a day passes where they don't test their limits.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Radiant ⭐</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Radiant is, well, bright. Intelligent. But also bright because they are sailing among the stars. In space.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are graceful and precise. Wise, and intuitive. They see the bigger picture, and take a pragmatic approach to their issues.</Typography>

            <Typography sx={{mt: 1}} variant="body1">&nbsp;</Typography>

            <Typography sx={{mt: 1}} variant="h6">Team Wave 🌊</Typography>
            <Typography sx={{mt: 1}} variant="body1">Team Wave is the most fluid and adaptable. They aren't set in their ways, and have no issue resolving unpredictable challenges they face.</Typography>
            <Typography sx={{mt: 1}} variant="body1">They are resourceful and creative. Few can match their flexibility. They can also breathe underwater somehow.</Typography>

            <Typography sx={{mt: 1}} variant="body1"></Typography>
            <Box component="div">
                <Button sx={{m: 2}} variant="contained" disabled={step === 0 ? true : false} onClick={() => {setStep((prevStep) => {return prevStep - 1;})}}>Back</Button>
                <Button sx={{m: 2}} variant="contained" onClick={() => {setStep(1)}}>Next</Button>
            </Box>
        </Paper> */}
        <Typography sx={{mt: 1}} variant="body1"></Typography>
            <Box component="div">
                <Button sx={{m: 2}} variant="contained" disabled={step === 0 ? true : false} onClick={() => {setStep((prevStep) => {return prevStep - 1;})}}>Back</Button>
                {disableButton ? <Tooltip arrow open={true} placement={'right'} title="Must be on the page for 90 seconds to continue"><Button sx={{m: 2}} variant="contained" disabled={true}>Next</Button></Tooltip> : <Button sx={{m: 2}} variant="contained" onClick={() => {setStep(1); setDisableButton(true)}}>Next</Button>}
            </Box>
            </Paper>
        </>}
        {step == 1 && <>
        <Typography variant="h3">Rules</Typography>
        <ContestPage isRegistering={true} onceDone={rulesNext}></ContestPage>
        <Button sx={{m: 2}} variant="contained" onClick={() => {setStep((prevStep) => {return prevStep - 1;})}}>Back</Button>
        </>}
        {step == 2 && <>
            <Typography variant="h3">Join a Team</Typography>
            <Paper sx={{p: 2}}>
                <Typography sx={{mt: 1}} variant="body1">Get ready. You'll be randomly placed onto one of the three teams.</Typography>
                <Typography sx={{mt: 1}} variant="body1">The more members each team has, the better. You won't be hurting a team by joining it. So don't feel hesitant to join.</Typography>
                <Typography sx={{mt: 1}} variant="body1">There's no commitment. If you don't have the time to participate it's no problem. But you should still join a team just in case.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You can't choose your team. Sorry if you're upset with what you get.</Typography>
                <Typography sx={{mt: 1}} variant="body1">And finally... best of luck.</Typography>
                <Box component="div">
                <Button sx={{m: 2}} variant="contained" onClick={() => {setStep((prevStep) => {return prevStep - 1;})}}>Back</Button>
                    <Button className="rainbow" sx={{m: 2}} variant="contained" onClick={() => {finallyPickTeam()}}>I'm ready. Let's join a team!</Button>
                </Box>
            </Paper>
        </>}
        {/* {step == 3 && <>
            <Typography variant="h3">Join a Team</Typography>
            <Paper sx={{p: 2}}>
                <Typography sx={{mt: 1}} variant="body1">Get ready. You'll be randomly placed onto one of the three teams.</Typography>
                <Typography sx={{mt: 1}} variant="body1">The more members each team has, the better. You won't be hurting a team by joining it. So don't feel hesitant to join.</Typography>
                <Typography sx={{mt: 1}} variant="body1">There's no commitment. If you don't have the time to participate it's no problem. But you should still join a team just in case.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You can't choose your team. Sorry if you're upset with what you get.</Typography>
                <Typography sx={{mt: 1}} variant="body1">And finally... best of luck.</Typography>
                <Box component="div">
                    <Button className="rainbow" sx={{m: 2}} variant="contained" onClick={() => {finallyPickTeam()}}>I'm ready. Let's join a team!</Button>
                </Box>
            </Paper>
        </>} */}
        {step == 3 && <>
            <Typography variant="h3">Your team...</Typography>
            {/* <PlayViolin counter={1}></PlayViolin> */}
            <Paper sx={{p: 2}}>
                <Typography className="zoom-in" variant="h1" sx={{whiteSpace: 'nowrap'}}>{fakeAlliance}</Typography>
            </Paper>
        </>}
        {step == 4 && <>
            {/* <Typography variant="h3">TEAM {alliance.toUpperCase()}</Typography>
            <Paper sx={{ p: 2, bgcolor: alliance === 'blaze' ? '#ff000080' : alliance === 'radiant' ? '#FFC10780' : alliance === 'wave' ? '#0099ff80' : 'gray' }}>
                <Typography sx={{mt: 1}} variant="body1">You are a {alliance}. Haven't you always been?</Typography>
                <Typography sx={{mt: 1}} variant="body1">It's all coming back to you now. Ahh... the memories... you remember working with</Typography>
                {teammates && typeof(teammates) === 'object' && teammates.length > 0 && <span>&nbsp;{teammates.map((counter, index) => {
                if(index <= 199) {
                    return <Typography component={'span'}><Link color={counter.color} underline='hover' href={`/counter/${counter.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counter.uuid}`);}}>{counter.name}</Link>{index + 1 < teammates.length ? ', ' : ''}</Typography>
                } else if(index == 200) {
                    return <Typography component={'span'}>and {teammates.length - 200} more</Typography>
                } else {
                    return;
                }
            })}</span>}
                {alliance === 'blaze' && <>
                <Typography sx={{mt: 1}} variant="body1">Only 106 degrees inside. Celsius. It's chilly. Time for some fresh air... you open your door to go on a walk.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You don't even notice the package at your doorstep until you swing your door wide open, knocking it over. What's this?</Typography>
                </>}
                {alliance === 'radiant' && <>
                <Typography sx={{mt: 1}} variant="body1">The first thing you read after you wake up is the history of the phrase "good morning." It fell out of use amongst Team Radiant after they embarked on their mission. You read about how people used to unknowingly synchronize their internal clocks with the sun when they lived on Earth. Fools. </Typography>
                <Typography sx={{mt: 1}} variant="body1">You receive a package notification... you weren't expecting a package. You open your unit's door and knock over the package on accident. They put it right by your door but your door swings outwards so it was kinda hard to open your door without knocking it over. Amateur work. But you're still curious about what's inside. What's this?</Typography>
                </>}
                {alliance === 'wave' && <>
                <Typography sx={{mt: 1}} variant="body1">The sun is shining bright today. You consider taking a trip near the Surface. But you can't get too close. Your body isn't adjusted to the volatile heat above the submerged city you reside in.</Typography>
                <Typography sx={{mt: 1}} variant="body1">But you may as well live a little. You decide to go outside and take a trip, only to be interrupted by an unexpected package at your door. The package feels surprisingly light, only being weighed down by makeshift attached weights. We solved the "package floating away issue" decades ago, no one did it like this anymore. Impossible... no way someone from outside of team wave sent you this package. What's this?</Typography>
                </>}
                <Typography sx={{mt: 1}} variant="body1">You try opening the package, but can't get it to budge. There appears to be <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the left, and <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the right. </Typography>
                <Typography sx={{mt: 1}} variant="body1">Interesting... did anyone else you know get a package like this? Maybe ask some other members of team {alliance}...</Typography>
                <Typography sx={{mt: 1}} variant="body1">What could the sides mean? Perhaps the keys they use are <Typography component={'span'} sx={{fontWeight: 'bold'}}>different</Typography> in some way. </Typography>
                <Typography sx={{mt: 1}} variant="body1">Above the key-holes on the left side, you find an imprinted "I". On the right side, in the same spot, you find an imprinted "T".</Typography>
                <Typography sx={{mt: 1}} variant="body1">You look around but can't find any keys. You even try using your own keys, but none of them fit. Maybe it's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>find some keys?</Typography> </Typography>
                <Typography sx={{mt: 1}} variant="body1">But keys could be anywhere! How will you ever find them...</Typography>

                <Button sx={{m: 2}} variant="contained" onClick={() => {setStep((prevStep) => {return prevStep - 1;})}}>Back</Button>
            </Paper> */}
        </>}
        </Box>
        
        </>
        )
    } else if(counter && counter.roles.includes('contestant'))  {
        return (<>
            <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleClose}
        >
            <Alert severity="error" onClose={handleClose}>
                {snackbarMessage}
            </Alert>
        </Snackbar>
        <Modal
        open={modalOpen}
        onClose={handleModalClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            border: '2px solid #000',
            boxShadow: 24,
            p: 4,
          }}
        >
          <h2 id="modal-title">Modal Title</h2>
          <p id="modal-description">Modal Description</p>
          <Button onClick={() => {handleModalClose()}}>Close</Button>
        </Box>
      </Modal>
        <Box sx={{bgcolor: 'background.paper', display: 'fixed', flexGrow: 1}}> {/* so the transparency works btw */}
            <Box sx={{ flexGrow: 1, p: 2, bgcolor: (allegiance && allegiance.name || alliance) === 'blaze' ? '#ff000020' : (allegiance && allegiance.name || alliance) === 'radiant' ? '#FFC10720' : (allegiance && allegiance.name || alliance) === 'wave' ? '#0099ff20' : 'gray'}}>
            <Typography sx={{display: 'flex', justifyContent: 'center', mb: 2}} variant="h3">{allianceEmoji} TEAM {allegiance ? allegiance.name.toUpperCase() : alliance.toUpperCase()} {allianceEmoji}</Typography>
            {/* <PlayViolin counter={1}></PlayViolin> */}
            <Paper sx={{ p: 2, bgcolor: isBlaze ? '#ff000080' : isRadiant ? '#FFC10780' : isWave ? '#0099ff80' : 'gray' }}>
                <Typography sx={{mt: 1}} variant="body1">You are a member of team {allegiance ? allegiance.name : alliance}.&nbsp;
                    {user && userKeyCount === 0 ? <Typography component={'span'} variant="body1">Haven't you always been?</Typography> : <></>}
                </Typography> 
                <Typography sx={{mt: 1}} variant="body1">
                    {user && userKeyCount === 0 ? <Typography component={'span'} variant="body1">It's all coming back to you now. Ahh... the memories... you remember working with</Typography> : <Typography component={'span'} variant="body1">You've always known</Typography>}
                {allegiance && allegiance.val.members.length > 0 ? <span>&nbsp;{allegiance.val.members.map((counter, index) => {
                    const counterFromCache = cachedCounters[counter] ? cachedCounters[counter] : defaultCounter(counter);
                if(index <= 199) {
                    return <Typography key={counterFromCache.uuid} component={'span'}><Link color={counterFromCache.color} underline='hover' href={`/counter/${counterFromCache.uuid}`} onClick={(e) => {e.preventDefault();navigate(`/counter/${counterFromCache.uuid}`);}}>{counterFromCache.name}</Link>{index + 1 < allegiance.val.members.length ? ', ' : ''}</Typography>
                } else if(index == 200) {
                    return <Typography key={'extra'} component={'span'}>and {allegiance.val.members.length - 200} more</Typography>
                } else {
                    return;
                }
            })}</span> : <span>... hmm, who was it again? Time to find out...</span>}</Typography>
            {user && userKeyCount === 0
            ? <>
                {isBlaze && <>
                <Typography sx={{mt: 1}} variant="body1">Only 106 degrees inside. Celsius. It's chilly. Time for some fresh air... you open your door to go on a walk.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You don't even notice the package at your doorstep until you swing your door wide open, knocking it over. What's this?</Typography>
                </>}
                {isRadiant && <>
                <Typography sx={{mt: 1}} variant="body1">The first thing you read after you wake up is the history of the phrase "good morning." It fell out of use amongst Team Radiant after they embarked on their mission. You read about how people used to unknowingly synchronize their internal clocks with the sun when they lived on Earth. Fools. </Typography>
                <Typography sx={{mt: 1}} variant="body1">You receive a package notification... you weren't expecting a package. You open your unit's door and knock over the package on accident. They put it right by your door but your door swings outwards so it was kinda hard to open your door without knocking it over. Amateur work. But you're still curious about what's inside. What's this?</Typography>
                </>}
                {isWave && <>
                <Typography sx={{mt: 1}} variant="body1">The sun is shining bright today. You consider taking a trip near the Surface. But you can't get too close. Your body isn't adjusted to the volatile heat above the submerged city you reside in.</Typography>
                <Typography sx={{mt: 1}} variant="body1">But you may as well live a little. You decide to go outside and take a trip, only to be interrupted by an unexpected package at your door. The package feels surprisingly light, only being weighed down by makeshift attached weights. We solved the "package floating away issue" decades ago, no one did it like this anymore. Impossible... no way someone from outside of team wave sent you this package. What's this?</Typography>
                </>}
                <Typography sx={{mt: 1}} variant="body1">You try opening the package, but can't get it to budge. There appears to be <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the left, and <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the right. </Typography>
                <Typography sx={{mt: 1}} variant="body1">Interesting... did anyone else you know get a package like this? Maybe ask some other members of team {allegiance && allegiance.name}...</Typography>
                <Typography sx={{mt: 1}} variant="body1">What could the sides mean? Perhaps the keys they use are <Typography component={'span'} sx={{fontWeight: 'bold'}}>different</Typography> in some way. </Typography>
                <Typography sx={{mt: 1}} variant="body1">Above the key-holes on the left side, you find an imprinted "I". On the right side, in the same spot, you find an imprinted "T".</Typography>
                <Typography sx={{mt: 1}} variant="body1">You look around but can't find any keys. You even try using your own keys, but none of them fit. Maybe it's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>find some keys?</Typography> </Typography>
                <Typography sx={{mt: 1}} variant="body1">But keys could be anywhere! How will you ever find them...</Typography>
                </> 
                : user && userKeyCount === 1
                ? <>
                {isBlaze && <>
                <Typography sx={{mt: 1}} variant="body1">Another lovely day. The perfect kind of day. The kind of day you go outside and stare at the sun for hours on end. </Typography>
                </>}
                {isRadiant && <>
                <Typography sx={{mt: 1}} variant="body1">The wonders of space. You never knew life on a planet. But sometimes you long for the old days, even though you never lived them. But you are committed to your team's journey to find a better planet. It will be a good day.</Typography>
                </>}
                {isWave && <>
                <Typography sx={{mt: 1}} variant="body1">The package has floated to the ceiling. Whatever's in there really must not be too heavy. Good thing you didn't lose it! You get excited, thinking about what may be inside...</Typography>
                </>}
                <Typography sx={{mt: 1}} variant="body1">And even better... you have a key.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You examine the package. There appears to be <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the left, and <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the right.</Typography>
                <Typography sx={{mt: 1}} variant="body1">It's a miracle...</Typography>
                <Typography sx={{mt: 1}} variant="body1">One of the left-side keys fits perfectly! You hear a mechanism unlock when you twist it. But still, the opening won't budge.</Typography>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 0 ? `You try putting some of your other keys into the right side... Whoa! ${teamKeyCount} key${teamKeyCount > 1 ? 's' : ''} worked.` : "Looks like you need some more keys..."}</Typography>
                <Typography sx={{mt: 1}} variant="body1">It's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>find some more keys!</Typography> </Typography>
                </> 
                : user && userKeyCount === 2
                ? <>
                {isBlaze && <>
                <Typography sx={{mt: 1}} variant="body1">The perfect day to start a fire. You hop inside and enjoy a nice movie.</Typography>
                </>}
                {isRadiant && <>
                <Typography sx={{mt: 1}} variant="body1">Low gravity. You want to research the benefits of low gravity on the human body, especially throughout the generations. Another team radiant W.</Typography>
                </>}
                {isWave && <>
                <Typography sx={{mt: 1}} variant="body1">"Blub blub blub blub blub?" your friend asks. Yes, you both got this strange package...</Typography>
                </>}
                <Typography sx={{mt: 1}} variant="body1">You examine the package once again. There appears to be <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the left, and <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the right.</Typography>
                <Typography sx={{mt: 1}} variant="body1">Your friend has the exact same box... but your left-side keys don't work in your friend's box... strange.</Typography>
                <Typography sx={{mt: 1}} variant="body1">You try them out on your own box... That's two left side keys down! One more to go...</Typography>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 0 ? `You try putting some of your other keys into the right side... Whoa! ${teamKeyCount} key${teamKeyCount > 1 ? 's' : ''} worked.` : "Looks like you need some more keys..."}</Typography>
                <Typography sx={{mt: 1}} variant="body1">It's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>find some more keys!</Typography> </Typography>
                </> 
                : user && userKeyCount > 2
                ? <>
                {isBlaze && <>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 2 ? "You feel something special in the air. This is it." : "Your spirits are high. The temperature is higher. It's the perfect day to be on team blaze."}</Typography>
                </>}
                {isRadiant && <>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 2 ? "You feel something special in pressurized-cabin air. This is it." : "Your spirits are high. The stars are higher. It's the perfect day to be on team radiant."}</Typography>
                </>}
                {isWave && <>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 2 ? "You feel something special in the water. This is it." : "Your spirits are high. The sea level is higher. It's the perfect day to be on team wave."}</Typography>
                </>}
                <Typography sx={{mt: 1}} variant="body1">You examine the package confidently. There appears to be <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the left, and <Typography component={'span'} sx={{fontWeight: 'bold'}}>3 key-holes</Typography> on the right.</Typography>
                <Typography sx={{mt: 1}} variant="body1">Your suspicions are confirmed. You have all of the left-side keys.</Typography>
                <Typography sx={{mt: 1}} variant="body1">{teamKeyCount > 2 ? `Click. Click. Click. All the right side keys work. The package is ready to be opened.` : "Aww... looks like you still need some more keys to open all of the locks on the right side. You've come this far... you can't give up now!"}</Typography>
                {teamKeyCount > 2 && <>
                <Typography sx={{mt: 1}} variant="body1">It's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>open the package!</Typography> </Typography>
                {fullPage ? <Button onClick={() => {handleOpeningPackage()}} variant='contained'>Open Package</Button> : 
                <>
                <Button disabled variant='contained'>Open Package</Button>
                <Link href="/contest" underline="always">
                Click here to go to the full page and open the package.
                </Link>
                </>}
                </>}
                {teamKeyCount <= 2 && <>
                <Typography sx={{mt: 1}} variant="body1">It's time to <Typography component={'span'} sx={{fontWeight: 'bold'}}>find some more keys!</Typography> </Typography>
                </>}
                </> 
                :<></>}
            </Paper>

            {user && allegiance && <>
                    <Paper sx={{mt: 4, p: 2, bgcolor: isBlaze ? '#ff000080' : isRadiant ? '#FFC10780' : isWave ? '#0099ff80' : 'gray' }}>
                    <Typography sx={{mt: 1}} variant="body1">{userKeyCount === 0 ? "Oh... an inventory?" : "Your Inventory"}</Typography>
                    <Box sx={{display: 'flex', flexFlow: 'wrap'}}>
                    {allegiance.val.team_inventory && allegiance.val.team_inventory.map((item) => {
                        return <Fragment key={item['name']}>
                        <InventoryItem {...item}></InventoryItem>
                        </Fragment>
                    })}
                    {user.inventory && user.inventory.map((item) => {
                        return <Fragment key={item['name']}>
                        <InventoryItem {...item}></InventoryItem>
                        </Fragment>
                    })}
                    {combinedKeyCount === 0 && <Typography>But there's nothing in here... yet...</Typography>}
                    </Box>
                {/* <LinearProgressWithLabel color="success" progress={allegiance.val.p0[0]} max={allegiance.val.p0[1]} />
                <LinearProgressWithLabel color="success" progress={allegiance.val.p1[0]} max={allegiance.val.p1[1]} />
                <LinearProgressWithLabel color="success" progress={allegiance.val.p2[0]} max={allegiance.val.p2[1]} />
                <LinearProgressWithLabel color="success" progress={allegiance.val.p3[0]} max={allegiance.val.p3[1]} /> */}
                </Paper>
                </>
                }
            </Box>
            </Box>
        </>);
    } else {
        return (
            <Loading />
        )
    }
}