/* eslint-disable react/jsx-tag-spacing,no-param-reassign */
import React, {PureComponent} from 'react';
import {
  Alert,
  Fragment,
  Card,
  Form,
  Input,
  Select,
  Icon,
  Button,
  Dropdown,
  Menu,
  InputNumber,
  DatePicker,
  Modal,
  message,
  Divider,
  Badge,
  Table,
  Radio,
} from 'antd';
import {connect} from 'dva'
import StandardTable from '@/components/StandardTable';
import PageHeaderWrapper from '@/components/PageHeaderWrapper';

var QRCode = require('qrcode-react');

import styles from './index.less'

const FormItem = Form.Item;
const Option = Select.Option;
const {TextArea} = Input;

const CreateForm = Form.create()(props => {
  const {modalVisible, form, handleAdd, handleModalVisible, projectlist} = props;
  const okHandle = () => {
    form.validateFields((err, fieldsValue) => {
      if (err) return;
      form.resetFields();
      handleAdd(fieldsValue);
    });
  };
  return (
    <Modal
      destroyOnClose
      title="新建编译任务"
      visible={modalVisible}
      onOk={okHandle}
      maskClosable={false}
      width={800}
      onCancel={() => handleModalVisible()}
    >
      <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="所属项目">
        {form.getFieldDecorator('projectId', {
          rules: [{required: true, message: '请选择所属项目'}],
          initialValue: '',
        })(
          <Select style={{width: '100%'}} placeholder="请选择所属项目">
            {projectlist&&projectlist.map(item => (
              <Option key={item.id} value={item.id}>
                {item.project_name}
              </Option>
            ))}
          </Select>
        )}
      </FormItem>
      <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="麦通类型">
        {form.getFieldDecorator('tmType', {
          rules: [{required: true, message: '请选择标签类型'}],
          initialValue: 0,
        })(
          <Radio.Group>
            <Radio value={0}>正式版</Radio>
            <Radio value={1}>测试版</Radio>
          </Radio.Group>
        )}
      </FormItem>
      <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="SVN路径">
        {form.getFieldDecorator('svnPath', {
          rules: [{required: true, message: '请输入SVN路径！',}],
          initialValue: '',
        })(<Input placeholder="请输入"/>)}
      </FormItem>
      <FormItem labelCol={{span: 5}} wrapperCol={{span: 15}} label="描述">
        {form.getFieldDecorator('desc', {
          // rules: [{ required: false, message: '请输入至少五个字符的规则描述！', min: 5 }],
          initialValue: '',
        })(<TextArea placeholder="请输入描述信息" rows={4}/>)}
      </FormItem>
    </Modal>
  );
});

@connect(({build, loading}) => ({
  build,
  loading: loading.models.build,
}))
@Form.create()
class IOS extends PureComponent {
  state = {
    modalVisible: false,
    showMoreAction: false,
    projectData: [],
    taskList: null,
    showModelQRRecord: {},
    projectList:[],
    hasBuilding:0,
  };

  componentDidMount() {
    this.getList()
    this.getProjectList()
  }

  getList = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'build/queryTaskList',
      payload:{
        platform:'0',
      }
    }).then(() => {
      const {build} = this.props
      const {taskList,hasBuilding} = build
      this.setState({
        taskList,
        hasBuilding
      })
    })
  }

  getProjectList = () => {
    const {dispatch} = this.props;
    dispatch({
      type: 'build/queryProjectList'
    }).then(() => {
      const {build} = this.props
      const {projectList} = build
      this.setState({projectData:projectList})
    })
  }

  handleAdd = fields => {
    const {dispatch} = this.props;
    fields.platform = 0
    dispatch({
      type: 'build/queryAddTask',
      payload: fields,
    }).then(() => {
      this.handleModalVisible();
      this.getList();
    })
  };

  handleRunBuild = (id) => {
    const {dispatch} = this.props;
    dispatch({
      type: 'build/queryIosTaskBuild',
      payload: {
        taskId: id
      },
    }).then(() => {
      this.getList();
      this.timer = setInterval(() => this.getList(), 20000);
    })
  };

  handleModalVisible = flag => {
    this.setState({
      modalVisible: !!flag,
    });
  };

  handleShowMoreActionModalVisible = (record) => {
    this.setState({
      showMoreAction: true,
      showModelQRRecord:record,
    });
  };

  componentDidUnMount() {
    clearInterval(this.timer);
  }

  renderStatus = (status) => {
    let result
    switch (status) {
      case 1:
        result = <Badge status="default" text="正在获取代码"/>
        break;
      case 2:
        result = <Badge status="processing" text="正在配置"/>
        break;
      case 3:
        result = <Badge status="processing" text="正在打包"/>
        break;
      case 4:
        result = <Badge status="error" text="打包失败"/>
        break;
      case 5:
        result = <Badge status="processing" text="生成包成功"/>
        break;
      case 7:
        result = <Badge status="error" text="获取代码失败"/>
        break;
      case 8:
        result = <Badge status="processing" text="获取代码成功"/>
        break;
      case 9:
        result = <Badge status="error" text="SVN路径不正确"/>
        break;
      case 10:
        result = <Badge status="success" text="任务完成"/>
        break;
      case 11:
        result = <Badge status="error" text="上传plist失败"/>
        break;
      default:
        result = <Badge status="default" text="新任务"/>
    }
    return result
  };

  render() {
    const {modalVisible, projectData, taskList,showMoreAction,showModelQRRecord,hasBuilding} = this.state;
    const {loading} = this.props
    const parentMethods = {
      projectlist: projectData,
      handleAdd: this.handleAdd,
      handleModalVisible: this.handleModalVisible,
    };
    const columns = [
      {
        title: '序号',
        dataIndex: 'index',
        key: 'index',
        render: (text, record, index) => <span>{index + 1}</span>
      },
      {
        title: '项目',
        dataIndex: 'porject_data',
        key: 'porject_data',
        width:'20%',
        render: (text, record) => <div><img src={record.project_data.project_logo} style={{height:20,width:20,marginRight:10}} alt=""/><span>{record.project_data.project_name}</span></div>
      },
      {
        title: 'SVN路径',
        dataIndex: 'svn_path',
        key: 'svn_path',
        width: '30%'
      },
      {
        title: '添加人',
        dataIndex: 'add_user',
        key: 'add_user',
      },
      {
        title: '任务状态',
        dataIndex: 'status',
        key: 'status',
        render: (text, record) => this.renderStatus(record.status)
      },
      {
        title: '更新时间',
        dataIndex: 'update_time',
        key: 'update_time',
        render: (text, record) => <span>{record.update_time}</span>
      },
      {
        title: '备注',
        dataIndex: 'description',
        key: 'description',
        width:'10%',
        render: (text, record) => <span>{record.description}</span>
      },
      {
        title: '操作',
        dataIndex: 'action',
        key: 'action',
        render: (text, record) => (
          <div className={styles.action}>
            {record.status === 0 &&<a onClick={() => this.handleRunBuild(record.id)}>开始打包</a>}
            {(record.log_path && record.status !== 10 )&&<a href={record.log_path} download="" >查看log</a>}
            {record.status === 10 &&<a onClick={()=>this.handleShowMoreActionModalVisible(record)}>查看二维码</a>}
            {record.is_analyze === 3 &&<Divider type="vertical" />}
            {record.is_analyze === 3 &&<a href={record.pdf_report_url} rel="noopener noreferrer" target="_blank">安全报告</a>}
          </div>
        )
      },
    ]
    return (
      <PageHeaderWrapper title="IOS打包任务列表">
        <Card bordered={false}>
          <div className={styles.tableList}>
            <div className={styles.tableListOperator}>
              <Button icon="plus" type="primary" onClick={() => this.handleModalVisible(true)}>
                新建
              </Button>
            </div>
            <div className={styles.alert_container}>
              {hasBuilding === 1&&<Alert
                message="已有任务正在编译，请烧等"
                type="info"
                showIcon
              />}
            </div>
            <Table
              rowKey={record => record.id}
              loading={loading}
              dataSource={taskList}
              columns={columns}
            />
          </div>
        </Card>
        <CreateForm {...parentMethods} modalVisible={modalVisible} />
        <Modal
          title={
            <div>
              {showModelQRRecord.project_data&&<img src={showModelQRRecord.project_data.project_logo} alt="" style={{height:45,width:45,marginRight:20}}/>}
              {showModelQRRecord.project_data&&<span>{showModelQRRecord.project_data.project_name}</span>}
            </div>
          }
          visible={showMoreAction}
          maskClosable={false}
          onOk={() => {
            console.log('handle ok')
          }}
          onCancel={() => {
            this.setState({
              showMoreAction:false,
              showModelQRRecord:{},
            })
          }}
          footer={null}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            margin: 20
          }}
          >
            {showModelQRRecord.file_url&&<QRCode value={`http://192.168.30.45/api/build/getPlist?taskId=${showModelQRRecord.id}`} size={250}/>}
            <span style={{marginTop:20}}>扫描二维码下载 | {(showModelQRRecord.log_path && showModelQRRecord.status === 10 )&&<a href={showModelQRRecord.log_path} download="" style={{fontWeight:'bold'}} >ipa下载</a>}</span>
            <span>更新时间：{showModelQRRecord.update_time}</span>
          </div>

        </Modal>
      </PageHeaderWrapper>
    );
  }
}

export default IOS;
