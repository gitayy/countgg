// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Some suites (e.g. RankTabPanel's replay-animation tests) wait out real setTimeout delays of
// several seconds via act(() => new Promise(...)) rather than fake timers, since the animation
// state machine itself is timer-driven — the default 5000ms per-test timeout is too tight for
// those, so raise it sitewide.
jest.setTimeout(15000)
