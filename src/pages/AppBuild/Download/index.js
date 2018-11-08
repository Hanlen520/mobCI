import React, { PureComponent } from 'react';
import { Layout } from 'antd';

const { Header, Footer, Content } = Layout;

export default class Devtest extends PureComponent {
  state={

  }

  componentWillMount(){
    const params = this.props.location.search;
    if (params.indexOf('?') !== -1) {
      const taskId = params.substr(1);
      console.log("task_id",taskId)
    }
  }

  render() {
    return (
      <Layout style={{alignItems:'center',justifyContent:'center',height:'100%'}}>
        <Header>Header</Header>
        <Content>Content</Content>
        <Footer>Footer</Footer>
      </Layout>
    );
  }
}
