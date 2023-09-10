import "./App.css";
import { maxGuesses, seed, urlParam } from "./util";
import Game from "./Game";
import { useEffect, useState } from "react";
import { About } from "./About";
import { Box, useTheme } from "@mui/material";

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

const now = new Date();
const todaySeed =
  now.toLocaleDateString("en-US", { year: "numeric" }) +
  now.toLocaleDateString("en-US", { month: "2-digit" }) +
  now.toLocaleDateString("en-US", { day: "2-digit" });

function LrwoedPage() {
  type Page = "game" | "about" | "settings";
  const [page, setPage] = useState<Page>("game");
  const theme = useTheme();
  const dark = theme.palette.mode;
  const [colorBlind, setColorBlind] = useSetting<boolean>("colorblind", false);
  const [difficulty, setDifficulty] = useSetting<number>("difficulty", 0);
  const [keyboard, setKeyboard] = useSetting<string>(
    "keyboard",
    "qwertyuiop-asdfghjkl-BzxcvbnmE"
  );
  const [enterLeft, setEnterLeft] = useSetting<boolean>("enter-left", false);

  useEffect(() => {
    document.body.className = theme.palette.mode;
    if (urlParam("today") !== null || urlParam("todas") !== null) {
      document.location = "?seed=" + todaySeed;
    }
    setTimeout(() => {
      // Avoid transition on page load
      document.body.style.transition = "0.3s background-color ease-out";
    }, 1);
  }, [dark, theme]);

  const link = (emoji: string, label: string, page: Page) => (
    <button
      className="emoji-link"
      onClick={() => setPage(page)}
      title={label}
      aria-label={label}
    >
      {emoji}
    </button>
  );

  const [goodOrBad, setGoodOrBad] = useState("best");
  useEffect(() => {
    if(Math.random() > 0.5) {
      setGoodOrBad("worst")
    }
  }, [])

  return (
    <Box sx={{bgcolor: "primary.light", display: 'flex', flexGrow: 1}}>
    <Box sx={{bgcolor: "background.paper", pl: 2, pr: 2, maxWidth: '750px'}} className={"App-container" + (colorBlind ? " color-blind" : "")}>
      <h1>
        <span
          style={{
            color: difficulty > 0 ? "#e66" : "inherit",
            fontStyle: difficulty > 1 ? "italic" : "inherit",
          }}
        >
          lrwoed
        </span>
      </h1>
      <div className="top-right">
        {page !== "game" ? (
          link("❌", "Close", "game")
        ) : (
          <>
            {link("❓", "About", "about")}
            {link("⚙️", "Settings", "settings")}
          </>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          left: 5,
          top: 5,
          visibility: page === "game" ? "visible" : "hidden",
        }}
      >
        {/* <a href={seed ? "?random" : "?seed=" + todaySeed}>
          {seed ? "Random" : "Today's"}
        </a> */}
      </div>
      {page === "about" && <About />}
      {page === "settings" && (
        <div className="Settings">
          {/* <div className="Settings-setting">
            <input
              id="dark-setting"
              type="checkbox"
              checked={dark}
              onChange={() => setDark((x: boolean) => !x)}
            />
            <label htmlFor="dark-setting">Dark theme</label>
          </div> */}
          <div className="Settings-setting">
            <input
              id="colorblind-setting"
              type="checkbox"
              checked={colorBlind}
              onChange={() => setColorBlind((x: boolean) => !x)}
            />
            <label htmlFor="colorblind-setting">High-contrast colors</label>
          </div>
          <div className="Settings-setting">
            <input
              id="difficulty-setting"
              type="range"
              min="0"
              max="2"
              value={difficulty}
              onChange={(e) => setDifficulty(+e.target.value)}
            />
            <div>
              <label htmlFor="difficulty-setting">Difficulty:</label>
              <strong>{["Normal", "Hard", "Ultra Hard"][difficulty]}</strong>
              <div
                style={{
                  fontSize: 14,
                  height: 40,
                  marginLeft: 8,
                  marginTop: 8,
                }}
              >
                {
                  [
                    `Guesses must not be valid dictionary words.`,
                    `Wordle's "Hard Mode". Green letters must stay fixed, and yellow letters must be reused.`,
                    `An even stricter Hard Mode. Yellow letters must move away from where they were clued, and gray clues must be obeyed.`,
                  ][difficulty]
                }
              </div>
            </div>
          </div>
          <div className="Settings-setting">
            <label htmlFor="keyboard-setting">Keyboard layout:</label>
            <select
              name="keyboard-setting"
              id="keyboard-setting"
              value={keyboard}
              onChange={(e) => setKeyboard(e.target.value)}
            >
              <option value="qwertyuiop-asdfghjkl-BzxcvbnmE">QWERTY</option>
              <option value="azertyuiop-qsdfghjklm-BwxcvbnE">AZERTY</option>
              <option value="qwertzuiop-asdfghjkl-ByxcvbnmE">QWERTZ</option>
              <option value="BpyfgcrlE-aoeuidhtns-qjkxbmwvz">Dvorak</option>
              <option value="qwfpgjluy-arstdhneio-BzxcvbkmE">Colemak</option>
            </select>
            <input
              style={{ marginLeft: 20 }}
              id="enter-left-setting"
              type="checkbox"
              checked={enterLeft}
              onChange={() => setEnterLeft((x: boolean) => !x)}
            />
            <label htmlFor="enter-left-setting">"Enter" on left side</label>
          </div>
        </div>
      )}
      <Game
        maxGuesses={maxGuesses}
        hidden={page !== "game"}
        difficulty={difficulty}
        colorBlind={colorBlind}
        keyboardLayout={keyboard.replaceAll(
          /[BE]/g,
          (x) => (enterLeft ? "EB" : "BE")["BE".indexOf(x)]
        )}
      />
    </Box>
    </Box>
  );
}

export default LrwoedPage;
