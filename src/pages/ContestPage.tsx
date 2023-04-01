import { Box, Button, Link, Typography } from '@mui/material';
import { FC, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Expandable } from '../components/Expandable';

interface Props {
    isRegistering?: boolean;
    onceDone?: Function;
}

  export const ContestPage: FC<Props> = ({isRegistering, onceDone}) => {

    const location = useLocation();
    useEffect(() => {
        document.title = `Contest Guidelines | countGG`;
        return (() => {
          document.title = 'countGG';
        })
      }, [location.pathname]);

    const rules = [
        {
            title: "The competition is just for fun.",
            description: [
                `For legal reasons we cannot offer a reward for contests. Too many laws lol.`,
                `Don't sue me. It is just for fun and there is no guaranteed reward. `,
                `Any gifts, such as a $25 gift card, that are given are entirely coincidental and have nothing to do with this competition.`
            ],
        },
        {
            title: "There may be audio at points.",
            description: [
                `Audio warning. The site may play audio for this event.`,
                `If you are in a place where you don't want audio make sure your volume is lowered. Smh at people going on this site at school`,
                `If you REALLY hate audio you can right-click the tab and hit "mute website" on chrome-based browsers.`
            ],
        },
        {
            title: "Breaking site rules puts you at risk of disqualification.",
            description: [
                `Don't break site rules, and don't exploit any harmful bugs to gain an advantage.`,
                `Use common sense. If you break rules you may be disqualified. Bans or mutes in general, even if unrelated to the contest, are also grounds for disqualification.`,
                `If you have any questions about the "limits" please ask admins before you "test the limits." It will be a case-by-case basis depending on your request.`
            ],
        },
        {
            title: "There may only be one final winner.",
            description: [
                `Don't be salty if you lose. Well you can be, but just don't break any rules smh.`,
                `And if you are eliminated for some reason you disagree with, sorry but oh well.`,
            ],
        },
        {
            title: "Exploits, bugs, and other issues will be handled on a case-by-case basis.",
            description: [
                `Sorry in advance if this happens but it's probably inevitable.`,
                `If you believe there is an issue feel free to reach out privately.`,
            ],
        },
        {
            title: "Play in your best interest.",
            description: [
                `You may collaborate with anyone but like... Try to avoid sharing outright spoilers, especially if working with other groups. For collaborative parts, feel free to share anything with your own group though.`,
                `And if someone is really really stuck on something. Hints are better than just leaking answers to start. Well this is just etiquette and not a hard rule but cmon. Be epic instead of cringe. I believe in you.`,
                `Also like. If you have an idea but think it may be cheating. Ask first smh. And don't be surprised if the response is "get good" because you don't really need to cheat for anything.`
            ],
        },
        {
            title: "Once again, no alternate accounts.",
            description: [
                `Cmon. Bruh. That just ruins the spirit of the game. Also if I find out I will permaban you lol.`,
                `Imagine being permabanned because of the april fools game. Smh`,
                `I won't even be mad. Just disappointed in you. Because you not only have to click this and agree to it. You have to do it twice. Don't do me like that. You're better than that.`
            ],
        },
    ]

    const [expanded, setExpanded] = useState(new Array(rules.length).fill(false));

  const handleToggle = (index: number) => {
    const newExpanded = [...expanded];
    newExpanded[index] = true;
    setExpanded(newExpanded);
  };

  const doNothing = (index: number) => {
  };

  const allExpanded = expanded.every((value) => value);
  if(isRegistering) {
    return (
        <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2}}>
            {rules.map((rule, index) => (
        <Expandable
          key={index}
          title={rule.title}
          description={rule.description}
          isExpanded={expanded[index]}
          onToggle={handleToggle}
          index={index}
        />
      ))}
      <Typography fontSize={12} sx={{mb: 2}}>Check our our <Link rel="noopener noreferrer" target='_blank' href='./privacy-policy'>privacy policy</Link>. Questions? Here's how to <Link rel="noopener noreferrer" target='_blank' href='./about'>contact us</Link>.</Typography>
      {!allExpanded && (
        <Typography>You still need to agree to some rules. Click on each rule to agree.</Typography>
      )}
      <Button disabled={!allExpanded} onClick={() => {onceDone ? onceDone() : doNothing(1)}} variant="contained" color="primary">
        Agree
      </Button>
        </Box>
        )
  } else {
    return (
        <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2}}>
            {rules.map((rule, index) => (
        <Expandable
          key={index}
          title={rule.title}
          description={rule.description}
          isExpanded={expanded[index]}
          onToggle={doNothing(index)}
          index={index}
        />
      ))}
      <Typography fontSize={12} sx={{mb: 2}}>Check our our <Link rel="noopener noreferrer" target='_blank' href='./privacy-policy'>privacy policy</Link>. Questions? Here's how to <Link rel="noopener noreferrer" target='_blank' href='./about'>contact us</Link>.</Typography>
        </Box>
        )
  }
      
    };

