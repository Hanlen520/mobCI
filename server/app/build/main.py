#-*-coding:utf-8-*-
from flask import Blueprint,jsonify,make_response,request,redirect,session
from app import db
from app.tables.Task import Task,Project
from threading import Thread
import os,csv

build = Blueprint('build', __name__)

@build.before_request
def build_before():
  url = request.path
  white_list = [
    u'/api/build/getPlist',
    u'/api/build/updateTaskStatus',
    u'/api/build/updateTaskFileUrl',
    u'/api/build/updateTaskLogPath',
    u'/api/build/updateAnalyzeStatus',
    u'/api/build/updatePerforStatus',
    u'/api/build/taskDetail',
  ]
  if url not in white_list:
    if 'username' in session:
      pass
    else:
      return make_response(jsonify({'code': 99999, 'msg': '未登录'}))
  else:
    pass

@build.route('/add',methods=['POST'])
def add():
  project_id = request.json.get("projectId")
  description = request.json.get("desc")
  svn_path = request.json.get("svnPath")
  tm_type = request.json.get("tmType")
  platform = request.json.get('platform')
  username = session.get('username')
  data = Task(project_id, svn_path,tm_type,description,username,0,platform)
  db.session.add(data)
  db.session.commit()
  return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': {'id':data.id}}))

@build.route('/taskDetail')
def taskDetail():
  taskId = request.values.get("taskId")
  if taskId == None:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task'}))
  task = Task.query.get(taskId)
  if task == None:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task'}))
  project_data = Project.query.get(task.project_id)
  content = {
    "project_name":project_data.build_name,
    "file_url": task.file_url,
  }
  return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': content}))

@build.route('/getPerformance')
def getPerformance():
  taskId = request.values.get("taskId")
  if taskId == None:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task'}))
  task = Task.query.get(taskId)
  if task == None:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task'}))
  csv_paths = task.file_url.split('/')
  csv_path = './app/' + csv_paths[4] + '/' + csv_paths[5] + '/performance.csv'
  if not os.path.exists(csv_path):
    return make_response(jsonify({'code': 10001, 'msg': 'no such task csv'}))
  f = open(csv_path,'r')
  csv_file = csv.reader(f)
  content = []
  for line in csv_file:
    if 'time' in line:
      continue
    line_data = {
      'time':line[0].split()[1],
      'activity':line[1],
      'cpu':float(line[2]),
      'mem':float(line[3]),
    }
    content.append(line_data)
  f.close()
  return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': content}))

@build.route('/tasklist')
def tasklist():
  platform = request.values.get("platform")
  tasks = Task.query.filter_by(platform=platform).order_by(db.desc(Task.update_time)).all()
  # cases = Test.query.filter(db.or_(Test.id == 5, Test.content.like('%fd%')))
  case_data = []
  if tasks:
    for item in tasks:
      project_data = Project.query.get(item.project_id)
      report_url = ""
      if item.file_url and item.platform == 1:
        urls = item.file_url.split('/')
        for i in range(len(urls)-1):
          report_url = report_url+ urls[i]+'/'
      if item.log_path and item.platform == 0:
        urls = item.log_path.split('/')
        for i in range(len(urls) - 1):
          report_url = report_url + urls[i] + '/'
      auto_report_url=""
      pdf_report_url=""
      if report_url:
        auto_report_url = report_url + "report.html"
        pdf_report_url = report_url + "analyzer.pdf"
      case_data.append({
        "id":item.id,
        "project_data":{
          "project_id": item.project_id,
          "project_name":project_data.project_name,
          "project_logo":project_data.app_logo,
        },
        "svn_path":item.svn_path,
        "tm_type":item.tm_type,
        "description":item.description,
        "add_time":item.add_time.strftime('%Y-%m-%d %H:%M:%S'),
        "update_time":item.update_time.strftime('%Y-%m-%d %H:%M:%S'),
        "add_user":item.add_user,
        "status":item.status,
        "file_url":item.file_url,
        "report_url":auto_report_url,
        "pdf_report_url":pdf_report_url,
        "log_path":item.log_path,
        "platform":item.platform,
        "is_analyze":item.is_analyze,
        "is_perfored":item.is_perfored,
      })
  has_building = 0
  has_data = Task.query.filter(db.and_(Task.status==3,Task.platform==platform)).first()
  if has_data:
    has_building = 1
  return make_response(jsonify({'code':0,'msg':'sucess','content':case_data,'has_building':has_building}))

def run_build(task_id,project_id,svn_path,tm_type):
  cmd = 'python build_ios.py start -i %s -p %s -s %s -t %s'%(task_id,project_id,svn_path,tm_type)
  os.system(cmd)

def run_android_build(task_id,project_id,svn_path,tm_type,build_name):
  cmd = 'python build_android.py start -i %s -p %s -s %s -t %s -n %s'%(task_id,project_id,svn_path,tm_type,build_name,)
  os.system(cmd)

@build.route('/taskBuild')
def taskbuild():
  db.session.commit()
  try:
    has_data = Task.query.filter_by(status="3").first()
    if has_data:
      return make_response(jsonify({'code': 10001, 'msg': 'need wait building'}))
  except:
    print "none building task"
  try:
    task_id = request.values.get("taskId")
  except:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task'}))
  data = {'status': '1'}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
  tasks = Task.query.get(task_id)
  # 启动多线程
  if tasks.platform == 0:
    buildThread = Thread(target=run_build, args=(tasks.id,tasks.project_id,tasks.svn_path,tasks.tm_type,))
    buildThread.start()
  else:
    project_data = Project.query.get(tasks.project_id)
    AndroidbuildThread = Thread(target=run_android_build, args=(tasks.id, tasks.project_id, tasks.svn_path, tasks.tm_type,project_data.build_name,))
    AndroidbuildThread.start()
  return make_response(jsonify({'code':0,'msg':'start building'}))

@build.route('/updateTaskStatus',methods=['POST'])
def updateTaskStatus():
  task_id = request.json.get("taskId")
  status = request.json.get("status")
  data = {'status':status}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
    return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': []}))
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))\

@build.route('/updateAnalyzeStatus',methods=['POST'])
def updateAnalyzeStatus():
  task_id = request.json.get("taskId")
  status = request.json.get("status")
  data = {'is_analyze':status}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
    return make_response(jsonify({'code': 0, 'msg': 'update Analyze Status sucess', 'content': []}))
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))

@build.route('/updatePerforStatus',methods=['POST'])
def updatePerforStatus():
  task_id = request.json.get("taskId")
  status = request.json.get("status")
  data = {'is_perfored':status}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
    return make_response(jsonify({'code': 0, 'msg': 'update Perfor Status sucess', 'content': []}))
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))

@build.route('/updateTaskFileUrl',methods=['POST'])
def updateTaskFileUrl():
  task_id = request.json.get("taskId")
  fileUrl = request.json.get("fileUrl")
  data = {'file_url':fileUrl}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
    return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': []}))
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))

@build.route('/updateTaskLogPath',methods=['POST'])
def updateTaskLogPath():
  task_id = request.json.get("taskId")
  logPath = request.json.get("logPath")
  data = {'log_path':logPath}
  row_data = Task.query.filter_by(id=task_id)
  if row_data.first():
    row_data.update(data)
    db.session.commit()
    return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': []}))
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))

@build.route('/getPlist',methods=['GET'])
def getPlist():
  task_id = request.values.get("taskId")
  row_data = Task.query.get(task_id)
  if row_data and row_data.file_url:
    return redirect(row_data.file_url)
  else:
    return make_response(jsonify({'code': 10001, 'msg': 'no such task', 'content': []}))

@build.route('/getProjectList')
def getProjectList():
  projects = Project.query.all()
  project_data = []
  if projects:
    for item in projects:
      project_data.append({
        "id":item.id,
        "project_name":item.project_name
      })
  return make_response(jsonify({'code': 0, 'msg': 'sucess', 'content': project_data}))
