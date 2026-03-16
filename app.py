import csv
import io
import json
import os

from flask import Flask, jsonify, render_template, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-in-prod")
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///travel.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max upload

db = SQLAlchemy(app)

ALLOWED_EXTENSIONS = {"csv", "json"}


class Location(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    note = db.Column(db.Text, default="")
    url = db.Column(db.String(512), default="")
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
    list_name = db.Column(db.String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "note": self.note,
            "url": self.url,
            "lat": self.lat,
            "lng": self.lng,
            "list_name": self.list_name,
        }


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_google_maps_csv(content):
    """
    Parse Google Maps Takeout CSV export.
    Expected columns: Title, Note, URL, Comment (varies by export version).
    Also handles the simpler saved places CSV format.
    """
    locations = []
    reader = csv.DictReader(io.StringIO(content))
    fieldnames = [f.strip() for f in (reader.fieldnames or [])]

    for row in reader:
        # Normalize keys (strip whitespace)
        row = {k.strip(): v.strip() for k, v in row.items() if k}

        title = row.get("Title") or row.get("title") or row.get("Name") or ""
        note = row.get("Note") or row.get("note") or row.get("Comment") or row.get("comment") or ""
        url = row.get("URL") or row.get("url") or row.get("Google Maps URL") or ""
        lat_raw = row.get("Latitude") or row.get("latitude") or ""
        lng_raw = row.get("Longitude") or row.get("longitude") or ""
        list_name = row.get("List") or row.get("list") or row.get("Folder") or ""

        try:
            lat = float(lat_raw) if lat_raw else None
            lng = float(lng_raw) if lng_raw else None
        except ValueError:
            lat, lng = None, None

        if title:
            locations.append({
                "title": title,
                "note": note,
                "url": url,
                "lat": lat,
                "lng": lng,
                "list_name": list_name,
            })

    return locations


def parse_google_maps_json(content):
    """
    Parse Google Maps Takeout JSON export (Saved Places format).
    Handles both the features array format and direct features list.
    """
    locations = []
    data = json.loads(content)

    # Google Takeout wraps everything in a FeatureCollection
    features = data if isinstance(data, list) else data.get("features", [])

    for feature in features:
        props = feature.get("properties", {})
        geo = feature.get("geometry", {})

        title = props.get("Title") or props.get("name") or props.get("title") or ""
        note = (
            props.get("Note")
            or props.get("note")
            or props.get("comment")
            or props.get("Comment")
            or ""
        )
        url = props.get("Google Maps URL") or props.get("url") or props.get("URL") or ""
        list_name = props.get("Folder") or props.get("list") or ""

        lat, lng = None, None
        if geo.get("type") == "Point":
            coords = geo.get("coordinates", [])
            if len(coords) >= 2:
                lng, lat = coords[0], coords[1]

        if title:
            locations.append({
                "title": title,
                "note": note,
                "url": url,
                "lat": lat,
                "lng": lng,
                "list_name": list_name,
            })

    return locations


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/locations")
def get_locations():
    locations = Location.query.all()
    return jsonify([loc.to_dict() for loc in locations])


@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "File must be .csv or .json"}), 400

    content = file.read().decode("utf-8", errors="replace")
    ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()

    try:
        if ext == "csv":
            parsed = parse_google_maps_csv(content)
        else:
            parsed = parse_google_maps_json(content)
    except Exception as e:
        return jsonify({"error": f"Failed to parse file: {str(e)}"}), 400

    added = 0
    for loc_data in parsed:
        # Skip duplicates by title + list_name
        existing = Location.query.filter_by(
            title=loc_data["title"], list_name=loc_data["list_name"]
        ).first()
        if not existing:
            db.session.add(Location(**loc_data))
            added += 1

    db.session.commit()
    return jsonify({"added": added, "total_parsed": len(parsed)})


@app.route("/api/locations/<int:loc_id>", methods=["DELETE"])
def delete_location(loc_id):
    loc = db.get_or_404(Location, loc_id)
    db.session.delete(loc)
    db.session.commit()
    return jsonify({"deleted": loc_id})


@app.route("/api/locations/clear", methods=["DELETE"])
def clear_locations():
    count = Location.query.count()
    Location.query.delete()
    db.session.commit()
    return jsonify({"deleted": count})


with app.app_context():
    db.create_all()

if __name__ == "__main__":
    app.run(debug=True)
