import { useEffect } from 'react';
import { GUI } from 'dat.gui';
import Head from 'next/head';

const CONFIG = {
  gradient: true,
  animated: true,
  highlight: 2,
  spread: 1,
  primary: '#ffffff',
  secondary: '#606060',
};

const GradientText = () => {
  useEffect(() => {
    const CTRL = new GUI();

    const UPDATE = () => {
      for (const key of Object.keys(CONFIG)) {
        document.documentElement.style.setProperty(`--${key}`, CONFIG[key]);
      }
      document.documentElement.setAttribute('data-gradient', CONFIG.gradient);
      document.documentElement.setAttribute('data-animate', CONFIG.animated);
    };

    const HIGHLIGHT_ONE = CTRL.addFolder('Highlight One');
    HIGHLIGHT_ONE.add(CONFIG, 'highlight', 0, 5, 1).name('Highlight').onChange(UPDATE);
    HIGHLIGHT_ONE.addColor(CONFIG, 'primary').name('Primary Color').onChange(UPDATE);
    HIGHLIGHT_ONE.add(CONFIG, 'gradient').name('Use gradient?').onChange(UPDATE);
    HIGHLIGHT_ONE.add(CONFIG, 'animated').name('Animate gradient?').onChange(UPDATE);

    const HIGHLIGHT_TWO = CTRL.addFolder('Highlight Two');
    HIGHLIGHT_TWO.add(CONFIG, 'spread', 0, 5, 1).name('Spread').onChange(UPDATE);
    HIGHLIGHT_TWO.addColor(CONFIG, 'secondary').name('Secondary Color').onChange(UPDATE);

    UPDATE();

    return () => {
      CTRL.destroy();
    };
  }, []);

  return (
    <>
      <Head>
        <style>
          {`
            @font-face {
              font-family: "Geist Sans";
              src: url("https://assets.codepen.io/605876/GeistVF.ttf") format("truetype");
            }
          `}
        </style>
      </Head>
      <div className="wrapper">
        <h2>Making the web more exciting one pixel at a time.</h2>
        <style jsx>{`
          :root {
            --bg: hsl(0 0% 2%);
            --primary-bg: linear-gradient(var(--primary), var(--primary));
          }

          body {
            display: grid;
            place-items: center;
            min-height: 100vh;
            font-family: "Geist Sans", sans-serif;
            font-weight: 80;
            background: var(--bg);
            overflow: hidden;
          }

          body::before {
            --size: 120px;
            --line: hsl(0 0% 100% / 0.13);
            --thickness: 2px;
            --offset: 60px;
            content: "";
            z-index: -1;
            position: absolute;
            inset: 0;
            background:
              linear-gradient(
                transparent 0 calc(var(--size) - var(--thickness)),
                var(--line) calc(var(--size) - var(--thickness)) var(--size)
              ) var(--offset) var(--offset) / var(--size) var(--size),
              linear-gradient(
                90deg,
                transparent 0 calc(var(--size) - var(--thickness)),
                var(--line) calc(var(--size) - var(--thickness)) var(--size)
              ) var(--offset) var(--offset) / var(--size) var(--size);
          }

          .wrapper {
            padding: 2rem;
            background: var(--bg);
            position: relative;
          }

          h2 {
            font-weight: 120;
            line-height: 1.07;
            resize: both;
            overflow: hidden;
            width: 10ch;
            background: var(--primary-bg),
              linear-gradient(var(--secondary), var(--secondary)),
              linear-gradient(
                var(--secondary) 0 calc((var(--highlight) + var(--spread)) * 1lh),
                transparent
              );
            background-repeat: no-repeat;
            background-size: 100% calc(var(--highlight) * 1lh),
              100% calc((var(--highlight) + var(--spread)) * 1lh), 100% 100%;
            background-clip: text;
            color: transparent;
            text-wrap: balance;
            font-size: clamp(2rem, 1rem + 4vw, 12rem);
            display: inline-block;
            margin: 0;
          }

          @media (prefers-reduced-motion: no-preference) {
            @property --angle {
              inherits: true;
              initial-value: 180deg;
              syntax: '<angle>';
            }
            @keyframes rotate {
              to {
                --angle: 540deg;
              }
            }
            [data-gradient="true"][data-animate="true"] {
              animation: rotate 6s infinite linear;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default GradientText;
