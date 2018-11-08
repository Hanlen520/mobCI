import { queryAddTask,queryTaskList,queryTaskBuild,queryProjectList,queryIosTaskBuild,queryTaskPerformance } from '@/services/api';
import {message} from 'antd'
import { reloadAuthorized } from '@/utils/Authorized';
import { routerRedux } from 'dva/router';

export default {
  namespace: 'build',

  state: {
    taskList:null,
    projectList:null,
    hasBuilding:0,
    performanceList:[],
  },

  effects: {
    *queryAddTask({ payload }, { call,put  }) {
      const response = yield call(queryAddTask, payload);
      if (response) {
        switch (response.code) {
          case 0:
            message.success('添加成功');
            break;
          case 10001:
            message.warning(response.msg);
            break;
          case 10002:
            message.warning(response.msg);
            break;
          case 99999:
            reloadAuthorized();
            message.error(response.msg);
            yield put(routerRedux.push('/user/login'));
            break;
          default:
            message.warning('出现了什么鬼');
        }
      } else {
        message.error('服务器异常！');
      }
    },
    *queryTaskList({payload}, { call, put }) {
      yield put({type: 'updateState', payload: {taskList:null}});
      const response = yield call(queryTaskList,payload);
      if (response) {
        switch (response.code) {
          case 0:
            yield put({type: 'updateState', payload: {taskList:response.content,hasBuilding:response.has_building}});
            break;
          case 10001:
            message.warning(response.msg);
            break;
          case 10002:
            message.warning(response.msg);
            break;
          case 99999:
            reloadAuthorized();
            message.error(response.msg);
            yield put(routerRedux.push('/user/login'));
            break;
          default:
            message.warning('出现了什么鬼');
        }
      } else {
        message.error('服务器异常！');
      }
    },
    *queryProjectList(_, { call, put }) {
      yield put({type: 'updateState', payload: {projectList:null}});
      const response = yield call(queryProjectList);
      if(response.code===0){
        yield put({type: 'updateState', payload: {projectList:response.content}});
      }else {
        message.error(response.msg)
      }
    },
    *queryTaskPerformance({payload}, { call, put }) {
      yield put({type: 'updateState', payload: {performanceList:[]}});
      const response = yield call(queryTaskPerformance,payload);
      if(response.code===0){
        yield put({type: 'updateState', payload: {performanceList:response.content}});
      }else {
        message.error(response.msg)
      }
    },
    *queryTaskBuild({ payload }, { call,  }) {
      const response = yield call(queryTaskBuild,payload);
      if(response&&response.code===0){
        message.success('开始执行');
      }else {
        message.error(response?response.msg:'服务器异常')
      }
    },
    *queryIosTaskBuild({ payload }, { call,  }) {
      const response = yield call(queryIosTaskBuild,payload);
      if(response&&response.code===0){
        message.success('开始执行');
      }else {
        message.error(response?response.msg:'服务器异常')
      }
    },
  },

  reducers: {
    updateState(state, { payload }) {
      return { ...state, ...payload };
    },
  },
};
