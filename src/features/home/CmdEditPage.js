import React, { Component, PropTypes } from 'react';
import { Link, hashHistory } from 'react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import memobind from 'memobind';
import { Button, Checkbox, Col, Form, Icon, Input, message, Popover, Row, Tooltip } from 'antd';
import * as actions from './redux/actions';

const FormItem = Form.Item;

export class CmdEditPage extends Component {
  static propTypes = {
    home: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    params: PropTypes.object,
    form: PropTypes.object.isRequired,
  };

  getFormItemLabel(name, tooltip) {
    return (
      <span>
        <span>{name}</span>
        <Tooltip title={tooltip}>
          <Icon type="question-circle-o" />
        </Tooltip>
      </span>
    );
  }

  handleSubmit(evt) {
    evt.preventDefault();
    const cmdId = this.props.params.cmdId;
    this.props.form.validateFields((errors, values) => {
      if (errors) {
        return;
      }
      this.props.actions.saveCmd(values, cmdId).then(() => {
        message.success(`${cmdId ? 'Edit' : 'Add'} success.`);
        hashHistory.push('/');
      });
    });
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const cmdId = this.props.params.cmdId;
    const initialData = cmdId ? this.props.home.cmdById[cmdId] : {};
    const { isWin } = this.props.home;
    return (
      <div className="rekit-page home-cmd-edit-page">
        <div className="header">
          <Link to="/"><Icon type="arrow-left" /></Link>
          <h1>{cmdId ? '编辑' : '添加'} 命令</h1>
        </div>
        <div className="page-content">
          <Form vertical required style={{ margin: 15 }} onSubmit={memobind(this, 'handleSubmit')}>
            <FormItem label="命令的名称">
              {getFieldDecorator('name', {
                initialValue: initialData.name || '',
                rules: [
                  { required: true, whitespace: true, message: '名字已经存在' }
                ],
              })(
                <Input size="default" />
              )}
            </FormItem>
            <FormItem label={this.getFormItemLabel('命令', '你需要运行的命令')}>
              {getFieldDecorator('cmd', {
                initialValue: initialData.cmd || '',
                rules: [
                  { required: true, message: 'Command is required.' }
                ],
              })(
                <Input size="default" />
              )}
            </FormItem>
            {!isWin && <FormItem>
              {getFieldDecorator('sudo', {
                valuePropName: 'checked',
                initialValue: !!initialData.sudo,
              })(
                <Checkbox>{this.getFormItemLabel('Sudo', '如果命令需要管理员权限')}</Checkbox>
              )}
            </FormItem>}
            <FormItem label={this.getFormItemLabel('工作目录', '运行命令的目录')}>
              {getFieldDecorator('cwd', {
                initialValue: initialData.cwd || '',
              })(
                <Input size="default" />
              )}
            </FormItem>
            <FormItem label={this.getFormItemLabel('Url', '可选。可以直接打开浏览器，例如，"http://127.0.0.1:9999"')}>
              {getFieldDecorator('url', {
                initialValue: initialData.url || '',
              })(
                <Input size="default" />
              )}
            </FormItem>

            <FormItem>
              {getFieldDecorator('finishPrompt', {
                valuePropName: 'checked',
                initialValue: !!initialData.finishPrompt,
              })(
                <Checkbox>{this.getFormItemLabel('完成通知', '当出错时提醒应该也会提醒')}</Checkbox>
              )}
            </FormItem>

            <FormItem className="buttons">
              <Button size="default" type="primary" htmlType="submit">Ok</Button>
              <Button size="default" onClick={() => hashHistory.push('/')}>Cancel</Button>
            </FormItem>
          </Form>
        </div>
      </div>
    );
  }
}

CmdEditPage = Form.create()(CmdEditPage);

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
)(CmdEditPage);
