import React from 'react';
import ReactDOM from 'react-dom';

import './Backdrop.css';

const Backdrop = props => {
  return ReactDOM.createPortal(
    <div className="backdrop" onClick={props.onBackClick}></div>,
    document.getElementById('backdrop-hook')
  );
};

export default Backdrop;
