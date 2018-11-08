import { Chart, Tooltip, Axis, Legend, Line, Point } from 'viser-react';
import * as React from 'react';
import {Card} from 'antd'
import {connect} from 'dva'

const DataSet = require('@antv/data-set');

class CustomChart extends React.Component{
  render(){
    const {title,data,position,style} = this.props
    const color = ['perfor', perfor => {
      if (perfor === 'mem') {
        return '#1abc9c';
      }
      return '#1890FF';
    }];

    const tooltip = ['perfor*mem*cpu', (perfor, mem,cpu) => {
      if (perfor === 'mem') {
        return {
          name: perfor,
          value: `${mem} mb`,
        };
      }if(perfor === 'cpu'){
        return {
          name: perfor,
          value: `${cpu} %`,
        };
      }
      if(typeof mem === 'string'){
        return {
          name: perfor,
          value: mem,
        };
      }else {
        return {
          name: perfor,
          value: cpu,
        };
      }

    }];
    return(
      <Card title={title} style={style}>
        <Chart forceFit height={400} data={data}>
          <Tooltip  />
          <Axis />
          <Legend />
          <Line position={position} color={color} tooltip={tooltip} />
          <Point position={position} color={color} size={4} style={{ stroke: '#fff', lineWidth: 1 }} shape="circle" tooltip={tooltip} />
        </Chart>
      </Card>
    );
  }
}

@connect(({build, loading}) => ({
  build,
  loading: loading.models.build,
}))
class Performance extends React.Component {
  state={
    cpudata:[],
    memdata:[],
  }

  componentWillMount() {
    const params = this.props.location.search;
    if (params.indexOf('?') !== -1) {
      const Id = params.substr(1);
      const {dispatch} = this.props;
      dispatch({
        type: 'build/queryTaskPerformance',
        payload:{
          taskId:Id,
        }
      }).then(() => {
        const {build} = this.props
        const {performanceList} = build
        const cpudv = new DataSet.View().source(performanceList);
        cpudv.transform({
          type: 'fold',
          fields: ['cpu','activity'],
          key: 'perfor',
          value: 'cpu',
        });
        const cpudata = cpudv.rows;

        const memdv = new DataSet.View().source(performanceList);
        memdv.transform({
          type: 'fold',
          fields: ['mem','activity'],
          key: 'perfor',
          value: 'mem',
        });
        const memdata = memdv.rows;

        this.setState({
          cpudata,
          memdata,
        })
      })
    }
  }

  render(){
    const {cpudata,memdata} = this.state
    return (
      <div>
        <CustomChart title="CPU" data={cpudata} position="time*cpu" color="perfor" />
        <CustomChart title="内存" data={memdata} position="time*mem" color="perfor2" style={{marginTop:20}} />
      </div>
    );
  }
}
export default Performance
