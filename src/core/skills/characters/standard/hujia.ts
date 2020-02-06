import { CardMatcher } from 'core/cards/libs/card_matcher';
import { CharacterNationality } from 'core/characters/character';
import {
  ClientEventFinder,
  EventPacker,
  GameEventIdentifiers,
  ServerEventFinder,
} from 'core/event/event';
import { AskForQueryStage } from 'core/game/stage_processor';
import { Player } from 'core/player/player';
import { Room } from 'core/room/room';
import { CommonSkill, LordSkill, TriggerSkill } from 'core/skills/skill';
import { TranslationPack } from 'core/translations/translation_json_tool';

@CommonSkill
@LordSkill
export class Hujia extends TriggerSkill {
  public isAutoTrigger() {
    return false;
  }

  public isTriggerable(stage: AskForQueryStage) {
    return (
      stage === AskForQueryStage.AskForCardResponseStage ||
      stage === AskForQueryStage.AskForCardUseStage
    );
  }

  constructor() {
    super('hujia', 'hujia_description');
  }

  canUse(
    room: Room,
    owner: Player,
    content: ServerEventFinder<
      | GameEventIdentifiers.AskForCardResponseEvent
      | GameEventIdentifiers.AskForCardUseEvent
    >,
  ) {
    const { carMatcher } = content;
    return CardMatcher.match(carMatcher, {
      name: ['jink'],
    });
  }
  async onTrigger(
    room: Room,
    event: ClientEventFinder<GameEventIdentifiers.SkillUseEvent>,
  ) {
    event.translationsMessage = TranslationPack.translationJsonPatcher(
      '{0} activates skill {1}',
      room.getPlayerById(event.fromId).Name,
      this.name,
    );

    return true;
  }

  async onEffect(
    room: Room,
    event: ServerEventFinder<GameEventIdentifiers.SkillEffectEvent>,
  ) {
    const { triggeredOnEvent, fromId } = event;
    const jinkCardEvent = triggeredOnEvent as ServerEventFinder<
      | GameEventIdentifiers.AskForCardUseEvent
      | GameEventIdentifiers.AskForCardResponseEvent
    >;
    const identifier = EventPacker.getIdentifier<
      | GameEventIdentifiers.AskForCardUseEvent
      | GameEventIdentifiers.AskForCardResponseEvent
    >(jinkCardEvent);

    if (identifier === undefined) {
      throw new Error(`Unwrapped event without identifier in ${this.name}`);
    }

    for (const player of room.getAlivePlayersFrom()) {
      if (
        player.Nationality === CharacterNationality.Wei &&
        player.Id !== fromId
      ) {
        room.notify(identifier, jinkCardEvent, player.Id);

        const response = await room.onReceivingAsyncReponseFrom<
          ClientEventFinder<
            | GameEventIdentifiers.AskForCardUseEvent
            | GameEventIdentifiers.AskForCardResponseEvent
          >
        >(identifier, player.Id);

        if (response.cardId !== undefined) {
          if (identifier === GameEventIdentifiers.AskForCardUseEvent) {
            const cardUseEvent: ServerEventFinder<GameEventIdentifiers.CardUseEvent> = EventPacker.createIdentifierEvent(
              GameEventIdentifiers.CardUseEvent,
              {
                cardId: response.cardId,
                fromId,
              },
            );

            await room.Processor.onHandleIncomingEvent(
              GameEventIdentifiers.CardUseEvent,
              cardUseEvent,
            );
          } else {
            const cardResponseEvent: ServerEventFinder<GameEventIdentifiers.CardResponseEvent> = EventPacker.createIdentifierEvent(
              GameEventIdentifiers.CardResponseEvent,
              {
                cardId: response.cardId,
                fromId,
              },
            );

            await room.Processor.onHandleIncomingEvent(
              GameEventIdentifiers.CardResponseEvent,
              cardResponseEvent,
            );
          }

          return false;
        }
      }
    }
    return true;
  }
}
