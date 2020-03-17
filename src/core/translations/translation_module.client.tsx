import { CardSuit } from 'core/cards/libs/card_props';
import { Player } from 'core/player/player';
import * as React from 'react';
import { Languages, TranslationPack, TranslationsDictionary } from './translation_json_tool';
import { TranslationModule } from './translation_module';

export type TranslatedCardObject = {
  cardSuit: CardSuit;
  suitElement: JSX.Element;
  cardNumber: string;
  cardName: string;
};
type EmojiOrImageTranslationDictionary = {
  [k: string]: JSX.Element;
};

export class ClientTranslationModule extends TranslationModule {
  private currentPlayer: Player | undefined;
  private emojiOrImageTextDict: EmojiOrImageTranslationDictionary = {};

  public static setup(currentLanguage: Languages, ...dictionaries: [Languages, TranslationsDictionary][]) {
    const translator = new ClientTranslationModule(...dictionaries);
    translator.currentLanguage = currentLanguage;

    return translator;
  }

  private static readonly uniquNumberOnCard = {
    0: '',
    1: 'A',
    11: 'J',
    12: 'Q',
    13: 'K',
  };

  public static getCardNumber(cardNumber: number): string {
    const numberString = ClientTranslationModule.uniquNumberOnCard[cardNumber];
    return numberString === undefined ? cardNumber.toString() : numberString;
  }

  public setupPlayer(player?: Player) {
    this.currentPlayer = player;
  }

  public addEmojiOrImageSymbolText(...symbolTextPair: [string | number, JSX.Element][]) {
    for (const [rawText, translatePath] of symbolTextPair) {
      this.emojiOrImageTextDict[TranslationPack.patchEmojiOrImageInTranslation(rawText)] = translatePath;
    }
  }
  public getEmojiOrImageSymbolText(symbolText: string | number) {
    return this.emojiOrImageTextDict[symbolText];
  }

  public translatePatchedCardText(text: string, dictionary: TranslationsDictionary): TranslatedCardObject[] {
    const cardTextArray: string[] = JSON.parse(text.slice(TranslationPack.translateCardObjectSign.length));

    return cardTextArray.map(cardText => {
      const [cardName, cardSuitString, cardNumber] = cardText.split(' ');
      return {
        cardSuit: TranslationPack.dispatchEmojiOrImageInTranslation(cardSuitString),
        suitElement: this.getEmojiOrImageSymbolText(cardSuitString),
        cardNumber,
        cardName: dictionary[cardName] || cardName,
      };
    });
  }

  public translatePatchedPlayerText(text: string, dictionary: TranslationsDictionary): string[] {
    const playerObjectArray: string[] = JSON.parse(text.slice(TranslationPack.translatePlayerObjectSign.length));

    return playerObjectArray.map(playerText => {
      const [characterName, position] = playerText.split(' ');
      const formattedPosition = `seat ${position}`;
      return (
        `${dictionary[characterName] || characterName}(${dictionary[formattedPosition] || formattedPosition})` +
        (this.currentPlayer && this.currentPlayer.Position.toString() === position ? `(${dictionary['you']})` : '')
      );
    });
  }

  public trx(rawText: string): JSX.Element {
    const dispatchedObject = TranslationPack.dispatch(rawText);

    if (!dispatchedObject) {
      return <span>{this.tr(rawText)}</span>;
    }

    const dictionary = this.dictionary.get(this.currentLanguage);
    const translatedOriginalText = dictionary
      ? dictionary[dispatchedObject.original] || dispatchedObject.original
      : dispatchedObject.original;
    const paramIndex = translatedOriginalText
      .match(/\{[0-9]\}/g)
      ?.map(indexString => parseInt(indexString.replace(/(\{|\})/g, ''), 10));
    if (!paramIndex) {
      return <span>{this.tr(rawText)}</span>;
    }

    const commonTextStyle: React.CSSProperties = {
      padding: '0 4px',
    };
    const boldTextStyle: React.CSSProperties = {
      fontWeight: 550,
    };
    const playerStyle: React.CSSProperties = {
      color: '#C65719',
    };
    const getCardNumberStyle = (cardSuit: CardSuit): React.CSSProperties => {
      const style: React.CSSProperties = boldTextStyle;
      if (cardSuit === CardSuit.Heart || cardSuit === CardSuit.Diamond) {
        return {
          ...style,
          color: 'red',
        };
      }
      return style;
    };

    const textCombinations: JSX.Element[] = dispatchedObject.params.map(param => {
      if (typeof param === 'string' && dictionary) {
        if (TranslationPack.isCardObjectText(param)) {
          const translatedCardObject = this.translatePatchedCardText(param, dictionary);

          return (
            <>
              {translatedCardObject.map((cardObject, index) => (
                <span key={index}>
                  <span>{this.tr('[')}</span>
                  <span
                    style={{
                      ...boldTextStyle,
                      ...commonTextStyle,
                    }}
                  >
                    {cardObject.cardName}
                  </span>
                  {cardObject.suitElement}
                  <span style={getCardNumberStyle(cardObject.cardSuit)}>
                    {ClientTranslationModule.getCardNumber(parseInt(cardObject.cardNumber, 10))}
                  </span>
                  <span>{this.tr(']')}</span>
                </span>
              ))}
            </>
          );
        } else if (TranslationPack.isPlayerObjectText(param)) {
          const translatedPlayerObject = this.translatePatchedPlayerText(param, dictionary);
          return (
            <span
              style={{
                ...playerStyle,
                ...boldTextStyle,
                ...commonTextStyle,
              }}
            >
              {translatedPlayerObject.join(',')}
            </span>
          );
        }
      }

      if (typeof param === 'string' && dictionary && TranslationPack.isTextArrayText(param)) {
        if (TranslationPack.isTextArrayText(param)) {
          param = param
            .slice(TranslationPack.translateTextArraySign.length)
            .split(',')
            .map(subParam => dictionary[subParam] || subParam)
            .join(',');
        } else {
          param = dictionary[param] || param;
        }
      }

      return (
        <span
          style={{
            ...boldTextStyle,
            ...commonTextStyle,
          }}
        >
          {dictionary ? dictionary[param] || param : param}
        </span>
      );
    });

    const translatedReactComponents: JSX.Element[] = [];
    const splitRawText = translatedOriginalText.split(/\{[0-9]\}/).map(splitStr => splitStr.trim());
    for (let i = 0; i < splitRawText.length; i++) {
      if (splitRawText[i]) {
        translatedReactComponents.push(<span>{splitRawText[i]}</span>);
      }
      if (textCombinations[paramIndex[i]]) {
        translatedReactComponents.push(textCombinations[paramIndex[i]]);
      }
    }

    return <>{translatedReactComponents}</>;
  }
}