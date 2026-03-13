from datetime import datetime,timezone

from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class Zone(db.Model):
    __tablename__ = "zones"
    id = db.Column(db.Integer,primary_key=True)
    name = db.Column(db.String(80),nullable=False)
    threshold = db.Column(db.Integer,default=30)
    irrigation_on = db.Column(db.Boolean,default=False)
    irrigation_mode = db.Column(db.String(20),default="auto")

    def to_dict(self):
        return{
            "id":self.id,
            "name":self.name,
            "threshold":self.threshold,
            "irrigation_on":self.irrigation_on,
            "irrigation_mode":self.irrigation_mode
        }
class Reading(db.Model):
    __tablename__ = "readings"
    id = db.Column(db.Integer,primary_key = True)
    zone_id = db.Column(db.Integer,db.ForeignKey("zones.id"),nullable=False)
    moisture = db.Column(db.Float)
    temperature = db.Column(db.Float)
    humidity = db.Column(db.Float)
    timestamp = db.Column(db.DateTime,default=lambda:datetime.now(timezone.utc))
    def to_dict(self):
        return {
            "id":self.id,
            "zone_id":self.zone_id,
            "moisture":self.moisture,
            "temperature":self.temperature,
            "humidity":self.humidity,
            "timestamp":self.timestamp.isoformat()
        }
class ImageUpload(db.Model):
    __tablename__ = "image_uploads"
    id = db.Column(db.Integer, primary_key=True)
    zone_id = db.Column(db.Integer, db.ForeignKey("zones.id"), nullable=False)
    filename = db.Column(db.String(80), nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # NEW FIELDS
    processed = db.Column(db.Boolean, default=False) 
    prediction_label = db.Column(db.String(50), nullable=True)
    prediction_confidence = db.Column(db.Float, nullable=True)
    prediction_raw = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "zone_id": self.zone_id,
            "filename": self.filename,
            "timestamp": self.timestamp.isoformat(),
            "processed": self.processed,
            "prediction_label": self.prediction_label,
            "prediction_confidence": self.prediction_confidence,
            "prediction_raw": self.prediction_raw
        }