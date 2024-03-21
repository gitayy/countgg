import { Box, Button, Link, Typography } from '@mui/material'
import { FC, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Expandable } from '../components/Expandable'

interface Props {
  isRegistering?: boolean
  onceDone?: Function
}

export const RulesPage: FC<Props> = ({ isRegistering, onceDone }) => {
  const location = useLocation()
  useEffect(() => {
    document.title = `Rules | Counting!`
    return () => {
      document.title = 'Counting!'
    }
  }, [location.pathname])

  const rules = [
    {
      title: 'Treat others kindly.',
      description: [
        `At counting.gg, we value kindness and respect towards all members of our community. We encourage all users to treat each other with empathy, compassion, and understanding. This means refraining from any behavior that could be interpreted as harassment, discrimination, or intolerance. In order to create a safe and welcoming environment, we expect all users to engage in civil and respectful communication at all times.`,
        `We understand that disagreements may arise, but we ask that all users handle them in a constructive and respectful manner. We believe that treating others with kindness is key to fostering a positive and productive community, and we encourage all users to embody this value in their interactions on our website.`,
      ],
    },
    {
      title: 'No counting bots.',
      description: [
        `Bots may never post a count. Don't automate, bot, or cheat the counting process, or risk a ban.`,
        `Some communities have utility/helper bots that don't count, but perform other functions. We hope to simply build these features in, but if you want to make a utility bot, reach out.`,
      ],
    },
    {
      title: '2+ manual inputs are required for each count. Minimum inputs per count: 1+ character of the post, and manually submitting.',
      description: [
        `If you are not using external tools (macros, scripts, etc.), this rule should not be an issue.`,
        `Auto-pasters are allowed (and are built into the site), but you are still required to input a portion of your post manually, and then submit your post manually.`,
        `You may not automaticate the "submit" input. Each count must have a unique, manual "submit" input.`,
        `Certain scripts may automcatically adjust your clipboard. Consult with the Discord community to ensure what you're using is allowed on a case-by-case basis. Generally, we will need 3+ inputs per count, even with these scripts.`,
        `Blatant violations (fully automated inputs i.e. botting) risk a ban. Please don't be afraid to ask any questions about what may or may not be allowed.`,
      ],
    },
    {
      title: 'No unnecessary spam.',
      description: [`counting.gg has a very generous rate limit, but spamming off-topic posts will risk a mute or a ban.`],
    },
    {
      title: 'No alternate accounts.',
      description: [
        `You can only have one account at a time. Signing up with an alternate account puts you at risk of a permaban.`,
        `If you want to make a new account or transfer Discord accounts, contact admins privately and we can get it done.`,
      ],
    },
    {
      title: 'No impersonation.',
      description: [`We do not condone knowingly impersonating other users. Doing so may lead to a loss of privileges or a ban.`],
    },
    {
      title: 'No illegal content.',
      description: [`Yeah.`],
    },
    {
      title: 'Admins have the authority to make decisions based on their judgment of the situation.',
      description: [
        `My tyrannical reign holds no prisoners.`,
        `I am not going to create a long rulebook or care about precedent. If I did something dumb in the past I don't want that creating precedent for a completely new situation.`,
        `I will try to be fair. But each situation will be handled uniquely. Ya feel me? Use common sense and you will be fine.`,
      ],
    },
    {
      title: 'Be 13 or older.',
      description: [`Per legal requirements, users must be over 13 to participate.`],
    },
  ]

  const [expanded, setExpanded] = useState(new Array(rules.length).fill(false))

  const handleToggle = (index: number) => {
    const newExpanded = [...expanded]
    newExpanded[index] = true
    setExpanded(newExpanded)
  }

  const doNothing = (index: number) => {}

  const allExpanded = expanded.every((value) => value)
  if (isRegistering) {
    return (
      <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2 }}>
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
        <Typography fontSize={12} sx={{ mb: 2 }}>
          Check our our{' '}
          <Link rel="noopener noreferrer" target="_blank" href="./privacy-policy">
            privacy policy
          </Link>
          . Questions? Here's how to{' '}
          <Link rel="noopener noreferrer" target="_blank" href="./about">
            contact us
          </Link>
          .
        </Typography>
        {!allExpanded && <Typography>You still need to agree to some rules. Click on each rule to agree.</Typography>}
        <Button
          disabled={!allExpanded}
          onClick={() => {
            onceDone ? onceDone() : doNothing(1)
          }}
          variant="contained"
          color="primary"
        >
          Agree
        </Button>
      </Box>
    )
  } else {
    return (
      <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', flexGrow: 1, p: 2 }}>
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
        <Typography fontSize={12} sx={{ mb: 2 }}>
          Check our our{' '}
          <Link rel="noopener noreferrer" target="_blank" href="./privacy-policy">
            privacy policy
          </Link>
          . Questions? Here's how to{' '}
          <Link rel="noopener noreferrer" target="_blank" href="./about">
            contact us
          </Link>
          .
        </Typography>
      </Box>
    )
  }
}
