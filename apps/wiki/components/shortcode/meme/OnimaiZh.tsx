import { LocalImage } from '@/components/LocalImage';
import styles from '../css/OnimaiZh.module.css';

export default function OnimaiZh() {
  return (
    <div>
      <LocalImage
        src="/hugo-static/images/meme/onimai.png"
        className={styles.doctorStory}
        alt="onimai meme"
      />
      <b>
        <i>再次申明：激素可不是魔法噢！</i>
      </b>
      <br />
      <small>
        （现实可没有漫画里的灵丹妙药！/現實可沒有漫畫裡的靈丹妙藥！）
      </small>
    </div>
  );
}
