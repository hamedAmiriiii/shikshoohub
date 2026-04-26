import React from 'react';
import styles from './Confetti.module.css';

const Confetti = () => {
  return (
    <div className={styles.container}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className={styles.confetti}></div>
      ))}
    </div>
  );
};

export default Confetti;
