import { Clue } from './clue'
import { Row, RowState } from './Row'
import { gameName, maxGuesses } from './util'

export function About() {
  return (
    <div className="App-about">
      <p>
        <i>{gameName}</i> is a remake of the word game{' '}
        <a href="https://www.powerlanguage.co.uk/wordle/">
          <i>Wordle</i>
        </a>{' '}
        by <a href="https://twitter.com/powerlanguish">powerlanguage</a>, but you can't guess any words in the dictionary. The correct
        answer will also be a non-dictionary word.
      </p>
      <p>
        You get {maxGuesses} tries to guess a target "word".
        <br />
        After each guess, you get Mastermind-style feedback.
      </p>
      <hr />
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Absent, letter: 'x' },
          { clue: Clue.Absent, letter: 'j' },
          { clue: Clue.Correct, letter: 'r' },
          { clue: Clue.Elsewhere, letter: 'd' },
        ]}
      />
      <p>
        <b>X</b> and <b>J</b> aren't in the target word at all.
      </p>
      <p>
        <b className={'green-bg'}>R</b> is correct! The third letter is <b className={'green-bg'}>R</b>
        .<br />
        <strong>(There may still be a second R in the word.)</strong>
      </p>
      <p>
        <b className={'yellow-bg'}>D</b> occurs <em>elsewhere</em> in the target word.
        <br />
        <strong>(Perhaps more than once. 🤔)</strong>
      </p>
      <hr />
      <p>
        Let's move the <b>D</b> in our next guess:
      </p>
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Correct, letter: 'd' },
          { clue: Clue.Correct, letter: 'v' },
          { clue: Clue.Correct, letter: 'r' },
          { clue: Clue.Absent, letter: 'b' },
        ]}
        annotation={'So close!'}
      />
      <Row
        rowState={RowState.LockedIn}
        wordLength={4}
        cluedLetters={[
          { clue: Clue.Correct, letter: 'd' },
          { clue: Clue.Correct, letter: 'v' },
          { clue: Clue.Correct, letter: 'r' },
          { clue: Clue.Correct, letter: 'h' },
        ]}
        annotation={'Got it!'}
      />
      <p>Yep... this game sucks.</p>
    </div>
  )
}
