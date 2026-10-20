/** The 7-8 rules, as the list shown inside the shared RulesDialog. */
export function Rules78() {
  return (
    <ol>
      <li>
        <strong>Two players, fifteen hands.</strong> One player is the 8 and wants 8 hands, the other is the 7 and wants
        7. Roles stay the same for the whole evening.
      </li>
      <li>
        <strong>The deck is 30 cards:</strong> 8 through Ace in every suit, plus the 7 of spades and 7 of hearts. Ace is
        high, 7 is low.
      </li>
      <li>
        <strong>The deal.</strong> Each player gets 5 cards in hand. The 8 looks at theirs and picks the trump suit.
        Then everyone gets five face-down cards with a face-up card laid on each.
      </li>
      <li>
        <strong>Playing a hand.</strong> The 8 leads. Play a card from your hand or any face-up card on the table.
        Playing a table card turns over the face-down card beneath it, ready for next time.
      </li>
      <li>
        <strong>Follow suit.</strong> If you have the suit that was led, in your hand or face up on the table, you must
        play it. Otherwise play anything, including trump.
      </li>
      <li>
        <strong>Winning a hand.</strong> Trump beats any other suit; otherwise the higher card of the led suit wins. The
        winner leads next.
      </li>
      <li>
        <strong>Owing hands.</strong> Win more than your number and you owe the other player the extra hands. Next
        deal they get one card swap for each: take one of your face-up cards, or a random card from your hand, and give
        back any card of theirs.
      </li>
      <li>
        <strong>Keep going.</strong> After the fifteenth hand, deal again. There is no last deal.
      </li>
    </ol>
  );
}
