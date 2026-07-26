import { fireEvent, render, screen, waitForElementToBeRemoved } from '@testing-library/react'
import { RankProgressCard } from './RankProgressCard'

describe('RankProgressCard', () => {
  it('does not show the division ladder until clicked, then shows every division on click', () => {
    render(<RankProgressCard rank="bronze" division={2} gg={120} divFloor={100} divCeil={200} />)

    // Collapsed by default — no new visual elements beyond the existing card content.
    expect(screen.queryByText('Bronze I')).not.toBeInTheDocument()
    expect(screen.queryByText('Silver I')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText(/GG$/))

    // Every division across every rank is now listed, in order.
    expect(screen.getByText('Bronze I')).toBeInTheDocument()
    expect(screen.getByText('Bronze II')).toBeInTheDocument()
    expect(screen.getByText('Bronze III')).toBeInTheDocument()
    expect(screen.getByText('Silver I')).toBeInTheDocument()
    expect(screen.getByText('Peak')).toBeInTheDocument()
  })

  // Each ladder row shows GG needed to GET TO that division — its cumulative FLOOR, not its
  // ceiling. Bronze's RANK_GG is 300, split into 3 divisions of 100 GG each, so with 50 total
  // GG (all within Bronze I): Bronze II's floor is 100 (Bronze I's own span), Bronze III's
  // floor is 200 (Bronze I + Bronze II) — rows read "50 / 100 GG" and "50 / 200 GG"
  // respectively, i.e. "how much you need to REACH this division", not clear it.
  it('shows GG needed to reach a not-yet-reached division (its floor), not its ceiling', () => {
    render(<RankProgressCard rank="bronze" division={1} gg={50} divFloor={0} divCeil={100} />)

    fireEvent.click(screen.getAllByText(/GG$/)[0])

    // "50 / 100 GG" appears twice: the card's own header label (division 1's own span is also
    // 0-100 here) and Bronze II's row (its floor is also 100) — both correct, just an overlap
    // from this test's specific division-1 setup.
    expect(screen.getAllByText('50 / 100 GG')).toHaveLength(2) // header label + Bronze II floor
    expect(screen.getByText('50 / 200 GG')).toBeInTheDocument() // Bronze III floor
    expect(screen.getByText('50 / 300 GG')).toBeInTheDocument() // Silver I floor (bronze's full 300)
  })

  // Division 1 of every rank has a floor of 0 — you're there the instant you enter the rank, so
  // there's nothing to show progress toward. Rendered as "-" instead of a degenerate "50 / 0".
  it('shows "-" for a division 1 row, since its floor is always 0', () => {
    render(<RankProgressCard rank="bronze" division={1} gg={50} divFloor={0} divCeil={100} />)

    fireEvent.click(screen.getAllByText(/GG$/)[0])

    expect(screen.getByText('-')).toBeInTheDocument()
  })

  // Regression test: peak has no ceiling (RANK_GG.peak is Infinity) but IS reachable — it has a
  // finite cumulative floor (every earlier rank's full requirement) — so it renders the same
  // floor-based "GG needed to get here" figure as any other division, not a blank label.
  it('shows GG needed to reach Peak (its cumulative floor), not a blank label', () => {
    render(<RankProgressCard rank="grandcounter" division={3} gg={230} divFloor={0} divCeil={16000} />)

    fireEvent.click(screen.getAllByText(/GG$/)[0])

    // Peak's floor = every earlier rank's full requirement = 41,400.
    expect(screen.getByText('25,630 / 41,400 GG')).toBeInTheDocument()
  })

  it('collapses again on a second click', async () => {
    render(<RankProgressCard rank="bronze" division={1} gg={0} divFloor={0} divCeil={100} />)

    const clickTarget = screen.getByText(/GG$/)
    fireEvent.click(clickTarget)
    expect(screen.getByText('Bronze I')).toBeInTheDocument()

    fireEvent.click(clickTarget)
    // MUI's Collapse (unmountOnExit) only removes the content once its own exit transition
    // finishes, not synchronously on click.
    await waitForElementToBeRemoved(() => screen.queryByText('Bronze I'))
  })
})
