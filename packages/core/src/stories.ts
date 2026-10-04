import { rng } from '@axile/engines';
import type { GameId, Role, StatDeltas } from '@axile/engines';

export interface TurnStory {
  eventId: string;
  title: string;
  scene: string;
  choice: string;
  consequence: string;
}

const events: Record<GameId, { id: string; title: string; scene: string }[]> = {
  market: [
    { id: 'market-rent', title: 'The rent notice', scene: 'A rent notice waits beneath the market report. The numbers are small enough to look harmless.' },
    { id: 'market-breakfast', title: 'Before the opening bell', scene: 'Breakfast grows cold while the price ticks forward. Nobody at the table asks what the chart means.' },
    { id: 'market-neighbor', title: 'A neighbor’s advice', scene: 'A neighbor shares a confident prediction over the fence, then admits they have not checked the latest price.' },
    { id: 'market-envelope', title: 'The unopened envelope', scene: 'An overdue envelope sits beside the screen. The market will close before the mail does.' },
  ],
  chess: [
    { id: 'chess-library', title: 'The library board', scene: 'The library is closing. One endgame remains on the board, and the caretaker has already put on a coat.' },
    { id: 'chess-cousin', title: 'A family challenge', scene: 'A cousin sets up the position from memory and says the answer should be obvious.' },
    { id: 'chess-train', title: 'The delayed train', scene: 'A delayed train leaves enough time for one careful calculation, but not enough to calculate twice.' },
    { id: 'chess-margin', title: 'A note in the margin', scene: 'A pencilled note in the newspaper says “mate in two.” The handwriting is not yours.' },
  ],
  nim: [
    { id: 'nim-breakroom', title: 'The break-room game', scene: 'Someone has arranged the stones during a short break. The next shift is already gathering outside.' },
    { id: 'nim-market-stall', title: 'The stall wager', scene: 'A stallholder offers a small wager and pushes the stones into neat piles.' },
    { id: 'nim-schoolyard', title: 'The schoolyard rule', scene: 'The old schoolyard rule returns with the old schoolyard audience: whoever takes the last stone wins.' },
    { id: 'nim-last-bus', title: 'The last bus', scene: 'The last bus home is due soon. Across the bench, an opponent counts the piles again.' },
  ],
  shift: [
    { id: 'shift-window', title: 'The window seat', scene: 'A scratched game board waits on the train table. The city outside keeps changing its mind.' },
    { id: 'shift-lunch', title: 'Lunch-hour rematch', scene: 'A colleague asks for a rematch while the lunch room empties around you.' },
    { id: 'shift-chalk', title: 'Chalk on the pavement', scene: 'A child draws a grid on the pavement and leaves the first move to you.' },
    { id: 'shift-elevator', title: 'Between floors', scene: 'The elevator stops between floors. Someone has drawn a grid on the notepad.' },
  ],
  dilemma: [
    { id: 'dilemma-key', title: 'The spare key', scene: 'A spare key changes hands. Both people understand that trust can be useful and expensive.' },
    { id: 'dilemma-promotion', title: 'The shared credit', scene: 'A piece of work succeeds. The credit is large enough for two names, if both names are written down.' },
    { id: 'dilemma-soup', title: 'A pot of soup', scene: 'A neighbor leaves soup at the door after a difficult week. The note asks for nothing.' },
    { id: 'dilemma-bridge', title: 'The bridge agreement', scene: 'Two households agree to repair the same bridge. The first contribution is due today.' },
  ],
  cards: [
    { id: 'cards-fair', title: 'The county fair', scene: 'A card table sits at the edge of the county fair. The prize is modest; the crowd is not.' },
    { id: 'cards-cafe', title: 'The café prediction', scene: 'A café owner turns over one card and asks whether the next will be higher or lower.' },
    { id: 'cards-wedding', title: 'The wedding table', scene: 'A relative deals from a borrowed deck between speeches and asks for one prediction.' },
    { id: 'cards-platform', title: 'The station platform', scene: 'A traveler deals cards on the platform while the departure board changes overhead.' },
  ],
};

const roleNames: Record<Role, string> = { trader: 'the trader', worker: 'the worker', family: 'the family-minded one', wildcard: 'the wildcard' };

function choiceText(game: GameId, move: string): string {
  if (game === 'market') {
    if (move === 'hold') return 'Keep the position unchanged and wait for the next price.';
    const [direction, size] = move.split(':');
    return `${direction === 'long' ? 'Bet on a rise' : 'bet on a fall'} with ${size}% of the available position.`;
  }
  if (game === 'chess') return `Play ${move}, trusting the calculation enough to put it on the board.`;
  if (game === 'nim') {
    const [pile, amount] = move.split(':');
    return `Take ${amount} ${amount === '1' ? 'stone' : 'stones'} from pile ${Number(pile) + 1}.`;
  }
  if (game === 'shift') {
    const [from, to] = move.split('>');
    const cell = (position: string) => `row ${Math.floor(Number(position) / 3) + 1}, column ${(Number(position) % 3) + 1}`;
    return to ? `Move a mark from ${cell(from)} to ${cell(to)}.` : `Place a mark at ${cell(from)}.`;
  }
  if (game === 'dilemma') return move === 'cooperate' ? 'Offer cooperation and leave room for trust to be returned.' : 'Protect your own position, even if the other person notices.';
  return move === 'higher' ? 'Call that the next card will be higher.' : 'Call that the next card will be lower.';
}

function consequenceText(deltas: StatDeltas): string {
  const effects = Object.entries(deltas).filter(([, value]) => value !== 0).map(([stat, value]) => `${stat} ${value! > 0 ? 'rose' : 'fell'} by ${Math.abs(value!)}`);
  return effects.length ? `Afterward, ${effects.join(' and ')}.` : 'The choice changed no recorded resource. Its consequence was the state it left behind.';
}

export function writeTurnStory(input: { seed: string; role: Role; game: GameId; turnIndex: number; moveIndex: number; move: string; deltas: StatDeltas }): TurnStory {
  const candidates = events[input.game];
  const event = rng(`${input.seed}:written-event:${input.turnIndex}:${input.moveIndex}`).pick(candidates);
  return {
    eventId: event.id,
    title: event.title,
    scene: `${input.role === 'family' ? 'The family-minded one' : `At this point, ${roleNames[input.role]}`} faces a small decision with a longer shadow. ${event.scene}`,
    choice: choiceText(input.game, input.move),
    consequence: consequenceText(input.deltas),
  };
}
