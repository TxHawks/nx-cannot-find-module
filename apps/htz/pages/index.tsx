import React from 'react';
import { NAME, } from '@haaretz/theme/merge.macro';

import styles from './index.module.css';

export function Index() {
  /*
   * Replace the elements below with your own.
   *
   * Note: The corresponding styles are in the ./index.css file.
   */
  return (
    <div className={styles.page}>
      {NAME}
    </div>
  );
}

export default Index;
