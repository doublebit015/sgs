import { Card } from 'core/cards/card';
import { TrickCard } from 'core/cards/trick_card';
import { ActiveSkill, CardTransformSkill } from 'core/skills/skill';

export class QiCaiSkill extends CardTransformSkill<TrickCard, ActiveSkill> {
  public canTransform(card: Card) {
    return card instanceof TrickCard;
  }

  public override(cloneSkill: ActiveSkill) {
    cloneSkill.isAvailableTarget = () => {
      return true;
    };
  }
}
