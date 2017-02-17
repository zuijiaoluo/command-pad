import React, { Component, PropTypes } from 'react';
import { hashHistory } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Icon } from 'antd';
import * as actions from './redux/actions';
import ALink from './ALink';

export class AboutPage extends Component {
  static propTypes = {
    home: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
  };

  render() {
    return (
      <div className="rekit-page home-about-page">
        <div className="header">
          <Icon type="close" onClick={() => hashHistory.push('/')} style={{ float: 'right' }} />
        </div>
        <div className="page-content">
          <div className="title-wrapper">
            <img src={require('../../images/logo.png')} alt="logo" className="logo" />
            <h2>涛涛私人版</h2>
            <div>Version {this.props.home.appVersion}</div>
          </div>
          <p>本项目纯属娱乐,如果商业使用请联系作者</p>
          <h3>.</h3>
          <h3>.</h3>
          <h3>Powered by</h3>
          <p className="powered-by">
            <ALink url="https://github.com/electron/electron">
              <img alt="electron logo" src={require('../../images/electron_logo.png')} />
            </ALink>
            <br />
            <ALink url="https://github.com/supnate/rekit">
              <img alt="rekit logo" className="rekit-logo" src={require('../../images/rekit_logo.png')} />
            </ALink>
            <br />
            <ALink url="https://github.com/supnate/command-pad">
              <img alt="command_pad logo" className="command_pad-logo" src={require('../../images/command_logo.png')} />
            </ALink>
          </p>
        </div>
      </div>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state) {
  return {
    home: state.home,
  };
}

/* istanbul ignore next */
function mapDispatchToProps(dispatch) {
  return {
    actions: bindActionCreators({ ...actions }, dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(AboutPage);
