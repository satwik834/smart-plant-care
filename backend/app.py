import os
from flask import Flask, request,jsonify,send_from_directory,abort
from werkzeug.utils import secure_filename
from flask_cors import CORS
from models import db,Zone, Reading, ImageUpload
from datetime import datetime,timezone
from flask_migrate import Migrate, migrate
from ml_model_torchscript import load_model,predict_bytes,predict_file
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])
import threading, time


def create_app():
    app = Flask(__name__)
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    migrate = Migrate(app, db)

    try:
        load_model()
        print("Model loaded successfully")
    except Exception as e:
        print(f"Model not loaded{e}")





    with app.app_context():
        db.create_all()
        if Zone.query.count() == 0:
            z = Zone(name="Zone 1 - Money Plant", threshold=30, irrigation_mode="auto")
            db.session.add(z)
            db.session.commit()

    #Health test route
    @app.route('/ping',methods=['GET'])
    def ping():
        return jsonify(
            {"Status":"OK","time":datetime.now(timezone.utc).isoformat()}
        )

    @app.route('/api/readings',methods=['POST'])
    def post_readings():
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error":"invalid data"}),400
        try:
            zone_id = int(data['zone_id'])
            moisture = int(data['moisture'])
        except [KeyError,ValueError]:
            return jsonify({"error":"zone_id and moisture are required"}),400


        temp = data.get('temperature')
        hum = data.get('humidity')

        zone = Zone.query.get(zone_id)
        if not zone:
            return jsonify({"error":"invalid zone_id"}),400

        r = Reading(zone_id=zone.id,moisture=moisture,temperature=temp,humidity=hum)
        db.session.add(r)
        if zone.irrigation_mode == "auto":
            zone.irrigation_on = moisture < zone.threshold
        db.session.commit()

        return jsonify({"status": "ok", "reading": r.to_dict(), "zone": zone.to_dict()}), 201



    @app.route("/api/zones",methods=['GET'])
    def get_zones():
        zones = Zone.query.all()
        res = []
        for z in zones:
            last = Reading.query.filter_by(zone_id=z.id).order_by(Reading.timestamp.desc()).first()
            zone_obj = z.to_dict()
            zone_obj["last_reading"] = last.to_dict() if last else None
            res.append(zone_obj)
        return jsonify(res)
    




    @app.route("/api/zones/<int:zone_id>",methods=['GET'])
    def get_zone(zone_id):
        z = Zone.query.get_or_404(zone_id)
        readings = Reading.query.filter_by(zone_id=zone_id).order_by(Reading.timestamp.desc()).limit(100).all()
        latest_image = ImageUpload.query.filter_by(zone_id=zone_id).order_by(ImageUpload.timestamp.desc()).first()

        return jsonify({
            "zone": z.to_dict(),
            "readings": [r.to_dict() for r in readings],
            "latest_image": latest_image.to_dict() if latest_image else None
        })




    @app.route("/api/zones/<int:zone_id>/irrigation", methods=["POST"])
    def irrigation(zone_id):
        zone = Zone.query.get_or_404(zone_id)
        data = request.get_json(force=True)
        action = data.get("action")

        if action not in ("start", "stop"):
            return jsonify({"error": "Invalid action, must be 'start' or 'stop'"}), 400
        if zone.irrigation_mode != "manual":
            return jsonify({"error": "Cannot control irrigation while in auto mode"}), 400


        # Update only irrigation status, not the mode
        zone.irrigation_on = (action == "start")
        db.session.commit()

        status_msg = "started" if zone.irrigation_on else "stopped"
        print(f"[ZONE {zone.id}] Irrigation {status_msg} (manual trigger)")

        return jsonify({
            "zone_id": zone.id,
            "irrigation_on": zone.irrigation_on,
            "mode": zone.irrigation_mode,
            "message": f"Irrigation {status_msg} successfully."
        }), 200
    @app.route("/api/zones/<int:zone_id>/threshold",methods=['POST'])
    def update_threshold(zone_id):
        z = Zone.query.get_or_404(zone_id)
        data = request.get_json(force=True)
        try:
            t = data.get('threshold')
        except [TypeError,ValueError]:
            return jsonify({"error":"invalid threshold"}),400
        z.threshold = t
        ## whenever threshold is updated esp should respond accordingly
        db.session.commit()
        return jsonify({"status": "ok", "zone": z.to_dict()})






    @app.route("/api/upload-image", methods=["POST"])
    def upload_image():
        if "image" not in request.files:
            return jsonify({"error": "no image"}), 400

        file = request.files["image"]
        ext = file.filename.rsplit(".",1)[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            return jsonify({"error":"invalid extension"}),400

        # save file
        filename = secure_filename(f"{int(time.time())}_{file.filename}")
        path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(path)

        zone_id = request.form.get("zone_id")
        if not zone_id:
            return jsonify({"error":"zone_id required"}),400

        img = ImageUpload(
            zone_id=int(zone_id),
            filename=filename,
            processed=False  # mark unprocessed
        )
        db.session.add(img)
        db.session.commit()

        return jsonify({
            "status": "ok",
            "image_id": img.id,
            "message": "Image uploaded. Inference pending."
        }), 201




    @app.route("/api/predict-image", methods=["POST"])
    def predict_image():
        if "image" not in request.files:
            return jsonify({"error": "no image"}), 400

        file = request.files["image"]
        if file.filename == "":
            return jsonify({"error": "no image"}), 400

        try:
            pred = predict_bytes(file.read())
        except Exception as e:
            return jsonify({"error": f"prediction_failed: {str(e)}"}), 500

        return jsonify({
            "status": "ok",
            "prediction": pred
        }), 200

    
    @app.route("/api/zones/<int:zone_id>/mode", methods=["POST"])
    def update_mode(zone_id):
        zone = Zone.query.get_or_404(zone_id)
        data = request.get_json(force=True)
        mode = data.get("mode")

        if mode not in ("auto", "manual"):
            return jsonify({"error": "Invalid mode, must be 'auto' or 'manual'"}), 400

        zone.irrigation_mode = mode
        if mode == "auto":
            zone.irrigation_on = False  # safety reset

        db.session.commit()
        print(f"[ZONE {zone.id}] Mode changed to {mode}")
        return jsonify({"status": "ok", "zone": zone.to_dict()}), 200



    @app.route("/uploads/<path:filename>", methods=["GET"])
    def get_uploaded(filename):
        if not os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], filename)):
            abort(404)
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

    @app.route('/api/zones/<int:zone_id>/predict-latest', methods=['GET'])
    def predict_latest(zone_id):
        # get latest uploaded image
        img = ImageUpload.query.filter_by(zone_id=zone_id).order_by(ImageUpload.timestamp.desc()).first()
        if not img:
            return jsonify({"error": "no image"}), 404

        # If already processed (cached result)
        if img.prediction_label is not None:
            return jsonify({
                "prediction_label": img.prediction_label,
                "confidence": img.prediction_confidence,
                "scores": img.prediction_scores if hasattr(img, "prediction_scores") else None,
                "raw_prob_unhealthy": img.prediction_raw,
                "cached": True,
                "filename": img.filename
            }), 200

        # Run inference now (UNPROCESSED IMAGE)
        img_path = os.path.join(app.config['UPLOAD_FOLDER'], img.filename)

        try:
            pred_dict = predict_file(img_path)    # returns dict with keys expected
        except Exception as e:
            return jsonify({"error": f"inference failed: {str(e)}"}), 500

        # Extract
        label = pred_dict["label"]
        conf = pred_dict["confidence"]
        raw = pred_dict["raw_prob_unhealthy"]
        scores = pred_dict["scores"]

        # Save to DB
        img.prediction_label = label
        img.prediction_confidence = conf
        img.prediction_raw = raw

        # Store scores as JSON string
        # (Modify model to add column if you want to store this)
        if hasattr(img, "prediction_scores"):
            img.prediction_scores = json.dumps(scores)

        db.session.commit()

        return jsonify({
            "prediction_label": label,
            "confidence": conf,
            "scores": scores,
            "raw_prob_unhealthy": raw,
            "cached": False,
            "filename": img.filename
        }), 200


    
    return app


if __name__ == '__main__':
    app = create_app()
    CORS(app)
    app.run(debug=True,port=5000)
