import { ClientEventFinder, GameEventIdentifiers, ServerEventFinder } from 'core/event/event';
import { PlayerId } from 'core/player/player_props';
import { Room } from 'core/room/room';
import { Precondition } from 'core/shares/libs/precondition/precondition';
import { ActiveSkill, CommonSkill } from 'core/skills/skill';

@CommonSkill
export class TaoYuanJieYiSkill extends ActiveSkill {
  constructor() {
    super('taoyuanjieyi', 'taoyuanjieyi_description');
  }

  public canUse() {
    return true;
  }

  public targetFilter(room: Room, targets: PlayerId[]): boolean {
    return targets.length === 0;
  }
  public cardFilter(): boolean {
    return true;
  }
  public isAvailableCard(): boolean {
    return false;
  }
  public isAvailableTarget(): boolean {
    return false;
  }
  public async onUse(room: Room, event: ClientEventFinder<GameEventIdentifiers.CardUseEvent>) {
    const others = room.getAlivePlayersFrom();
    event.toIds = others.filter(player => room.canUseCardTo(room, event.cardId, player.Id)).map(player => player.Id);
    return true;
  }

  public async beforeEffect(room: Room, event: ServerEventFinder<GameEventIdentifiers.CardEffectEvent>) {
    event.toIds = event.toIds?.filter(to => {
      const player = room.getPlayerById(to);
      return player.Hp < player.MaxHp;
    });

    return true;
  }

  public async onEffect(room: Room, event: ServerEventFinder<GameEventIdentifiers.CardEffectEvent>) {
    const { toIds, cardId } = event;
    await room.recover({
      cardIds: [cardId],
      recoveredHp: 1,
      toId: Precondition.exists(toIds, 'Unknown targets in taoyuanjieyi')[0],
    });

    return true;
  }
}
