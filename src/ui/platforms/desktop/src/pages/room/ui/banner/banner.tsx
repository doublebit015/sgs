import classNames from 'classnames';
import { ClientTranslationModule } from 'core/translations/translation_module.client';
import * as React from 'react';
import { useHistory } from 'react-router-dom';
import { ConnectionService } from 'services/connection_service/connection_service';
import { Button } from 'ui/button/button';
import { SignalBar } from 'ui/signal_bar/signal_bar';
import styles from './banner.module.css';
import { ServerHostTag } from 'props/config_props';

export type BannerProps = {
  roomName: string;
  roomIndex: number;
  translator: ClientTranslationModule;
  connectionService: ConnectionService;
  className?: string;
  defaultPing?: number;
  onClickSettings(): void;
  host: ServerHostTag;
};

const BreadCrumb = (props: { content: string[] }) => {
  return (
    <div className={styles.breadcrumb}>
      {props.content.map((layer, index) => (
        <span className={styles.layer}>
          {layer}
          {index === props.content.length - 1 ? '' : ' /\u00a0'}
        </span>
      ))}
    </div>
  );
};

export const Banner = (props: BannerProps) => {
  const history = useHistory();
  const { roomIndex, host, roomName, translator, defaultPing } = props;
  const breadcrumb = [translator.tr('lobby'), roomName, `${translator.tr('room id')}: ${roomIndex}`];

  const onClick = () => {
    history.push('/lobby');
  };

  return (
    <div className={classNames(styles.banner, props.className)}>
      <BreadCrumb content={breadcrumb} />
      <div className={styles.controlButtons}>
        <Button variant="primary" onClick={props.onClickSettings} className={styles.settingsButton}>
          {translator.tr('settings')}
        </Button>
        <Button variant="primary" onClick={onClick}>
          {translator.tr('back to lobby')}
        </Button>
      </div>
      <SignalBar host={host} defaultPing={defaultPing} connectionService={props.connectionService} className={styles.signalBar} />
    </div>
  );
};
