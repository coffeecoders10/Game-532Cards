/** The Judgement rules, as the list shown inside the shared RulesDialog. */
export function RulesJudgement() {
  return (
    <ol>
      <li>
        <strong>Three to six players, as many rounds as you like.</strong> Each round, win exactly as many hands as you
        called. The highest total when the host ends the game wins.
      </li>
      <li>
        <strong>The deal.</strong> Every player gets the same number of cards: 16 with three players, 13 with four, 10
        with five and 8 with six. The deck is trimmed to fit by taking out the 2s. Ace is high.
      </li>
      <li>
        <strong>Trump.</strong> A random suit is trump for the round, and a new one is drawn each round. Any trump
        beats every card of another suit.
      </li>
      <li>
        <strong>Judgement.</strong> Before any card is played, each player in turn calls how many hands they will win,
        from 0 to the number of cards in their hand. Calls are public and can&apos;t be changed. The last player to call can&apos;t pick the number that makes all the calls add up to the hands available, so somebody always misses.
      </li>
      <li>
        <strong>Who starts.</strong> One player starts the judging and leads the first hand. The starting seat moves one
        place clockwise every round.
      </li>
      <li>
        <strong>Playing a hand.</strong> The first card sets the led suit. Follow it if you can; if you can&apos;t, play
        anything, including trump. Highest trump wins; with no trump, the highest card of the led suit wins. The winner
        leads the next hand.
      </li>
      <li>
        <strong>Scoring.</strong> Win exactly the number you called and you score that number. Win fewer or more and you
        score nothing. Calling 0 and winning none scores nothing too.
      </li>
      <li>
        <strong>Ending.</strong> After any round the host can end the game. The highest total wins, and a tie is shared.
      </li>
    </ol>
  );
}
