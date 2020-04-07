import { CardType } from 'core/cards/card';
import { CardLostReason, EventPacker, GameEventIdentifiers, ServerEventFinder } from 'core/event/event';
import { Sanguosha } from 'core/game/engine';
import { AllStage, DamageEffectStage } from 'core/game/stage_processor';
import { Player } from 'core/player/player';
import { PlayerCardsArea } from 'core/player/player_props';
import { Room } from 'core/room/room';
import { Precondition } from 'core/shares/libs/precondition/precondition';
import { CommonSkill, TriggerSkill } from 'core/skills/skill';
import { TranslationPack } from 'core/translations/translation_json_tool';

@CommonSkill
export class QiLinGongSkill extends TriggerSkill {
  constructor() {
    super('qilingong', 'qilingong_description');
  }

  public isTriggerable(event: ServerEventFinder<GameEventIdentifiers.DamageEvent>, stage?: AllStage) {
    return stage === DamageEffectStage.DamageEffect;
  }

  canUse(room: Room, owner: Player, content?: ServerEventFinder<GameEventIdentifiers.DamageEvent>) {
    if (!content) {
      return false;
    }

    const { cardIds, fromId, toId } = content;
    const to = room.getPlayerById(toId);
    const horses = to.getCardIds(PlayerCardsArea.EquipArea).filter(cardId => {
      const card = Sanguosha.getCardById(cardId);
      return card.is(CardType.OffenseRide) || card.is(CardType.DefenseRide);
    });
    if (horses.length === 0) {
      return false;
    }

    if (!cardIds || cardIds.length === 0 || !fromId) {
      return false;
    }
    return owner.Id === fromId && Sanguosha.getCardById(cardIds[0]).GeneralName === 'slash';
  }

  async onTrigger(room: Room, content: ServerEventFinder<GameEventIdentifiers.SkillUseEvent>) {
    return true;
  }

  async onEffect(room: Room, skillUseEvent: ServerEventFinder<GameEventIdentifiers.SkillEffectEvent>) {
    const { triggeredOnEvent } = skillUseEvent;
    const event = Precondition.exists(triggeredOnEvent, 'Unable to get damage event') as ServerEventFinder<
      GameEventIdentifiers.DamageEvent
    >;
    const to = room.getPlayerById(event.toId);

    const options = {
      [PlayerCardsArea.EquipArea]: to.getCardIds(PlayerCardsArea.EquipArea).filter(cardId => {
        const card = Sanguosha.getCardById(cardId);
        return card.is(CardType.OffenseRide) || card.is(CardType.DefenseRide);
      }),
    };

    const chooseCardEvent = {
      fromId: event.fromId!,
      toId: to.Id,
      options,
    };

    room.notify(
      GameEventIdentifiers.AskForChoosingCardFromPlayerEvent,
      EventPacker.createUncancellableEvent<GameEventIdentifiers.AskForChoosingCardFromPlayerEvent>(chooseCardEvent),
      event.fromId!,
    );

    const response = await room.onReceivingAsyncReponseFrom(
      GameEventIdentifiers.AskForChoosingCardFromPlayerEvent,
      event.fromId!,
    );

    if (response.selectedCard === undefined) {
      return true;
    }

    const loseEvent: ServerEventFinder<GameEventIdentifiers.CardLostEvent> = {
      fromId: chooseCardEvent.toId,
      cardIds: [response.selectedCard],
      droppedBy: chooseCardEvent.fromId,
      reason: CardLostReason.PassiveDrop,
      translationsMessage: TranslationPack.translationJsonPatcher(
        '{0} is placed into drop stack',
        TranslationPack.patchCardInTranslation(response.selectedCard),
      ).extract(),
    };
    await room.loseCards(loseEvent);
    room.bury(response.selectedCard);
    return true;
  }
}