// @flow

import classnames from 'classnames';
import React from 'react';
import styles from './style.css';

type State = {
  pathLength: ?number,
  animateOut: boolean,
};

class HomepageTopSlice extends React.Component<{}, State> {
  state = {
    pathLength: null,
    animateOut: false,
  };

  onPathRef = (ref: ?mixed /* Flow doesn't have types for SvgPathElement yet */) => {
    const pathLength: ?number =
      ref && typeof ref.getTotalLength === 'function' ? ref.getTotalLength() : null;

    this.setState({ pathLength, animateOut: false });
  };

  onAnimationEnd = () => {
    this.setState({ animateOut: true });
  };

  svg = () => {
    const { pathLength, animateOut } = this.state;

    const showWriting = pathLength != null;

    return (
      <svg
        className={classnames({
          [styles.hidden]: !showWriting,
          [styles.animateOut]: animateOut,
        })}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        x="0px"
        y="0px"
        width="340px"
        height="333px"
        viewBox="0 0 340 333"
        enableBackground="new 0 0 340 333"
        xmlSpace="preserve"
      >
        <path
          ref={this.onPathRef}
          className={classnames(styles.writingPath, {
            [styles.writingPathAnimate]: showWriting,
          })}
          style={{
            strokeDasharray: pathLength || 0,
            strokeDashoffset: pathLength || 0,
          }}
          onAnimationEnd={this.onAnimationEnd}
          fill="none"
          stroke="#000000"
          strokeWidth="4"
          strokeMiterlimit="10"
          d="M66.039,133.545c0,0-21-57,18-67s49-4,65,8 s30,41,53,27s66,4,58,32s-5,44,18,57s22,46,0,45s-54-40-68-16s-40,88-83,48s11-61-11-80s-79-7-70-41 C46.039,146.545,53.039,128.545,66.039,133.545z"
        />
      </svg>
    );
  };

  render() {
    return (
      <section className={styles.homepageTopSlice}>
        <div className={styles.sliceContainer}>
          <h1 className={styles.badgerSlogan}>We are catalysts for change through</h1>
          <div className={styles.writingSpace}>{this.svg()}</div>
        </div>
      </section>
    );
  }
}

export default HomepageTopSlice;
