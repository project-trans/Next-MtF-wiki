import { LocalImage } from '@/components/LocalImage';
import styles from '../css/OnimaiZh.module.css';

export default function Hybl() {
  return (
    <>
      <LocalImage
        src="/hugo-static/images/meme/hybl.jpg"
        className={styles.doctorStory}
        aria-hidden="true"
        alt=""
      />{' '}
      害，您瞧瞧，这儿不花园北路吗？
    </>
  );
}
