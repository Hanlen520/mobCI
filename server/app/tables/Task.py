from app import db
from datetime import datetime

class Task(db.Model):
  __tablename__ = 'build_task'
  id = db.Column(db.Integer, primary_key=True)
  project_id = db.Column(db.Integer)
  svn_path = db.Column(db.String(255))
  tm_type = db.Column(db.Integer)
  description = db.Column(db.String(2000))
  add_time = db.Column(db.DateTime, nullable=False)
  update_time = db.Column(db.DateTime)
  add_user = db.Column(db.String(255))
  status = db.Column(db.SMALLINT)
  is_analyze = db.Column(db.SMALLINT)
  is_perfored = db.Column(db.SMALLINT)
  platform = db.Column(db.SMALLINT)
  log_path = db.Column(db.String(500))
  file_url = db.Column(db.String(500))

  def __init__(self,project_id, svn_path,tm_type,description,add_user,status,platform):
    self.project_id = project_id
    self.svn_path = svn_path
    self.tm_type = tm_type
    self.description = description
    self.add_user = add_user
    self.status = status
    self.add_time = datetime.now()
    self.update_time = datetime.now()
    self.platform = platform


class Project(db.Model):
  __tablename__ = 'build_project'
  id = db.Column(db.Integer, primary_key=True)
  project_name = db.Column(db.String(255))
  add_time = db.Column(db.DateTime, nullable=False)
  app_logo = db.Column(db.String(255))
  build_name = db.Column(db.String(255))

  def __init__(self,project_name):
    self.project_name = project_name
    self.add_time = datetime.now()
