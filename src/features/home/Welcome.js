import React, { PureComponent } from 'react';
import { hashHistory } from 'react-router';
import { Button } from 'antd';

export default class Welcome extends PureComponent {
  render() {
    return (
      <div className="home-welcome">
        <h2>
          欢迎使用
        </h2>
        <p>点击下面开始创建第一个命令</p>
        <p>
          <Button type="primary" onClick={() => hashHistory.push('/cmd/add')}>添加命令</Button>
        </p>
      </div>
    );
  }
}
